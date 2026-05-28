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
router.register(r'feedback', FeedbackViewSet)
router.register(r'favorites', FavoriteViewSet, basename='favorites')
router.register(r'tvshow-rating', TVShowRatingViewSet, basename='tvshow-rating')
router.register(r'tvshow-favorite', FavoriteTVShowsViewSet, basename='tvshow-favorite')
router.register(r'tvshow-watchlist', TVShowWatchlistViewSet, basename='tvshow-watchlist')
router.register(r'tvshow-review', TVShowReviewViewSet, basename='tvshow-review')
router.register(r'tv', TVShowViewSet, basename='tvshow')
router.register(r'keyword', KeywordViewSet, basename='keyword')

# Include router URLs
urlpatterns = [
    path('', include(router.urls)),
    path('register/', register_user, name='register_user'),
    path('token/', MyTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    # path('api/user/profile/', UserProfileUpdateView.as_view(), name='user_profile_update'),
    path('api/user/me/', get_my_profile, name='get_my_profile'),
    path('trigger-seed/', trigger_seed, name='trigger_seed'),
    path('seed-status/', seed_status, name='seed_status'),
]
