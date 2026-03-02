from django.contrib import admin
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
# ----------------------------
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("id", "username", "email", "role", "organization")
    list_filter = ("role", "organization")
    search_fields = ("username", "email")


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