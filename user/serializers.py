from rest_framework import serializers
from django.contrib.auth.models import User

class UserSerializer(serializers.ModelSerializer):
  password = serializers.CharField(write_only=True)
  password2 = serializers.CharField(write_only=True)

  class Meta:
    model = User
    fields = ('password', 'password2', 'username', 'email')

  def validate(self, attrs):
    # Проверяем, что пароли совпадают
    if attrs['password'] != attrs['password2']:
      raise serializers.ValidationError('Пароли не совпадают')
    return attrs

  def create(self, validated_data):
    # Удаляем подтверждение пароля
    validated_data.pop('password2')
    # Создаем пользователя с хешированным паролем
    user = User.objects.create_user(**validated_data)
    return user
