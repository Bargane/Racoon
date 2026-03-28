import random
from datetime import timedelta
from decimal import Decimal

from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import AvailabilitySlot, Booking, Review, Studio, StudioRoom, User

# ---------------------------------------------------------------------------
# Données issues du studios.json V1
# ---------------------------------------------------------------------------
STUDIOS_DATA = [
    {
        "owner_index": 0,
        "name": "Studio Bleu",
        "description": "38 studios musique et 25 halls de danse répartis sur 6 sites parisiens. Référence incontournable pour la répétition à Paris.",
        "address": "7/9 Rue des Petites Écuries, 75010 Paris",
        "arrondissement": "10ème",
        "phone": "01 45 23 16 03",
        "email": "info@studiobleu.com",
        "website": "https://www.studiobleu.com",
        "booking_url": "https://reservation.studiobleu.com",
        "price_range": "15-30€/h",
        "latitude": 48.8726,
        "longitude": 2.3490,
        "rooms": [
            {
                "name": "Studio Rock A",
                "room_type": "music",
                "capacity": 10,
                "size_sqm": 30,
                "price_per_hour": Decimal("20.00"),
                "equipment": "Batterie Pearl, ampli guitare Marshall, ampli basse Ampeg, sono Yamaha, 3 micros",
            },
            {
                "name": "Hall de Danse 1",
                "room_type": "dance",
                "capacity": 20,
                "size_sqm": 80,
                "price_per_hour": Decimal("31.00"),
                "equipment": "Parquet bois, miroirs sur 2 murs, barres mobiles, sono Bose, climatisation",
            },
        ],
    },
    {
        "owner_index": 0,
        "name": "Mains d'Œuvres",
        "description": "20 studios de répétition à Saint-Ouen, lieu de référence des musiques actuelles en Île-de-France. Tarifs parmi les plus accessibles de la région.",
        "address": "1 Rue Charles Garnier, 93400 Saint-Ouen",
        "arrondissement": "Saint-Ouen",
        "phone": "01 40 11 08 07",
        "email": "studios@mainsdoeuvres.org",
        "website": "https://www.mainsdoeuvres.org",
        "booking_url": "https://www.quickstudio.com/studios/studios-mains-d-oeuvres/bookings",
        "price_range": "5-16€/h",
        "latitude": 48.9044,
        "longitude": 2.3320,
        "rooms": [
            {
                "name": "Studio Métal",
                "room_type": "music",
                "capacity": 8,
                "size_sqm": 28,
                "price_per_hour": Decimal("10.00"),
                "equipment": "Batterie Pearl Export, ampli guitare Marshall JCM800, ampli basse Hartke, sono",
            },
            {
                "name": "Studio Jazz",
                "room_type": "music",
                "capacity": 15,
                "size_sqm": 50,
                "price_per_hour": Decimal("16.00"),
                "equipment": "Piano droit, batterie Sonor, amplis, sono, traitement acoustique professionnel",
            },
        ],
    },
    {
        "owner_index": 1,
        "name": "Wacked Live",
        "description": "3 studios insonorisés box-in-box en plein cœur de Paris. Accès rapide métro Étienne Marcel / Rambuteau. Tarifs dégressifs avant 18h.",
        "address": "32 Boulevard de Sébastopol, 75001 Paris",
        "arrondissement": "1er",
        "phone": "06 50 59 99 89",
        "email": "info@wackedlive.fr",
        "website": "https://wackedlive.fr",
        "booking_url": "https://wackedlive.fr/index.php/reservation/",
        "price_range": "15-25€/h",
        "latitude": 48.8605,
        "longitude": 2.3510,
        "rooms": [
            {
                "name": "Studio 1 — 20m²",
                "room_type": "music",
                "capacity": 4,
                "size_sqm": 20,
                "price_per_hour": Decimal("15.00"),
                "equipment": "Batterie, ampli guitare, ampli basse, sono, traitement acoustique box-in-box",
            },
            {
                "name": "Studio 3 — 33m²",
                "room_type": "music",
                "capacity": 8,
                "size_sqm": 33,
                "price_per_hour": Decimal("20.00"),
                "equipment": "Batterie, 2 amplis guitare, ampli basse, piano numérique, sono, porte acoustique",
            },
        ],
    },
    {
        "owner_index": 1,
        "name": "FGO-Barbara",
        "description": "6 studios musique et danse dans le 18ème. Lieu engagé dédié aux artistes émergents. Tarifs accessibles, réservation via Quickstudio.",
        "address": "1 Rue Fleury, 75018 Paris",
        "arrondissement": "18ème",
        "phone": "01 53 09 99 99",
        "email": "contact@fgo-barbara.fr",
        "website": "https://www.fgo-barbara.fr",
        "booking_url": "https://www.quickstudio.com/studios/fgo-barbara/bookings",
        "price_range": "10-24€/h",
        "latitude": 48.8944,
        "longitude": 2.3488,
        "rooms": [
            {
                "name": "Studio Musique A",
                "room_type": "music",
                "capacity": 10,
                "size_sqm": 25,
                "price_per_hour": Decimal("12.00"),
                "equipment": "Batterie, amplis guitare & basse, piano, sono",
            },
            {
                "name": "Salle Danse",
                "room_type": "dance",
                "capacity": 20,
                "size_sqm": 60,
                "price_per_hour": Decimal("18.00"),
                "equipment": "Parquet bois, miroirs, barres, sono",
            },
        ],
    },
    {
        "owner_index": 0,
        "name": "Micadanses",
        "description": "5 studios de danse professionnels dans le Marais. Référence danse contemporaine à Paris, lieu de résidence pour compagnies.",
        "address": "15-20 Rue Geoffroy-l'Asnier, 75004 Paris",
        "arrondissement": "4ème",
        "phone": "01 48 87 47 91",
        "email": "info@micadanses.fr",
        "website": "https://micadanses.com",
        "booking_url": "https://micadanses.com",
        "price_range": "16-80€/h",
        "latitude": 48.8550,
        "longitude": 2.3530,
        "rooms": [
            {
                "name": "Studio May B — 120m²",
                "room_type": "dance",
                "capacity": 30,
                "size_sqm": 120,
                "price_per_hour": Decimal("50.00"),
                "equipment": "Grand parquet bois, miroirs sur 3 murs, barres fixes, sono professionnelle, douches",
            },
            {
                "name": "Studio 2 — 60m²",
                "room_type": "dance",
                "capacity": 15,
                "size_sqm": 60,
                "price_per_hour": Decimal("25.00"),
                "equipment": "Parquet bois, miroirs, barres mobiles, sono, climatisation",
            },
        ],
    },
    {
        "owner_index": 1,
        "name": "Studio Luna Rossa",
        "description": "30 studios de répétition dans le 13ème. Formules horaires avantageuses : 3h achetées = 4ème offerte avant 18h. Studio d'enregistrement disponible.",
        "address": "24 Rue Primo Levi, 75013 Paris",
        "arrondissement": "13ème",
        "phone": "01 45 85 91 23",
        "email": "contact@studiolunarossa.com",
        "website": "https://www.studiolunarossa.com",
        "booking_url": "https://www.studiolunarossa.com",
        "price_range": "20-35€/h",
        "latitude": 48.8291,
        "longitude": 2.3625,
        "rooms": [
            {
                "name": "Studio Pop-Rock",
                "room_type": "music",
                "capacity": 15,
                "size_sqm": 40,
                "price_per_hour": Decimal("22.00"),
                "equipment": "Batterie, 2 amplis guitare, ampli basse, piano numérique, sono, 4 micros",
            },
        ],
    },
]

