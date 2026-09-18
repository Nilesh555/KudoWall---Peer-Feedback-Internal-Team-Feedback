from django.conf import settings
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.contrib.auth.tokens import default_token_generator
from django.db import IntegrityError
from django.db.models import Q
from rest_framework import generics, status, filters
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from drf_spectacular.utils import extend_schema, extend_schema_view, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import Department, User
from .serializers import (
    DepartmentSerializer,
    UserSerializer,
    UserProfileSerializer,
    SignupSerializer,
    EmailVerificationSerializer,
    LoginSerializer,
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    TokenRefreshRequestSerializer,
    LogoutRequestSerializer,
)


def set_auth_cookies(response, access_token=None, refresh_token=None):
    """
    Helper function to set access and refresh tokens into secure HTTP-only cookies.
    """
    if access_token:
        response.set_cookie(
            key=settings.AUTH_COOKIE_ACCESS_NAME,
            value=str(access_token),
            max_age=settings.AUTH_COOKIE_ACCESS_MAX_AGE,
            httponly=settings.AUTH_COOKIE_HTTP_ONLY,
            secure=settings.AUTH_COOKIE_SECURE,
            samesite=settings.AUTH_COOKIE_SAMESITE,
            path=settings.AUTH_COOKIE_PATH,
        )
    if refresh_token:
        response.set_cookie(
            key=settings.AUTH_COOKIE_REFRESH_NAME,
            value=str(refresh_token),
            max_age=settings.AUTH_COOKIE_REFRESH_MAX_AGE,
            httponly=settings.AUTH_COOKIE_HTTP_ONLY,
            secure=settings.AUTH_COOKIE_SECURE,
            samesite=settings.AUTH_COOKIE_SAMESITE,
            path=settings.AUTH_COOKIE_PATH,
        )


def clear_auth_cookies(response):
    """
    Helper function to remove auth cookies upon logout.
    """
    response.delete_cookie(settings.AUTH_COOKIE_ACCESS_NAME, path=settings.AUTH_COOKIE_PATH)
    response.delete_cookie(settings.AUTH_COOKIE_REFRESH_NAME, path=settings.AUTH_COOKIE_PATH)


# ==============================================================================
# Authentication Views
# ==============================================================================

@extend_schema(
    tags=['Authentication'],
    summary="Register a new user account",
    description="Registers a team member with name, email, password, department, and avatar. Triggers simulated email verification.",
    request=SignupSerializer,
    responses={
        201: UserSerializer,
        400: OpenApiTypes.OBJECT,
    }
)
class SignupView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = SignupSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        try:
            user = serializer.save()
        except IntegrityError:
            return Response(
                {"email": ["An account with this email address already exists."]},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Simulated email verification payload
        response_data = {
            "message": "Account created successfully. Please verify your email address.",
            "user": UserSerializer(user).data,
            "verification_simulation": {
                "email": user.email,
                "verification_token": user.email_verification_token,
                "verify_url": f"/api/accounts/verify-email/?email={user.email}&token={user.email_verification_token}"
            }
        }
        return Response(response_data, status=status.HTTP_201_CREATED)


@extend_schema(
    tags=['Authentication'],
    summary="Verify email address",
    description="Verifies the user email using the simulated verification token.",
    request=EmailVerificationSerializer,
    responses={
        200: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
    }
)
class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        user.is_email_verified = True
        user.email_verification_token = None
        user.save(update_fields=['is_email_verified', 'email_verification_token'])

        return Response({"message": "Email verified successfully. You can now log in."}, status=status.HTTP_200_OK)


@extend_schema(
    tags=['Authentication'],
    summary="User login with JWT and HTTP-only cookies",
    description="Authenticates credentials and issues a short-lived (15m) access token and long-lived (7d) refresh token set in an HTTP-only cookie.",
    request=LoginSerializer,
    responses={
        200: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
        401: OpenApiTypes.OBJECT,
    }
)
class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']

        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)

        response = Response({
            "message": "Login successful.",
            "access_token": access_token,
            "user": UserSerializer(user).data
        }, status=status.HTTP_200_OK)

        # Set secure HTTP-only cookies
        set_auth_cookies(response, access_token=access_token, refresh_token=refresh_token)
        return response


