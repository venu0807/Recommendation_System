from django.db import migrations
from django.contrib.auth.hashers import make_password

def create_superuser(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    if not User.objects.filter(username='venu').exists():
        User.objects.create(
            username='venu',
            password=make_password('1432'),
            is_superuser=True,
            is_staff=True,
            is_active=True
        )

def remove_superuser(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    User.objects.filter(username='venu').delete()

class Migration(migrations.Migration):

    dependencies = [
        ('Users', '0007_favoritetvshowsmodel_tvshowreviewmodel_and_more'),
    ]

    operations = [
        migrations.RunPython(create_superuser, remove_superuser),
    ]
