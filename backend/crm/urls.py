from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()

router.register("companies", CompanyViewSet, basename="company")
router.register("contacts", ContactViewSet, basename="contact")

urlpatterns = router.urls