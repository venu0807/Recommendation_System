from django.contrib import admin
from .models import *

class CastModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'birthday', 'deathday', 'known_for_department')
    ordering = ('name',)
    list_filter = ('known_for_department',)
    search_fields = ('name', 'biography')
    list_per_page = 20
    fieldsets = (
        (None, {
            'fields': ('name', 'birthday', 'deathday', 'known_for_department', 'biography', 'profile_path')
        }),
    )

class CrewModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'birthday', 'department', 'job')
    ordering = ('name',)
    list_filter = ('department', 'job')
    search_fields = ('name', 'biography')
    list_per_page = 20
    fieldsets = (
        (None, {
            'fields': ('name', 'birthday', 'deathday', 'department', 'job', 'biography', 'profile_path')
        }),
    )

class MovieModelAdmin(admin.ModelAdmin):
    list_display = ('title', 'release_date', 'popularity', 'vote_average')
    ordering = ('release_date',)
    list_filter = ('genres', 'status')
    search_fields = ('title', 'overview')
    list_per_page = 20
    fieldsets = (
        (None, {
            'fields': ('title', 'original_title', 'tagline', 'overview', 'release_date', 'popularity', 'vote_average', 'status', 'genres')
        }),
        ('Financial Information', {
            'fields': ('budget', 'revenue')
        }),
        ('Media', {
            'fields': ('poster_path', 'backdrop_path', 'trailer_link', 'teaser_link')
        }),
    )

class GenreModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'description')
    ordering = ('name',)
    search_fields = ('name',)
    list_per_page = 20

class RatingModelAdmin(admin.ModelAdmin):
    list_display = ('user', 'movie', 'rating', 'timestamp')
    ordering = ('-timestamp',)
    list_filter = ('user', 'movie')
    search_fields = ('user__username', 'movie__title')
    list_per_page = 20

class WatchlistModelAdmin(admin.ModelAdmin):
    list_display = ('user', 'movie', 'added_date')
    ordering = ('-added_date',)
    list_filter = ('user',)
    search_fields = ('user__username', 'movie__title')
    list_per_page = 20

class FavoriteMoviesModelAdmin(admin.ModelAdmin):
    list_display = ('user', 'movie', 'added_date')
    ordering = ('-added_date',)
    list_filter = ('user',)
    search_fields = ('user__username', 'movie__title')
    list_per_page = 20

class KeywordModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'tmdb_id')
    ordering = ('name',)
    search_fields = ('name',)
    list_per_page = 20

class ProductionCompanyModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'origin_country', 'tmdb_id')
    ordering = ('name',)
    search_fields = ('name',)
    list_per_page = 20

# Register models with the admin site
admin.site.register(CastModel, CastModelAdmin)
admin.site.register(CrewModel, CrewModelAdmin)
admin.site.register(MovieModel, MovieModelAdmin)
admin.site.register(GenreModel, GenreModelAdmin)
admin.site.register(RatingModel, RatingModelAdmin)
admin.site.register(WatchlistModel, WatchlistModelAdmin)
admin.site.register(FavoriteMoviesModel, FavoriteMoviesModelAdmin)
admin.site.register(KeywordModel, KeywordModelAdmin)
admin.site.register(ProductionCompanyModel, ProductionCompanyModelAdmin)