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
