from django.db import models
from django.contrib.auth.models import User

class Category(models.Model):
  title = models.CharField(max_length=100)
  color = models.CharField(max_length=7, default='#007bff')
  user = models.ForeignKey(User, on_delete=models.CASCADE)

class Tag(models.Model):
    name = models.CharField(max_length=50)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

class Task(models.Model):
  """ Модель Задачи """
  category = models.ForeignKey(Category, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
  tags = models.ManyToManyField(Tag, blank=True)
  priority = models.CharField(max_length=10, choices=[
        ('low', 'Низкий'),
        ('medium', 'Средний'),
        ('high', 'Высокий')
    ], default='medium')
  due_date = models.DateTimeField(null=True, blank=True)
  user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='tasks')
  title = models.CharField(max_length=200)
  description = models.TextField(null=True, blank=True)
  completed = models.BooleanField(default=False)
  created_at = models.DateTimeField(auto_now_add=True)
  priority = models.IntegerField(choices=[(1, 'Low'), (2, 'Medium'), (3, 'High')], default=2)

  def __str__(self):
        return self.title

  class Meta:
      # Задачи будут сортироваться по полю `completed` (невыполненные сверху)
      ordering = ['completed']
