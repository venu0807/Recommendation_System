from django.http import JsonResponse
from django.db import connection
import redis
import os
from django.core.cache import cache

def health_check(request):
    health = {
        "status": "ok",
        "database": "unknown",
        "redis": "unknown",
        "cache": "unknown",
        "celery": "unknown",
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
        redis_url = os.environ.get('REDIS_URL')
        if redis_url:
            r = redis.from_url(redis_url)
            r.ping()
            health["redis"] = "healthy"
        else:
            health["redis"] = "not configured"
            health["status"] = "degraded"
    except Exception as e:
        health["redis"] = f"unavailable: {str(e)}"
        health["status"] = "error"

    # Check Django Cache (uses Redis in production)
    try:
        cache.set('health_check_test', 'ok', 10)
        if cache.get('health_check_test') == 'ok':
            health["cache"] = "healthy"
        else:
            health["cache"] = "unhealthy"
            health["status"] = "degraded"
    except Exception as e:
        health["cache"] = f"error: {str(e)}"
        health["status"] = "degraded"

    # Check Celery (if configured)
    try:
        from celery import current_app
        inspect = current_app.control.inspect()
        if inspect.ping():
            health["celery"] = "healthy"
        else:
            health["celery"] = "no workers"
    except Exception as e:
        health["celery"] = f"error: {str(e)}"
        health["status"] = "degraded"

    status_code = 200 if health["status"] in ("ok", "degraded") else 503
    return JsonResponse(health, status=status_code)