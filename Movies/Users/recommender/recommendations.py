import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from django.db.models import Q, Avg, Count
from ..models import *
from django.utils import timezone
from datetime import timedelta
import logging
from django.db import models
from django.core.cache import cache

logger = logging.getLogger(__name__)

# Cache configuration
RECS_CACHE_TTL = 60 * 15  # 15 minutes for user recommendations
TFIDF_CACHE_TTL = 60 * 30  # 30 minutes for TF-IDF matrix
LIST_CACHE_TTL = 60 * 10  # 10 minutes for list endpoints


# ──────────────────────────────────────────────
#  USER-MOVIE MATRIX (for collaborative filtering)
# ──────────────────────────────────────────────

def create_user_movie_matrix():
    """Build a user-movie rating matrix as a DataFrame. Used by collaborative filtering."""
    ratings = RatingModel.objects.all().values('user_id', 'movie_id', 'rating')
    logger.info(f"Ratings data: {list(ratings)}")

    if not ratings:
        logger.warning("No ratings found in the database.")
        return pd.DataFrame()

    df = pd.DataFrame(ratings)
    if not {'user_id', 'movie_id', 'rating'}.issubset(df.columns):
        raise ValueError("Required fields (user_id, movie_id, rating) are missing.")

    user_movie_matrix = df.pivot_table(index='user_id', columns='movie_id', values='rating').fillna(0).infer_objects(copy=False)
    logger.info(f"User movie matrix created with shape: {user_movie_matrix.shape}")
    logger.debug(f"User movie matrix head: {user_movie_matrix.head()}")
    return user_movie_matrix


# ──────────────────────────────────────────────
#  USER RECOMMENDATIONS (with caching)
# ──────────────────────────────────────────────

def get_user_recommendations(user_id, num_recommendations=10):
    """Cached wrapper around the user recommendation engine."""
    cache_key = f'user_recs_{user_id}_{num_recommendations}'
    cached = cache.get(cache_key)
    if cached is not None:
        logger.info(f"Cache hit for user {user_id}")
        return cached

    result = _compute_user_recommendations(user_id, num_recommendations)
    cache.set(cache_key, result, RECS_CACHE_TTL)
    logger.info(f"Cached recommendations for user {user_id}")
    return result


def clear_user_recommendations_cache(user_id, cache_sizes=None):
    """Invalidate cached recommendations for a user. Called after rating a movie."""
    if cache_sizes is None:
        cache_sizes = [5, 10, 20]
    for num in cache_sizes:
        cache.delete(f'user_recs_{user_id}_{num}')
    logger.info(f"Cleared recommendation cache for user {user_id}")


