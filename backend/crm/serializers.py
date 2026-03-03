from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Company, Contact, ActivityLog, Organization

User = get_user_model()


class OrganizationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organization
        fields = ["id", "name", "subscription_plan", "created_at"]


class UserSerializer(serializers.ModelSerializer):
    organization = OrganizationSerializer(read_only=True)

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "role", "organization"]


class CompanySerializer(serializers.ModelSerializer):
    logo_url = serializers.SerializerMethodField()

    class Meta:
        model = Company
        fields = [
            "id", "name", "industry", "country", "logo", "logo_url",
            "organization", "is_deleted", "created_at"
        ]
        read_only_fields = ["organization", "is_deleted", "created_at"]

    def get_logo_url(self, obj):
        if obj.logo:
            return obj.logo.url
        return None


class ContactSerializer(serializers.ModelSerializer):

    class Meta:
        model = Contact
        fields = [
            "id", "full_name", "email", "phone", "role",
            "company", "organization", "created_at"
        ]
        read_only_fields = ["organization", "created_at"]

    def validate_email(self, value):
        company_id = self.initial_data.get("company") or (
            self.instance.company_id if self.instance else None
        )
        qs = Contact.objects.filter(
            email=value,
            company_id=company_id
        )
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError("Email must be unique within the same company.")
        return value

    def validate_phone(self, value):
        if value:
            if not value.isdigit():
                raise serializers.ValidationError("Phone must contain only digits.")
            if not (8 <= len(value) <= 15):
                raise serializers.ValidationError("Phone must be between 8 and 15 digits.")
        return value


class ActivityLogSerializer(serializers.ModelSerializer):
    user_name = serializers.SerializerMethodField()

    class Meta:
        model = ActivityLog
        fields = ["id", "user", "user_name", "action", "model", "object_id", "timestamp"]

    def get_user_name(self, obj):
        if obj.user:
            return obj.user.get_full_name() or obj.user.username
        return "System"