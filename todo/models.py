from django.db import models
from django.contrib.auth.models import User

class Task(models.Model):
  """ Модель Задачи """
  user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
  title = models.CharField(max_length=200)
  description = models.TextField(null=True, blank=True)
  completed = models.BooleanField(default=False)
  created_at = models.DateTimeField(auto_now_add=True)

  def __str__(self):
        return self.title

  class Meta:
      # Задачи будут сортироваться по полю `completed` (невыполненные сверху)
      ordering = ['completed']
