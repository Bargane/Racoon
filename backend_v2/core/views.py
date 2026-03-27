from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from django.utils import timezone
from django.shortcuts import get_object_or_404
from django.core.mail import send_mail
from django.conf import settings
from django.db.models import Avg
import urllib.request
import json as json_lib
import re
from groq import Groq
from .models import Studio, AvailabilitySlot, StudioRoom, Booking, Review
from .serializers import RegisterSerializer, UserSerializer, StudioSerializer, AvailabilitySlotSerializer, BookingSerializer, ReviewSerializer


@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    return Response({'status': 'ok', 'timestamp': timezone.now().isoformat(), 'version': '2.0.0'})


@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    user = serializer.save()
    refresh = RefreshToken.for_user(user)
    return Response({
        'user': UserSerializer(user).data,
        'access': str(refresh.access_token),
        'refresh': str(refresh),
    }, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(['GET', 'POST'])
def studios_list(request):
    if request.method == 'GET':
        qs = Studio.objects.filter(is_active=True).select_related('owner')
        q = request.query_params
        if q.get('type'):
            qs = qs.filter(rooms__room_type=q['type']).distinct()
        if q.get('price_max'):
            try:
                qs = qs.filter(rooms__price_per_hour__lte=float(q['price_max'])).distinct()
            except ValueError:
                pass
        if q.get('capacity'):
            try:
                qs = qs.filter(rooms__capacity__gte=int(q['capacity'])).distinct()
            except ValueError:
                pass
        if q.get('date'):
            from datetime import datetime
            try:
                day = datetime.fromisoformat(q['date']).date()
                qs = qs.filter(
                    rooms__slots__start_time__date=day,
                    rooms__slots__is_booked=False,
                ).distinct()
            except ValueError:
                pass
        return Response(StudioSerializer(qs, many=True).data)

    if not request.user.is_authenticated:
        return Response({'detail': 'Authentification requise.'}, status=status.HTTP_401_UNAUTHORIZED)
    if request.user.role != 'owner':
        return Response({'detail': 'Réservé aux propriétaires de studio.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = StudioSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    studio = serializer.save(owner=request.user)
    _geocode_studio(studio)
    return Response(StudioSerializer(studio).data, status=status.HTTP_201_CREATED)


def _geocode_studio(studio):
    if studio.latitude and studio.longitude:
        return
    try:
        query = urllib.request.quote(studio.address)
        url = f"https://nominatim.openstreetmap.org/search?q={query}&format=json&limit=1"
        req = urllib.request.Request(url, headers={'User-Agent': 'Racoon-V2/1.0'})
        with urllib.request.urlopen(req, timeout=5) as resp:
            results = json_lib.loads(resp.read())
        if results:
            studio.latitude = float(results[0]['lat'])
            studio.longitude = float(results[0]['lon'])
            studio.save(update_fields=['latitude', 'longitude'])
    except Exception:
        pass


@api_view(['GET', 'PUT', 'DELETE'])
def studio_detail(request, pk):
    studio = get_object_or_404(Studio, pk=pk)

    if request.method == 'GET':
        return Response(StudioSerializer(studio).data)

    if not request.user.is_authenticated or studio.owner != request.user:
        return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'PUT':
        serializer = StudioSerializer(studio, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return Response(serializer.data)

    studio.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
def studio_availability(request, pk):
    studio = get_object_or_404(Studio, pk=pk)

    if request.method == 'GET':
        slots = AvailabilitySlot.objects.filter(
            room__studio=studio, is_booked=False
        ).select_related('room')
        return Response(AvailabilitySlotSerializer(slots, many=True).data)

    if not request.user.is_authenticated or studio.owner != request.user:
        return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

    # Vérifie que la room appartient bien à ce studio
    room_id = request.data.get('room')
    if room_id and not studio.rooms.filter(pk=room_id).exists():
        return Response({'detail': 'Cette salle n\'appartient pas à ce studio.'}, status=status.HTTP_400_BAD_REQUEST)

    serializer = AvailabilitySlotSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    serializer.save()
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
def delete_slot(request, pk, slot_id):
    studio = get_object_or_404(Studio, pk=pk)
    if not request.user.is_authenticated or studio.owner != request.user:
        return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)
    slot = get_object_or_404(AvailabilitySlot, pk=slot_id, room__studio=studio)
    if slot.is_booked:
        return Response({'detail': 'Impossible de supprimer un créneau déjà réservé.'}, status=status.HTTP_400_BAD_REQUEST)
    slot.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def bookings_list(request):
    if request.method == 'GET':
        bookings = Booking.objects.filter(artist=request.user).select_related('slot__room__studio', 'artist')
        return Response(BookingSerializer(bookings, many=True).data)

    serializer = BookingSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    slot = serializer.validated_data['slot']
    duration_h = (slot.end_time - slot.start_time).total_seconds() / 3600
    total = slot.room.price_per_hour * duration_h

    booking = serializer.save(artist=request.user, total_price=total)

    # Marque le créneau comme réservé
    slot.is_booked = True
    slot.save()

    # Notification email au propriétaire
    owner = slot.room.studio.owner
    if owner.email:
        try:
            send_mail(
                subject=f"Nouvelle réservation — {slot.room.studio.name}",
                message=(
                    f"Bonjour {owner.username},\n\n"
                    f"{request.user.username} a réservé {slot.room.name} "
                    f"le {slot.start_time.strftime('%d/%m/%Y à %Hh%M')} "
                    f"jusqu'à {slot.end_time.strftime('%Hh%M')}.\n"
                    f"Montant : {total:.2f}€\n\n"
                    f"— Racoon"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[owner.email],
                fail_silently=True,
            )
        except Exception:
            pass

    return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def booking_detail(request, pk):
    booking = get_object_or_404(Booking, pk=pk)
    is_artist = booking.artist == request.user
    is_owner = booking.slot.room.studio.owner == request.user
    if not (is_artist or is_owner):
        return Response({'detail': 'Non autorisé.'}, status=status.HTTP_403_FORBIDDEN)

    if request.method == 'GET':
        return Response(BookingSerializer(booking).data)

    new_status = request.data.get('status')
    if new_status not in ('confirmed', 'cancelled'):
        return Response({'detail': 'Statut invalide.'}, status=status.HTTP_400_BAD_REQUEST)
    if new_status == 'cancelled' and booking.status == 'confirmed' and not is_owner:
        return Response({'detail': 'Seul le propriétaire peut annuler une réservation confirmée.'}, status=status.HTTP_403_FORBIDDEN)

    booking.status = new_status
    booking.save()
    if new_status == 'cancelled':
        booking.slot.is_booked = False
        booking.slot.save()

    return Response(BookingSerializer(booking).data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def pay_booking(request, pk):
    booking = get_object_or_404(Booking, pk=pk, artist=request.user)

    if booking.status == 'cancelled':
        return Response({'detail': 'Réservation annulée.'}, status=status.HTTP_400_BAD_REQUEST)
    if booking.status == 'confirmed':
        return Response({'detail': 'Déjà payé.'}, status=status.HTTP_400_BAD_REQUEST)

    # Validation basique côté serveur (pas de traitement réel — à brancher sur PayPlug/Stripe)
    card = request.data.get('card_number', '').replace(' ', '')
    expiry = request.data.get('expiry', '')
    cvv = request.data.get('cvv', '')

    if not card.isdigit() or len(card) < 15:
        return Response({'detail': 'Numéro de carte invalide.'}, status=status.HTTP_400_BAD_REQUEST)
    if not expiry or '/' not in expiry:
        return Response({'detail': 'Date d\'expiration invalide.'}, status=status.HTTP_400_BAD_REQUEST)
    if not cvv.isdigit() or len(cvv) < 3:
        return Response({'detail': 'CVV invalide.'}, status=status.HTTP_400_BAD_REQUEST)

    # Simule un paiement accepté et confirme la réservation
    booking.status = 'confirmed'
    booking.save()

    # Email de confirmation à l'artiste
    if request.user.email:
        try:
            slot = booking.slot
            send_mail(
                subject=f"Confirmation de paiement — {slot.room.studio.name}",
                message=(
                    f"Bonjour {request.user.username},\n\n"
                    f"Votre réservation est confirmée !\n\n"
                    f"Studio : {slot.room.studio.name}\n"
                    f"Date : {slot.start_time.strftime('%d/%m/%Y à %Hh%M')}\n"
                    f"Montant débité : {booking.total_price:.2f}€\n\n"
                    f"À bientôt — Racoon"
                ),
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[request.user.email],
                fail_silently=True,
            )
        except Exception:
            pass

    return Response({'status': 'confirmed', 'total_price': str(booking.total_price)})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def owner_bookings(request):
    bookings = Booking.objects.filter(
        slot__room__studio__owner=request.user
    ).select_related('slot__room__studio', 'artist').order_by('slot__start_time')
    return Response(BookingSerializer(bookings, many=True).data)


@api_view(['GET', 'POST'])
def studio_reviews(request, pk):
    studio = get_object_or_404(Studio, pk=pk)

    if request.method == 'GET':
        reviews = studio.reviews.select_related('artist').order_by('-created_at')
        avg = reviews.aggregate(avg=Avg('rating'))['avg']
        return Response({
            'average': round(avg, 1) if avg else None,
            'count': reviews.count(),
            'reviews': ReviewSerializer(reviews, many=True).data,
        })

    if not request.user.is_authenticated:
        return Response({'detail': 'Authentification requise.'}, status=status.HTTP_401_UNAUTHORIZED)

    has_booking = Booking.objects.filter(
        artist=request.user,
        slot__room__studio=studio,
        status='confirmed',
    ).exists()
    if not has_booking:
        return Response({'detail': 'Vous devez avoir effectué une réservation confirmée pour laisser un avis.'}, status=status.HTTP_403_FORBIDDEN)

    serializer = ReviewSerializer(data=request.data)
    if not serializer.is_valid():
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    serializer.save(artist=request.user, studio=studio)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['POST'])
@permission_classes([AllowAny])
def recommend(request):
    prompt = (request.data.get('prompt') or '').strip()
    if not prompt:
        return Response({'error': 'prompt manquant.'}, status=status.HTTP_400_BAD_REQUEST)

    studios = Studio.objects.filter(is_active=True).prefetch_related('reviews', 'rooms')
    studios_data = []
    for s in studios:
        avg = s.reviews.aggregate(avg=Avg('rating'))['avg']
        studios_data.append({
            'id': s.id,
            'name': s.name,
            'address': s.address,
            'arrondissement': s.arrondissement,
            'price_range': s.price_range,
            'description': s.description,
            'avg_rating': round(avg, 1) if avg else None,
            'room_types': list(s.rooms.values_list('room_type', flat=True).distinct()),
            'capacity_max': s.rooms.order_by('-capacity').values_list('capacity', flat=True).first(),
        })

    system_prompt = (
        "Tu es un assistant expert en studios de répétition à Paris. "
        "Analyse la demande de l'artiste et retourne une liste JSON des studios les plus pertinents triés par pertinence. "
        "Pour chaque studio retourné, ajoute un champ 'relevance_reason' (1 phrase). "
        "Réponds UNIQUEMENT avec un bloc ```json contenant une liste d'objets avec les champs: id, relevance_reason. "
        "Retourne au maximum 5 studios."
    )

    user_msg = (
        f"Demande: {prompt}\n\n"
        f"Studios disponibles:\n{json_lib.dumps(studios_data, ensure_ascii=False)}"
    )

    try:
        client = Groq(api_key=settings.GROQ_API_KEY)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_msg},
            ],
            temperature=0.7,
            max_tokens=1024,
        )
        text = response.choices[0].message.content
        match = re.search(r'```json\s*(.*?)\s*```', text, re.DOTALL)
        if not match:
            return Response({'type': 'clarification', 'message': text})

        ranked = json_lib.loads(match.group(1))
        studio_map = {s.id: s for s in studios}
        results = []
        for item in ranked:
            s = studio_map.get(item.get('id'))
            if not s:
                continue
            avg = s.reviews.aggregate(avg=Avg('rating'))['avg']
            results.append({
                **StudioSerializer(s).data,
                'relevance_reason': item.get('relevance_reason', ''),
                'avg_rating': round(avg, 1) if avg else None,
                'ai_pick': True,
            })

        return Response({'type': 'search_results', 'results': results})

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
