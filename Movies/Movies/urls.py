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

from django.db import transaction

def load_movies(request):
    import subprocess
    import sys
    from django.http import JsonResponse
    try:
        log_file = open('/app/load_db_log.txt', 'w')
        subprocess.Popen([sys.executable, 'manage.py', 'load_my_db'], stdout=log_file, stderr=subprocess.STDOUT)
        return JsonResponse({'status': 'Database wipe and load started in the background! Please check back in a few minutes.'})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})



def db_test(request):
    from Users.models import PersonModel
    from django.db import connection
    from django.http import JsonResponse
    import traceback
    try:
        c1 = PersonModel.objects.count()
        with connection.cursor() as cursor:
            cursor.execute('TRUNCATE TABLE "Users_personmodel" CASCADE;')
        c2 = PersonModel.objects.count()
        p = PersonModel(id=133, tmdb_id=1683371, name='Eric Linden')
        p.save()
        c3 = PersonModel.objects.count()
        return JsonResponse({'status': 'ok', 'before': c1, 'after_truncate': c2, 'after_insert': c3})
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e), 'trace': traceback.format_exc()})

urlpatterns = [
    path('db-test/', db_test),
    path('api/health/', health_check, name='health_check'),
    path('magic-admin-setup/', force_create_superuser),
    path('magic-load-movies/', load_movies),
    path('', include("Users.urls")),
    path('admin/', admin.site.urls),
]
