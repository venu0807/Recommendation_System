from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import *

# Initialize DefaultRouter
router = DefaultRouter()
router.register('movie', MovieViewSet, basename='movie')
router.register('genre', GenreViewSet, basename='genre')
router.register('cast', CastViewSet, basename='cast')
router.register('crew', CrewViewSet, basename='crew')
router.register('production-company', ProductionCompanyViewSet, basename='production-companies')
router.register('rating', RatingViewSet, basename='rating')
router.register('watchlist', WatchlistViewSet, basename='watchlist')
router.register('favorite', FavoriteMoviesViewSet, basename='favorite')
router.register('feedback', FeedbackViewSet)

# Include router URLs
urlpatterns = [
    path('', include(router.urls)),
]