@extend_schema(
    tags=['Authentication'],
    summary="Refresh access token with refresh-token rotation",
    description="Reads the refresh token from the HTTP-only cookie or request body, blacklists the old refresh token, rotates a new refresh token into the cookie, and returns a new access token.",
    request=TokenRefreshRequestSerializer,
    responses={
        200: OpenApiTypes.OBJECT,
        401: OpenApiTypes.OBJECT,
    }
)
class CookieTokenRefreshView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        cookie_name = getattr(settings, 'AUTH_COOKIE_REFRESH_NAME', 'refresh_token')
        raw_refresh_token = request.data.get('refresh') or request.COOKIES.get(cookie_name)

        if not raw_refresh_token:
            return Response(
                {"detail": "Refresh token not provided in cookie or request body."},
                status=status.HTTP_401_UNAUTHORIZED
            )

        try:
            refresh = RefreshToken(raw_refresh_token)
            user_id = refresh.payload.get('user_id')
            user = User.objects.get(id=user_id, is_active=True)

            # Invalidate old refresh token (rotation & blacklist)
            try:
                refresh.blacklist()
            except AttributeError:
                pass

            # Generate new pair (rotation)
            new_refresh = RefreshToken.for_user(user)
            new_access_token = str(new_refresh.access_token)
            new_refresh_token = str(new_refresh)

            response = Response({
                "access_token": new_access_token,
                "message": "Token refreshed successfully."
            }, status=status.HTTP_200_OK)

            set_auth_cookies(response, access_token=new_access_token, refresh_token=new_refresh_token)
            return response

        except (TokenError, User.DoesNotExist) as e:
            return Response(
                {"detail": "Invalid, expired, or blacklisted refresh token. Please log in again."},
                status=status.HTTP_401_UNAUTHORIZED
            )


@extend_schema(
    tags=['Authentication'],
    summary="Logout and invalidate tokens",
    description="Blacklists the active refresh token and clears both access and refresh HTTP-only cookies.",
    request=LogoutRequestSerializer,
    responses={
        200: OpenApiTypes.OBJECT,
    }
)
class LogoutView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        cookie_name = getattr(settings, 'AUTH_COOKIE_REFRESH_NAME', 'refresh_token')
        raw_refresh_token = request.COOKIES.get(cookie_name) or request.data.get('refresh')

        if raw_refresh_token:
            try:
                refresh = RefreshToken(raw_refresh_token)
                refresh.blacklist()
            except Exception:
                pass

        response = Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)
        clear_auth_cookies(response)
        return response


@extend_schema(
    tags=['Authentication'],
    summary="Request password reset token (simulation)",
    description="Generates a password reset token for the given registered email address.",
    request=ForgotPasswordSerializer,
    responses={
        200: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
    }
)
class ForgotPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ForgotPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data['email']
        user = User.objects.get(email__iexact=email)

        token = default_token_generator.make_token(user)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))

        return Response({
            "message": "Password reset link generated (Simulation).",
            "simulation": {
                "email": user.email,
                "uidb64": uidb64,
                "token": token,
                "reset_url": f"/reset-password?uidb64={uidb64}&token={token}"
            }
        }, status=status.HTTP_200_OK)


@extend_schema(
    tags=['Authentication'],
    summary="Reset password using reset token",
    description="Resets the user's password using the uidb64 and token received from the forgot-password flow.",
    request=ResetPasswordSerializer,
    responses={
        200: OpenApiTypes.OBJECT,
        400: OpenApiTypes.OBJECT,
    }
)
class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = ResetPasswordSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        uidb64 = serializer.validated_data['uidb64']
        token = serializer.validated_data['token']
        new_password = serializer.validated_data['new_password']

        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"detail": "Invalid user ID or payload."}, status=status.HTTP_400_BAD_REQUEST)

        if not default_token_generator.check_token(user, token):
            return Response({"detail": "Invalid or expired password reset token."}, status=status.HTTP_400_BAD_REQUEST)

        user.set_password(new_password)
        user.save()
        return Response({"message": "Password has been successfully reset. Please log in with your new password."}, status=status.HTTP_200_OK)


