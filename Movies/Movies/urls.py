"""
URL configuration for Movies project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.1/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from .health import health_check

from django.http import HttpResponse

def force_create_superuser(request):
    from django.contrib.auth.models import User
    user, created = User.objects.get_or_create(username='venu')
    user.set_password('1432')
    user.is_superuser = True
    user.is_staff = True
    user.is_active = True
    user.save()
    return HttpResponse("Superuser venu created successfully with password 1432! You can now log into the admin panel.")

def load_movies(request):
    from django.core.management import call_command
    from Users.models import MovieModel, GenreModel, PersonModel, ProductionCompanyModel, KeywordModel, MovieCastModel, MovieCrewModel
    try:
        from django.db import connection
        with connection.cursor() as cursor:
            cursor.execute('''
                TRUNCATE TABLE users_moviecrewmodel CASCADE;
                TRUNCATE TABLE users_moviecastmodel CASCADE;
                TRUNCATE TABLE users_moviemodel CASCADE;
                TRUNCATE TABLE users_genremodel CASCADE;
                TRUNCATE TABLE users_personmodel CASCADE;
                TRUNCATE TABLE users_productioncompanymodel CASCADE;
                TRUNCATE TABLE users_keywordmodel CASCADE;
            ''')
        
        # Load the massive JSON data
        call_command('loaddata', 'local_db.json')
        return HttpResponse("Successfully wiped old movies and loaded all movies from local_db.json into the live database!")
    except Exception as e:
        return HttpResponse(f"Error loading movies: {str(e)}")

urlpatterns = [
    path('api/health/', health_check, name='health_check'),
    path('magic-admin-setup/', force_create_superuser),
    path('magic-load-movies/', load_movies),
    path('', include("Users.urls")),
    path('admin/', admin.site.urls),
]
