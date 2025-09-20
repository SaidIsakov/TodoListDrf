from django.urls import path, include
from .views import*

urlpatterns = [
  path('registration/', register_user, name='register_user'),
]
