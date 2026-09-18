from django.urls import path
from .views import (
    KudosListCreateAPIView,
    KudosDetailAPIView,
    KudosReactionAPIView,
)

app_name = 'kudos'

urlpatterns = [
    # Kudos Feed & Give Kudos
    path('', KudosListCreateAPIView.as_view(), name='kudos-list-create'),
    path('<int:pk>/', KudosDetailAPIView.as_view(), name='kudos-detail'),

    # Kudos Reactions
    path('<int:kudos_id>/reactions/', KudosReactionAPIView.as_view(), name='kudos-reactions'),
]
