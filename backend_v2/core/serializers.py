from rest_framework import serializers
from .models import User


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'role', 'phone')

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'role', 'phone')


class StudioSerializer(serializers.ModelSerializer):
    owner = UserSerializer(read_only=True)

    class Meta:
        from .models import Studio
        model = Studio
        fields = '__all__'
        read_only_fields = ('owner', 'created_at', 'updated_at')


class AvailabilitySlotSerializer(serializers.ModelSerializer):
    class Meta:
        from .models import AvailabilitySlot
        model = AvailabilitySlot
        fields = ('id', 'room', 'start_time', 'end_time', 'is_booked')
        read_only_fields = ('is_booked',)

    def validate(self, data):
        from .models import AvailabilitySlot
        if data['start_time'] >= data['end_time']:
            raise serializers.ValidationError("La fin doit être après le début.")
        # Anti double-booking
        overlap = AvailabilitySlot.objects.filter(
            room=data['room'],
            start_time__lt=data['end_time'],
            end_time__gt=data['start_time'],
        )
        if self.instance:
            overlap = overlap.exclude(pk=self.instance.pk)
        if overlap.exists():
            raise serializers.ValidationError("Ce créneau chevauche un créneau existant.")
        return data


class BookingSerializer(serializers.ModelSerializer):
    artist = UserSerializer(read_only=True)

    class Meta:
        from .models import Booking
        model = Booking
        fields = ('id', 'artist', 'slot', 'status', 'total_price', 'notes', 'created_at')
        read_only_fields = ('artist', 'total_price', 'created_at')

    def validate_slot(self, slot):
        if slot.is_booked:
            raise serializers.ValidationError("Ce créneau est déjà réservé.")
        return slot


class ReviewSerializer(serializers.ModelSerializer):
    artist = UserSerializer(read_only=True)

    class Meta:
        from .models import Review
        model = Review
        fields = ('id', 'artist', 'rating', 'comment', 'created_at')
        read_only_fields = ('artist', 'created_at')

    def validate_rating(self, value):
        if not 1 <= value <= 5:
            raise serializers.ValidationError("La note doit être entre 1 et 5.")
        return value