ARTISTS = [
    {"username": "artist1", "email": "artist1@test.com", "first_name": "Sophie", "last_name": "Martin"},
    {"username": "artist2", "email": "artist2@test.com", "first_name": "Karim", "last_name": "Benali"},
    {"username": "artist3", "email": "artist3@test.com", "first_name": "Julie", "last_name": "Dupont"},
]

OWNERS = [
    {"username": "owner1", "email": "owner1@test.com", "first_name": "Marc", "last_name": "Lebrun"},
    {"username": "owner2", "email": "owner2@test.com", "first_name": "Nadia", "last_name": "Rousseau"},
]

REVIEWS = [
    {"artist_index": 0, "studio_index": 0, "rating": 5, "comment": "Parfait pour notre groupe rock, le matériel est en excellent état. On revient !"},
    {"artist_index": 1, "studio_index": 2, "rating": 4, "comment": "Studio bien insonorisé, très central. Un peu cher mais la qualité est là."},
    {"artist_index": 2, "studio_index": 4, "rating": 5, "comment": "Le studio May B est magnifique. Parquet impeccable, acoustique parfaite pour la contemporaine."},
    {"artist_index": 0, "studio_index": 1, "rating": 4, "comment": "Super rapport qualité/prix à Saint-Ouen. Personnel accueillant, je recommande."},
]


