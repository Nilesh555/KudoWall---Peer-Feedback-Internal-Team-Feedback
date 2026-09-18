from django.urls import path
from apps.kudos.views import KudosReactionAPIView

app_name = 'reactions'

urlpatterns = [
    path('<int:kudos_id>/', KudosReactionAPIView.as_view(), name='kudo-reactions'),
]

