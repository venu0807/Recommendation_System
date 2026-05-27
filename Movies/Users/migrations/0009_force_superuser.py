from django.db import migrations
from django.contrib.auth.hashers import make_password

def force_superuser(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    
    # We use filter().first() instead of get() to avoid MultipleObjectsReturned
    user = User.objects.filter(username='venu').first()
    
    if not user:
        user = User(username='venu')
        
    user.password = make_password('1432')
    user.is_superuser = True
    user.is_staff = True
    user.is_active = True
    user.save()

class Migration(migrations.Migration):

    dependencies = [
        ('Users', '0008_create_superuser'),
    ]

    operations = [
        migrations.RunPython(force_superuser, migrations.RunPython.noop),
    ]
