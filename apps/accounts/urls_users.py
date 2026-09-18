from django.urls import path
from .views import UserListAPIView, UserDetailAPIView

urlpatterns = [
    path('', UserListAPIView.as_view(), name='user-list-direct'),
    path('<int:pk>/', UserDetailAPIView.as_view(), name='user-detail-direct'),
]
