from django.contrib import admin
from .models import *

class UserProfileModelAdmin(admin.ModelAdmin):
    list_display = ('user', 'firstname', 'lastname', 'email')
    search_fields = ('user__username', 'firstname', 'lastname', 'email')


class PersonModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'birthday', 'deathday', 'known_for_department','tmdb_id')
    ordering = ('name',)
    list_filter = ('known_for_department',)
    search_fields = ('name', 'biography')
    # list_per_page = 20
  

class MovieCastModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'character', 'known_for_department')
    ordering = ('name',)
    list_filter = ('known_for_department',)
    search_fields = ('name','character')
    # list_per_page = 20
  

class MovieCrewModelAdmin(admin.ModelAdmin):
    list_display = ('name','department', 'job')
    ordering = ('name',)
    list_filter = ('department', 'job')
    search_fields = ('name', 'department')
    # list_per_page = 20
   

class MovieModelAdmin(admin.ModelAdmin):
    list_display = ('title', 'release_date', 'popularity', 'vote_average')
    ordering = ('release_date',)
    list_filter = ('release_date', 'genres', 'is_active')
    search_fields = ('title', 'overview')
    # list_per_page = 20

    # def get_queryset(self, request):
    #     qs = super().get_queryset(request)
    #     return qs.filter(is_active=True)  # Show only active movies by default

    # def deactivate_movies(self, request, queryset):
    #     """Custom action to deactivate selected movies."""
    #     queryset.update(is_active=False)
    #     self.message_user(request, "Selected movies have been deactivated.")

    # deactivate_movies.short_description = "Deactivate selected movies"
    # actions = [deactivate_movies]

class ReleaseDateModelAdmin(admin.ModelAdmin):
    list_display = ('movie', 'release_date', 'country')
    ordering = ('release_date',)
    list_filter = ('release_date', 'country')
    search_fields = ('movie', 'country')


class GenreModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'tmdb_id', 'description')
    search_fields = ('name',)
    list_filter = ('name',)

class RatingModelAdmin(admin.ModelAdmin):
    list_display = ('user', 'movie', 'rating', 'timestamp')
    ordering = ('-timestamp',)
    list_filter = ('user', 'movie')
    search_fields = ('user__username', 'movie__title')
    # list_per_page = 20

class WatchlistModelAdmin(admin.ModelAdmin):
    list_display = ('user', 'movie', 'added_date')
    ordering = ('-added_date',)
    list_filter = ('user',)
    search_fields = ('user__username', 'movie__title')
    # list_per_page = 20

class FavoriteMoviesModelAdmin(admin.ModelAdmin):
    list_display = ('user', 'movie', 'added_date')
    ordering = ('-added_date',)
    list_filter = ('user',)
    search_fields = ('user__username', 'movie__title')
    # list_per_page = 20

class KeywordModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'tmdb_id')
    ordering = ('name',)
    search_fields = ('name',)
    # list_per_page = 20

class ProductionCompanyModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'origin_country', 'tmdb_id')
    ordering = ('name',)
    search_fields = ('name',)
    # list_per_page = 20

# Register models with the admin site
admin.site.register(UserProfileModel, UserProfileModelAdmin)
admin.site.register(PersonModel, PersonModelAdmin)
admin.site.register(MovieCastModel, MovieCastModelAdmin)
admin.site.register(MovieCrewModel, MovieCrewModelAdmin)
admin.site.register(MovieModel, MovieModelAdmin)
admin.site.register(ReleaseDateModel, ReleaseDateModelAdmin)
admin.site.register(GenreModel, GenreModelAdmin)
admin.site.register(RatingModel, RatingModelAdmin)
admin.site.register(WatchlistModel, WatchlistModelAdmin)
admin.site.register(FavoriteMoviesModel, FavoriteMoviesModelAdmin)
admin.site.register(KeywordModel, KeywordModelAdmin)
admin.site.register(ProductionCompanyModel, ProductionCompanyModelAdmin)