"""
Django settings for Movies project.

Production-ready configuration with proper PostgreSQL, Redis, and security settings.
"""

from pathlib import Path
import os
from datetime import timedelta
from dotenv import load_dotenv
import dj_database_url
import sentry_sdk

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(BASE_DIR / '.env')

# Sentry initialization
if os.environ.get('SENTRY_DSN'):
    sentry_sdk.init(
        dsn=os.environ.get('SENTRY_DSN'),
        traces_sample_rate=0.3,
        profiles_sample_rate=0.1,
        environment=os.environ.get('ENVIRONMENT', 'production'),
    )

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    raise RuntimeError('SECRET_KEY environment variable is required in production')

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# Production: require explicit ALLOWED_HOSTS
ALLOWED_HOSTS = os.environ.get('ALLOWED_HOSTS', '').split(',')
if not ALLOWED_HOSTS or ALLOWED_HOSTS == ['']:
    if DEBUG:
        ALLOWED_HOSTS = ['localhost', '127.0.0.1']
    else:
        raise RuntimeError('ALLOWED_HOSTS environment variable is required in production')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'Users.apps.UsersConfig',
    'rest_framework',
    'corsheaders',
    'rest_framework_simplejwt.token_blacklist',
    'channels',
    'drf_spectacular',
    'drf_spectacular_sidecar',
    'whitenoise.runserver_nostatic',
]

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(minutes=5),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=int(os.environ.get('JWT_REFRESH_DAYS', '30'))),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "UPDATE_LAST_LOGIN": False,
    "ALGORITHM": "HS256",
    "AUTH_HEADER_TYPES": ("Bearer",),
    "USER_ID_FIELD": "id",
    "USER_ID_CLAIM": "user_id",
    "TOKEN_OBTAIN_SERIALIZER": "rest_framework_simplejwt.serializers.TokenObtainPairSerializer",
    "TOKEN_REFRESH_SERIALIZER": "rest_framework_simplejwt.serializers.TokenRefreshSerializer",
    "TOKEN_VERIFY_SERIALIZER": "rest_framework_simplejwt.serializers.TokenVerifySerializer",
    "TOKEN_BLACKLIST_SERIALIZER": "rest_framework_simplejwt.serializers.TokenBlacklistSerializer",
}

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'Users.authentication.CookieJWTAuthentication',
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': os.environ.get('THROTTLE_ANON', '100/hour'),
        'user': os.environ.get('THROTTLE_USER', '1000/hour'),
    },
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

ROOT_URLCONF = 'Movies.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
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

WSGI_APPLICATION = 'Movies.wsgi.application'
ASGI_APPLICATION = 'Movies.asgi.application'

# Database - PostgreSQL required in production
DATABASE_URL = os.environ.get('DATABASE_URL')
if not DATABASE_URL:
    if DEBUG:
        DATABASE_URL = 'sqlite:///db.sqlite3'
    else:
        raise RuntimeError('DATABASE_URL environment variable is required in production')

DATABASES = {
    'default': dj_database_url.config(
        default=DATABASE_URL,
        conn_max_age=600,
    )
}

# Enable connection health checks (Django 4.1+)
DATABASES['default']['CONN_HEALTH_CHECKS'] = True

# Add connection timeout for PostgreSQL
if DATABASES['default']['ENGINE'] == 'django.db.backends.postgresql':
    DATABASES['default']['OPTIONS'] = {
        'connect_timeout': 10,
        'sslmode': 'require',
    }

# Cache - Redis required in production
REDIS_URL = os.environ.get('REDIS_URL')
if REDIS_URL:
    CACHES = {
        'default': {
            'BACKEND': 'django_redis.cache.RedisCache',
            'LOCATION': REDIS_URL,
            'OPTIONS': {
                'CLIENT_CLASS': 'django_redis.client.DefaultClient',
                'COMPRESSOR': 'django_redis.compressors.zlib.ZlibCompressor',
                'IGNORE_EXCEPTIONS': True,
            },
            'KEY_PREFIX': 'movies',
            'TIMEOUT': 300,
        }
    }
