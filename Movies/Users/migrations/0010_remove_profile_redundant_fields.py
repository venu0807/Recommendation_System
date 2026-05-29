from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('Users', '0009_force_superuser'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='userprofilemodel',
            name='firstname',
        ),
        migrations.RemoveField(
            model_name='userprofilemodel',
            name='lastname',
        ),
        migrations.RemoveField(
            model_name='userprofilemodel',
            name='email',
        ),
    ]