class Command(BaseCommand):
    help = "Peuple la BDD avec des studios réels et des comptes de test"

    def add_arguments(self, parser):
        parser.add_argument(
            "--reset",
            action="store_true",
            help="Supprime toutes les données existantes avant de seeder",
        )

    def handle(self, *args, **options):
        if options["reset"]:
            self.stdout.write(self.style.WARNING("Suppression des données existantes..."))
            Review.objects.all().delete()
            Booking.objects.all().delete()
            AvailabilitySlot.objects.all().delete()
            StudioRoom.objects.all().delete()
            Studio.objects.all().delete()
            User.objects.filter(username__in=[u["username"] for u in ARTISTS + OWNERS]).delete()

        # --- Comptes owners ---
        owners = []
        for data in OWNERS:
            user, created = User.objects.get_or_create(
                username=data["username"],
                defaults={
                    "email": data["email"],
                    "first_name": data["first_name"],
                    "last_name": data["last_name"],
                    "role": User.ROLE_OWNER,
                },
            )
            if created:
                user.set_password("test1234")
                user.save()
                self.stdout.write(self.style.SUCCESS(f"  Owner créé : {user.username}"))
            owners.append(user)

        # --- Comptes artistes ---
        artists = []
        for data in ARTISTS:
            user, created = User.objects.get_or_create(
                username=data["username"],
                defaults={
                    "email": data["email"],
                    "first_name": data["first_name"],
                    "last_name": data["last_name"],
                    "role": User.ROLE_ARTIST,
                },
            )
            if created:
                user.set_password("test1234")
                user.save()
                self.stdout.write(self.style.SUCCESS(f"  Artiste créé : {user.username}"))
            artists.append(user)

        # --- Studios + rooms ---
        studios = []
        all_rooms = []
        for studio_data in STUDIOS_DATA:
            studio, created = Studio.objects.get_or_create(
                name=studio_data["name"],
                defaults={
                    "owner": owners[studio_data["owner_index"]],
                    "description": studio_data["description"],
                    "address": studio_data["address"],
                    "arrondissement": studio_data["arrondissement"],
                    "phone": studio_data.get("phone", ""),
                    "email": studio_data.get("email", ""),
                    "website": studio_data.get("website", ""),
                    "booking_url": studio_data.get("booking_url", ""),
                    "price_range": studio_data["price_range"],
                    "latitude": studio_data.get("latitude"),
                    "longitude": studio_data.get("longitude"),
                },
            )
            if created:
                self.stdout.write(self.style.SUCCESS(f"  Studio créé : {studio.name}"))
            studios.append(studio)

            for room_data in studio_data["rooms"]:
                room, _ = StudioRoom.objects.get_or_create(
                    studio=studio,
                    name=room_data["name"],
                    defaults=room_data,
                )
                all_rooms.append(room)

        # --- Créneaux sur les 14 prochains jours ---
        now = timezone.now().replace(minute=0, second=0, microsecond=0)
        slot_hours = [10, 12, 14, 16, 18, 20]
        slots_created = 0

        for room in all_rooms:
            for day_offset in range(1, 15):
                day = now + timedelta(days=day_offset)
                for hour in slot_hours:
                    # Pas tous les créneaux pour simuler une vraie disponibilité
                    if random.random() > 0.3:
                        start = day.replace(hour=hour)
                        end = start + timedelta(hours=2)
                        _, created = AvailabilitySlot.objects.get_or_create(
                            room=room,
                            start_time=start,
                            defaults={"end_time": end, "is_booked": False},
                        )
                        if created:
                            slots_created += 1

        self.stdout.write(self.style.SUCCESS(f"  {slots_created} créneaux créés"))

        # --- 3 réservations confirmées ---
        bookings_created = 0
        booked_slots = (
            AvailabilitySlot.objects
            .filter(is_booked=False)
            .select_related("room")
            .order_by("start_time")[:20]
        )
        slots_to_book = list(booked_slots)[:3]

        booking_artists = [artists[0], artists[1], artists[2]]
        for i, slot in enumerate(slots_to_book):
            if not Booking.objects.filter(slot=slot).exists():
                duration_hours = (slot.end_time - slot.start_time).seconds / 3600
                total = slot.room.price_per_hour * Decimal(str(duration_hours))
                Booking.objects.create(
                    artist=booking_artists[i],
                    slot=slot,
                    status=Booking.STATUS_CONFIRMED,
                    total_price=total,
                )
                slot.is_booked = True
                slot.save()
                bookings_created += 1

        self.stdout.write(self.style.SUCCESS(f"  {bookings_created} réservations confirmées créées"))

        # --- Avis ---
        reviews_created = 0
        for review_data in REVIEWS:
            studio = studios[review_data["studio_index"]]
            artist = artists[review_data["artist_index"]]
            _, created = Review.objects.get_or_create(
                artist=artist,
                studio=studio,
                defaults={
                    "rating": review_data["rating"],
                    "comment": review_data["comment"],
                },
            )
            if created:
                reviews_created += 1

        self.stdout.write(self.style.SUCCESS(f"  {reviews_created} avis créés"))

        self.stdout.write(self.style.SUCCESS("\n✅ Seed terminé !"))
        self.stdout.write("")
        self.stdout.write("  Comptes de test (mdp: test1234)")
        self.stdout.write("  Owners  : owner1@test.com / owner2@test.com")
        self.stdout.write("  Artistes: artist1@test.com / artist2@test.com / artist3@test.com")
        self.stdout.write(f"  Studios : {len(studios)} créés ({sum(len(s['rooms']) for s in STUDIOS_DATA)} salles)")
