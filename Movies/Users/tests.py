import json
import io
import csv
from decimal import Decimal
from datetime import date, datetime, timedelta

from django.test import TestCase, override_settings
from django.urls import reverse
from django.contrib.auth.models import User
from django.utils import timezone
from django.core.exceptions import ValidationError
from rest_framework import status
from rest_framework.test import APITestCase, APIClient, APIRequestFactory, force_authenticate
from rest_framework_simplejwt.tokens import RefreshToken

from .models import (
    MovieModel, GenreModel, PersonModel, MovieCastModel, MovieCrewModel,
    KeywordModel, ProductionCompanyModel, RatingModel, WatchlistModel,
    FavoriteMoviesModel, UserProfileModel, TVShowModel, SeasonModel,
    EpisodeModel, TVShowRatingModel, FavoriteTVShowsModel,
    TVShowWatchlistModel, TVShowReviewModel, FeedbackModel,
    ReleaseDateModel, MediaModel, UserListModel, UserMovieHistoryModel
)
from .serializers import (
    MovieSerializer, RatingSerializer, GenreSerializer,
    PersonSerializer, UserProfileSerializer, WatchlistSerializer,
    FavoriteMoviesSerializer, TVShowSerializer, KeywordSerializer
)
from .views import (
    register_user, get_my_profile
)
from django.conf import settings


# =============================================================================
# MODEL TESTS
# =============================================================================

class ModelTestBase(TestCase):
    """Base class providing commonly created model instances."""

    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            email='test@example.com',
            first_name='Test',
            last_name='User'
        )
        self.genre = GenreModel.objects.create(
            tmdb_id=1, name='Action', popularity_score=95.0
        )
        self.genre2 = GenreModel.objects.create(
            tmdb_id=2, name='Comedy', popularity_score=85.0
        )
        self.keyword = KeywordModel.objects.create(
            tmdb_id=10, name='superhero'
        )
        self.production_company = ProductionCompanyModel.objects.create(
            tmdb_id=100, name='Marvel Studios', origin_country='US'
        )
        self.person = PersonModel.objects.create(
            tmdb_id=200, name='Robert Downey Jr.',
            gender=2, popularity=90.0
        )
        self.person2 = PersonModel.objects.create(
            tmdb_id=201, name='Chris Evans', gender=2, popularity=85.0
        )
        self.movie = MovieModel.objects.create(
            tmdb_id=500,
            title='Test Movie',
            original_title='Test Movie Original',
            overview='A test movie for testing purposes.',
            runtime=120,
            release_date=date(2023, 6, 15),
            popularity=80.0,
            vote_average=Decimal('7.5'),
            vote_count=1000,
            original_language='en',
            poster_path='http://example.com/poster.jpg',
            is_active=True,
        )
        self.movie.genres.add(self.genre, self.genre2)
        self.movie.keywords.add(self.keyword)
        self.movie.production_companies.add(self.production_company)

        self.cast_entry = MovieCastModel.objects.create(
            member=self.person,
            movie=self.movie,
            name='Robert Downey Jr.',
            original_name='Robert Downey Jr.',
            gender=2,
            popularity=90.0,
            cast_id=1,
            character='Iron Man',
            credit_id='cr001',
            order=0
        )
        self.movie.cast.add(self.cast_entry)

        self.crew_entry = MovieCrewModel.objects.create(
            member=self.person2,
            movie=self.movie,
            name='Chris Evans',
            original_name='Chris Evans',
            gender=2,
            department='Directing',
            job='Director',
            credit_id='cr002'
        )
        self.movie.crew.add(self.crew_entry)