@extend_schema(
    tags=['Users & Profiles'],
    summary="Get detailed profile of current authenticated user",
    description="Returns full authenticated user profile, allowance, earned points, recognition stats, earned badges, and kudos history.",
    responses={
        200: UserProfileSerializer,
        401: OpenApiTypes.OBJECT,
    }
)
class UserProfileView(APIView):
    """
    Profile endpoint returning authenticated user's profile, allowance,
    points, recognition statistics, unlocked badges, and kudos history.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)


@extend_schema(
    tags=['Users & Profiles'],
    summary="Current user profile (Alias)",
    description="Alias endpoint returning authenticated user's full profile details.",
    responses={
        200: UserProfileSerializer,
        401: OpenApiTypes.OBJECT,
    }
)
class CurrentUserView(UserProfileView):
    """
    Alias endpoint for current user profile.
    """
    pass


# ==============================================================================
# Department & User Listing Views
# ==============================================================================

@extend_schema_view(
    get=extend_schema(
        tags=['Departments'],
        summary="List all departments",
        description="Retrieves a list of all company departments with user counts.",
        responses={200: DepartmentSerializer(many=True)}
    )
)
class DepartmentListAPIView(generics.ListAPIView):
    queryset = Department.objects.prefetch_related('users').all()
    serializer_class = DepartmentSerializer
    permission_classes = [AllowAny]
    pagination_class = None


@extend_schema_view(
    get=extend_schema(
        tags=['Departments'],
        summary="Retrieve department details",
        description="Retrieves specific department information by its primary key ID.",
        responses={
            200: DepartmentSerializer,
            404: OpenApiTypes.OBJECT,
        }
    )
)
class DepartmentDetailAPIView(generics.RetrieveAPIView):
    queryset = Department.objects.prefetch_related('users').all()
    serializer_class = DepartmentSerializer
    permission_classes = [AllowAny]


@extend_schema_view(
    get=extend_schema(
        tags=['Users & Profiles'],
        summary="List / Search team members (User Autocomplete)",
        description=(
            "Retrieves paginated team members. Designed for Give Kudos modal autocomplete and member search. "
            "Supports search by name/email, department filtering, and auto-excludes authenticated sender."
        ),
        parameters=[
            OpenApiParameter(
                name='search',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Search query matching user name or email (e.g., "Alice" or "bob@")'
            ),
            OpenApiParameter(
                name='department',
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                description='Filter by department name (Engineering, Design, etc.) or department ID'
            ),
            OpenApiParameter(
                name='exclude_self',
                type=OpenApiTypes.BOOL,
                location=OpenApiParameter.QUERY,
                description='Exclude the currently authenticated user from results (default: true in modal)'
            ),
            OpenApiParameter(
                name='page',
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                description='Page number for pagination'
            ),
        ],
        responses={200: UserSerializer(many=True)}
    )
)
class UserListAPIView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = User.objects.select_related('department').filter(is_active=True).order_by('name')

        # 1. User search by name or email (case-insensitive substring)
        search_query = self.request.query_params.get('search')
        if search_query:
            clean_search = search_query.strip()
            queryset = queryset.filter(
                Q(name__icontains=clean_search) | Q(email__icontains=clean_search)
            )

        # 2. Filter by department name or ID
        department_param = self.request.query_params.get('department')
        if department_param:
            clean_dept = department_param.strip()
            if clean_dept.isdigit():
                queryset = queryset.filter(department_id=int(clean_dept))
            else:
                queryset = queryset.filter(department__name__iexact=clean_dept)

        # 3. Exclude self (ideal for Give Kudos modal receiver picker)
        exclude_self_param = self.request.query_params.get('exclude_self')
        should_exclude_self = False
        if exclude_self_param is not None:
            should_exclude_self = exclude_self_param.strip().lower() in ('true', '1', 't')
        elif self.request.user.is_authenticated:
            # Default to excluding self if authenticated
            should_exclude_self = True

        if should_exclude_self and self.request.user.is_authenticated:
            queryset = queryset.exclude(id=self.request.user.id)

        return queryset


@extend_schema_view(
    get=extend_schema(
        tags=['Users & Profiles'],
        summary="Retrieve user profile",
        description="Retrieves public details of a specific team member by ID.",
        responses={
            200: UserSerializer,
            404: OpenApiTypes.OBJECT,
        }
    )
)
class UserDetailAPIView(generics.RetrieveAPIView):
    queryset = User.objects.select_related('department').filter(is_active=True)
    serializer_class = UserSerializer
    permission_classes = [AllowAny]
