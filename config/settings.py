from pathlib import Path
from datetime import timedelta
import os
from dotenv import load_dotenv

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from .env file
load_dotenv(BASE_DIR / '.env')

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/5.0/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv('SECRET_KEY', 'insecure-default-change-me-in-production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.getenv('DEBUG', 'True').strip().lower() in ('true', '1', 't')

ALLOWED_HOSTS = [host.strip() for host in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1,testserver').split(',') if host.strip()]
if DEBUG and 'testserver' not in ALLOWED_HOSTS:
    ALLOWED_HOSTS.append('testserver')

# Application definition
DJANGO_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
]

THIRD_PARTY_APPS = [
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'drf_spectacular',
]

LOCAL_APPS = [
    'apps.accounts',
    'apps.kudos',
    'apps.reactions',
    'apps.leaderboard',
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # Must be near the top for CORS handling
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'config.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [BASE_DIR / 'templates'],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'config.wsgi.application'
ASGI_APPLICATION = 'config.asgi.application'

# Database Configuration using environment variables (PostgreSQL)
# All credentials are loaded from .env and not hardcoded
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.getenv('DB_NAME'),
        'USER': os.getenv('DB_USER'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST'),
        'PORT': os.getenv('DB_PORT'),
    }
}

# Password validation
# https://docs.djangoproject.com/en/5.0/ref/settings/#auth-password-validators
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# Static files (CSS, JavaScript, Images)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

# Media files (Uploads, Avatars)
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Default primary key field type
DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# Custom User Model
AUTH_USER_MODEL = 'accounts.User'

# ==========================================
# Django REST Framework (DRF) Configuration
# ==========================================
REST_FRAMEWORK = {
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'apps.accounts.authentication.JWTCookieAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticatedOrReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}

# ==========================================
# Simple JWT Configuration
# ==========================================
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=15),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'UPDATE_LAST_LOGIN': True,
    'ALGORITHM': 'HS256',
    'SIGNING_KEY': os.getenv('JWT_SECRET_KEY', SECRET_KEY),
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_HEADER_NAME': 'HTTP_AUTHORIZATION',
    'USER_ID_FIELD': 'id',
    'USER_ID_CLAIM': 'user_id',
}

# ==========================================
# API Documentation (drf-spectacular / OpenAPI)
# ==========================================
SPECTACULAR_SETTINGS = {
    'TITLE': 'Internal Team Feedback & Peer Kudos Wall API',
    'DESCRIPTION': (
        'RESTful API backend for employee recognition, peer kudos wall, '
        'emoji reactions, and monthly department leaderboard analytics.\n\n'
        '### Key Features\n'
        '* **Authentication**: JWT authentication with 15-minute access tokens and 7-day refresh tokens delivered via HTTP-only cookies with automatic rotation and blacklisting.\n'
        '* **Users & Profiles**: Complete user directory, autocomplete search for peer recognition, and personal profile analytics.\n'
        '* **Kudos Feed & Transfer**: Atomic points transfer with database row locking (SELECT FOR UPDATE) preventing race conditions and negative allowances.\n'
        '* **Reactions**: Interactive emoji reactions (+1, 👏, 🔥) with toggle support.\n'
        '* **Leaderboard**: Real-time monthly rankings calculated through database-level ORM aggregation with department filtering.'
    ),
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'COMPONENT_SPLIT_REQUEST': True,
    'SCHEMA_PATH_PREFIX': r'/api/',
    'TAGS': [
        {'name': 'Authentication', 'description': 'Signup, email verification, login with JWT & HTTP-only cookies, token rotation, logout, forgot password, and reset password.'},
        {'name': 'Users & Profiles', 'description': 'Authenticated user profile, team directory, and user autocomplete search.'},
        {'name': 'Kudos', 'description': 'Company kudos feed with filtering, kudos details, and atomic Give Kudos point transfer.'},
        {'name': 'Reactions', 'description': 'Emoji reactions (+1, 👏, 🔥) on kudos cards.'},
        {'name': 'Leaderboard', 'description': 'Monthly leaderboard rankings with department filtering.'},
        {'name': 'Departments', 'description': 'Company departments listing and details.'},
    ],
    'SWAGGER_UI_SETTINGS': {
        'deepLinking': True,
        'persistAuthorization': True,
        'displayOperationId': False,
        'defaultModelsExpandDepth': 2,
        'defaultModelExpandDepth': 2,
    },
}

# ==========================================
# CORS Configuration (React Frontend)
# ==========================================
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv('CORS_ALLOWED_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')
    if origin.strip()
]
CORS_ALLOW_CREDENTIALS = True  # Required for HTTP-only cookies in cross-origin requests

# ==========================================
# Cookie Security Settings (HTTP-only Cookies)
# ==========================================
AUTH_COOKIE_ACCESS_NAME = 'access_token'
AUTH_COOKIE_REFRESH_NAME = 'refresh_token'
AUTH_COOKIE_ACCESS_MAX_AGE = 15 * 60  # 15 minutes
AUTH_COOKIE_REFRESH_MAX_AGE = 7 * 24 * 60 * 60  # 7 days
AUTH_COOKIE_SECURE = os.getenv('COOKIE_SECURE', 'False').strip().lower() in ('true', '1', 't')
AUTH_COOKIE_SAMESITE = os.getenv('COOKIE_SAMESITE', 'Lax')
AUTH_COOKIE_PATH = '/'
AUTH_COOKIE_HTTP_ONLY = True
