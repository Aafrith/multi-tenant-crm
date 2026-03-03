from django.db import models
from django.contrib.auth.models import AbstractUser


class Organization(models.Model):

    PLAN = (
        ("BASIC", "Basic"),
        ("PRO", "Pro"),
    )

    name = models.CharField(max_length=200)
    subscription_plan = models.CharField(max_length=20, choices=PLAN)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name


class User(AbstractUser):

    ROLE = (
        ("ADMIN", "Admin"),
        ("MANAGER", "Manager"),
        ("STAFF", "Staff"),
    )

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    role = models.CharField(
        max_length=20,
        choices=ROLE,
        default="STAFF"
    )


class Company(models.Model):

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)

    name = models.CharField(max_length=200)
    industry = models.CharField(max_length=100)
    country = models.CharField(max_length=100)

    logo = models.ImageField(
        upload_to="company_logos/",
        null=True,
        blank=True
    )

    is_deleted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)


class Contact(models.Model):

    ROLE = (
        ("DECISION_MAKER", "Decision Maker"),
        ("INFLUENCER", "Influencer"),
        ("END_USER", "End User"),
        ("OTHER", "Other"),
    )

    organization = models.ForeignKey(Organization, on_delete=models.CASCADE)
    company = models.ForeignKey(Company, on_delete=models.CASCADE)

    full_name = models.CharField(max_length=200)
    email = models.EmailField()
    phone = models.CharField(max_length=20, null=True, blank=True)
    role = models.CharField(max_length=30, choices=ROLE, default="OTHER")
    is_deleted = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)


class ActivityLog(models.Model):

    ACTION_CHOICES = (
        ("CREATE", "Create"),
        ("UPDATE", "Update"),
        ("DELETE", "Delete"),
    )

    user = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )

    organization = models.ForeignKey(
        Organization,
        on_delete=models.CASCADE,
        null=True,
        blank=True
    )

    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    model = models.CharField(max_length=50)
    object_id = models.IntegerField()

    timestamp = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-timestamp"]

    def __str__(self):
        return f"{self.action} {self.model} #{self.object_id}"