from rest_framework.parsers import MultiPartParser, FormParser
# User Profile Update API
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import *
from .serializers import *
from .recommender.recommendations import *
from django.db.models import Count,Q
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, HttpResponse
import json
import csv
import logging
from django.shortcuts import get_object_or_404
from rest_framework.pagination import PageNumberPagination
from django.utils import timezone
from django.db import models
import re
from .serializers import TVShowRatingSerializer, FavoriteTVShowsSerializer, TVShowWatchlistSerializer, TVShowReviewSerializer
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from .services import get_search_results

logger = logging.getLogger(__name__)



class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['firstname'] = user.first_name
        token['lastname'] = user.last_name
        token['is_staff'] = user.is_staff
        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            access_token = response.data.get('access')
            refresh_token = response.data.get('refresh')
            
            response.set_cookie(
                'access_token',
                access_token,
                httponly=True,
                samesite='Lax',
                secure=False,  # Set to True in production with HTTPS
                max_age=300
            )
            response.set_cookie(
                'refresh_token',
                refresh_token,
                httponly=True,
                samesite='Lax',
                secure=False,
                max_age=3600 * 24 * 90
            )
            
            # Optionally remove tokens from the JSON body so frontend doesn't store them
            # del response.data['access']
            # del response.data['refresh']
        return response


@api_view(['POST'])
@permission_classes([AllowAny])
def register_user(request):
    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        username = data.get('username')
        password = data.get('password')
        firstname = data.get('firstname')
        lastname = data.get('lastname')
        email = data.get('email')

        if not username or not password or not firstname or not lastname or not email:
            return JsonResponse({'detail': 'Invalid data'}, status=400)

        try:
            # Create the user and save first name and last name
            user = User.objects.create_user(
                username=username,
                password=password,
                email=email,
                first_name=firstname,  # Save first name
                last_name=lastname      # Save last name
            )
            user_profile = UserProfileModel.objects.create(
                user=user,
                firstname=firstname,
                lastname=lastname,
                email=email
            )

            logger.info(f"User profile created: {user_profile}")

            return JsonResponse({'detail': 'User registered successfully'}, status=201)
        except Exception as e:
            logger.error(f"Error creating user: {str(e)}")
            return JsonResponse({'detail': 'An error occurred during registration. Please try again later.'}, status=500)
    else:
        return JsonResponse({'detail': 'Invalid request method'}, status=405)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class UserPreferenceViewSet(viewsets.ModelViewSet):
    queryset = UserProfileModel.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return UserProfileModel.objects.filter(user=self.request.user)

    # @action(detail=False, methods=['get'])
    # def personalized_movies(self, request):
    #     user_profile = self.get_object()
    #     preferred_movies = user_profile.get_preferred_movies()
    #     serializer = MovieSerializer(preferred_movies, many=True)
    #     return Response(serializer.data)

    # @action(detail=False, methods=['get'])
    # def liked_movies(self, request):
    #     """Get movies rated by the user."""
    #     user_profile = self.get_object()
    #     liked_movies = user_profile.liked_movies()
    #     serializer = MovieSerializer(liked_movies, many=True)
    #     return Response(serializer.data)

    # @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    # def favorite_movies(self, request):
    #     """Get user's favorite movies."""
    #     user_profile = self.get_object()
    #     favorite_movies = user_profile.favorite_movies()
    #     serializer = MovieSerializer(favorite_movies, many=True)
    #     return Response(serializer.data)

    # @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    # def watchlist_movies(self, request):
    #     """Get user's watchlist movies."""
    #     user_profile = self.get_object()
    #     watchlist_movies = user_profile.watchlist_movies()
    #     serializer = MovieSerializer(watchlist_movies, many=True)
    #     return Response(serializer.data)
    

