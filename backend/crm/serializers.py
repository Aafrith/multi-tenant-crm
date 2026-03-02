from rest_framework import serializers
from .models import *


class CompanySerializer(serializers.ModelSerializer):

    class Meta:
        model = Company
        fields = "__all__"
        read_only_fields = ["organization"]


class ContactSerializer(serializers.ModelSerializer):

    class Meta:
        model = Contact
        fields = "__all__"
        read_only_fields = ["organization"]

    def validate_phone(self, value):

        if value:

            if not value.isdigit():
                raise serializers.ValidationError("Phone must be numeric")

            if len(value) < 8 or len(value) > 15:
                raise serializers.ValidationError("Phone length invalid")

        return value