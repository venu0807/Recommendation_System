from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
from django.utils.timezone import timedelta
from django.db.models import Q,F, Count, Avg


# Genre Model
class GenreModel(models.Model):
    tmdb_id = models.IntegerField(null=True, blank=True,unique=True)  # TMDB-specific ID
    name = models.CharField(max_length=400)
    description = models.TextField(null=True, blank=True)  # Description of the genre

    def __str__(self):
        return self.name


class MovieModel(models.Model):
    tmdb_id = models.IntegerField(unique=True)  # TMDB-specific ID
    title = models.CharField(max_length=500)
    original_title = models.CharField(max_length=500, null=True, blank=True)  # Original title
    tagline = models.CharField(max_length=500, null=True, blank=True)  # Tagline
    overview = models.TextField(null=True, blank=True)  # Movie summary
    runtime = models.PositiveIntegerField(null=True, blank=True)  # Runtime in minutes
    budget = models.BigIntegerField(null=True, blank=True)  # Budget in USD
    revenue = models.BigIntegerField(null=True, blank=True)  # Revenue in USD
    release_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=300,null=True, blank=True)  # Released, Post-Production, etc.
    popularity = models.FloatField(null=True, blank=True)
    vote_average = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    vote_count = models.PositiveIntegerField(null=True, blank=True)
    languages = models.JSONField(default=list, null=True, blank=True)  # List of spoken languages
    homepage = models.URLField(max_length=500, null=True, blank=True)  # Official homepage
    poster_path = models.CharField(max_length=500, null=True, blank=True)  # Poster image
    backdrop_path = models.CharField(max_length=500, null=True, blank=True)  # Backdrop image
    trailer_link = models.URLField(max_length=500, null=True, blank=True)
    teaser_link = models.URLField(max_length=500, null=True, blank=True)
    genres = models.ManyToManyField(GenreModel, related_name='movies')
    cast = models.ManyToManyField('CastModel', related_name='movies', blank=True)
    crew = models.ManyToManyField('CrewModel', related_name='movies', blank=True)
    keywords = models.ManyToManyField('KeywordModel', related_name='movies', blank=True)  # Keywords associated with the movie
    production = models.ManyToManyField('ProductionCompanyModel', related_name='movies', blank=True) # List of production companies
    deleted_at = models.DateTimeField(null=True, blank=True)
    collection = models.JSONField(null=True, blank=True)  # Belongs to a collection


    class Meta:
        indexes = [
            models.Index(fields=['release_date']),
            models.Index(fields=['popularity']),
            models.Index(fields=['vote_average']),
        ]


    def __str__(self):
        return self.title
    


    def delete(self, *args, **kwargs):
        self.deleted_at = timezone.now()
        self.save()
        

    @staticmethod
    def search_movies(query):
        return MovieModel.objects.filter(
            Q(title__icontains=query) |
            Q(genres__name__icontains=query) |
            Q(cast__name__icontains=query) |
            Q(crew__name__icontains=query)
        ).distinct()

    @staticmethod
    def get_recommended_movies(user, limit=20):

       # Step 1: Collaborative Filtering - Find user's favorite genres
        user_rated_movies = RatingModel.objects.filter(user=user, rating__gte=4.0)
        liked_genres = MovieModel.objects.filter(id__in=user_rated_movies.values_list('movie', flat=True)
        ).values_list('genres__name', flat=True)

         # Step 2: Content-Based Filtering - Recommend movies with similar genres
        recommended_movies = MovieModel.objects.filter(
               genre__name__in=liked_genres
            ).exclude(
                id__in=user_rated_movies.values_list('movie', flat=True)
            ).distinct().order_by('-popularity','-vote_average')[:limit]

        # # Recommend movies with similar genres or cast/crew
        # recommendations = MovieModel.objects.filter(
        #     Q(genres__name__in=liked_genres) &
        #     ~Q(ratingmodel__user=user)  # Exclude already rated movies
        # ).distinct()
        return recommended_movies
    
    @staticmethod
    def get_trending_for_user(user, limit=20):
        # Hybrid model: Mix trending with user preferences
        trending_movies = MovieModel.get_trending_movies(limit=50)
        user_rated_movies = RatingModel.objects.filter(user=user).values_list('movie', flat=True)

        # Filter out movies already rated by the user
        recommendations = trending_movies.exclude(id__in=user_rated_movies)[:limit]
        return recommendations
    

    @staticmethod
    def dynamic_recommendations(user, preferred_genres=None, min_rating=None):
        filters = Q()
        if preferred_genres:
            filters &= Q(genres__name__in=preferred_genres)
        if min_rating:
            filters &= Q(vote_average__gte=min_rating)

        return MovieModel.objects.filter(filters).exclude(ratingmodel__user=user).distinct()
    

    @staticmethod
    def filter_movies(genres=None, year=None,min_rating=0, min_popularity=None, min_vote_count=None, countries=None,limit=20):
        filters = Q()
        if genres:
            filters &= Q(genres__name__in=genres)
        if year:
            filters &= Q(release_date__year=year)
        if min_rating:
            filters &= Q(vote_average__gte=min_rating)
        if min_popularity:
            filters &= Q(popularity__gte=min_popularity)
        if min_vote_count:
            filters &= Q(vote_count__gte=min_vote_count)
        if countries:
            filters &= Q(production_countries__in=countries)

        return MovieModel.objects.filter(filters).order_by('-popularity')[:limit]
    


    @staticmethod
    def get_popular_movies(limit=20):
        return MovieModel.objects.order_by('-popularity')[:limit]
        # popular_movies = MovieModel.get_popular_movies(limit=10


    @staticmethod   
    def get_now_playing_movies(limit=20):
        return MovieModel.objects.filter(release_date__lte=timezone.now()).order_by('-popularity','-release_date')[:limit]
      
    @staticmethod
    def get_upcoming_movies(limit=20):
        return MovieModel.objects.filter(release_date__gte=timezone.now()).order_by('-release_date','-popularity')[:limit]
        # upcoming_movies = MovieModel.get_upcoming_movies(limit=10)


    @staticmethod
    def get_top_rated_movies(limit=20):
        return MovieModel.objects.filter(release_date__lte=timezone.now()).order_by('-vote_average')[:limit]
        # top_rated_movies = MovieModel.get_movies_by_year(2023, limit=10)

    
    @staticmethod
    def get_movies_by_genres(genres):
        return MovieModel.objects.filter(genres__name__in=genres).distinct()
     # trending_action_movies = MovieModel.get_movies_by_genre('Action)

    
    @staticmethod
    def get_trending_movies(limit=20):
        return MovieModel.objects.order_by('-popularity')[:limit]

        # trending_movies = MovieModel.get_trending_movies(limit=5)

    @staticmethod
    def get_trending_movies_last_week(limit=20):
        one_week_ago = timezone.now() - timedelta(days=7)
        return MovieModel.objects.filter(release_date__gte=one_week_ago).order_by('-popularity')[:limit]
    
    
    @staticmethod
    def get_movies_by_year(year, limit=20):
        return MovieModel.objects.filter(release_date__year=year).order_by('-popularity')[:limit]
    
    @staticmethod
    def get_highly_rated_and_popular_movies(limit=20):
        return MovieModel.objects.annotate(
            avg_rating=F('ratingmodel__rating')
        ).filter(avg_rating__gte=4.0).order_by('-popularity')[:limit]
    
    @staticmethod
    def get_recently_released_movies(days=30, limit=20):
        recent_date = timezone.now() - timedelta(days=days)
        return MovieModel.objects.filter(release_date__gte=recent_date).order_by('-popularity','-release_date')[:limit]
    
    @staticmethod
    def get_movies_in_date_range(start_date, end_date):
        return MovieModel.objects.filter(release_date__range=[start_date, end_date])

    @staticmethod
    def get_cold_start_recommendations(limit=20):
        # Focus on new or highly-rated movies
        recent_releases = MovieModel.get_recently_released_movies(days=90, limit=10)
        top_rated = MovieModel.get_top_rated_movies(limit=10)

        return list(recent_releases) + list(top_rated)


