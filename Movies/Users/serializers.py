from rest_framework import serializers
from django.db.models import Q, Avg
from .models import *

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfileModel
        fields = ['preferred_genres', 'preferred_actors']  # Include the fields you want to expose

    def update(self, instance, validated_data):
        """Override the update method to handle the update of user preferences."""
        
        instance.preferred_genres = validated_data.get('preferred_genres', instance.preferred_genres)
        instance.preferred_actors = validated_data.get('preferred_actors', instance.preferred_actors)
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


class ProductionCompanySerializer(serializers.ModelSerializer):
    tmdb_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductionCompanyModel
        fields = '__all__'

class MovieSerializer(serializers.ModelSerializer):
    genres = GenreSerializer(many=True, read_only=True)
    cast = MovieCastSerializer(many=True, read_only=True)
    crew = MovieCrewSerializer(many=True, read_only=True)
    recommendation_source = serializers.CharField(required=False)
    match_score = serializers.IntegerField(required=False)
    similarity_score = serializers.FloatField(required=False)
    keyword = KeywordSerializer(many=True, read_only=True)
    productioncompany = ProductionCompanySerializer(many=True, read_only=True)
    average_rating = serializers.SerializerMethodField()
    tmdb_url = serializers.SerializerMethodField()

    class Meta:
        model = MovieModel
        fields = '__all__'

    def get_average_rating(self, obj):
        """Get the average rating for the movie."""
        avg_rating = RatingModel.objects.filter(movie=obj).aggregate(Avg('rating'))['rating__avg']
        return round(avg_rating, 2) if avg_rating else None

    def get_tmdb_url(self, obj):
        """Return the TMDB URL for the movie."""
        return f"https://www.themoviedb.org/movie/{obj.tmdb_id}"

    def get_imdb_url(self, obj):
        """Return the IMDb URL if an IMDb ID is available."""
        return f"https://www.imdb.com/title/{obj.keywords.get('imdb_id')}" if obj.keywords.get('imdb_id') else None



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


