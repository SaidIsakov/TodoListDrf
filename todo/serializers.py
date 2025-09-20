from rest_framework import serializers
from .models import Task
from django.contrib.auth.models import User

class TodoSerializer(serializers.ModelSerializer):
    # Поле owner только для чтения, показывает username владельца
    user = serializers.ReadOnlyField(source='user.username')
    user_id = serializers.ReadOnlyField(source='user.id')

    class Meta:
        model = Task  # Модель для сериализации
        fields = [
            'id',           # Автоматический ID
            'title',        # Заголовок
            'description',  # Описание
            'completed',       # Статус
            'created_at',   # Дата создания
            'user',         # Владелец
            'user_id'
        ]
        # Можно также использовать: fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    # Показывает список ID задач пользователя
    tasks = serializers.PrimaryKeyRelatedField(many=True, read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'tasks']  # ID, имя и задачи пользователя

class UserDetailSerializer(serializers.ModelSerializer):
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
