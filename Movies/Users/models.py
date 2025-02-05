from django.db import models
from django.contrib.auth.models import User
from django.db.models import Q, Avg
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.timezone import now


class UserProfileModel(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    firstname = models.CharField(max_length=30)
    lastname = models.CharField(max_length=30)
    email = models.EmailField()
    preferred_movies = models.ManyToManyField('MovieModel', blank=True)
    preferred_genres = models.ManyToManyField('GenreModel', blank=True)
    preferred_actors = models.ManyToManyField('PersonModel', blank=True)
    date_of_birth = models.DateField(null=True, blank=True)
    location = models.CharField(max_length=255, null=True, blank=True)
    subscription_type = models.CharField(max_length=50, choices=[('free', 'Free'), ('premium', 'Premium'), ('vip', 'VIP')], default='free')

    def __str__(self):
        return f"{self.user}'s Preferences"
    
    def get_preferred_movies(self):
        preferred_movies = MovieModel.objects.filter(
            Q(movies__in=self.preferred_movies.all()) |
            Q(genres__in=self.preferred_genres.all()) |
            Q(actor__in=self.preferred_actors.all())
        ).distinct()

        if not self.preferred_genres.exists() and not self.preferred_actors.exists():
            preferred_movies = MovieModel.objects.all()

        return preferred_movies


class GenreModel(models.Model):
    tmdb_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=250, unique=True)
    description = models.TextField(null=True, blank=True)
    popularity_score = models.FloatField(default=0.0)
    parent_genre = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True)

    def __str__(self):
        return self.name


class MovieModel(models.Model):
    tmdb_id = models.IntegerField(unique=True)
    title = models.CharField(max_length=500)
    original_title = models.CharField(max_length=500, null=True, blank=True)
    tagline = models.CharField(max_length=500, null=True, blank=True)
    overview = models.TextField(null=True, blank=True)
    runtime = models.PositiveIntegerField(null=True, blank=True)
    budget = models.BigIntegerField(null=True, blank=True)
    revenue = models.BigIntegerField(null=True, blank=True)
    release_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=300, null=True, blank=True)
    popularity = models.FloatField(null=True, blank=True)
    vote_average = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    vote_count = models.PositiveIntegerField(null=True, blank=True)
    original_language = models.CharField(max_length=10, null=True, blank=True)
    imdb_id = models.CharField(max_length=50, null=True, blank=True)
    belongs_to_collection = models.JSONField(default=list, null=True, blank=True)
    poster_path = models.URLField(null=True, blank=True)
    backdrop_path = models.URLField(null=True, blank=True)
    teaser_link = models.TextField(blank=True, null=True)
    trailer_link = models.TextField(blank=True, null=True)
    awards = models.JSONField(default=list, null=True, blank=True) 
    is_active = models.BooleanField(default=True)
    user_ratings_count = models.PositiveIntegerField(default=0)
    streaming_platforms = models.JSONField(default=list, null=True, blank=True)
    cached_average_rating = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    homepage = models.URLField(null=True, blank=True)
    spoken_languages = models.JSONField(default=list, null=True, blank=True)
    production_countries = models.JSONField(default=list, null=True, blank=True)

    genres = models.ManyToManyField('GenreModel', related_name='movies')
    keywords = models.ManyToManyField('KeywordModel', related_name='movies')
    production_companies = models.ManyToManyField('ProductionCompanyModel', related_name='movies')
    cast = models.ManyToManyField('MovieCastModel', related_name='movies')
    crew = models.ManyToManyField('MovieCrewModel', related_name='movies')

    class Meta:
        indexes = [
            models.Index(fields=['tmdb_id']),
            models.Index(fields=['title']),
            models.Index(fields=['release_date']),
            models.Index(fields=['popularity']),
            models.Index(fields=['vote_average']),
        ]

    def __str__(self):
        return self.title

    def delete(self, *args, **kwargs):
        self.is_active = timezone.now()
        self.save()

    def average_rating(self):
        return self.ratingmodel_set.aggregate(Avg('rating'))['rating__avg'] or 0


class PersonModel(models.Model):
    tmdb_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=255)
    gender = models.IntegerField(null=True, blank=True)
    popularity = models.FloatField(default=0)
    profile_path = models.URLField(null=True, blank=True)
    known_for_department = models.CharField(max_length=255, null=True, blank=True)
    also_known_as = models.JSONField(default=list)
    biography = models.TextField(null=True, blank=True)
    birthday = models.DateField(null=True, blank=True)
    deathday = models.DateField(null=True, blank=True)
    place_of_birth = models.CharField(max_length=255, null=True, blank=True)
    imdb_id = models.CharField(max_length=50, null=True, blank=True)
    homepage = models.URLField(null=True, blank=True)

    def __str__(self):
        return self.name


