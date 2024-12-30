from django.apps import AppConfig


class UsersConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'Users'

    def ready(self):
        # Import the function you want to run
        from .utils import fetch_movies  # Adjust the import based on your project structure
        fetch_movies()  # Call the function
