from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

urlpatterns = [
    # Django Admin
    path('admin/', admin.site.urls),

    # OpenAPI 3.0 & Swagger Documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Top-Level Shortcuts for Profile & Users
    path('api/profile/', include([
        path('', include('apps.accounts.urls_profile')),
    ])),
    path('api/users/', include([
        path('', include('apps.accounts.urls_users')),
    ])),

    # Modular Application API Endpoints
    path('api/accounts/', include('apps.accounts.urls', namespace='accounts')),
    path('api/kudos/', include('apps.kudos.urls', namespace='kudos')),
    path('api/reactions/', include('apps.reactions.urls', namespace='reactions')),
    path('api/leaderboard/', include('apps.leaderboard.urls', namespace='leaderboard')),
]