# Advanced Movie ViewSet
class MovieViewSet(viewsets.ModelViewSet):
    queryset = MovieModel.objects.all().prefetch_related(
        'genres', 'cast', 'crew', 'keywords', 'production_companies'
    ).annotate(
        annotated_average_rating=Avg('ratingmodel__rating')
    )
    serializer_class = MovieSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'genres__name', 'actor__member__name']
    ordering_fields = ['release_date', 'average_rating']
    ordering = ['-id']


    @method_decorator(cache_page(60 * 15))
    @action(detail=False, methods=['get'])
    def trending_today(self, request):
        trending_movies = get_trending_movies()
        serializer = self.get_serializer(trending_movies, many=True)
        return Response(serializer.data)
    
    @method_decorator(cache_page(60 * 15))
    @action(detail=False, methods=['get'])
    def trending_this_week(self, request):
        trending_movies = get_trending_movies_last_week()  # Implement this function to get trending movies of the week
        serializer = self.get_serializer(trending_movies, many=True)
        return Response(serializer.data)
    
    @method_decorator(cache_page(60 * 15))
    @action(detail=False, methods=['get'])
    def popular(self, request):
        popular_movies = get_popular_movies()
        serializer = self.get_serializer(popular_movies, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        upcoming_movies = get_upcoming_movies()
        serializer = self.get_serializer(upcoming_movies, many=True)
        return Response(serializer.data)


    @action(detail=False, methods=['get'])
    def now_playing(self, request):
        now_playing_movies = get_now_playing_movies()
        serializer = self.get_serializer(now_playing_movies, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def top_rated(self, request):
        """Get top-rated movies."""
        top_rated = get_top_rated_movies()
        serializer = self.get_serializer(top_rated, many=True)
        return Response(serializer.data)
    
    
# ML code
    @action(detail=True, methods=['get'])
    def recommendations(self, request, pk=None):
        movie = self.get_object()
        recommendations = get_movie_recommendations(movie.id)
        serializer = self.get_serializer(recommendations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def user_recommendations(self, request):
        try:
            if not request.user.is_authenticated:
                return Response(
                    {"detail": "Authentication required"}, 
                    status=status.HTTP_401_UNAUTHORIZED
                )

            user_id = request.user.username
            logger.info(f"Getting recommendations for user {user_id}")

            # Get recommendations and rated movies
            result = get_user_recommendations(user_id)
            
            # Add recommendation explanation and match score
            for movie in result['recommendations']:
                movie.recommendation_source = getattr(movie, 'recommendation_source', 'Based on your preferences')
                movie.match_score = getattr(movie, 'match_score', 85)  # Default match score

            # Serialize with additional fields
            recommendations_serializer = MovieSerializer(result['recommendations'], many=True)
            rated_movies_serializer = MovieSerializer(
                [item['movie'] for item in result['rated_movies']], 
                many=True
            )

            return Response({
                'recommendations': recommendations_serializer.data,
                'rated_movies': [
                    {
                        'movie': rated_movies_serializer.data[i],
                        'rating': result['rated_movies'][i]['rating'],
                        'match_score': getattr(result['rated_movies'][i]['movie'], 'match_score', None),
                        'recommendation_source': getattr(result['rated_movies'][i]['movie'], 'recommendation_source', None)
                    }
                    for i in range(len(result['rated_movies']))
                ]
            })

        except Exception as e:
            logger.error(f"Error in user_recommendations: {str(e)}", exc_info=True)
            return Response(
                {"detail": "Error getting recommendations"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
    
    @action(detail=False, methods=['get'])
    def hybrid_recommendations(self, request):
        if not request.user.is_authenticated:
            logger.warning("User is not authenticated.")
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        user_id = request.user.id
        movie_id = request.query_params.get('last_viewed_movie_id')
        recommendations = hybrid_recommendations(user_id, movie_id)
        logger.info(f"Hybrid recommendations for user {user_id}: {[movie.id for movie in recommendations]}")
        
        serializer = MovieSerializer(recommendations, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def dynamic_recommendations(self, request):
        if not request.user.is_authenticated:
            logger.warning("User is not authenticated.")
            return Response({"detail": "Authentication credentials were not provided."}, status=status.HTTP_401_UNAUTHORIZED)

        user = request.user
        recommendations = dynamic_recommendations(user)
        logger.info(f"Dynamic recommendations for user {user.id}: {[movie.id for movie in recommendations]}")
        
        serializer = MovieSerializer(recommendations, many=True)
        return Response(serializer.data)
    
        
    # Search

    @action(detail=False, methods=['get'])
    def search(self, request):
        query = request.query_params.get('query', '').strip()
        results = get_search_results(query)
        return Response(results)

   


    # save_rating
    
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def rate(self, request):

        user = request.user
        movie_id = request.data.get('movie_id')
        rating = request.data.get('rating')
        feedback = request.data.get('feedback', '')

        movie = get_object_or_404(MovieModel, id=movie_id)

        # Ensure rating is a Decimal
        from decimal import Decimal, InvalidOperation
        try:
            rating_decimal = Decimal(str(rating))
        except (InvalidOperation, TypeError, ValueError):
            return Response({'detail': 'Invalid rating value'}, status=status.HTTP_400_BAD_REQUEST)

        rating_obj, created = RatingModel.objects.update_or_create(
            user=user, movie=movie,
            defaults={'rating': rating_decimal, 'feedback': feedback}
        )

        logger.info(f"User  {user.username} rated movie {movie.title} with rating {rating}.")

        # --- Real-time recommendations via Django Channels ---
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            from .serializers import MovieSerializer
            from .recommender.recommendations import get_user_recommendations

            channel_layer = get_channel_layer()
            rec_result = get_user_recommendations(user.username)
            recommendations = rec_result['recommendations']
            data = MovieSerializer(recommendations, many=True).data
            async_to_sync(channel_layer.group_send)(
                f"recommend_{user.username}",
                {
                    "type": "send_recommendations",
                    "data": {"recommendations": data}
                }
            )
        except Exception as e:
            logger.error(f"Error sending real-time recommendations: {e}")

        return Response({'status': 'rating set'}, status=status.HTTP_200_OK)
    



    @action(detail=False, methods=['get'])
    # @permission_classes([IsAuthenticated])
    def export_csv(self, request):
        """Export movie data as CSV."""
        logger.info(f"User  {request.user.username} is exporting movie data.")
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="movies.csv"'

        writer = csv.writer(response)
        writer.writerow(['ID', 'Title', 'Average Rating', 'Release Date'])

        for movie in MovieModel.objects.all():
            writer.writerow([movie.id, movie.title, movie.average_rating, movie.release_date])

        return response
    

# Rating ViewSet
class RatingViewSet(viewsets.ModelViewSet):
    queryset = RatingModel.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    # def perform_create(self, serializer):
    #     serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_ratings(self, request):
        """Get all ratings by the logged-in user."""
        user = request.user
        ratings = RatingModel.objects.filter(user=user)
        serializer = self.get_serializer(ratings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        """Delete all ratings by the logged-in user."""
        count, _ = RatingModel.objects.filter(user=request.user).delete()
        return Response({'detail': f'{count} ratings deleted'}, status=status.HTTP_200_OK)


class PersonViewSet(viewsets.ModelViewSet):
    queryset = PersonModel.objects.all()
    serializer_class = PersonSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'popularity']

    @action(detail=True, methods=['get'])
    def movies(self, request, pk=None):
        """Get all movies for a person (both cast and crew roles)"""
        try:
            person = self.get_object()
            
            # Get cast movies
            cast_movies = MovieModel.objects.filter(
                cast__member=person
            ).annotate(
                role_type=models.Value('cast', output_field=models.CharField()),
                role=models.F('cast__character')
            ).prefetch_related('genres', 'cast', 'crew')

            # Get crew movies
            crew_movies = MovieModel.objects.filter(
                crew__member=person
            ).annotate(
                role_type=models.Value('crew', output_field=models.CharField()),
                role=models.F('crew__job')
            ).prefetch_related('genres', 'cast', 'crew')

            # Combine and sort all movies
            all_movies = cast_movies.union(crew_movies).order_by('-release_date')

            # Serialize the data
            serializer = MovieSerializer(all_movies, many=True)
            
            # Add role information to each movie
            movies_with_roles = []
            for movie in all_movies:
                movie_data = MovieSerializer(movie).data
                movie_data['role_type'] = movie.role_type
                movie_data['role'] = movie.role
                movies_with_roles.append(movie_data)

            return Response(movies_with_roles)
            
        except Exception as e:
            return Response({'error': str(e)}, status=400)

class CastMovieViewSet(viewsets.ModelViewSet):
    queryset = MovieCastModel.objects.all()
    serializer_class = MovieCastSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'popularity']

    @action(detail=True, methods=['get'])
    def movies(self, request, pk=None):
        """Get all movies associated with a specific cast."""
        cast_member = get_object_or_404(PersonModel, pk=pk)
        movies = MovieModel.objects.filter(cast__member=cast_member).order_by('-release_date')
        serializer = MovieSerializer(movies, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular cast members based on their appearances."""
        popular_cast = PersonModel.objects.annotate(movie_count=Count('movie')).order_by('-movie_count')[:10]
        serializer = self.get_serializer(popular_cast, many=True)
        return Response(serializer.data)


class CrewMovieViewSet(viewsets.ModelViewSet):
    queryset = MovieCrewModel.objects.all()
    serializer_class = MovieCrewSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'popularity']

    @action(detail=True, methods=['get'])
    def movies(self, request, pk=None):
        """Get all movies associated with a specific crew."""
        crew_member = get_object_or_404(PersonModel, pk=pk)
        movies = MovieModel.objects.filter(crew__member=crew_member).order_by('-release_date')
        serializer = MovieSerializer(movies, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular crew members based on their appearances."""
        popular_crew = PersonModel.objects.annotate(movie_count=Count('movie')).order_by('-movie_count')[:10]
        serializer = self.get_serializer(popular_crew, many=True)
        return Response(serializer.data)


class ProductionCompanyViewSet(viewsets.ModelViewSet):
    queryset = ProductionCompanyModel.objects.all()
    serializer_class = ProductionCompanySerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'foundation_year']

    @action(detail=True, methods=['get'])
    def movies(self, request, pk=None):
        """Get all movies produced by a specific company."""
        company = self.get_object()
        movies = company.movies.all()
        serializer = MovieSerializer(movies, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def oldest(self, request):
        """Get the oldest production companies."""
        oldest_companies = ProductionCompanyModel.objects.order_by('foundation_year')[:10]
        serializer = self.get_serializer(oldest_companies, many=True)
        return Response(serializer.data)




# Watchlist ViewSet
class WatchlistViewSet(viewsets.ModelViewSet):
    serializer_class = WatchlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WatchlistModel.objects.filter(
            user=self.request.user,
            is_active=True
        ).select_related('movie')

    @action(detail=False, methods=['post'])
    def add(self, request):
        movie_id = request.data.get('movie_id')
        if not movie_id:
            return Response({'error': 'movie_id is required'}, status=400)

        try:
            movie = MovieModel.objects.get(id=movie_id)
            watchlist_item, created = WatchlistModel.objects.get_or_create(
                user=request.user,
                movie=movie,
                defaults={'is_active': True}
            )
            
            if not created and not watchlist_item.is_active:
                watchlist_item.is_active = True
                watchlist_item.removed_at = None
                watchlist_item.save()

            serializer = self.get_serializer(watchlist_item)
            return Response(serializer.data, status=201)
        except MovieModel.DoesNotExist:
            return Response({'error': 'Movie not found'}, status=404)

    @action(detail=True, methods=['delete'])
    def remove(self, request, pk=None):
        try:
            watchlist_item = WatchlistModel.objects.get(
                user=request.user,
                movie_id=pk,
                is_active=True
            )
            # Actually delete the record instead of just marking it inactive
            watchlist_item.delete()
            return Response(status=204)
        except WatchlistModel.DoesNotExist:
            return Response({'error': 'Watchlist item not found'}, status=404)

    @action(detail=False, methods=['get'])
    def my_watchlist(self, request):
        """Get all active watchlist items for the current user"""
        watchlist = self.get_queryset()
        serializer = self.get_serializer(watchlist, many=True)
        return Response(serializer.data)

# Genre ViewSet
class GenreViewSet(viewsets.ModelViewSet):
    queryset = GenreModel.objects.all()
    serializer_class = GenreSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular genres based on associated movies."""
        genres = GenreModel.objects.annotate(movie_count=Count('movie')).order_by('-movie_count')[:10]
        serializer = self.get_serializer(genres, many=True)
        return Response(serializer.data)
 


class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = RatingModel.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]
    def post(self, request):
        movie_id = request.data.get('movie_id')
        feedback = request.data.get('feedback')  # True for like, False for dislike

        # Save feedback
        FeedbackModel.objects.update_or_create(
            user=request.user,
            movie_id=movie_id,
            defaults={'feedback': feedback}
        )

        return Response({'message': 'Feedback recorded'}, status=status.HTTP_201_CREATED)

class FavoriteViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteMoviesSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FavoriteMoviesModel.objects.filter(
            user=self.request.user,
            is_active=True
        ).select_related('movie')

    @action(detail=False, methods=['post'])
    def add(self, request):
        movie_id = request.data.get('movie_id')
        if not movie_id:
            return Response({'error': 'movie_id is required'}, status=400)

        try:
            movie = MovieModel.objects.get(id=movie_id)
            favorite, created = FavoriteMoviesModel.objects.get_or_create(
                user=request.user,
                movie=movie,
                defaults={'is_active': True}
            )
            
            if not created and not favorite.is_active:
                favorite.is_active = True
                favorite.removed_at = None
                favorite.save()

            serializer = self.get_serializer(favorite)
            return Response(serializer.data, status=201)
        except MovieModel.DoesNotExist:
            return Response({'error': 'Movie not found'}, status=404)

    @action(detail=True, methods=['delete'])
    def remove(self, request, pk=None):
        try:
            favorite = FavoriteMoviesModel.objects.get(
                user=request.user,
                movie_id=pk,
                is_active=True
            )
            # Actually delete the record instead of just marking it inactive
            favorite.delete()
            return Response(status=204)
        except FavoriteMoviesModel.DoesNotExist:
            return Response({'error': 'Favorite not found'}, status=404)

    @action(detail=False, methods=['get'])
    def my_favorites(self, request):
        """Get all active favorites for the current user"""
        favorites = self.get_queryset()
        serializer = self.get_serializer(favorites, many=True)
        return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_profile(request):
    try:
        user_profile = UserProfileModel.objects.get(user=request.user)
        serializer = UserProfileSerializer(user_profile)
        return Response(serializer.data, status=200)
    except UserProfileModel.DoesNotExist:
        return Response({'detail': 'Profile not found'}, status=404)

class TVShowRatingViewSet(viewsets.ModelViewSet):
    queryset = TVShowRatingModel.objects.all()
    serializer_class = TVShowRatingSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def rate(self, request):
        user = request.user
        tv_show_id = request.data.get('tv_show_id')
        rating = request.data.get('rating')
        review = request.data.get('review', '')
        feedback = request.data.get('feedback', '')
        tv_show = get_object_or_404(TVShowModel, id=tv_show_id)
        from decimal import Decimal, InvalidOperation
        try:
            rating_decimal = Decimal(str(rating))
        except (InvalidOperation, TypeError, ValueError):
            return Response({'detail': 'Invalid rating value'}, status=status.HTTP_400_BAD_REQUEST)
        rating_obj, created = TVShowRatingModel.objects.update_or_create(
            user=user, tv_show=tv_show,
            defaults={'rating': rating_decimal, 'review': review, 'feedback': feedback}
        )
        return Response({'status': 'rating set'}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def my_ratings(self, request):
        user = request.user
        ratings = TVShowRatingModel.objects.filter(user=user)
        serializer = self.get_serializer(ratings, many=True)
        return Response(serializer.data)

class FavoriteTVShowsViewSet(viewsets.ModelViewSet):
    serializer_class = FavoriteTVShowsSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FavoriteTVShowsModel.objects.filter(user=self.request.user, is_active=True).select_related('tv_show')

    @action(detail=False, methods=['post'])
    def add(self, request):
        tv_show_id = request.data.get('tv_show_id')
        if not tv_show_id:
            return Response({'error': 'tv_show_id is required'}, status=400)
        try:
            tv_show = TVShowModel.objects.get(id=tv_show_id)
            favorite, created = FavoriteTVShowsModel.objects.get_or_create(
                user=request.user,
                tv_show=tv_show,
                defaults={'is_active': True}
            )
            if not created and not favorite.is_active:
                favorite.is_active = True
                favorite.removed_at = None
                favorite.save()
            serializer = self.get_serializer(favorite)
            return Response(serializer.data, status=201)
        except TVShowModel.DoesNotExist:
            return Response({'error': 'TV Show not found'}, status=404)

    @action(detail=True, methods=['delete'])
    def remove(self, request, pk=None):
        try:
            favorite = FavoriteTVShowsModel.objects.get(
                user=request.user,
                tv_show_id=pk,
                is_active=True
            )
            favorite.delete()
            return Response(status=204)
        except FavoriteTVShowsModel.DoesNotExist:
            return Response({'error': 'Favorite not found'}, status=404)

class TVShowWatchlistViewSet(viewsets.ModelViewSet):
    serializer_class = TVShowWatchlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TVShowWatchlistModel.objects.filter(user=self.request.user, is_active=True).select_related('tv_show')

    @action(detail=False, methods=['post'])
    def add(self, request):
        tv_show_id = request.data.get('tv_show_id')
        if not tv_show_id:
            return Response({'error': 'tv_show_id is required'}, status=400)
        try:
            tv_show = TVShowModel.objects.get(id=tv_show_id)
            watchlist_item, created = TVShowWatchlistModel.objects.get_or_create(
                user=request.user,
                tv_show=tv_show,
                defaults={'is_active': True}
            )
            if not created and not watchlist_item.is_active:
                watchlist_item.is_active = True
                watchlist_item.removed_at = None
                watchlist_item.save()
            serializer = self.get_serializer(watchlist_item)
            return Response(serializer.data, status=201)
        except TVShowModel.DoesNotExist:
            return Response({'error': 'TV Show not found'}, status=404)

    @action(detail=True, methods=['delete'])
    def remove(self, request, pk=None):
        try:
            watchlist_item = TVShowWatchlistModel.objects.get(
                user=request.user,
                tv_show_id=pk,
                is_active=True
            )
            watchlist_item.delete()
            return Response(status=204)
        except TVShowWatchlistModel.DoesNotExist:
            return Response({'error': 'Watchlist item not found'}, status=404)

class TVShowReviewViewSet(viewsets.ModelViewSet):
    queryset = TVShowReviewModel.objects.all()
    serializer_class = TVShowReviewSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def get_queryset(self):
        return TVShowReviewModel.objects.filter(tv_show_id=self.request.query_params.get('tv_show_id')) if self.request.query_params.get('tv_show_id') else TVShowReviewModel.objects.all()
class TVShowViewSet(viewsets.ModelViewSet):
    queryset = TVShowModel.objects.all().prefetch_related(
        'genres', 'cast', 'crew'
    )
    from .serializers import TVShowSerializer
    serializer_class = TVShowSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'genres__name']
    ordering_fields = ['first_air_date', 'vote_average']
    ordering = ['-id']

    @method_decorator(cache_page(60 * 15))
    @action(detail=False, methods=['get'])
    def popular(self, request):
        popular_shows = TVShowModel.objects.filter(poster_path__isnull=False).order_by('-popularity')[:20]
        serializer = self.get_serializer(popular_shows, many=True)
        return Response(serializer.data)

    @method_decorator(cache_page(60 * 15))
    @action(detail=False, methods=['get'])
    def top_rated(self, request):
        top_rated_shows = TVShowModel.objects.filter(poster_path__isnull=False).order_by('-vote_average', '-vote_count')[:20]
        serializer = self.get_serializer(top_rated_shows, many=True)
        return Response(serializer.data)

    @method_decorator(cache_page(60 * 15))
    @action(detail=False, methods=['get'])
    def on_air(self, request):
        on_air_shows = TVShowModel.objects.filter(poster_path__isnull=False).order_by('-first_air_date')[:20]
        serializer = self.get_serializer(on_air_shows, many=True)
        return Response(serializer.data)

class KeywordViewSet(viewsets.ModelViewSet):
    queryset = KeywordModel.objects.all()
    from .serializers import KeywordSerializer
    serializer_class = KeywordSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

import subprocess
import sys

@api_view(['GET'])
@permission_classes([AllowAny])
def trigger_seed(request):
    try:
        log_file = open('/app/seed_log.txt', 'w')
        subprocess.Popen([sys.executable, 'manage.py', 'fetch_movies'], stdout=log_file, stderr=subprocess.STDOUT)
    except Exception as e:
        return JsonResponse({'status': f'Error starting process: {e}'})
    return JsonResponse({'status': 'Database seeding started! Check /seed-status/ for progress.'})

@api_view(['GET'])
@permission_classes([AllowAny])
def seed_status(request):
    try:
        with open('/app/seed_log.txt', 'r') as f:
            lines = f.readlines()
            return HttpResponse("<br>".join(lines) or "Log is empty")
    except Exception as e:
        return HttpResponse(f"No log yet: {e}")
