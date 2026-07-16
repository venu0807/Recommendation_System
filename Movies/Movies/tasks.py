import os
import time
import requests
from celery import shared_task
from django.core.cache import cache

TMDB_API_KEY = os.environ.get('TMDB_API_KEY', '')
TMDB_BASE = 'https://api.themoviedb.org/3'
CACHE_TTL = 4 * 60 * 60  # 4 hours


class TMDBRateLimiter:
    """Rate limiter for TMDB API calls (max 40 requests per 10 seconds on free tier)."""
    def __init__(self, max_calls=40, period=10):
        self.max_calls = max_calls
        self.period = period

    def is_allowed(self):
        now = time.time()
        key = 'tmdb_rate_limit'
        timestamps = cache.get(key, [])
        timestamps = [t for t in timestamps if now - t < self.period]
        if len(timestamps) >= self.max_calls:
            return False
        timestamps.append(now)
        cache.set(key, timestamps, self.period * 2)
        return True


@shared_task(bind=True, max_retries=3)
def refresh_trending_movies(self):
    """Fetch trending movies from TMDB and cache them."""
    limiter = TMDBRateLimiter()
    if not limiter.is_allowed():
        raise self.retry(exc=Exception('Rate limited'), countdown=15)
    try:
        resp = requests.get(
            f'{TMDB_BASE}/trending/movie/week',
            params={'api_key': TMDB_API_KEY},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        cache.set('tmdb_trending', data.get('results', []), CACHE_TTL)
        return f"Cached {len(data.get('results', []))} trending movies"
    except requests.RequestException as e:
        raise self.retry(exc=e, countdown=60)


@shared_task(bind=True, max_retries=2)
def fetch_movie_details(self, tmdb_id: int):
    """Fetch movie details from TMDB and cache them."""
    limiter = TMDBRateLimiter()
    if not limiter.is_allowed():
        raise self.retry(exc=Exception('Rate limited'), countdown=15)
    try:
        resp = requests.get(
            f'{TMDB_BASE}/movie/{tmdb_id}',
            params={'api_key': TMDB_API_KEY},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()
        cache_key = f'tmdb_movie_{tmdb_id}'
        cache.set(cache_key, data, CACHE_TTL)
        return data
    except requests.RequestException as e:
        raise self.retry(exc=e, countdown=30)