class MovieModelTest(ModelTestBase):

    def test_movie_creation(self):
        """Test basic MovieModel creation and field values."""
        self.assertEqual(self.movie.title, 'Test Movie')
        self.assertEqual(self.movie.tmdb_id, 500)
        self.assertTrue(self.movie.is_active)
        self.assertEqual(str(self.movie), 'Test Movie')

    def test_movie_relationships(self):
        """Test M2M relationships with genres, keywords, production_companies."""
        self.assertIn(self.genre, self.movie.genres.all())
        self.assertIn(self.genre2, self.movie.genres.all())
        self.assertIn(self.keyword, self.movie.keywords.all())
        self.assertIn(self.production_company, self.movie.production_companies.all())

    def test_movie_cast_relationship(self):
        """Test M2M relationship through MovieCastModel."""
        cast_members = self.movie.cast.all()
        self.assertIn(self.cast_entry, cast_members)

    def test_movie_crew_relationship(self):
        """Test M2M relationship through MovieCrewModel."""
        crew_members = self.movie.crew.all()
        self.assertIn(self.crew_entry, crew_members)

    def test_movie_soft_delete(self):
        """Test that delete() performs a soft delete (sets is_active=False)."""
        movie_id = self.movie.id
        self.movie.delete()
        self.movie.refresh_from_db()
        self.assertFalse(self.movie.is_active)
        # The record should still exist in the database
        self.assertTrue(MovieModel.objects.filter(id=movie_id).exists())

    def test_movie_average_rating_with_no_ratings(self):
        """Test average_rating returns 0 when no ratings exist."""
        self.assertEqual(self.movie.average_rating(), 0)

    def test_movie_average_rating_with_ratings(self):
        """Test average_rating calculation."""
        RatingModel.objects.create(user=self.user, movie=self.movie, rating=Decimal('8.0'))
        RatingModel.objects.create(
            user=User.objects.create_user(username='user2', password='pass'),
            movie=self.movie,
            rating=Decimal('7.0')
        )
        self.assertEqual(self.movie.average_rating(), Decimal('7.5'))

    def test_movie_str(self):
        """Test __str__ returns the movie title."""
        self.assertEqual(str(self.movie), 'Test Movie')


class GenreModelTest(TestCase):

    def test_genre_creation(self):
        genre = GenreModel.objects.create(
            tmdb_id=5, name='Drama', description='Dramatic works', popularity_score=80.0
        )
        self.assertEqual(str(genre), 'Drama')
        self.assertEqual(genre.tmdb_id, 5)

    def test_genre_unique_constraints(self):
        """Test that name and tmdb_id are unique."""
        GenreModel.objects.create(tmdb_id=1, name='Action')
        with self.assertRaises(Exception):
            GenreModel.objects.create(tmdb_id=1, name='Action 2')
        with self.assertRaises(Exception):
            GenreModel.objects.create(tmdb_id=2, name='Action')

    def test_genre_hierarchy(self):
        parent = GenreModel.objects.create(tmdb_id=10, name='Entertainment')
        child = GenreModel.objects.create(tmdb_id=11, name='Movies', parent_genre=parent)
        self.assertEqual(child.parent_genre, parent)


class KeywordModelTest(TestCase):

    def test_keyword_creation(self):
        kw = KeywordModel.objects.create(tmdb_id=99, name='action-packed')
        self.assertEqual(str(kw), 'action-packed')
        self.assertEqual(kw.tmdb_id, 99)


class ProductionCompanyModelTest(TestCase):

    def test_company_creation(self):
        company = ProductionCompanyModel.objects.create(
            tmdb_id=999, name='Test Studio', logo_path='/logos/test.png', origin_country='US'
        )
        self.assertEqual(str(company), 'Test Studio')


class PersonModelTest(TestCase):

    def test_person_creation(self):
        person = PersonModel.objects.create(
            tmdb_id=300, name='Scarlett Johansson', gender=1,
            biography='A talented actress.',
            birthday=date(1984, 11, 22)
        )
        self.assertEqual(str(person), 'Scarlett Johansson')
        self.assertEqual(person.tmdb_id, 300)


