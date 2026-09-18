from django.urls import path
from .views import LeaderboardAPIView

app_name = 'leaderboard'

urlpatterns = [
    path('', LeaderboardAPIView.as_view(), name='monthly-leaderboard'),
]
