from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import *

from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

# Initialize DefaultRouter
router = DefaultRouter()
router.register(r'user', UserPreferenceViewSet, basename='user-preferences')
router.register(r'movie', MovieViewSet, basename='movie')
router.register(r'genre', GenreViewSet, basename='genre')
router.register(r'person', PersonViewSet, basename='person')
router.register(r'cast_movie', CastMovieViewSet, basename='cast_movie')
router.register(r'crew_movie', CrewMovieViewSet, basename='crew_movie')
router.register(r'production-company', ProductionCompanyViewSet, basename='production-companies')
router.register(r'rating', RatingViewSet, basename='rating')
router.register(r'watchlist', WatchlistViewSet, basename='watchlist')
router.register(r'favorite', FavoriteViewSet, basename='favorite')
router.register(r'feedback', FeedbackViewSet)
router.register(r'favorites', FavoriteViewSet, basename='favorites')

# Include router URLs
urlpatterns = [
    path('', include(router.urls)),
    path('register/', register_user, name='register_user'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