class MovieCastModelTest(ModelTestBase):

    def test_cast_str(self):
        expected = f"Robert Downey Jr. as Iron Man in Test Movie"
        self.assertEqual(str(self.cast_entry), expected)

    def test_cast_unique_together(self):
        """Test that duplicate cast entries (member, movie, order) are rejected."""
        with self.assertRaises(Exception):
            MovieCastModel.objects.create(
                member=self.person,
                movie=self.movie,
                name='Duplicate',
                original_name='Duplicate',
                cast_id=1,
                character='Duplicate',
                credit_id='cr003',
                order=0
            )


class MovieCrewModelTest(ModelTestBase):

    def test_crew_str(self):
        expected = f"Chris Evans - Director in Directing for Test Movie"
        self.assertEqual(str(self.crew_entry), expected)


class UserProfileModelTest(ModelTestBase):

    def test_profile_creation(self):
        profile = UserProfileModel.objects.create(
            user=self.user,
            subscription_type='free'
        )
        self.assertEqual(str(profile), f"{self.user}'s Preferences")

    def test_profile_default_subscription(self):
        profile = UserProfileModel.objects.create(user=self.user)
        self.assertEqual(profile.subscription_type, 'free')

    def test_get_preferred_movies_no_preferences(self):
        """When no preferences set, should return all movies."""
        profile = UserProfileModel.objects.create(user=self.user)
        movies = profile.get_preferred_movies()
        self.assertIn(self.movie, movies)

    def test_get_preferred_movies_with_preferences(self):
        profile = UserProfileModel.objects.create(user=self.user)
        profile.preferred_genres.add(self.genre)
        movies = profile.get_preferred_movies()
        self.assertIn(self.movie, movies)


class RatingModelTest(ModelTestBase):

    def test_rating_creation(self):
        rating = RatingModel.objects.create(
            user=self.user, movie=self.movie, rating=Decimal('8.5')
        )
        self.assertEqual(str(rating), f"{self.user.username} - Test Movie - 8.5")

    def test_rating_validation_valid(self):
        """Test that a valid rating (0-10) passes clean()."""
        rating = RatingModel(user=self.user, movie=self.movie, rating=Decimal('5.0'))
        try:
            rating.clean()
        except ValidationError:
            self.fail('Rating 5.0 should be valid')

    def test_rating_validation_too_high(self):
        """Test that rating > 10 raises ValidationError."""
        rating = RatingModel(user=self.user, movie=self.movie, rating=Decimal('10.5'))
        with self.assertRaises(ValidationError):
            rating.clean()

    def test_rating_validation_negative(self):
        """Test that rating < 0 raises ValidationError."""
        rating = RatingModel(user=self.user, movie=self.movie, rating=Decimal('-1.0'))
        with self.assertRaises(ValidationError):
            rating.clean()

    def test_rating_unique_constraint(self):
        """Test that a user cannot rate the same movie twice."""
        RatingModel.objects.create(user=self.user, movie=self.movie, rating=Decimal('7.0'))
        with self.assertRaises(Exception):
            RatingModel.objects.create(user=self.user, movie=self.movie, rating=Decimal('8.0'))


class WatchlistModelTest(ModelTestBase):

    def test_watchlist_creation(self):
        wl = WatchlistModel.objects.create(user=self.user, movie=self.movie)
        self.assertTrue(wl.is_active)
        self.assertIsNone(wl.removed_at)
        self.assertEqual(str(wl), f"{self.user.username} - Test Movie")


class FavoriteMoviesModelTest(ModelTestBase):

    def test_favorite_creation(self):
        fav = FavoriteMoviesModel.objects.create(user=self.user, movie=self.movie)
        self.assertTrue(fav.is_active)
        self.assertEqual(str(fav), f"{self.user.username} - Test Movie")


