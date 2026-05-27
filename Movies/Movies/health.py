from django.http import JsonResponse
from django.db import connection
import redis
import os

def health_check(request):
    health = {
        "status": "ok",
        "database": "unknown",
        "redis": "unknown"
    }

    # Check Database connection
    try:
        connection.ensure_connection()
        health["database"] = "healthy"
    except Exception as e:
        health["database"] = "unhealthy"
        health["status"] = "error"

    # Check Redis connection
    try:
        redis_url = os.environ.get('REDIS_URL', 'redis://redis:6379/0')
        r = redis.from_url(redis_url)
        r.ping()
        health["redis"] = "healthy"
    except Exception as e:
        health["redis"] = "unhealthy"
        health["status"] = "error"

    status_code = 200 if health["status"] == "ok" else 503
    return JsonResponse(health, status=status_code)
