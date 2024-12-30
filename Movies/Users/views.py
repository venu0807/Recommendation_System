from .models import *
from .serializers import *
from .recommender.recommendations import *
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
from django.db.models import Count
from django.shortcuts import render


class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        token['email'] = user.email
        token['is_staff'] = user.is_staff
        return token


class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer


@csrf_exempt
def register_user(request):
    if request.method == 'POST':
        data = json.loads(request.body.decode('utf-8'))
        username = data.get('username')
        password = data.get('password')

        if not username or not password:
            return JsonResponse({'detail': 'Invalid data'}, status=400)

        try:
            user = User.objects.create_user(username=username, password=password)
            user.save()
            return JsonResponse({'detail': 'User registered successfully'})
        except Exception as e:
            return JsonResponse({'detail': str(e)}, status=500)
    else:
        return JsonResponse({'detail': 'Invalid request method'}, status=405)


def recommendations_view(request):
    user_id = request.user.id  # Example: Get user ID from logged-in user
    movie_title = 'Inception'  # Example: Use a predefined movie title
    top_n = 10  # Number of recommended movies to show

    # Displaying recommendations (can customize this as needed)
    content_based_recs = display_content_based_recommendations(movie_title, top_n)
    collaborative_recs = display_collaborative_recommendations(user_id, top_n)
    hybrid_recs = display_hybrid_recommendations(user_id, movie_title, top_n)

    # Pass data to the template
    return render(request, 'recommendations.html', {
        'content_based_recs': content_based_recs,
        'collaborative_recs': collaborative_recs,
        'hybrid_recs': hybrid_recs,
    })



# Advanced Movie ViewSet
class MovieViewSet(viewsets.ModelViewSet):
    queryset = MovieModel.objects.all()
    serializer_class = MovieSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'genres__name', 'cast__name']
    ordering_fields = ['release_date', 'average_rating']


    @action(detail=False, methods=['get'])
    def recommend(self, request):
        """Get movie recommendations for the logged-in user."""
        user_id = request.user.id
        ratings = RatingModel.objects.all().values('user_id', 'movie_id', 'rating')
        
        recommender = MovieRecommender(ratings)
        recommender.prepare_data()
        recommender.train_model()
        
        recommendations = recommender.get_recommendations(user_id)
        
        # Fetch movie details for the recommended movie IDs
        recommended_movie_ids = [movie[0] for movie in recommendations]
        recommended_movies = MovieModel.objects.filter(id__in=recommended_movie_ids)
        serializer = self.get_serializer(recommended_movies, many=True)
        
        return Response(serializer.data)




    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get movies that are currently playing."""
        movies = MovieModel.get_popular_movies(limit=20)
        serializer = self.get_serializer(movies, many=True)
        return Response(serializer.data)


    
    @action(detail=False, methods=['get'])
    def now_playing(self, request):
        """Get movies that are currently playing."""
        movies = MovieModel.get_now_playing_movies(limit=20)
        serializer = self.get_serializer(movies, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        """Get upcoming movies."""
        movies = MovieModel.get_upcoming_movies(limit=20)
        serializer = self.get_serializer(movies, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def top_rated(self, request):
        """Get top-rated movies."""
        movies = MovieModel.get_top_rated_movies(limit=20)
        serializer = self.get_serializer(movies, many=True)
        return Response(serializer.data)
    
    
    @action(detail=False, methods=['get'])
    def trending(self, request):
        """Get trending movies."""
        movies = MovieModel.get_trending_movies(limit=20)
        serializer = self.get_serializer(movies, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def trending_last_week(self, request):
        """Get trending movies."""
        movies = MovieModel.get_trending_movies_last_week(limit=20)
        serializer = self.get_serializer(movies, many=True)
        return Response(serializer.data)
    

    @action(detail=True, methods=['get'])
    def recommendations(self, request, pk=None):
        """Get recommended movies based on a specific movie."""
        movie = self.get_object()
        recommended_movies = MovieModel.dynamic_recommendations(user=request.user, preferred_genres=[genre.name for genre in movie.genres.all()])
        serializer = self.get_serializer(recommended_movies, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export movie data as CSV."""
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

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def my_ratings(self, request):
        """Get all ratings by the logged-in user."""
        ratings = RatingModel.objects.filter(user=request.user)
        serializer = self.get_serializer(ratings, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['delete'])
    def bulk_delete(self, request):
        """Delete all ratings by the logged-in user."""
        count, _ = RatingModel.objects.filter(user=request.user).delete()
        return Response({'detail': f'{count} ratings deleted'}, status=status.HTTP_200_OK)