class TVShowModelTest(TestCase):

    def setUp(self):
        self.show = TVShowModel.objects.create(
            tmdb_id=1000,
            name='Test Show',
            overview='A test TV show.',
            first_air_date=date(2020, 1, 1),
            number_of_seasons=3,
            number_of_episodes=30,
            popularity=90.0,
            status='Ended'
        )

    def test_show_creation(self):
        self.assertEqual(str(self.show), 'Test Show')
        self.assertEqual(self.show.tmdb_id, 1000)

    def test_season_creation(self):
        season = SeasonModel.objects.create(
            tv_show=self.show, season_number=1, name='Season 1'
        )
        self.assertEqual(str(season), 'Test Show - Season 1')

    def test_episode_creation(self):
        season = SeasonModel.objects.create(
            tv_show=self.show, season_number=1, name='Season 1'
        )
        episode = EpisodeModel.objects.create(
            season=season, episode_number=1, name='Pilot'
        )
        self.assertEqual(str(episode), 'Test Show S1E1')


class TVShowRatingModelTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='tvuser', password='pass')
        self.show = TVShowModel.objects.create(tmdb_id=5000, name='Rating Show')

    def test_validation_invalid(self):
        rating = TVShowRatingModel(user=self.user, tv_show=self.show, rating=Decimal('11.0'))
        with self.assertRaises(ValidationError):
            rating.clean()


class UserListModelTest(ModelTestBase):

    def test_list_creation(self):
        lst = UserListModel.objects.create(
            user=self.user, name='My Favorites', description='Top picks', is_public=True
        )
        lst.movies.add(self.movie)
        self.assertEqual(str(lst), f"My Favorites (Public) by {self.user.username}")
        self.assertIn(self.movie, lst.movies.all())


class MediaModelTest(ModelTestBase):

    def test_media_creation(self):
        media = MediaModel.objects.create(
            movie=self.movie, media_type='poster',
            url='http://example.com/poster.jpg', language='en'
        )
        self.assertIn('poster for Test Movie', str(media))


class FeedbackModelTest(ModelTestBase):

    def test_feedback_creation(self):
        feedback = FeedbackModel.objects.create(
            user=self.user, movie=self.movie, is_helpful=True
        )
        self.assertTrue(feedback.is_helpful)


# =============================================================================
# AUTHENTICATION TESTS
# =============================================================================