def _compute_user_recommendations(user_id, num_recommendations=10):
    try:
        logger.info(f"Starting recommendations for user_id: {user_id}")
        
        # Get user's ratings
        user_ratings = RatingModel.objects.filter(user__username=user_id)
        logger.info(f"Found {user_ratings.count()} ratings for user {user_id}")

        if not user_ratings.exists():
            logger.warning(f"No ratings found for user {user_id}")
            return {
                'recommendations': get_trending_movies(num_recommendations),
                'rated_movies': []
            }

        # Get rated movies
        rated_movies = []
        for rating in user_ratings:
            rated_movies.append({
                'movie': rating.movie,
                'rating': rating.rating
            })

        # Get highest rated movie first
        highest_rated = user_ratings.order_by('-rating').first()
        highest_rated_movie = highest_rated.movie
        rated_movie_ids = set(user_ratings.values_list('movie_id', flat=True))
        
        logger.info(f"Highest rated movie: {highest_rated_movie.title} ({highest_rated.rating})")
        logger.info(f"Language: {highest_rated_movie.original_language}")
        logger.info(f"Genres: {[g.name for g in highest_rated_movie.genres.all()]}")

        recommendations = []

        # First get recommendations based on highest rated movie
        primary_recs = MovieModel.objects.filter(
            Q(genres__in=highest_rated_movie.genres.all()) &  # Must match genres
            Q(original_language=highest_rated_movie.original_language),  # Must match language
            poster_path__isnull=False
        ).exclude(
            id__in=rated_movie_ids
        ).annotate(
            genre_match=Count('genres', filter=Q(genres__in=highest_rated_movie.genres.all()))
        ).order_by('-genre_match', '-vote_average')[:5]
        
        # Add recommendations with source information
        for movie in primary_recs:
            recommendations.append({
                'movie': movie,
                'source': f"Because you rated {highest_rated_movie.title} ({highest_rated.rating}/10)",
                'match_score': movie.genre_match
            })
        logger.info(f"Added {len(primary_recs)} primary recommendations")

        # Then get recommendations based on other highly rated movies (rating >= 7)
        for rating in user_ratings.filter(rating__gte=7.0).exclude(id=highest_rated.id):
            movie = rating.movie
            similar_movies = MovieModel.objects.filter(
                genres__in=movie.genres.all(),
                poster_path__isnull=False
            ).exclude(
                id__in=rated_movie_ids | {m['movie'].id for m in recommendations}
            ).annotate(
                genre_match=Count('genres', filter=Q(genres__in=movie.genres.all()))
            ).filter(
                genre_match__gte=2  # Must match at least 2 genres
            ).order_by('-genre_match', '-vote_average')[:3]
            
            # Add recommendations with source information
            for similar_movie in similar_movies:
                recommendations.append({
                    'movie': similar_movie,
                    'source': f"Because you rated {movie.title} ({rating.rating}/10)",
                    'match_score': similar_movie.genre_match
                })
            logger.info(f"Added {len(similar_movies)} recommendations based on {movie.title}")

        # If we still need more recommendations, add movies with similar genres
        if len(recommendations) < num_recommendations:
            remaining = num_recommendations - len(recommendations)
            genre_recs = MovieModel.objects.filter(
                genres__in=highest_rated_movie.genres.all(),
                poster_path__isnull=False
            ).exclude(
                id__in=rated_movie_ids | {m['movie'].id for m in recommendations}
            ).annotate(
                genre_match=Count('genres', filter=Q(genres__in=highest_rated_movie.genres.all()))
            ).filter(
                genre_match__gte=1  # Must match at least one genre
            ).order_by('-genre_match', '-vote_average')[:remaining]
            
            # Add recommendations with source information
            for movie in genre_recs:
                recommendations.append({
                    'movie': movie,
                    'source': f"Similar to movies you've rated highly",
                    'match_score': movie.genre_match
                })
            logger.info(f"Added {len(genre_recs)} additional genre recommendations")

        # Remove duplicates while preserving order
        seen = set()
        unique_recommendations = []
        for rec in recommendations:
            movie = rec['movie']
            if movie.id not in seen and movie.id not in rated_movie_ids:
                seen.add(movie.id)
                unique_recommendations.append({
                    'movie': movie,
                    'source': rec['source'],
                    'match_score': rec['match_score']
                })
                logger.info(f"Adding: {movie.title}")
                logger.info(f"Source: {rec['source']}")
                logger.info(f"Match score: {rec['match_score']}")

        # Return only the movies, but with source information
        final_recommendations = []
        for rec in unique_recommendations[:num_recommendations]:
            movie = rec['movie']
            movie.recommendation_source = rec['source']  # Add source information to movie object
            movie.match_score = rec['match_score']  # Add match score to movie object
            final_recommendations.append(movie)

        # Return both recommendations and rated movies
        return {
            'recommendations': final_recommendations,
            'rated_movies': rated_movies
        }

    except Exception as e:
        logger.error(f"Error in _compute_user_recommendations: {str(e)}", exc_info=True)
        return {
            'recommendations': get_trending_movies(num_recommendations),
            'rated_movies': []
        }


# ──────────────────────────────────────────────
#  CONTENT-BASED FILTERING (with cached TF-IDF)
# ──────────────────────────────────────────────

