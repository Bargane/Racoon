"""
Seed script — données de test pour la V2.
Usage : python seed/seed.py
Suppression : python seed/seed.py --flush
"""
import os
import sys
import django

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'racoon_api.settings')
django.setup()

from django.utils import timezone
from datetime import timedelta
from core.models import User, Studio, StudioRoom, AvailabilitySlot


def flush():
    AvailabilitySlot.objects.all().delete()
    StudioRoom.objects.all().delete()
    Studio.objects.all().delete()
    User.objects.filter(username__in=['owner1', 'owner2', 'artiste1']).delete()
    print("BDD vidée.")


def seed():
    # --- Users ---
    owner1, _ = User.objects.get_or_create(username='owner1', defaults={
        'email': 'owner1@racoon.fr', 'role': 'owner',
    })
    owner1.set_password('test1234')
    owner1.save()

    owner2, _ = User.objects.get_or_create(username='owner2', defaults={
        'email': 'owner2@racoon.fr', 'role': 'owner',
    })
    owner2.set_password('test1234')
    owner2.save()

    artiste1, _ = User.objects.get_or_create(username='artiste1', defaults={
        'email': 'artiste1@racoon.fr', 'role': 'artist',
    })
    artiste1.set_password('test1234')
    artiste1.save()

    # --- Studios ---
    studio1, _ = Studio.objects.get_or_create(name='Studio Voltaire', defaults={
        'owner': owner1,
        'address': '15 Rue de la Roquette, 75011 Paris',
        'arrondissement': '11ème',
        'description': 'Studio de répétition musique au cœur du 11ème.',
        'price_range': '15-25€/h',
        'email': 'contact@studiovoltaire.fr',
        'phone': '01 40 00 11 22',
        'latitude': 48.8530, 'longitude': 2.3731,
    })

    studio2, _ = Studio.objects.get_or_create(name='Danse Montmartre', defaults={
        'owner': owner1,
        'address': '3 Rue Lepic, 75018 Paris',
        'arrondissement': '18ème',
        'description': 'Salles de danse lumineuses avec parquet et miroirs.',
        'price_range': '20-35€/h',
        'email': 'contact@dansemontmartre.fr',
        'phone': '01 40 00 33 44',
        'latitude': 48.8838, 'longitude': 2.3346,
    })

    studio3, _ = Studio.objects.get_or_create(name='Republic Sound', defaults={
        'owner': owner2,
        'address': '42 Rue du Faubourg du Temple, 75010 Paris',
        'arrondissement': '10ème',
        'description': 'Trois cabines musique équipées batterie, amplis et sono.',
        'price_range': '12-20€/h',
        'email': 'contact@republicsound.fr',
        'phone': '01 40 00 55 66',
        'latitude': 48.8664, 'longitude': 2.3634,
    })

    # --- Rooms ---
    room1, _ = StudioRoom.objects.get_or_create(studio=studio1, name='Salle A', defaults={
        'room_type': 'music', 'capacity': 6, 'size_sqm': 30,
        'price_per_hour': 20, 'equipment': 'Batterie Pearl, ampli guitare Fender, ampli basse Ampeg, sono',
    })
    room2, _ = StudioRoom.objects.get_or_create(studio=studio2, name='Salle Miroir', defaults={
        'room_type': 'dance', 'capacity': 20, 'size_sqm': 80,
        'price_per_hour': 28, 'equipment': 'Parquet bois, miroirs 3 murs, barres, sono Bose',
    })
    room3, _ = StudioRoom.objects.get_or_create(studio=studio3, name='Cabine 1', defaults={
        'room_type': 'music', 'capacity': 5, 'size_sqm': 22,
        'price_per_hour': 15, 'equipment': 'Batterie Tama, ampli guitare Marshall, ampli basse Hartke, clavier',
    })

    # --- Créneaux (7 prochains jours, 10h-22h par tranche de 2h) ---
    now = timezone.now().replace(minute=0, second=0, microsecond=0)
    created = 0
    for room in [room1, room2, room3]:
        for day_offset in range(1, 8):
            day = now + timedelta(days=day_offset)
            for hour in range(10, 22, 2):
                start = day.replace(hour=hour)
                end = start + timedelta(hours=2)
                _, new = AvailabilitySlot.objects.get_or_create(room=room, start_time=start, defaults={'end_time': end})
                if new:
                    created += 1

    print(f"Seed terminé : 3 studios, 3 salles, {created} créneaux.")
    print("Comptes de test :")
    print("  owner1 / test1234  (propriétaire)")
    print("  owner2 / test1234  (propriétaire)")
    print("  artiste1 / test1234  (artiste)")


if __name__ == '__main__':
    if '--flush' in sys.argv:
        flush()
    else:
        seed()