# Watchlist ViewSet
class WatchlistViewSet(viewsets.ModelViewSet):
    queryset = WatchlistModel.objects.all()
    serializer_class = WatchlistSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return WatchlistModel.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Add/remove a movie from the user's watchlist."""
        movie = MovieModel.objects.get(pk=pk)
        result = WatchlistModel.toggle_watchlist(request.user, movie.id)
        return Response({"detail": result}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export user's watchlist as CSV."""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="watchlist.csv"'

        writer = csv.writer(response)
        writer.writerow(['Movie ID', 'Movie Title'])

        for watchlist in WatchlistModel.objects.filter(user=request.user):
            writer.writerow([watchlist.movie.id, watchlist.movie.title])

        return response

# Favorite Movies ViewSet
class FavoriteMoviesViewSet(viewsets.ModelViewSet):
    queryset = FavoriteMoviesModel.objects.all()
    serializer_class = FavoriteMoviesSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return FavoriteMoviesModel.objects.filter(user=self.request.user)

    @action(detail=True, methods=['post'])
    def toggle(self, request, pk=None):
        """Add/remove a movie from the user's favorites."""
        movie = MovieModel.objects.get(pk=pk)
        favorite, created = FavoriteMoviesModel.objects.get_or_create(user=request.user, movie=movie)
        if not created:
            favorite.delete()
            return Response({"detail": "Removed from favorites"}, status=status.HTTP_200_OK)
        return Response({"detail": "Added to favorites"}, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export user's favorite movies as CSV."""
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="favorite_movies.csv"'

        writer = csv.writer(response)
        writer.writerow(['Movie ID', 'Movie Title'])

        for favorite in FavoriteMoviesModel.objects.filter(user=request.user):
            writer.writerow([favorite.movie.id, favorite.movie.title])

        return response

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
    

# Cast ViewSet
class CastViewSet(viewsets.ModelViewSet):
    queryset = CastModel.objects.all()
    serializer_class = CastSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'popularity']

    @action(detail=True, methods=['get'])
    def movies(self, request, pk=None):
        """Get all movies associated with a specific cast."""
        cast = self.get_object()
        movies = cast.movie_set.all()
        serializer = MovieSerializer(movies, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular cast members based on their appearances."""
        popular_cast = CastModel.objects.annotate(movie_count=Count('movie')).order_by('-movie_count')[:10]
        serializer = self.get_serializer(popular_cast, many=True)
        return Response(serializer.data)

class CrewViewSet(viewsets.ModelViewSet):
    queryset = CrewModel.objects.all()
    serializer_class = CrewSerializer
    permission_classes = [AllowAny]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name']
    ordering_fields = ['name', 'popularity']

    @action(detail=True, methods=['get'])
    def movies(self, request, pk=None):
        """Get all movies associated with a specific cast."""
        cast = self.get_object()
        movies = cast.movie_set.all()
        serializer = MovieSerializer(movies, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def popular(self, request):
        """Get popular cast members based on their appearances."""
        popular_cast = CastModel.objects.annotate(movie_count=Count('movie')).order_by('-movie_count')[:10]
        serializer = self.get_serializer(popular_cast, many=True)
        return Response(serializer.data)



    # Production Company ViewSet
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
        movies = company.movie_set.all()
        serializer = MovieSerializer(movies, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def oldest(self, request):
        """Get the oldest production companies."""
        oldest_companies = ProductionCompanyModel.objects.order_by('foundation_year')[:10]
        serializer = self.get_serializer(oldest_companies, many=True)
        return Response(serializer.data)



class FeedbackViewSet(viewsets.ModelViewSet):
    queryset = RatingModel.objects.all()
    serializer_class = RatingSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def submit_feedback(self, request, pk=None):
        """Submit feedback for a specific rating."""
        rating = self.get_object()
        feedback = request.data.get('feedback', '')

        if feedback:
            rating.feedback = feedback
            rating.save()
            return Response({'detail': 'Feedback submitted successfully'}, status=status.HTTP_200_OK)
        return Response({'detail': 'Feedback cannot be empty'}, status=status.HTTP_400_BAD_REQUEST)