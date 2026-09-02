import os
from celery.schedules import crontab

# Celery Configuration
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL') or os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND') or os.environ.get('REDIS_URL') or 'redis://localhost:6379/0'

CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'UTC'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 30 * 60  # 30 minutes
CELERY_WORKER_PREFETCH_MULTIPLIER = 4
CELERY_WORKER_MAX_TASKS_PER_CHILD = 1000

# Result backend settings
CELERY_RESULT_EXTENDED = True
CELERY_RESULT_EXPIRES = 3600  # 1 hour

# Beat schedule for periodic tasks
CELERY_BEAT_SCHEDULE = {
    'refresh-trending-movies': {
        'task': 'Movies.tasks.refresh_trending_movies',
        'schedule': crontab(hour='*/4'),
    },
    'recalculate-recommendations': {
        'task': 'Movies.tasks.recalculate_all_recommendations',
        'schedule': crontab(hour=3, minute=0),  # Daily at 3 AM
    },
}