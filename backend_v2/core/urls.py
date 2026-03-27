from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from . import views

urlpatterns = [
    path('health/', views.health_check),
    path('auth/register/', views.register),
    path('auth/login/', TokenObtainPairView.as_view()),
    path('auth/refresh/', TokenRefreshView.as_view()),
    path('auth/me/', views.me),
    path('studios/', views.studios_list),
    path('studios/<int:pk>/', views.studio_detail),
    path('studios/<int:pk>/availability/', views.studio_availability),
    path('studios/<int:pk>/availability/<int:slot_id>/', views.delete_slot),
    path('bookings/', views.bookings_list),
    path('bookings/<int:pk>/', views.booking_detail),
    path('owner/bookings/', views.owner_bookings),
]
