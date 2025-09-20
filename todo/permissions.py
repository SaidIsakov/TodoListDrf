from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Кастомное permission: разрешает редактирование только владельцу объекта.
    Чтение разрешено всем аутентифицированным пользователям.
    """

    def has_object_permission(self, request, view, obj):
        # SAFE_METHODS = GET, HEAD, OPTIONS (только чтение)
        if request.method in permissions.SAFE_METHODS:
            return True  # Разрешаем чтение всем

        # Для методов изменения (POST, PUT, PATCH, DELETE)
        # проверяем, что пользователь - владелец задачи
        return obj.user == request.user
