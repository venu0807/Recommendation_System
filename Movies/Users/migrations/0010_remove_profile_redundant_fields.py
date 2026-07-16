from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('Users', '0007_favoritetvshowsmodel_tvshowreviewmodel_and_more'),
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
