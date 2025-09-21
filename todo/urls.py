from django.urls import path, include
from .views import*

urlpatterns = [
  # Todos endpoints
  path('', TodoListCreateView.as_view(), name='todo-list'),
  path('<int:pk>/', TodoDetailView.as_view(), name='todo-dstail' ),
]
