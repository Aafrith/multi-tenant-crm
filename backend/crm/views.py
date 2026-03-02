from rest_framework.viewsets import ModelViewSet
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied

from .models import *
from .serializers import *


class CompanyViewSet(ModelViewSet):

    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Company.objects.filter(
            organization=self.request.user.organization,
            is_deleted=False
        )

    def perform_create(self, serializer):

        serializer.save(
            organization=self.request.user.organization
        )

    def perform_destroy(self, instance):

        if self.request.user.role != "ADMIN":
            raise PermissionDenied("Only admin can delete")

        instance.is_deleted = True
        instance.save()


class ContactViewSet(ModelViewSet):

    serializer_class = ContactSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):

        return Contact.objects.filter(
            organization=self.request.user.organization
        )

    def perform_create(self, serializer):

        serializer.save(
            organization=self.request.user.organization
        )