class ReleaseDateModel(models.Model):
    movie = models.ForeignKey('MovieModel', on_delete=models.CASCADE, related_name='release_dates')
    country = models.CharField(max_length=400)  # Country name or ISO country code
    release_date = models.DateField()  # Country-specific release date

    class Meta:
        unique_together = ('movie', 'country')  # Ensure no duplicate entries for the same movie and country
        indexes = [
            models.Index(fields=['country', 'release_date']),
        ]

    def __str__(self):
        return f"{self.movie.title} - {self.country} - {self.release_date}"

    # movie = MovieModel.objects.get(title="Example Movie")
    # release_dates = movie.release_dates.all()
    # for rd in release_dates:
    #     print(f"Country: {rd.country}, Release Date: {rd.release_date}")

    # movies_in_usa = MovieModel.objects.filter(release_dates__country="USA", release_dates__release_date__lte=timezone.now())



class CastModel(models.Model):
    tmdb_id = models.IntegerField(unique=True)  # TMDB-specific ID
    name = models.CharField(max_length=500)
    profile_path = models.CharField(max_length=500, null=True, blank=True)  # Profile image path
    known_for_department = models.CharField(max_length=400, null=True, blank=True)  # Acting, Directing, etc.
    biography = models.TextField(null=True, blank=True)
    birthday = models.DateField(null=True, blank=True)
    deathday = models.DateField(null=True, blank=True)
    place_of_birth = models.CharField(max_length=500, null=True, blank=True)
    popularity = models.FloatField(null=True, blank=True)
    gender = models.CharField(max_length=300,null=True, blank=True)  # Male, Female, Non-Binary, etc.
    imdb_id = models.CharField(max_length=400, null=True, blank=True)  # IMDB ID
    roles = models.JSONField(default=list, null=True, blank=True)  # List of roles in different movies

    def __str__(self):
        return self.name

    def get_movies_by_cast_role(cast_id, job):
        cast = CrewModel.objects.get(id=cast_id)
        return MovieModel.objects.filter(cast=cast, cast__job=job)
    
    # movies_acted = get_movies_by_cast_role(cast_id=123,job='Actor')
    # for movie in movies_acted:
    #     print(movie.title)



