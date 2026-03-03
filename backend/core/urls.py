from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView
from crm.views import CustomTokenObtainPairView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/v1/token/",         CustomTokenObtainPairView.as_view(), name="token_obtain"),
    path("api/v1/token/refresh/", TokenRefreshView.as_view(),          name="token_refresh"),
    path("api/v1/",               include("crm.urls")),
]

# Serve uploaded media locally when not using S3
if not getattr(settings, "AWS_STORAGE_BUCKET_NAME", None):
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
