from django.urls import path
from .views import (
    SignupView,
    VerifyEmailView,
    LoginView,
    LogoutView,
    CookieTokenRefreshView,
    ForgotPasswordView,
    ResetPasswordView,
    CurrentUserView,
    UserProfileView,
    DepartmentListAPIView,
    DepartmentDetailAPIView,
    UserListAPIView,
    UserDetailAPIView,
)

app_name = 'accounts'

urlpatterns = [
    # JWT Authentication & Account Management
    path('signup/', SignupView.as_view(), name='signup'),
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('token/refresh/', CookieTokenRefreshView.as_view(), name='token-refresh'),
    path('forgot-password/', ForgotPasswordView.as_view(), name='forgot-password'),
    path('reset-password/', ResetPasswordView.as_view(), name='reset-password'),
    path('me/', CurrentUserView.as_view(), name='me'),
    path('profile/', UserProfileView.as_view(), name='profile'),

    # Department Endpoints
    path('departments/', DepartmentListAPIView.as_view(), name='department-list'),
    path('departments/<int:pk>/', DepartmentDetailAPIView.as_view(), name='department-detail'),

    # User Read Endpoints
    path('users/', UserListAPIView.as_view(), name='user-list'),
    path('users/<int:pk>/', UserDetailAPIView.as_view(), name='user-detail'),
]
