from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Users'

    def ready(self):
        # Register drf-spectacular authentication extension
        # This is done via SPECTACULAR_SETTINGS['AUTHENTICATION_EXTENSIONS'] in settings.py
        pass
