from rest_framework import serializers
from django.db.models import Q, Avg
from drf_spectacular.utils import extend_schema_field
from .models import *

class UserProfileSerializer(serializers.ModelSerializer):
    first_name = serializers.CharField(source='user.first_name', required=False)
    last_name = serializers.CharField(source='user.last_name', required=False)
    email = serializers.EmailField(source='user.email', required=False)

    class Meta:
        model = UserProfileModel
        fields = [
            'id', 'first_name', 'last_name', 'email', 'avatar', 'bio',
            'preferred_genres', 'preferred_actors', 'preferred_movies',
            'date_of_birth', 'location', 'subscription_type'
        ]

    def update(self, instance, validated_data):
        """Override the update method to handle the update of user preferences."""
        user_data = validated_data.pop('user', {})
        
        # Update User model fields
        if user_data:
            user = instance.user
            if 'first_name' in user_data:
                user.first_name = user_data['first_name']
            if 'last_name' in user_data:
                user.last_name = user_data['last_name']
            if 'email' in user_data:
                user.email = user_data['email']
            user.save()
        
        # Update UserProfileModel fields
        if 'preferred_genres' in validated_data:
            instance.preferred_genres.set(validated_data['preferred_genres'])
        if 'preferred_actors' in validated_data:
            instance.preferred_actors.set(validated_data['preferred_actors'])
        instance.bio = validated_data.get('bio', instance.bio)
        instance.avatar = validated_data.get('avatar', instance.avatar)
        instance.date_of_birth = validated_data.get('date_of_birth', instance.date_of_birth)
        instance.location = validated_data.get('location', instance.location)
        instance.subscription_type = validated_data.get('subscription_type', instance.subscription_type)
        instance.save()
        return instance


class PersonSerializer(serializers.ModelSerializer):

    class Meta:
        model = PersonModel
        fields = '__all__'



class MovieCastSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovieCastModel
        fields = '__all__'

class MovieCrewSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovieCrewModel
        fields = '__all__'

class GenreSerializer(serializers.ModelSerializer):
    tmdb_url = serializers.SerializerMethodField()

    class Meta:
        model = GenreModel
        fields = '__all__'

    @extend_schema_field(serializers.URLField)
    def get_tmdb_url(self, obj):
        """Return the TMDB URL for the genre."""
        return f"https://www.themoviedb.org/genre/{obj.tmdb_id}"


class ReleaseDateSerializer(serializers.ModelSerializer):
    movie_title = serializers.CharField(source='movie.title', read_only=True)

    class Meta:
        model = ReleaseDateModel
        fields = '__all__'

class KeywordSerializer(serializers.ModelSerializer):
    tmdb_url = serializers.SerializerMethodField()

    class Meta:
        model = KeywordModel
        fields = '__all__'

    @extend_schema_field(serializers.URLField)
    def get_tmdb_url(self, obj):
        return f"https://www.themoviedb.org/keyword/{obj.tmdb_id}"


class ProductionCompanySerializer(serializers.ModelSerializer):
    tmdb_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductionCompanyModel
        fields = '__all__'

    @extend_schema_field(serializers.URLField)
    def get_tmdb_url(self, obj):
        return f"https://www.themoviedb.org/company/{obj.tmdb_id}"

class MovieSerializer(serializers.ModelSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    cast = MovieCastSerializer(many=True, read_only=True)
    crew = MovieCrewSerializer(many=True, read_only=True)
    recommendation_source = serializers.CharField(required=False)
    match_score = serializers.IntegerField(required=False)
    similarity_score = serializers.FloatField(required=False)
    keywords = KeywordSerializer(many=True, read_only=True)
    production_companies = ProductionCompanySerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    tmdb_url = serializers.SerializerMethodField()

    class Meta:
        model = MovieModel
        fields = '__all__'

    @extend_schema_field(serializers.DecimalField(max_digits=4, decimal_places=2))
    def get_average_rating(self, obj):
        """Get the average rating for the movie."""
        if hasattr(obj, 'annotated_average_rating') and obj.annotated_average_rating is not None:
            return round(obj.annotated_average_rating, 2)

        avg_rating = RatingModel.objects.filter(movie=obj).aggregate(Avg('rating'))['rating__avg']
        return round(avg_rating, 2) if avg_rating else None

    @extend_schema_field(serializers.URLField)
    def get_tmdb_url(self, obj):
        """Return the TMDB URL for the movie."""
        return f"https://www.themoviedb.org/movie/{obj.tmdb_id}"

    def get_imdb_url(self, obj):
        """Return the IMDb URL if an IMDb ID is available."""
        return f"https://www.imdb.com/title/{obj.imdb_id}" if obj.imdb_id else None



class RatingSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()  # Display username
    movie = serializers.StringRelatedField()  # Display movie name

    class Meta:
        model = RatingModel
        fields = '__all__'

    def create(self, validated_data):
        # Ensure the rating is saved or updated for the logged-in user
        user = validated_data['user']
        movie = validated_data['movie']
        rating = validated_data['rating']

        # Check if the user already rated this movie
        existing_rating = RatingModel.objects.filter(user=user, movie=movie).first()
        if existing_rating:
            existing_rating.rating = rating
            existing_rating.save()
            return existing_rating
        else:
            return RatingModel.objects.create(user=user, movie=movie, rating=rating)


class WatchlistSerializer(serializers.ModelSerializer):
    movie = MovieSerializer()

    class Meta:
        model = WatchlistModel
        fields = '__all__'


class FavoriteMoviesSerializer(serializers.ModelSerializer):
    movie = MovieSerializer()

    class Meta:
        model = FavoriteMoviesModel
        fields = '__all__'


class TVShowRatingSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    tv_show = serializers.StringRelatedField()

    class Meta:
        model = TVShowRatingModel
        fields = '__all__'

class FavoriteTVShowsSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    tv_show = serializers.StringRelatedField()

    class Meta:
        model = FavoriteTVShowsModel
        fields = '__all__'

class TVShowWatchlistSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    tv_show = serializers.StringRelatedField()

    class Meta:
        model = TVShowWatchlistModel
        fields = '__all__'

class TVShowReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()
    tv_show = serializers.StringRelatedField()

    class Meta:
        model = TVShowReviewModel
        fields = '__all__'


class TVShowSerializer(serializers.ModelSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    cast = PersonSerializer(many=True, read_only=True)
    crew = PersonSerializer(many=True, read_only=True)

    class Meta:
        model = TVShowModel
        fields = '__all__'
