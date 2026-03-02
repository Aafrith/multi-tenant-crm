from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):

    def has_permission(self, request, view):
        return request.user.role == "ADMIN"


class IsManagerOrAdmin(BasePermission):

    def has_permission(self, request, view):
        return request.user.role in ["ADMIN", "MANAGER"]