from rest_framework.routers import DefaultRouter
from django.urls import path
from .views import CompanyViewSet, ContactViewSet, ActivityLogViewSet, MeView

router = DefaultRouter()
router.register("companies", CompanyViewSet, basename="company")
router.register("contacts", ContactViewSet, basename="contact")
router.register("logs", ActivityLogViewSet, basename="activitylog")

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
] + router.urls