class CrewModel(models.Model):
    tmdb_id = models.IntegerField(unique=True)  # TMDB-specific ID
    name = models.CharField(max_length=500)
    profile_path = models.CharField(max_length=500, null=True, blank=True)  # Profile image path
    department = models.CharField(max_length=400, null=True, blank=True)  # Writing, Directing, etc.
    job = models.CharField(max_length=400, null=True, blank=True)  # Specific role: Director, Writer, etc.
    biography = models.TextField(null=True, blank=True)
    birthday = models.DateField(null=True, blank=True)
    deathday = models.DateField(null=True, blank=True)
    place_of_birth = models.CharField(max_length=500, null=True, blank=True)
    gender = models.CharField(max_length=300,null=True, blank=True)  # Male, Female, Non-Binary, etc.
    imdb_id = models.CharField(max_length=400, null=True, blank=True)  # IMDB ID
    popularity = models.FloatField(null=True, blank=True)
    known_for = models.JSONField(default=list, null=True, blank=True)  # Known works

    def __str__(self):
        return self.name
    
    def get_movies_by_crew_role(crew_id, job):
        crew = CrewModel.objects.get(id=crew_id)
        return MovieModel.objects.filter(crew=crew, crew__job=job)

        # movies_directed = CrewModel.get_movies_by_crew_role(crew_id=456, job='Director')
        # for movie in movies_directed:
        #     print(movie.title)


class KeywordModel(models.Model):
    tmdb_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=500)
    

    def __str__(self):
        return self.name

class ProductionCompanyModel(models.Model):
    tmdb_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=500)
    logo_path = models.CharField(max_length=500, null=True, blank=True)
    origin_country = models.CharField(max_length=100)

    def __str__(self):
        return self.name


class RatingModel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    movie = models.ForeignKey(MovieModel, on_delete=models.CASCADE)
    rating = models.DecimalField(max_digits=3, decimal_places=1)  # Rating (e.g., 8.5)
    review = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)
    feedback = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.movie.title} - {self.rating}"


class WatchlistModel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    movie = models.ForeignKey(MovieModel, on_delete=models.CASCADE)
    added_date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.user.username} - {self.movie.title}"

    def toggle_watchlist(user, movie_id):
        movie = MovieModel.objects.get(id=movie_id)
        watchlist_item, created = WatchlistModel.objects.get_or_create(user=user, movie=movie)
        if not created:  # Item already exists; remove it
            watchlist_item.delete()
            return "Removed from watchlist"
        return "Added to watchlist"



class FavoriteMoviesModel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    movie = models.ForeignKey(MovieModel, on_delete=models.CASCADE)
    added_date = models.DateTimeField(default=timezone.now)

    def __str__(self):
        return f"{self.user.username} - {self.movie.title}"
