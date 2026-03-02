from rest_framework.routers import DefaultRouter
from .views import *

router = DefaultRouter()

router.register("companies", CompanyViewSet)
router.register("contacts", ContactViewSet)

urlpatterns = router.urls