class MovieCastModel(models.Model):
    member = models.ForeignKey(PersonModel, on_delete=models.CASCADE)
    movie = models.ForeignKey(MovieModel, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    original_name = models.CharField(max_length=255)
    gender = models.IntegerField(null=True, blank=True)
    popularity = models.FloatField(default=0)
    profile_path = models.URLField(null=True, blank=True)
    known_for_department = models.CharField(max_length=255, null=True, blank=True)
    cast_id = models.IntegerField(null=True)  # Remove unique=True
    character = models.CharField(max_length=255)
    credit_id = models.CharField(max_length=255)
    order = models.IntegerField()

    class Meta:
        unique_together = ('member', 'movie', 'order')
        ordering = ['order']  # Add ordering

    def __str__(self):
        return f"{self.member.name} as {self.character} in {self.movie.title}"

class MovieCrewModel(models.Model):
    member = models.ForeignKey(PersonModel, on_delete=models.CASCADE)
    movie = models.ForeignKey(MovieModel, on_delete=models.CASCADE)
    name = models.CharField(max_length=255)
    original_name = models.CharField(max_length=255)
    gender = models.IntegerField(null=True, blank=True)
    popularity = models.FloatField(default=0)
    profile_path = models.URLField(null=True, blank=True)
    known_for_department = models.CharField(max_length=255, null=True, blank=True)
    credit_id = models.CharField(max_length=50, null=True, blank=True)
    department = models.CharField(max_length=255)
    job = models.CharField(max_length=255)

    class Meta:
        unique_together = ('member', 'movie')

    def __str__(self):
        return f"{self.member.name} - {self.job} in {self.department} for {self.movie.title}"


class UserMovieHistoryModel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    movie = models.ForeignKey(MovieModel, on_delete=models.CASCADE)
    watched_at = models.DateTimeField(default=timezone.now)
    duration = models.PositiveIntegerField(null=True, blank=True)
    rating_given = models.BooleanField(default=False)
    status = models.CharField(max_length=50, default='inactive', choices=[('watched', 'Watched'), ('paused', 'Paused'), ('unfinished', 'Unfinished')])

    def __str__(self):
        return f"{self.user.username} watched {self.movie.title} at {self.watched_at}"


class ReleaseDateModel(models.Model):
    movie = models.ForeignKey('MovieModel', on_delete=models.CASCADE, related_name='release_dates')
    country = models.CharField(max_length=400)
    release_date = models.DateField()

    class Meta:
        unique_together = ('movie', 'country')
        indexes = [
            models.Index(fields=['country', 'release_date']),
        ]

    def __str__(self):
        return f"{self.movie.title} - {self.country} - {self.release_date}"


class KeywordModel(models.Model):
    tmdb_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=500)

    def __str__(self):
        return self.name


class ProductionCompanyModel(models.Model):
    tmdb_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=500)
    logo_path = models.CharField(max_length=500, null=True, blank=True)
    origin_country = models.CharField(max_length=100, blank=True, null=True)

    def __str__(self):
        return self.name


class RatingModel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    movie = models.ForeignKey(MovieModel, on_delete=models.CASCADE)
    rating = models.DecimalField(max_digits=3, decimal_places=1)
    review = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)
    feedback = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"{self.user.username} - {self.movie.title} - {self.rating}"

    class Meta:
        unique_together = ('user', 'movie')

    def clean(self):
        if not (0 <= self.rating <= 10):
            raise ValidationError('Rating must be between 0 and 10.')
        
    


class FeedbackModel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    movie = models.ForeignKey(MovieModel, on_delete=models.CASCADE)
    is_helpful = models.BooleanField(default=False)
    feedback_date = models.DateTimeField(default=now)
    detailed_feedback = models.TextField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.movie.title} - {'Helpful' if self.is_helpful else 'Not Helpful'}"


class WatchlistModel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    movie = models.ForeignKey(MovieModel, on_delete=models.CASCADE)
    added_date = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    removed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.movie.title}"


class FavoriteMoviesModel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    movie = models.ForeignKey(MovieModel, on_delete=models.CASCADE)
    added_date = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    removed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.movie.title}"