def _get_tfidf_matrix():
    """Build or retrieve cached TF-IDF cosine similarity matrix and movie IDs."""
    cache_key = 'tfidf_matrix_data'
    cached = cache.get(cache_key)
    if cached is not None:
        logger.info("TF-IDF cache hit")
        return cached['matrix'], cached['movie_ids']

    movies = MovieModel.objects.all().prefetch_related('genres')
    features = []
    movie_ids = []
    for movie in movies:
        genres_str = ' '.join([g.name for g in movie.genres.all()])
        features.append(f"{movie.title} {genres_str} {movie.overview or ''}")
        movie_ids.append(movie.id)

    if not features:
        logger.warning("No movies found for TF-IDF matrix")
        return None, []

    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(features)
    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)

    cache.set(cache_key, {'matrix': cosine_sim, 'movie_ids': movie_ids}, TFIDF_CACHE_TTL)
    logger.info(f"Cached TF-IDF matrix for {len(movie_ids)} movies")
    return cosine_sim, movie_ids


def clear_tfidf_cache():
    """Invalidate the TF-IDF matrix cache. Called when new movies are added."""
    cache.delete('tfidf_matrix_data')
    logger.info("Cleared TF-IDF matrix cache")


def get_movie_recommendations(movie_id, num_recommendations=10):
    """Content-based recommendations with cached TF-IDF matrix."""
    cache_key = f'movie_recs_{movie_id}_{num_recommendations}'
    cached = cache.get(cache_key)
    if cached is not None:
        logger.info(f"Cache hit for movie {movie_id}")
        return MovieModel.objects.filter(id__in=cached)

    cosine_sim, movie_ids = _get_tfidf_matrix()
    if cosine_sim is None:
        return MovieModel.objects.none()

    try:
        movie_idx = movie_ids.index(movie_id)
    except ValueError:
        logger.warning(f"Movie {movie_id} not found in TF-IDF matrix")
        return MovieModel.objects.none()

    sim_scores = list(enumerate(cosine_sim[movie_idx]))
    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    rec_ids = [movie_ids[i[0]] for i in sim_scores[1:num_recommendations + 1]]

    cache.set(cache_key, rec_ids, RECS_CACHE_TTL)
    return MovieModel.objects.filter(id__in=rec_ids)

# Hybrid Recommendations (Collaborative + Content-Based)
def hybrid_recommendations(user_id, movie_id=None, num_recommendations=10):
    logger.info(f"Generating hybrid recommendations for user_id: {user_id}, movie_id: {movie_id}")
    # Get user-based recommendations (Collaborative Filtering)
    user_recommendations = get_user_recommendations(user_id, num_recommendations)
    
    # Get movie-based recommendations (Content-Based Filtering)
    movie_recommendations = get_movie_recommendations(movie_id, num_recommendations) if movie_id else []

    # Get User Profile Preferences (Genres and Actors)
    try:
        user_preferences = UserProfileModel.objects.get(user_id=user_id)
        preferred_genres = user_preferences.preferred_genres.all()
        preferred_actors = user_preferences.preferred_actors.all()
    except UserProfileModel.DoesNotExist:
        preferred_genres = []
        preferred_actors = []

    # Filter movie recommendations based on user preferences
    movie_recommendations = [movie for movie in movie_recommendations if
        any(genre in preferred_genres for genre in movie.genres.all()) or
        any(actor in preferred_actors for actor in movie.cast.all())]

    # Combine both types of recommendations
    combined_recommendations = set(user_recommendations['recommendations']) | set(movie_recommendations)

    # Return the top recommendations
    final_recommendations = list(combined_recommendations)[:num_recommendations]
    logger.info(f"Final hybrid recommendations for user_id {user_id}: {[movie.id for movie in final_recommendations]}")
    return final_recommendations

# Dynamic Recommendations based on recent user activity and ratings
def dynamic_recommendations(user, limit=10):
    user_ratings = RatingModel.objects.filter(user=user, rating__gte=4.0)
    preferred_genres = set()
    preferred_actors = set()

    for rating in user_ratings:
        preferred_genres.update(rating.movie.genres.values_list('name', flat=True))
        preferred_actors.update(rating.movie.cast.values_list('name', flat=True))

    recommendations = MovieModel.objects.filter(
        Q(genres__name__in = list(preferred_genres)) |
        Q(cast__name__in = list(preferred_actors))
    ).exclude(
        id__in=user_ratings.values_list('movie_id', flat=True)
    ).distinct().order_by('-average_rating')[:limit]

    return recommendations

