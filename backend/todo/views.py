from rest_framework import generics, permissions, viewsets
from .models import Task
from .serializers import TodoSerializer
from .permissions import IsOwnerOrReadOnly


class TodoListCreateView(generics.ListCreateAPIView):
    """
    View для получения списка задач и создания новых.
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
    """
    queryset = Task.objects.all()  # Все задачи (фильтрация в permissions)
    serializer_class = TodoSerializer
    # Разрешаем доступ только аутентифицированным пользователям
    # и только владельцам для редактирования/удаления

    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]


