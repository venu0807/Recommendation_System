import pandas as pd
import numpy as np
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.preprocessing import MinMaxScaler
from surprise import SVD, Reader, Dataset
from surprise.model_selection import train_test_split
from django.db.models import Q, Avg, Count, Case, When, Sum, F
from ..models import *
from django.utils import timezone
from datetime import timedelta
import logging
from django.db import models
from collections import defaultdict

logger = logging.getLogger(__name__)

class AdvancedRecommender:
    def __init__(self):
        self.svd_model = SVD(n_factors=100, n_epochs=20, lr_all=0.005, reg_all=0.02)
        self.min_max_scaler = MinMaxScaler()
        self.tfidf = TfidfVectorizer(stop_words='english')
        
    def prepare_data(self):
        """Prepare rating data for training"""
        ratings = RatingModel.objects.all().values('user__username', 'movie_id', 'rating')
        df = pd.DataFrame(ratings)
        reader = Reader(rating_scale=(0, 10))
        return Dataset.load_from_df(df[['user__username', 'movie_id', 'rating']], reader)

    def train_model(self):
        """Train the SVD model"""
        try:
            data = self.prepare_data()
            trainset = data.build_full_trainset()
            self.svd_model.fit(trainset)
            logger.info("SVD model trained successfully")
        except Exception as e:
            logger.error(f"Error training SVD model: {str(e)}")

    def get_content_features(self, movie):
        """Extract content features from movie"""
        genres = ' '.join([g.name for g in movie.genres.all()])
        cast = ' '.join([c.name for c in movie.cast.all()[:5]])
        crew = ' '.join([c.name for c in movie.crew.all()[:3]])
        return f"{movie.title} {movie.overview} {genres} {cast} {crew}"

    def calculate_genre_preferences(self, user_ratings):
        """Calculate user's genre preferences"""
        genre_scores = defaultdict(float)
        genre_counts = defaultdict(int)
        
        for rating in user_ratings:
            weight = (rating.rating / 10.0) ** 2  # Square to give more weight to higher ratings
            for genre in rating.movie.genres.all():
                genre_scores[genre.id] += weight
                genre_counts[genre.id] += 1
        
        # Normalize scores
        for genre_id in genre_scores:
            if genre_counts[genre_id] > 0:
                genre_scores[genre_id] /= genre_counts[genre_id]
                
        return genre_scores

    def get_user_recommendations(self, user_id, num_recommendations=10):
        try:
            logger.info(f"Getting recommendations for user: {user_id}")
            
            # Get user's ratings
            user_ratings = RatingModel.objects.filter(user__username=user_id)
            if not user_ratings.exists():
                logger.warning(f"No ratings found for user {user_id}")
                return {
                    'recommendations': get_trending_movies(num_recommendations),
                    'rated_movies': []
                }

            # Get rated movies for exclusion
            rated_movies = []
            rated_movie_ids = set()
            for rating in user_ratings:
                rated_movies.append({
                    'movie': rating.movie,
                    'rating': rating.rating
                })
                rated_movie_ids.add(rating.movie.id)

            # 1. Collaborative Filtering Recommendations
            self.train_model()
            cf_scores = {}
            all_movies = MovieModel.objects.exclude(id__in=rated_movie_ids)
            
            for movie in all_movies:
                try:
                    predicted_rating = self.svd_model.predict(user_id, movie.id).est
                    cf_scores[movie.id] = predicted_rating
                except Exception as e:
                    logger.error(f"Error predicting rating: {str(e)}")

            # 2. Content-Based Filtering
            genre_preferences = self.calculate_genre_preferences(user_ratings)
            content_scores = {}
            
            # Get user's highest rated movies
            top_rated_movies = user_ratings.order_by('-rating')[:5]
            movie_features = []
            
            for rating in top_rated_movies:
                movie_features.append(self.get_content_features(rating.movie))
            
            if movie_features:
                tfidf_matrix = self.tfidf.fit_transform(movie_features)
                
                for movie in all_movies:
                    # Calculate genre score
                    genre_score = sum(genre_preferences.get(g.id, 0) for g in movie.genres.all())
                    
                    # Calculate content similarity
                    movie_feature = self.get_content_features(movie)
                    movie_vector = self.tfidf.transform([movie_feature])
                    content_sim = np.mean(cosine_similarity(movie_vector, tfidf_matrix))
                    
                    # Combine scores
                    content_scores[movie.id] = 0.7 * genre_score + 0.3 * content_sim

            # 3. Hybrid Scoring
            final_recommendations = []
            for movie in all_movies:
                cf_score = cf_scores.get(movie.id, 0)
                cb_score = content_scores.get(movie.id, 0)
                
                # Calculate popularity score
                popularity_score = (movie.vote_average * movie.vote_count) / (movie.vote_count + 1000)
                
                # Weighted combination of scores
                final_score = (
                    0.4 * cf_score +
                    0.3 * cb_score +
                    0.3 * popularity_score
                )
                
                if final_score > 0:
                    source = self.get_recommendation_source(movie, user_ratings)
                    final_recommendations.append({
                        'movie': movie,
                        'score': final_score,
                        'source': source
                    })

            # Sort and prepare final recommendations
            final_recommendations.sort(key=lambda x: x['score'], reverse=True)
            recommendations = []
            
            for rec in final_recommendations[:num_recommendations]:
                movie = rec['movie']
                movie.recommendation_source = rec['source']
                movie.match_score = int(rec['score'] * 100)
                recommendations.append(movie)

            return {
                'recommendations': recommendations,
                'rated_movies': rated_movies
            }

        except Exception as e:
            logger.error(f"Error in get_user_recommendations: {str(e)}", exc_info=True)
            return {
                'recommendations': get_trending_movies(num_recommendations),
                'rated_movies': []
            }

    def get_recommendation_source(self, movie, user_ratings):
        """Generate personalized recommendation source message"""
        similar_rated = None
        max_similarity = 0
        
        for rating in user_ratings:
            rated_movie = rating.movie
            # Calculate similarity based on genres and other features
            genre_overlap = len(
                set(g.id for g in movie.genres.all()) & 
                set(g.id for g in rated_movie.genres.all())
            )
            if genre_overlap > max_similarity:
                max_similarity = genre_overlap
                similar_rated = rating

        if similar_rated:
            return f"Because you rated {similar_rated.movie.title} ({similar_rated.rating}/10)"
        return "Based on your viewing preferences"