# ──────────────────────────────────────────────
#  LIST ENDPOINTS (with caching)
# ──────────────────────────────────────────────

def clear_all_list_caches():
    """Invalidate all cached list endpoints. Called when movies are added/updated."""
    for num in [5, 10, 20, 50]:
        for prefix in ['trending_movies_', 'trending_week_', 'popular_movies_',
                       'upcoming_movies_', 'now_playing_', 'top_rated_movies_']:
            cache.delete(f'{prefix}{num}')
    logger.info("Cleared all list endpoint caches")


def get_trending_movies(num_movies=20):
    """Trending Movies (Based on vote_average)."""
    cache_key = f'trending_movies_{num_movies}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    result = list(MovieModel.objects.filter(poster_path__isnull=False).prefetch_related(
        'genres', 'cast', 'crew', 'keywords', 'production_companies'
    ).annotate(
        annotated_average_rating=Avg('ratingmodel__rating')
    ).order_by('-vote_average')[:num_movies])
    cache.set(cache_key, result, LIST_CACHE_TTL)
    return result


def get_trending_movies_last_week(num_movies=20):
    """Trending Movies Last Week (Based on popularity)."""
    cache_key = f'trending_week_{num_movies}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    one_week_ago = timezone.now() - timedelta(days=7)
    result = list(MovieModel.objects.filter(release_date__gte=one_week_ago, poster_path__isnull=False).prefetch_related(
        'genres', 'cast', 'crew', 'keywords', 'production_companies'
    ).annotate(
        annotated_average_rating=Avg('ratingmodel__rating')
    ).order_by('-popularity')[:num_movies])
    cache.set(cache_key, result, LIST_CACHE_TTL)
    return result


def get_popular_movies(num_movies=20):
    """Popular Movies (Based on popularity)."""
    cache_key = f'popular_movies_{num_movies}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    result = list(MovieModel.objects.filter(poster_path__isnull=False).prefetch_related(
        'genres', 'cast', 'crew', 'keywords', 'production_companies'
    ).annotate(
        annotated_average_rating=Avg('ratingmodel__rating')
    ).order_by('-popularity')[:num_movies])
    cache.set(cache_key, result, LIST_CACHE_TTL)
    return result


def get_upcoming_movies(num_movies=20):
    """Upcoming Movies (next 14 days)."""
    cache_key = f'upcoming_movies_{num_movies}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    today = timezone.now()
    end_date = today + timedelta(days=14)
    result = list(MovieModel.objects.filter(
        release_date__gte=today,
        release_date__lte=end_date,
        poster_path__isnull=False
    ).prefetch_related(
        'genres', 'cast', 'crew', 'keywords', 'production_companies'
    ).annotate(
        annotated_average_rating=Avg('ratingmodel__rating')
    ).order_by('-release_date', '-popularity')[:num_movies])
    cache.set(cache_key, result, LIST_CACHE_TTL)
    return result


def get_now_playing_movies(num_movies=20):
    """Now Playing Movies."""
    cache_key = f'now_playing_{num_movies}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    result = list(MovieModel.objects.filter(release_date__lte=timezone.now(), poster_path__isnull=False).prefetch_related(
        'genres', 'cast', 'crew', 'keywords', 'production_companies'
    ).annotate(
        annotated_average_rating=Avg('ratingmodel__rating'
    )).order_by('-release_date')[:num_movies])
    cache.set(cache_key, result, LIST_CACHE_TTL)
    return result


def get_top_rated_movies(num_movies=20):
    """Top Rated Movies (Based on votes and ratings)."""
    cache_key = f'top_rated_movies_{num_movies}'
    cached = cache.get(cache_key)
    if cached is not None:
        return cached
    result = list(MovieModel.objects.filter(release_date__lte=timezone.now(), poster_path__isnull=False).prefetch_related(
        'genres', 'cast', 'crew', 'keywords', 'production_companies'
    ).annotate(
        annotated_average_rating=Avg('ratingmodel__rating')
    ).order_by('-vote_count', '-vote_average')[:num_movies])
    cache.set(cache_key, result, LIST_CACHE_TTL)
    return result