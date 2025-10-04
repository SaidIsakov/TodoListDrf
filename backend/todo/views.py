from rest_framework import generics, permissions, viewsets
from .models import Task, Category
from .serializers import TodoSerializer, CategoryListSerializer
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
    queryset = Task.objects.all()
    serializer_class = TodoSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

class CategoryListView(generics.ListAPIView):
  queryset = Category.objects.all()
  serializer_class = CategoryListSerializer

