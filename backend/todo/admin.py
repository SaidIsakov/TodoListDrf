from django.contrib import admin
from .models import Task

@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
  list_display = ('title', 'completed', 'description')
  list_editable = ('completed', )
  list_filter = ('id', 'user')
