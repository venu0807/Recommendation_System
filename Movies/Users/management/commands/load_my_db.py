from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import connection

class Command(BaseCommand):
    help = 'Wipe database and load local_db.json'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('Truncating database tables...'))
        with connection.cursor() as cursor:
            cursor.execute('''
                TRUNCATE TABLE "Users_moviecrewmodel" CASCADE;
                TRUNCATE TABLE "Users_moviecastmodel" CASCADE;
                TRUNCATE TABLE "Users_moviemodel" CASCADE;
                TRUNCATE TABLE "Users_genremodel" CASCADE;
                TRUNCATE TABLE "Users_personmodel" CASCADE;
                TRUNCATE TABLE "Users_productioncompanymodel" CASCADE;
                TRUNCATE TABLE "Users_keywordmodel" CASCADE;
                TRUNCATE TABLE "Users_tvshowmodel" CASCADE;
            ''')
        
        self.stdout.write(self.style.SUCCESS('Loading database from local_db.json...'))
        call_command('loaddata', 'local_db.json')
        
        # Clear the cache because we just replaced the database
        from django.core.cache import cache
        cache.clear()
        
        self.stdout.write(self.style.SUCCESS('Successfully loaded local_db.json!'))
