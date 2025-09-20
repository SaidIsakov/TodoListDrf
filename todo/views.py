from rest_framework import generics, permissions
from .models import Task
from .serializers import TodoSerializer, UserSerializer, UserDetailSerializer
from .permissions import IsOwnerOrReadOnly
from django.contrib.auth.models import User

class TodoListCreateView(generics.ListCreateAPIView):
    """
    View для получения списка задач и создания новых.
    GET: возвращает список всех задач текущего пользователя
    POST: создает новую задачу для текущего пользователя
    """
    serializer_class = TodoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Возвращаем только задачи текущего пользователя
        return Task.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        # Автоматически устанавливаем владельца при создании
        serializer.save(user=self.request.user)

class TodoDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    View для получения, обновления и удаления конкретной задачи.
    GET: получить задачу по ID
    PUT/PATCH: обновить задачу
    DELETE: удалить задачу
    """
    queryset = Task.objects.all()  # Все задачи (фильтрация в permissions)
    serializer_class = TodoSerializer
    # Разрешаем доступ только аутентифицированным пользователям
    # и только владельцам для редактирования/удаления
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

class UserListView(generics.ListAPIView):
    """
    View для получения списка пользователей (только чтение)
    """
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

class UserDetailView(generics.RetrieveAPIView):
    """
    View для получения информации о конкретном пользователе
    """
    queryset = User.objects.all()
    serializer_class = UserDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return User.objects.prefetch_related('tasks')
