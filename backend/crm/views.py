from rest_framework.viewsets import ModelViewSet
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework import status
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import Company, Contact, ActivityLog
from .serializers import (
    CompanySerializer,
    ContactSerializer,
    ActivityLogSerializer,
    UserSerializer,
)
from .permissions import IsAdmin, IsManagerOrAdmin


# ---------------------------------------------------------------------------
# Custom JWT — embeds role, org_id and username into the token payload so the
# frontend can read them instantly without a separate /me/ round-trip.
# ---------------------------------------------------------------------------

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["username"]     = user.username
        token["role"]         = user.role
        token["org_id"]       = user.organization_id
        token["org_name"]     = user.organization.name if user.organization else None
        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Also return user info in the response body for convenience
        data["username"] = self.user.username
        data["role"]     = self.user.role
        data["org_name"] = self.user.organization.name if self.user.organization else None
        return data


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


def log_action(user, action, instance):
    """Create an activity log entry."""
    ActivityLog.objects.create(
        user=user,
        action=action,
        model=instance.__class__.__name__,
        object_id=instance.id,
        organization=user.organization if user else None,
    )


class MeView(APIView):
    """Return the current authenticated user's profile."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class CompanyViewSet(ModelViewSet):
    serializer_class = CompanySerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ["name", "industry", "country"]
    filterset_fields = ["industry", "country"]
    ordering_fields = ["name", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        return Company.objects.filter(
            organization=self.request.user.organization,
            is_deleted=False,
        )

    def perform_create(self, serializer):
        instance = serializer.save(organization=self.request.user.organization)
        log_action(self.request.user, "CREATE", instance)

    def perform_update(self, serializer):
        if self.request.user.role == "STAFF":
            raise PermissionDenied("Staff cannot edit company records.")
        instance = serializer.save()
        log_action(self.request.user, "UPDATE", instance)

    def perform_destroy(self, instance):
        if self.request.user.role != "ADMIN":
            raise PermissionDenied("Only Admin users can delete records.")
        instance.is_deleted = True
        instance.save()
        log_action(self.request.user, "DELETE", instance)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"detail": "Company soft-deleted successfully."},
            status=status.HTTP_200_OK,
        )


class ContactViewSet(ModelViewSet):
    serializer_class = ContactSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ["full_name", "email", "phone"]
    filterset_fields = ["company", "role"]
    ordering_fields = ["full_name", "created_at"]
    ordering = ["-created_at"]

    def get_queryset(self):
        qs = Contact.objects.filter(
            organization=self.request.user.organization,
            is_deleted=False,
        )
        company_id = self.request.query_params.get("company")
        if company_id:
            qs = qs.filter(company_id=company_id)
        return qs

    def perform_create(self, serializer):
        # Ensure the company belongs to the user's organization
        company = serializer.validated_data.get("company")
        if company and company.organization != self.request.user.organization:
            raise PermissionDenied("Cannot add contacts to companies outside your organization.")
        instance = serializer.save(organization=self.request.user.organization)
        log_action(self.request.user, "CREATE", instance)

    def perform_update(self, serializer):
        if self.request.user.role == "STAFF":
            raise PermissionDenied("Staff cannot edit contact records.")
        instance = serializer.save()
        log_action(self.request.user, "UPDATE", instance)

    def perform_destroy(self, instance):
        if self.request.user.role != "ADMIN":
            raise PermissionDenied("Only Admin users can delete records.")
        instance.is_deleted = True
        instance.save()
        log_action(self.request.user, "DELETE", instance)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        self.perform_destroy(instance)
        return Response(
            {"detail": "Contact soft-deleted successfully."},
            status=status.HTTP_200_OK,
        )


class ActivityLogViewSet(ModelViewSet):
    serializer_class = ActivityLogSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get"]  # Read-only
    filter_backends = [SearchFilter, OrderingFilter, DjangoFilterBackend]
    search_fields = ["action", "model", "user__username"]
    filterset_fields = ["action", "model"]
    ordering = ["-timestamp"]

    def get_queryset(self):
        return ActivityLog.objects.filter(
            organization=self.request.user.organization
        ).select_related("user")
