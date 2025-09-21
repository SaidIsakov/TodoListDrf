from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from todo.serializers import TodoSerializer

class UserRegistrationSerializer(serializers.ModelSerializer):
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


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        # Проверяем существование пользователя
        try:
            user = User.objects.get(username=username)
        except User.DoesNotExist:
            raise serializers.ValidationError("Пользователь не найден")

        # Проверяем пароль
        if not user.check_password(password):
            raise serializers.ValidationError("Неверный пароль")

        # Добавляем пользователя в validated_data
        attrs['user'] = user
        return attrs


class UserProfileSerializer(serializers.ModelSerializer):
  """ Показываем полные объекты задач, а не только их IDs  """
  tasks = TodoSerializer(many=True, read_only=True)

  todos_count = serializers.SerializerMethodField()
  completed_todos_count = serializers.SerializerMethodField()
  pending_todos_count = serializers.SerializerMethodField()

  class Meta:
        model = User
        fields = (
            'id',
            'username',
            'email',  # Добавляем email
            'first_name',
            'last_name',
            'todos_count',
            'tasks',  # Полный список задач
            'completed_todos_count',  # Количество завершенных
            'pending_todos_count'  # Количество ожидающих
        )

  def get_todos_count(self, obj):
    """Общее количество задач пользователя"""
    return obj.tasks.count()

  def get_completed_todos_count(self, obj):
      """Количество завершенных задач"""
      return obj.tasks.filter(completed=True).count()

  def get_pending_todos_count(self, obj):
    """Количество задач в работе и ожидании"""
    return obj.tasks.exclude(completed=True).count()
