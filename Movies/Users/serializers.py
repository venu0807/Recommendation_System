from rest_framework import serializers
from django.db.models import Q, Avg
from .models import *


class CastSerializer(serializers.ModelSerializer):
    tmdb_url = serializers.SerializerMethodField()

    class Meta:
        model = CastModel
        fields = '__all__'

    def get_tmdb_url(self, obj):
        """Return the TMDB profile URL for the cast."""
        return f"https://www.themoviedb.org/person/{obj.tmdb_id}"


class CrewSerializer(serializers.ModelSerializer):
    tmdb_url = serializers.SerializerMethodField()

    class Meta:
        model = CrewModel
        fields = '__all__'

    def get_tmdb_url(self, obj):
        """Return the TMDB profile URL for the crew."""
        return f"https://www.themoviedb.org/person/{obj.tmdb_id}"


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
    cast = CastSerializer(many=True, read_only=True)
    crew = CrewSerializer(many=True, read_only=True)
    genres = GenreSerializer(many=True, read_only=True)
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


class MoviesByCastSerializer(serializers.ModelSerializer):
    cast = CastSerializer(many=True)

    class Meta:
        model = MovieModel
        fields = '__all__'

    @staticmethod
    def get_movies_by_cast(cast_id):
        return MovieModel.objects.filter(cast__id=cast_id)


class MovieRecommendationSerializer(serializers.ModelSerializer):
    genres = GenreSerializer(many=True)
    cast = CastSerializer(many=True)

    class Meta:
        model = MovieModel
        fields = '__all__'


class RatingSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField()  # Display username
    movie = serializers.StringRelatedField()  # Display movie name

    class Meta:
        model = RatingModel
        fields = '__all__'


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
