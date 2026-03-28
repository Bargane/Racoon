"""
Tests end-to-end V2 — parcours artiste & propriétaire.
Usage : python seed/test_e2e.py
Prérequis : serveur Django lancé sur localhost:8000 + seed exécuté
"""
import sys
import json
import urllib.request
import urllib.error

BASE = 'http://localhost:8000/api'
OK = '\033[92m✓\033[0m'
KO = '\033[91m✗\033[0m'
errors = []


def req(method, path, data=None, token=None):
    url = BASE + path
    body = json.dumps(data).encode() if data else None
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = f'Bearer {token}'
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            return resp.status, json.loads(resp.read())
    except urllib.error.HTTPError as e:
        raw = e.read()
        try:
            return e.code, json.loads(raw) if raw else {}
        except Exception:
            return e.code, {'_raw': raw.decode(errors='replace')}


def check(label, condition, detail=''):
    if condition:
        print(f"  {OK} {label}")
    else:
        print(f"  {KO} {label}" + (f" — {detail}" if detail else ''))
        errors.append(label)


# ─────────────────────────────────────────────
print("\n📋 Parcours artiste (issue #38)")
# ─────────────────────────────────────────────

# 1. Recherche IA
print("\n1. Recherche IA")
status, data = req('POST', '/recommend/', {'prompt': 'salle de répétition rock Paris ce weekend'})
check("POST /recommend/ retourne 200", status == 200, str(status))
check("Résultats présents", data.get('type') == 'search_results' and len(data.get('results', [])) > 0,
      f"type={data.get('type')}, count={len(data.get('results', []))}")

# 2. Détail studio
print("\n2. Détail studio")
studios_status, studios = req('GET', '/studios/')
check("GET /studios/ retourne des studios", studios_status == 200 and len(studios) > 0)
studio_id = studios[0]['id'] if studios else None
if studio_id:
    status, studio = req('GET', f'/studios/{studio_id}/')
    check("GET /studios/:id/ retourne le studio", status == 200 and studio.get('name'))

# 3. Inscription artiste
print("\n3. Inscription artiste")
import time
ts = int(time.time())
status, reg = req('POST', '/auth/register/', {
    'username': f'test_artist_{ts}',
    'email': f'test_artist_{ts}@racoon.fr',
    'password': 'test1234!',
    'role': 'artist',
})
check("POST /auth/register/ artiste", status == 201, str(status))
artist_token = reg.get('access')
check("Token JWT reçu", bool(artist_token))

# 4. Réservation créneau
print("\n4. Réservation")
slot_id = None
if studio_id:
    status, avail = req('GET', f'/studios/{studio_id}/availability/')
    check("Créneaux disponibles", status == 200 and len(avail) > 0, f"{len(avail)} créneaux")
    if avail:
        slot_id = avail[0]['id']
        status, booking = req('POST', '/bookings/', {'slot': slot_id}, token=artist_token)
        check("POST /bookings/ crée la résa", status == 201, str(status))
        booking_id = booking.get('id')

        # Vérif créneau plus dispo
        status2, avail2 = req('GET', f'/studios/{studio_id}/availability/')
        slot_ids_after = [s['id'] for s in avail2]
        check("Créneau retiré des disponibilités", slot_id not in slot_ids_after)

# 5. Dashboard artiste
print("\n5. Dashboard artiste")
status, my_bookings = req('GET', '/bookings/', token=artist_token)
check("GET /bookings/ retourne mes réservations", status == 200)
check("Réservation visible dans le dashboard", any(b.get('id') == booking_id for b in my_bookings) if slot_id else True)

# ─────────────────────────────────────────────
print("\n📋 Parcours propriétaire (issue #39)")
# ─────────────────────────────────────────────

# 1. Connexion owner existant
print("\n1. Connexion propriétaire")
status, login = req('POST', '/auth/login/', {'username': 'owner1', 'password': 'test1234'})
check("POST /auth/login/ owner1", status == 200, str(status))
owner_token = login.get('access')
check("Token JWT owner reçu", bool(owner_token))

# 2. Créer un studio
print("\n2. Création studio")
status, new_studio = req('POST', '/studios/', {
    'name': f'Studio Test E2E {ts}',
    'address': '10 Rue de Rivoli, 75001 Paris',
    'arrondissement': '1er',
    'price_range': '18€/h',
    'description': 'Studio créé par le test e2e',
}, token=owner_token)
check("POST /studios/ crée le studio", status == 201, str(status))
new_studio_id = new_studio.get('id')

# 3. Studio visible dans la liste
print("\n3. Visibilité dans la recherche")
status, all_studios = req('GET', '/studios/')
check("Studio visible dans GET /studios/", any(s['id'] == new_studio_id for s in all_studios))

# 4. Dashboard owner — réservations
print("\n4. Dashboard owner")
status, owner_bookings = req('GET', '/owner/bookings/', token=owner_token)
check("GET /owner/bookings/ accessible", status == 200, str(status))

# 5. Confirm/refus réservation
if slot_id and booking_id:
    print("\n5. Gestion réservation")
    status, updated = req('PATCH', f'/bookings/{booking_id}/', {'status': 'confirmed'}, token=owner_token)
    check("PATCH /bookings/:id/ confirme la résa", status == 200 and updated.get('status') == 'confirmed', str(status))

    # Revenus
    confirmed_bookings = [b for b in owner_bookings if b.get('status') == 'confirmed']
    check("Endpoint owner bookings accessible", status == 200)

# ─────────────────────────────────────────────
print(f"\n{'─'*45}")
if errors:
    print(f"{KO} {len(errors)} test(s) échoué(s) :")
    for e in errors:
        print(f"   - {e}")
    sys.exit(1)
else:
    print(f"{OK} Tous les tests sont passés.")
