web: daphne Movies.asgi:application --bind 0.0.0.0 --port $PORT --http-timeout 120
worker: celery -A Movies worker --loglevel=info