else:
    if DEBUG:
        CACHES = {
            'default': {
                'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
                'LOCATION': 'movie-recommendation-cache',
            }
        }
    else:
        raise RuntimeError('REDIS_URL environment variable is required in production')

# Channel layers - Redis required in production
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [REDIS_URL],
        },
    },
}

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Asia/Kolkata'
USE_I18N = True
USE_TZ = True

# Static files
STATIC_URL = '/static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = BASE_DIR / 'mediafiles'

# drf-spectacular settings
SPECTACULAR_SETTINGS = {
    'TITLE': 'Movies Recommendation API',
    'DESCRIPTION': 'API for movie recommendations, ratings, watchlists, favorites, and TV show management.',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
    'SWAGGER_UI_DIST': 'SIDECAR',
    'SWAGGER_UI_FAVICON_HREF': 'SIDECAR',
    'REDOC_DIST': 'SIDECAR',
    'COMPONENT_SPLIT_REQUEST': True,
    'AUTHENTICATION_EXTENSIONS': [
        'Users.schema.CookieJWTAuthenticationScheme',
    ],
    'AUTHENTICATION_WHITELIST': [
        'Users.authentication.CookieJWTAuthentication',
    ],
}

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS Configuration
CORS_ALLOW_ALL_ORIGINS = False
CORS_ALLOWED_ORIGINS = [
    'https://recommendation-system-ochre.vercel.app',
    'https://recommendation-system-37g9y5dw3.vercel.app',
    'http://localhost:3000',
    'http://127.0.0.1:3000',
] + [org.strip() for org in os.environ.get('CORS_ALLOWED_ORIGINS', '').split(',') if org.strip()]

CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https:\/\/recommendation-system-.*\.vercel\.app$",
]

CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = os.environ.get('CSRF_TRUSTED_ORIGINS', '').split(',') if os.environ.get('CSRF_TRUSTED_ORIGINS') else []
SECURE_PROXY_SSL_HEADER = ('HTTP_X_FORWARDED_PROTO', 'https')

# Security headers - Production ready
SECURE_HSTS_SECONDS = int(os.environ.get('SECURE_HSTS_SECONDS', '31536000'))
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_SSL_REDIRECT = os.environ.get('SECURE_SSL_REDIRECT', 'True') == 'True'
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'
SECURE_REFERRER_POLICY = 'strict-origin-when-cross-origin'
SECURE_CROSS_ORIGIN_OPENER_POLICY = 'same-origin'

# Cookie security
SESSION_COOKIE_SECURE = os.environ.get('COOKIE_SECURE', 'True') == 'True'
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = 'Lax'
CSRF_COOKIE_SECURE = os.environ.get('COOKIE_SECURE', 'True') == 'True'
CSRF_COOKIE_HTTPONLY = True
CSRF_COOKIE_SAMESITE = 'Lax'

# TMDB
TMDB_API_KEY = os.environ.get('TMDB_API_KEY', '')
TMDB_API_URL = os.environ.get('TMDB_API_URL', 'https://api.themoviedb.org/3')

# Logging - Structured JSON for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'json': {
            'format': '{ "time": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s" }',
        },
    },
    'handlers': {
        'console': {
            'class': 'logging.StreamHandler',
            'formatter': 'json',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': os.environ.get('DJANGO_LOG_LEVEL', 'INFO'),
    },
    'loggers': {
        'django.request': {
            'handlers': ['console'],
            'level': 'WARNING',
            'propagate': False,
        },
        'django.db.backends': {
            'handlers': ['console'],
            'level': 'WARNING',
        },
    },
}

# Celery configuration
from .celery_config import *  # noqa: F401, F403

# Health check settings
HEALTH_CHECK = {
    'DATABASE': True,
    'CACHE': True,
    'REDIS': True,
}