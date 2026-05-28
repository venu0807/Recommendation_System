from django.db import models
from django.contrib.auth.models import User
from django.db.models import Q, Avg
from django.core.exceptions import ValidationError
from django.utils import timezone
from django.utils.timezone import now


class MediaModel(models.Model):
    MEDIA_TYPE_CHOICES = [
        ('poster', 'Poster'),
        ('backdrop', 'Backdrop'),
        ('trailer', 'Trailer'),
        ('teaser', 'Teaser'),
        ('image', 'Image'),
    ]
    movie = models.ForeignKey('MovieModel', on_delete=models.CASCADE, null=True, blank=True, related_name='media')
    tv_show = models.ForeignKey('TVShowModel', on_delete=models.CASCADE, null=True, blank=True, related_name='media')
    media_type = models.CharField(max_length=20, choices=MEDIA_TYPE_CHOICES)
    url = models.URLField()
    language = models.CharField(max_length=10, null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        target = self.movie.title if self.movie else (self.tv_show.name if self.tv_show else "Unknown")
        return f"{self.media_type} for {target}"




class TVShowModel(models.Model):
    tmdb_id = models.IntegerField(unique=True)
    name = models.CharField(max_length=255)
    overview = models.TextField(null=True, blank=True)
    first_air_date = models.DateField(null=True, blank=True)
    last_air_date = models.DateField(null=True, blank=True)
    number_of_seasons = models.PositiveIntegerField(default=1)
    number_of_episodes = models.PositiveIntegerField(default=1)
    poster_path = models.URLField(null=True, blank=True)
    backdrop_path = models.URLField(null=True, blank=True)
    genres = models.ManyToManyField('GenreModel', related_name='tvshows')
    cast = models.ManyToManyField('PersonModel', related_name='tvshows_cast')
    crew = models.ManyToManyField('PersonModel', related_name='tvshows_crew')
    popularity = models.FloatField(default=0)
    vote_average = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    vote_count = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=100, null=True, blank=True)
    homepage = models.URLField(null=True, blank=True)

    def __str__(self):
        return self.name

class SeasonModel(models.Model):
    tv_show = models.ForeignKey(TVShowModel, on_delete=models.CASCADE, related_name='seasons')
    season_number = models.PositiveIntegerField()
    name = models.CharField(max_length=255)
    overview = models.TextField(null=True, blank=True)
    air_date = models.DateField(null=True, blank=True)
    poster_path = models.URLField(null=True, blank=True)

    def __str__(self):
        return f"{self.tv_show.name} - Season {self.season_number}"

class EpisodeModel(models.Model):
    season = models.ForeignKey(SeasonModel, on_delete=models.CASCADE, related_name='episodes')
    episode_number = models.PositiveIntegerField()
    name = models.CharField(max_length=255)
    overview = models.TextField(null=True, blank=True)
    air_date = models.DateField(null=True, blank=True)
    still_path = models.URLField(null=True, blank=True)
    vote_average = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)
    vote_count = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.season.tv_show.name} S{self.season.season_number}E{self.episode_number}"


# User-created Lists (public/private)
class UserListModel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='lists')
    name = models.CharField(max_length=255)
    description = models.TextField(null=True, blank=True)
    movies = models.ManyToManyField('MovieModel', blank=True, related_name='in_lists')
    tv_shows = models.ManyToManyField('TVShowModel', blank=True, related_name='in_lists')
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} ({'Public' if self.is_public else 'Private'}) by {self.user.username}"

class UserProfileModel(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    firstname = models.CharField(max_length=30)
    lastname = models.CharField(max_length=30)
    email = models.EmailField()
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    bio = models.TextField(null=True, blank=True)
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
            Q(id__in=self.preferred_movies.all()) |
            Q(genres__in=self.preferred_genres.all()) |
            Q(cast__member__in=self.preferred_actors.all())
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
        self.is_active = False
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


class TVShowRatingModel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tv_show = models.ForeignKey(TVShowModel, on_delete=models.CASCADE)
    rating = models.DecimalField(max_digits=3, decimal_places=1)
    review = models.TextField(null=True, blank=True)
    timestamp = models.DateTimeField(default=timezone.now)
    feedback = models.TextField(blank=True, null=True)

    class Meta:
        unique_together = ('user', 'tv_show')

    def clean(self):
        if not (0 <= self.rating <= 10):
            raise ValidationError('Rating must be between 0 and 10.')

    def __str__(self):
        return f"{self.user.username} - {self.tv_show.name} - {self.rating}"

class FavoriteTVShowsModel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tv_show = models.ForeignKey(TVShowModel, on_delete=models.CASCADE)
    added_date = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    removed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.tv_show.name}"

class TVShowWatchlistModel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tv_show = models.ForeignKey(TVShowModel, on_delete=models.CASCADE)
    added_date = models.DateTimeField(default=timezone.now)
    is_active = models.BooleanField(default=True)
    removed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} - {self.tv_show.name}"

class TVShowReviewModel(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    tv_show = models.ForeignKey(TVShowModel, on_delete=models.CASCADE)
    review = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username} review on {self.tv_show.name}"


