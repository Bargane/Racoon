from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    ROLE_ARTIST = 'artist'
    ROLE_OWNER = 'owner'
    ROLE_CHOICES = [
        (ROLE_ARTIST, 'Artiste'),
        (ROLE_OWNER, 'Propriétaire de studio'),
    ]
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default=ROLE_ARTIST)
    phone = models.CharField(max_length=20, blank=True)

    def __str__(self):
        return f"{self.username} ({self.role})"


class Studio(models.Model):
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name='studios')
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    address = models.CharField(max_length=300)
    arrondissement = models.CharField(max_length=50, blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    website = models.URLField(blank=True)
    booking_url = models.URLField(blank=True)
    price_range = models.CharField(max_length=100, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name


class StudioRoom(models.Model):
    TYPE_MUSIC = 'music'
    TYPE_DANCE = 'dance'
    TYPE_CHOICES = [
        (TYPE_MUSIC, 'Musique'),
        (TYPE_DANCE, 'Danse'),
    ]
    studio = models.ForeignKey(Studio, on_delete=models.CASCADE, related_name='rooms')
    name = models.CharField(max_length=100)
    room_type = models.CharField(max_length=10, choices=TYPE_CHOICES, default=TYPE_MUSIC)
    capacity = models.PositiveIntegerField(default=10)
    size_sqm = models.PositiveIntegerField(null=True, blank=True)
    price_per_hour = models.DecimalField(max_digits=6, decimal_places=2)
    equipment = models.TextField(blank=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.studio.name} — {self.name}"


class AvailabilitySlot(models.Model):
    room = models.ForeignKey(StudioRoom, on_delete=models.CASCADE, related_name='slots')
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    is_booked = models.BooleanField(default=False)

    class Meta:
        ordering = ['start_time']

    def __str__(self):
        return f"{self.room} — {self.start_time:%d/%m %Hh}"


class Booking(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_CONFIRMED = 'confirmed'
    STATUS_CANCELLED = 'cancelled'
    STATUS_CHOICES = [
        (STATUS_PENDING, 'En attente'),
        (STATUS_CONFIRMED, 'Confirmée'),
        (STATUS_CANCELLED, 'Annulée'),
    ]
    artist = models.ForeignKey(User, on_delete=models.CASCADE, related_name='bookings')
    slot = models.OneToOneField(AvailabilitySlot, on_delete=models.CASCADE)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    total_price = models.DecimalField(max_digits=8, decimal_places=2)
    stripe_payment_intent_id = models.CharField(max_length=200, blank=True)
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Résa {self.artist.username} — {self.slot}"


class Review(models.Model):
    artist = models.ForeignKey(User, on_delete=models.CASCADE, related_name='reviews')
    studio = models.ForeignKey(Studio, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField()  # 1-5
    comment = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('artist', 'studio')

    def __str__(self):
        return f"{self.artist.username} → {self.studio.name} ({self.rating}★)"
