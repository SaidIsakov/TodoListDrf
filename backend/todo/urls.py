from django.urls import path, include
from .views import*

urlpatterns = [
  # Todos endpoints
  path('', TodoListCreateView.as_view(), name='todo-list'),
  path('categories/', CategoryListView.as_view(), name='category'),
  path('<int:pk>/', TodoDetailView.as_view(), name='todo-dstail' ),
]
