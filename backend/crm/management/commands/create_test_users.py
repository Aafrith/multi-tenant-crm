"""
Management command: create_test_users
--------------------------------------
Creates (or resets) a test organization with three users covering every
role so that the full RBAC flow can be verified immediately.

Usage:
    python manage.py create_test_users
    python manage.py create_test_users --org "Acme Corp" --plan PRO

Credentials created:
    admin_user   / Admin@1234   role=ADMIN
    manager_user / Manager@1234 role=MANAGER
    staff_user   / Staff@1234   role=STAFF
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from crm.models import Organization

User = get_user_model()

TEST_USERS = [
    {
        "username":   "admin_user",
        "password":   "Admin@1234",
        "role":       "ADMIN",
        "first_name": "Admin",
        "last_name":  "User",
        "email":      "admin@crm.local",
        "is_staff":   True,
        "is_superuser": True,
    },
    {
        "username":   "manager_user",
        "password":   "Manager@1234",
        "role":       "MANAGER",
        "first_name": "Manager",
        "last_name":  "User",
        "email":      "manager@crm.local",
        "is_staff":   False,
        "is_superuser": False,
    },
    {
        "username":   "staff_user",
        "password":   "Staff@1234",
        "role":       "STAFF",
        "first_name": "Staff",
        "last_name":  "Member",
        "email":      "staff@crm.local",
        "is_staff":   False,
        "is_superuser": False,
    },
]


class Command(BaseCommand):
    help = "Create test users (admin / manager / staff) for development"

    def add_arguments(self, parser):
        parser.add_argument("--org",  default="Demo Organization",
                            help="Organization name (default: Demo Organization)")
        parser.add_argument("--plan", default="PRO", choices=["BASIC", "PRO"],
                            help="Subscription plan (default: PRO)")

    def handle(self, *args, **options):
        org_name = options["org"]
        plan     = options["plan"]

        org, created = Organization.objects.get_or_create(
            name=org_name,
            defaults={"subscription_plan": plan},
        )
        verb = "Created" if created else "Found existing"
        self.stdout.write(self.style.SUCCESS(f"{verb} organization: {org.name} ({org.subscription_plan})"))

        self.stdout.write("")
        self.stdout.write("  Username        Password         Role")
        self.stdout.write("  " + "-" * 48)

        for spec in TEST_USERS:
            user, user_created = User.objects.get_or_create(username=spec["username"])
            user.set_password(spec["password"])          # always re-hash
            user.role         = spec["role"]
            user.organization = org
            user.first_name   = spec["first_name"]
            user.last_name    = spec["last_name"]
            user.email        = spec["email"]
            user.is_staff     = spec["is_staff"]
            user.is_superuser = spec["is_superuser"]
            user.is_active    = True
            user.save()

            status = "created" if user_created else "updated"
            self.stdout.write(
                f"  {spec['username']:<16}{spec['password']:<17}{spec['role']:<10}  [{status}]"
            )

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Done! You can now log in with any of the credentials above."))