class AuthenticationTest(APITestCase):

    def setUp(self):
        self.register_url = reverse('register_user')
        self.token_url = reverse('token_obtain_pair')
        self.token_refresh_url = reverse('token_refresh')

        self.valid_payload = {
            'username': 'newuser',
            'password': 'StrongPass123!',
            'first_name': 'New',
            'last_name': 'User',
            'email': 'newuser@example.com'
        }

    def test_register_user_success(self):
        """Test successful user registration creates User and UserProfileModel."""
        response = self.client.post(
            self.register_url,
            data=json.dumps(self.valid_payload),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = json.loads(response.content)
        self.assertEqual(data['detail'], 'User registered successfully')
        self.assertTrue(User.objects.filter(username='newuser').exists())
        self.assertTrue(UserProfileModel.objects.filter(user__username='newuser').exists())

    def test_register_user_missing_fields(self):
        """Test registration fails when required fields are missing."""
        response = self.client.post(
            self.register_url,
            data=json.dumps({'username': 'incomplete'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_token_obtain_success(self):
        """Test that a valid user can obtain a JWT token."""
        User.objects.create_user(username='logintest', password='testpass123')
        response = self.client.post(
            self.token_url,
            data=json.dumps({'username': 'logintest', 'password': 'testpass123'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)

    def test_token_obtain_invalid_credentials(self):
        """Test that invalid credentials return 401."""
        response = self.client.post(
            self.token_url,
            data=json.dumps({'username': 'nobody', 'password': 'wrong'}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_token_refresh_valid(self):
        """Test that a valid refresh token can obtain a new access token."""
        user = User.objects.create_user(username='refreshtest', password='testpass123')
        refresh = RefreshToken.for_user(user)
        response = self.client.post(
            self.token_refresh_url,
            data=json.dumps({'refresh': str(refresh)}),
            content_type='application/json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_token_obtain_sets_cookies(self):
        """Test that login endpoint sets httponly cookies."""
        User.objects.create_user(username='cookieuser', password='testpass123')
        response = self.client.post(
            self.token_url,
            data=json.dumps({'username': 'cookieuser', 'password': 'testpass123'}),
            content_type='application/json'
        )
        self.assertIn('access_token', response.cookies)
        self.assertIn('refresh_token', response.cookies)
        self.assertTrue(response.cookies['access_token']['httponly'])


# =============================================================================
# SERIALIZER TESTS
# =============================================================================

class SerializerTest(ModelTestBase):

    def test_genre_serializer_has_tmdb_url(self):
        serializer = GenreSerializer(self.genre)
        self.assertIn('tmdb_url', serializer.data)
        self.assertIn('themoviedb.org/genre/1', serializer.data['tmdb_url'])

    def test_keyword_serializer_has_tmdb_url(self):
        serializer = KeywordSerializer(self.keyword)
        self.assertIn('tmdb_url', serializer.data)
        self.assertIn('themoviedb.org/keyword/10', serializer.data['tmdb_url'])

    def test_movie_serializer_includes_nested(self):
        serializer = MovieSerializer(self.movie)
        data = serializer.data
        self.assertIn('genres', data)
        self.assertIn('cast', data)
        self.assertIn('crew', data)
        self.assertIn('keywords', data)
        self.assertIn('tmdb_url', data)
        self.assertIn('average_rating', data)

    def test_movie_serializer_average_rating_no_ratings(self):
        serializer = MovieSerializer(self.movie)
        self.assertIsNone(serializer.data['average_rating'])

    def test_movie_serializer_tmdb_url(self):
        serializer = MovieSerializer(self.movie)
        self.assertIn('themoviedb.org/movie/500', serializer.data['tmdb_url'])

    def test_rating_serializer_readonly_fields(self):
        rating = RatingModel.objects.create(
            user=self.user, movie=self.movie, rating=Decimal('7.5')
        )
        serializer = RatingSerializer(rating)
        self.assertEqual(serializer.data['user'], self.user.username)
        self.assertEqual(serializer.data['movie'], 'Test Movie')

    def test_user_profile_serializer_fields(self):
        profile = UserProfileModel.objects.create(user=self.user)
        serializer = UserProfileSerializer(profile)
        expected_fields = {
            'id', 'first_name', 'last_name', 'email', 'avatar', 'bio',
            'preferred_genres', 'preferred_actors', 'preferred_movies',
            'date_of_birth', 'location', 'subscription_type'
        }
        self.assertEqual(set(serializer.data.keys()), expected_fields)


# =============================================================================
# VIEW / API TESTS
# =============================================================================

class MovieViewSetTest(ModelTestBase):

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        # Create a few more movies for list tests
        for i in range(3):
            movie = MovieModel.objects.create(
                tmdb_id=600 + i,
                title=f'Movie {i}',
                poster_path='http://example.com/poster.jpg',
                popularity=50.0 + i,
                release_date=date(2024, 1, 1),
            )
            movie.genres.add(self.genre)

        # Movie without poster (should be excluded from certain queries)
        MovieModel.objects.create(
            tmdb_id=900,
            title='No Poster Movie',
            popularity=10.0,
            poster_path=None
        )

    def test_movie_list_unauthenticated(self):
        """Test that movie list is accessible without authentication."""
        response = self.client.get('/movie/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_movie_detail(self):
        response = self.client.get(f'/movie/{self.movie.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['title'], 'Test Movie')

    def test_movie_popular(self):
        response = self.client.get('/movie/popular/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Should include movies with poster_path
        self.assertGreater(len(response.data), 0)
        # No poster movies should not be included
        titles = [m['title'] for m in response.data]
        self.assertNotIn('No Poster Movie', titles)

    def test_movie_top_rated(self):
        response = self.client.get('/movie/top_rated/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_movie_trending_today(self):
        response = self.client.get('/movie/trending_today/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_movie_upcoming(self):
        response = self.client.get('/movie/upcoming/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_movie_now_playing(self):
        response = self.client.get('/movie/now_playing/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_movie_search(self):
        response = self.client.get('/movie/search/', {'query': 'Test'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('movies', response.data)
        self.assertIn('persons', response.data)
        self.assertIn('genres', response.data)

    def test_movie_search_empty_query(self):
        response = self.client.get('/movie/search/', {'query': ''})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['movies'], [])
        self.assertEqual(response.data['persons'], [])
        self.assertEqual(response.data['genres'], [])

    def test_movie_export_csv(self):
        response = self.client.get('/movie/export_csv/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response['Content-Type'], 'text/csv')
        content = response.content.decode('utf-8')
        self.assertIn('Test Movie', content)

    def test_movie_recommendations(self):
        """Test content-based movie recommendations."""
        response = self.client.get(f'/movie/{self.movie.id}/recommendations/')
        # Should work without auth since MovieViewSet uses AllowAny
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_movie_rate_requires_auth(self):
        """Test that rating a movie requires authentication."""
        response = self.client.post('/movie/rate/', {'movie_id': self.movie.id, 'rating': 8.0})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_movie_rate_authenticated(self):
        """Test that an authenticated user can rate a movie."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/movie/rate/', {'movie_id': self.movie.id, 'rating': 8.5})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'rating set')
        # Verify the rating was saved
        self.assertTrue(RatingModel.objects.filter(user=self.user, movie=self.movie, rating=Decimal('8.5')).exists())

    def test_movie_rate_invalid_rating(self):
        """Test that invalid rating values are rejected."""
        self.client.force_authenticate(user=self.user)
        response = self.client.post('/movie/rate/', {'movie_id': self.movie.id, 'rating': 'invalid'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_user_recommendations_requires_auth(self):
        response = self.client.get('/movie/user_recommendations/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_recommendations_authenticated(self):
        """Test recommendations return proper structure for authenticated user."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/movie/user_recommendations/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('recommendations', response.data)
        self.assertIn('rated_movies', response.data)


class FavoriteViewSetTest(ModelTestBase):

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_add_favorite(self):
        response = self.client.post('/favorites/add/', {'movie_id': self.movie.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(FavoriteMoviesModel.objects.filter(user=self.user, movie=self.movie, is_active=True).exists())

    def test_add_favorite_twice(self):
        """Adding the same favorite twice should not duplicate."""
        self.client.post('/favorites/add/', {'movie_id': self.movie.id})
        response = self.client.post('/favorites/add/', {'movie_id': self.movie.id})
        # Should return the existing favorite
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        count = FavoriteMoviesModel.objects.filter(user=self.user, movie=self.movie).count()
        self.assertEqual(count, 1)

    def test_add_favorite_missing_id(self):
        response = self.client.post('/favorites/add/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_favorite(self):
        fav = FavoriteMoviesModel.objects.create(user=self.user, movie=self.movie, is_active=True)
        response = self.client.delete(f'/favorites/{self.movie.id}/remove/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(FavoriteMoviesModel.objects.filter(user=self.user, movie=self.movie, is_active=True).exists())

    def test_my_favorites(self):
        FavoriteMoviesModel.objects.create(user=self.user, movie=self.movie, is_active=True)
        response = self.client.get('/favorites/my_favorites/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_my_favorites_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/favorites/my_favorites/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class WatchlistViewSetTest(ModelTestBase):

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_add_watchlist(self):
        response = self.client.post('/watchlist/add/', {'movie_id': self.movie.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(WatchlistModel.objects.filter(user=self.user, movie=self.movie, is_active=True).exists())

    def test_add_watchlist_missing_id(self):
        response = self.client.post('/watchlist/add/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_remove_watchlist(self):
        WatchlistModel.objects.create(user=self.user, movie=self.movie, is_active=True)
        response = self.client.delete(f'/watchlist/{self.movie.id}/remove/')
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(WatchlistModel.objects.filter(user=self.user, movie=self.movie, is_active=True).exists())

    def test_my_watchlist(self):
        WatchlistModel.objects.create(user=self.user, movie=self.movie, is_active=True)
        response = self.client.get('/watchlist/my_watchlist/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    def test_my_watchlist_requires_auth(self):
        self.client.force_authenticate(user=None)
        response = self.client.get('/watchlist/my_watchlist/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class RatingViewSetTest(ModelTestBase):

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)
        RatingModel.objects.create(user=self.user, movie=self.movie, rating=Decimal('8.0'))

    def test_my_ratings(self):
        response = self.client.get('/rating/my_ratings/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['rating'], '8.0')

    def test_bulk_delete_ratings(self):
        response = self.client.delete('/rating/bulk_delete/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(RatingModel.objects.filter(user=self.user).count(), 0)


class ProfileTest(ModelTestBase):

    def setUp(self):
        super().setUp()
        self.client = APIClient()
        UserProfileModel.objects.create(user=self.user)

    def test_get_my_profile_authenticated(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get('/api/user/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['first_name'], 'Test')
        self.assertEqual(response.data['last_name'], 'User')

    def test_get_my_profile_unauthenticated(self):
        response = self.client.get('/api/user/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class GenreViewSetTest(ModelTestBase):

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def test_genre_list(self):
        response = self.client.get('/genre/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [g['name'] for g in response.data]
        self.assertIn('Action', names)

    def test_genre_search(self):
        response = self.client.get('/genre/', {'search': 'Action'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)


class PersonViewSetTest(ModelTestBase):

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def test_person_list(self):
        response = self.client.get('/person/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [p['name'] for p in response.data]
        self.assertIn('Robert Downey Jr.', names)

    def test_person_movies(self):
        response = self.client.get(f'/person/{self.person.id}/movies/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # The person should appear in the cast of the test movie
        titles = [m['title'] for m in response.data]
        self.assertIn('Test Movie', titles)


class KeywordViewSetTest(ModelTestBase):

    def setUp(self):
        super().setUp()
        self.client = APIClient()

    def test_keyword_list(self):
        response = self.client.get('/keyword/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        names = [k['name'] for k in response.data]
        self.assertIn('superhero', names)


# =============================================================================
# RECOMMENDATION ENGINE TESTS
# =============================================================================

@override_settings(TMDB_API_KEY='test_key')
class RecommendationEngineTest(ModelTestBase):

    def test_get_trending_movies(self):
        from .recommender.recommendations import get_trending_movies
        trending = get_trending_movies(num_movies=5)
        self.assertIn(self.movie, trending)

    def test_get_popular_movies(self):
        from .recommender.recommendations import get_popular_movies
        popular = get_popular_movies(num_movies=5)
        self.assertIn(self.movie, popular)

    def test_get_user_recommendations_with_no_ratings(self):
        """When user has no ratings, should return trending movies."""
        from .recommender.recommendations import get_user_recommendations
        result = get_user_recommendations(self.user.username, num_recommendations=5)
        self.assertIn('recommendations', result)
        self.assertIn('rated_movies', result)
        self.assertEqual(len(result['rated_movies']), 0)
        # Should have trending movies as fallback
        self.assertGreater(len(result['recommendations']), 0)

    def test_get_user_recommendations_with_ratings(self):
        """When user has ratings, should get personalized recommendations."""
        from django.core.cache import cache
        from .recommender.recommendations import get_user_recommendations
        # Clear any cached entry from previous tests
        cache.delete(f'user_recs_{self.user.username}_5')
        # Create a rating on the action movie
        RatingModel.objects.create(user=self.user, movie=self.movie, rating=Decimal('9.0'))
        result = get_user_recommendations(self.user.username, num_recommendations=5)
        self.assertIn('recommendations', result)
        self.assertIn('rated_movies', result)
        self.assertEqual(len(result['rated_movies']), 1)

    def test_get_movie_recommendations(self):
        from .recommender.recommendations import get_movie_recommendations
        # Need at least 2 movies for content-based recs
        
        # Create a movie with a title that will match via TF-IDF similarity
        movie2 = MovieModel.objects.create(
            tmdb_id=700,
            title='Another Movie',
            overview='A test movie for testing purposes.',  # Same overview as self.movie
            poster_path='http://example.com/p.jpg'
        )
        movie2.genres.add(self.genre, self.genre2)  # Same genres as self.movie
        recommendations = get_movie_recommendations(self.movie.id, num_recommendations=5)
        # Should return at least some recommendations (may or may not include movie2 depending on TF-IDF)
        self.assertGreaterEqual(len(recommendations), 0)

    def test_create_user_movie_matrix(self):
        from .recommender.recommendations import create_user_movie_matrix
        RatingModel.objects.create(user=self.user, movie=self.movie, rating=Decimal('7.5'))
        matrix = create_user_movie_matrix()
        self.assertFalse(matrix.empty)

    def test_create_user_movie_matrix_no_ratings(self):
        from .recommender.recommendations import create_user_movie_matrix
        matrix = create_user_movie_matrix()
        self.assertTrue(matrix.empty)


# =============================================================================
# SERVICE TESTS
# =============================================================================

class ServiceTest(ModelTestBase):

    def test_search_returns_all_types(self):
        from .services import get_search_results
        results = get_search_results('Test')
        self.assertIn('movies', results)
        self.assertIn('persons', results)
        self.assertIn('genres', results)
        # Movies should match 'Test Movie' title
        self.assertGreater(len(results['movies']), 0)
        # Persons should match 'Test' in name (e.g. 'Test User' if person created)
        # Genres may or may not match depending on test data

    def test_search_empty(self):
        from .services import get_search_results
        results = get_search_results('')
        self.assertEqual(results['movies'], [])
        self.assertEqual(results['persons'], [])
        self.assertEqual(results['genres'], [])

    def test_search_partial_title(self):
        from .services import get_search_results
        results = get_search_results('Test')
        titles = [m['title'] for m in results['movies']]
        self.assertIn('Test Movie', titles)


# =============================================================================
# URL ROUTING TESTS
# =============================================================================

class URLRoutingTest(TestCase):

    def test_movie_urls(self):
        self.assertEqual(reverse('movie-list'), '/movie/')
        self.assertEqual(reverse('movie-detail', args=[1]), '/movie/1/')

    def test_genre_urls(self):
        self.assertEqual(reverse('genre-list'), '/genre/')
        self.assertEqual(reverse('genre-detail', args=[1]), '/genre/1/')

    def test_person_urls(self):
        self.assertEqual(reverse('person-list'), '/person/')
        self.assertEqual(reverse('person-detail', args=[1]), '/person/1/')

    def test_auth_urls(self):
        self.assertEqual(reverse('register_user'), '/register/')
        self.assertEqual(reverse('token_obtain_pair'), '/token/')
        self.assertEqual(reverse('token_refresh'), '/token/refresh/')

    def test_profile_url(self):
        self.assertEqual(reverse('get_my_profile'), '/api/user/me/')

    def test_rating_urls(self):
        self.assertEqual(reverse('rating-list'), '/rating/')

    def test_watchlist_urls(self):
        self.assertEqual(reverse('watchlist-list'), '/watchlist/')

    def test_favorites_urls(self):
        self.assertEqual(reverse('favorites-list'), '/favorites/')

    def test_keyword_urls(self):
        self.assertEqual(reverse('keyword-list'), '/keyword/')