# Initialize the recommender
recommender = AdvancedRecommender()

def get_user_recommendations(user_id, num_recommendations=10):
    try:
        # Use the advanced recommender
        result = recommender.get_user_recommendations(user_id, num_recommendations)
        
        # Log recommendations for debugging
        logger.info(f"Generated recommendations for user {user_id}:")
        for movie in result['recommendations']:
            logger.info(f"Movie: {movie.title}")
            logger.info(f"Source: {movie.recommendation_source}")
            logger.info(f"Match Score: {movie.match_score}%")
            
        return result
        
    except Exception as e:
        logger.error(f"Error in get_user_recommendations: {str(e)}", exc_info=True)
        return {
            'recommendations': get_trending_movies(num_recommendations),
            'rated_movies': []
        }

# Collaborative Filtering Using Matrix Factorization (SVD)
def create_user_movie_matrix():
    # Get ratings from the database
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

def get_user_recommendations(user_id, num_recommendations=10):
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
        logger.error(f"Error in get_user_recommendations: {str(e)}", exc_info=True)
        return {
            'recommendations': get_trending_movies(num_recommendations),
            'rated_movies': []
        }

# Content-Based Filtering
def create_movie_features():
    movies = MovieModel.objects.all()
    features = []
    for movie in movies:
        # Use title, genres, and overview for features
        features.append(f"{movie.title} {' '.join([genre.name for genre in movie.genres.all()])} {movie.overview}")
    return features

def get_movie_recommendations(movie_id, num_recommendations=10):
    movies = MovieModel.objects.all()
    features = create_movie_features()

    tfidf = TfidfVectorizer(stop_words='english')
    tfidf_matrix = tfidf.fit_transform(features)

    cosine_sim = cosine_similarity(tfidf_matrix, tfidf_matrix)
    movie_idx = list(movies.values_list('id', flat=True)).index(movie_id)
    sim_scores = list(enumerate(cosine_sim[movie_idx]))

    sim_scores = sorted(sim_scores, key=lambda x: x[1], reverse=True)
    movie_indices = [i[0] for i in sim_scores[1:num_recommendations + 1]]

    return movies.filter(id__in=[movies[i].id for i in movie_indices])

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
        Q(actors__name__in = list(preferred_actors))
    ).exclude(
        id__in=user_ratings.values_list('movie_id', flat=True)
    ).distinct().order_by('-average_rating')[:limit]

    return recommendations

# Trending Movies (Based on vote_average)
def get_trending_movies(num_movies=20):
    return MovieModel.objects.filter(poster_path__isnull=False).order_by('-vote_average')[:num_movies]

# Trending Movies Last Week (Based on popularity)
def get_trending_movies_last_week(num_movies=20):
    one_week_ago = timezone.now() - timedelta(days=7)
    return MovieModel.objects.filter(release_date__gte=one_week_ago, poster_path__isnull=False).order_by('-popularity')[:num_movies]

# Popular Movies (Based on popularity)
def get_popular_movies(num_movies=20):
    return MovieModel.objects.filter(poster_path__isnull=False).annotate(
        average_rating=Avg('ratingmodel__rating')
    ).order_by('-popularity')[:num_movies]

def get_upcoming_movies(num_movies=20):
    today = timezone.now()
    end_date = today + timedelta(days=14)
    return MovieModel.objects.filter(
        release_date__gte=today,
        release_date__lte=end_date,
        poster_path__isnull=False
    ).order_by('-release_date', '-popularity')[:num_movies]

# Now Playing Movies
def get_now_playing_movies(num_movies=20):
    return MovieModel.objects.filter(release_date__lte=timezone.now(), poster_path__isnull=False).order_by('-release_date')[:num_movies]

# Top Rated Movies (Based on votes and ratings)
def get_top_rated_movies(num_movies=20):
    return MovieModel.objects.filter(release_date__lte=timezone.now(), poster_path__isnull=False).order_by('-vote_count', '-vote_average')[:num_movies]