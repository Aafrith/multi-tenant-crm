from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import (
    Organization,
    User,
    Company,
    Contact,
    ActivityLog,
)


# ----------------------------
# Organization Admin
# ----------------------------
@admin.register(Organization)
class OrganizationAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "subscription_plan", "created_at")
    search_fields = ("name",)


# ----------------------------
# User Admin
# Extends BaseUserAdmin so passwords are properly hashed via the
# built-in add/change password forms.  Custom fields (organization,
# role) are appended as an extra fieldset.
# ----------------------------
@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("id", "username", "email", "role", "organization", "is_active")
    list_filter = ("role", "organization", "is_active", "is_staff")
    search_fields = ("username", "email")

    # Append our custom fields to the existing fieldsets
    fieldsets = BaseUserAdmin.fieldsets + (
        ("CRM Settings", {"fields": ("organization", "role")}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ("CRM Settings", {"fields": ("organization", "role")}),
    )


# ----------------------------
# Company Admin (IMPORTANT)
# ----------------------------
@admin.register(Company)
class CompanyAdmin(admin.ModelAdmin):
    list_display = ("id", "name", "industry", "country", "organization", "created_at")
    list_filter = ("industry", "country", "organization")
    search_fields = ("name", "industry")


# ----------------------------
# Contact Admin
# ----------------------------
@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ("id", "full_name", "email", "company", "organization", "created_at")
    list_filter = ("company", "organization")
    search_fields = ("full_name", "email")


# ----------------------------
# Activity Log Admin (Read Only)
# ----------------------------
@admin.register(ActivityLog)
class ActivityLogAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "action", "model", "object_id", "timestamp")
    list_filter = ("action", "model")
    readonly_fields = ("user", "action", "model", "object_id", "timestamp")

    def has_add_permission(self, request):
        return False

    def has_delete_permission(self, request, obj=None):
        return False