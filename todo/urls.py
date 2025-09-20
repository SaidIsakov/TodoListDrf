from django.urls import path, include
from .views import*

urlpatterns = [
  # Todos endpoints
  path('todos/', TodoListCreateView.as_view(), name='todo-list'),
  path('todos/<int:pk>/', TodoDetailView.as_view(), name='todo-dstail' ),

   # Users endpoints (опционально)
    path('users/', UserListView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailView.as_view(), name='user-detail'),
]
