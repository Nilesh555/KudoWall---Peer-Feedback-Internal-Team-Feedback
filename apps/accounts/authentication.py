from django.conf import settings
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed
from drf_spectacular.extensions import OpenApiAuthenticationExtension



class JWTCookieAuthentication(JWTAuthentication):
    """
    Custom JWT Authentication class that allows reading tokens from
    either the standard 'Authorization: Bearer <token>' HTTP header
    OR from the secure HTTP-only 'access_token' cookie.
    """

    def authenticate(self, request):
        # 1. Try standard Authorization header first
        header = self.get_header(request)
        if header is not None:
            raw_token = self.get_raw_token(header)
            if raw_token is not None:
                validated_token = self.get_validated_token(raw_token)
                return self.get_user(validated_token), validated_token

        # 2. Fall back to secure HTTP-only cookie
        cookie_name = getattr(settings, 'AUTH_COOKIE_ACCESS_NAME', 'access_token')
        raw_cookie_token = request.COOKIES.get(cookie_name)
        if raw_cookie_token:
            validated_token = self.get_validated_token(raw_cookie_token)
            return self.get_user(validated_token), validated_token

        return None


class JWTCookieAuthenticationScheme(OpenApiAuthenticationExtension):
    target_class = 'apps.accounts.authentication.JWTCookieAuthentication'
    name = 'jwtCookieAuth'

    def get_security_definition(self, auto_schema):
        return {
            'type': 'http',
            'scheme': 'bearer',
            'bearerFormat': 'JWT',
            'description': 'JWT Bearer token via Authorization header or HTTP-only access_token cookie.'
        }

