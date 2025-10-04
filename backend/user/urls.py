from django.urls import path, include
from .views import*

urlpatterns = [
  path('registration/', RegisterView.as_view(), name='register_user'),
  path('login/', LoginView.as_view(), name='login_user'),
  path('profile/', UserProfileView.as_view(), name='profile'),
  path('change-password/', ChangePasswordView.as_view(), name='change_password'),
]
