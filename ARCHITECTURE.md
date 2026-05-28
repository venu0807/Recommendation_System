# 🏗️ Recommendation System Architecture

This document outlines the system architecture, data flow, and key design decisions of the Movie Recommendation Platform.

## 🌟 System Overview
The platform is a decoupled client-server architecture:
- **Frontend:** React 18 SPA (Single Page Application) with Context API state management
- **Backend:** Django REST Framework (DRF) with Django Channels for WebSockets
- **Database:** SQLite (development) / PostgreSQL (production)
- **Cache:** In-memory `LocMemCache` (development) / Redis (production)

```
Browser  ──HTTP──>  Django (ASGI/WSGI)  ──>  SQLite/PostgreSQL
                         │
                    [Recommendation Engine]
                         │
                    [Django Cache Framework]
```

---

## 🎨 Frontend Architecture (React)

### State Management (`Context.js`)
The `UserProvider` acts as the central state manager:
1. **Boot Fetching:** On initial load, fetches `/movie/popular/` and `/movie/upcoming/` concurrently using `Promise.allSettled`.
2. **Memoization:** Wraps the massive `contextValue` in `useMemo` to prevent cascading re-renders.
3. **Local Fallbacks:** Login/register forms hold their own state locally.

### Performance
- **Image Lazy Loading:** TMDB poster images use native `loading="lazy"`.

### Test Coverage
- 231 frontend tests across 33 test files (Jest + React Testing Library).
- Covers: authentication, API fetching, routing, error boundaries, all major components.

---

## ⚙️ Backend Architecture (Django)

### Tech Stack
- **Framework:** Django 5.2 + DRF 3.17
- **Authentication:** JWT via `rest_framework_simplejwt` with httpOnly cookies
- **Real-Time:** Django Channels (in-memory layer for dev, Redis for production)
- **Documentation:** drf-spectacular (Swagger + ReDoc)
- **Testing:** 103 backend tests covering models, views, serializers, and the recommendation engine

### Authentication Flow
1. `POST /token/` issues short-lived `access` (5min) and long-lived `refresh` (30 day) tokens
2. Tokens stored in httpOnly cookies (accessible to JS via cookie-based auth)
3. Custom `CookieJWTAuthentication` class reads tokens from cookies

### Key ViewSets
| ViewSet | Endpoints | Auth |
|---------|-----------|------|
| `MovieViewSet` | `/movie/` — list, search, trending, popular, upcoming, recommendations, rate | AllowAny (list), IsAuthenticated (rate) |
| `WatchlistViewSet` | `/watchlist/` — add, remove, my_watchlist | IsAuthenticated |
| `FavoriteViewSet` | `/favorites/` — add, remove, my_favorites | IsAuthenticated |
| `RatingViewSet` | `/rating/` — my_ratings, bulk_delete | IsAuthenticated |
| `TVShowViewSet` | `/tv/` — list, popular, top_rated, on_air | AllowAny |

---

## 🧠 Recommendation Engine

The engine lives in `Movies/Users/recommender/recommendations.py` and has **3 caching layers**:

| Cache | Key Pattern | TTL | Invalidated |
|-------|-------------|-----|-------------|
| User recs | `user_recs_{username}_{num}` | 15 min | On rating a movie |
| TF-IDF matrix | `tfidf_matrix_data` | 30 min | Manual call |
| List endpoints | `trending_movies_20`, etc. | 10 min | Manual call |

### How Recommendations Work
1. **With ratings:** Finds your highest-rated movie → matches by genre + language → scores by genre overlap count → dedupes → returns top N
2. **Without ratings:** Falls back to trending/popular movies
3. **Movie similarity:** TF-IDF vectorization on (title + genres + overview) → cosine similarity

### Cache Invalidation
When a user rates a movie via `POST /movie/rate/`, the system:
1. Clears `user_recs_{username}_5`, `_10`, `_20`
2. Recomputes recommendations
3. Pushes updated recs via WebSocket to the user

---

## 🦅 Observability

### Health Check
```
GET /api/health/
→ 200 {"status": "ok", "database": "connected"}
```

### Logging
All logs are output in JSON format for structured ingestion:
```json
{ "time": "2026-05-28 12:00:00", "level": "INFO", "message": "Cached recommendations for user testuser" }
```

### Crash Reporting (Optional)
Set `SENTRY_DSN` in `.env` to forward unhandled exceptions to Sentry.

---

## 📂 Project Structure

```
Recommendation_System/
├── Movies/                     # Django backend
│   ├── Movies/                 # Project settings, ASGI/WSGI, URLs
│   ├── Users/                  # Main application
│   │   ├── migrations/         # Database migrations
│   │   ├── recommender/        # ML recommendation engine with caching
│   │   │   └── recommendations.py
│   │   ├── management/commands/# fetch_movies, remove_duplicates
│   │   ├── models.py           # 20+ models (Movie, TVShow, Person, etc.)
│   │   ├── views.py            # ViewSets and API views
│   │   ├── serializers.py      # DRF serializers
│   │   ├── services.py         # Business logic (search)
│   │   ├── consumers.py        # WebSocket consumers
│   │   ├── authentication.py   # Custom JWT cookie auth
│   │   └── tests.py            # 103 tests
│   └── staticfiles/            # Collected static assets
├── films/                      # React frontend
│   ├── public/                 # Static HTML
│   └── src/                    # Components, context, styles, tests
│       ├── components/         # Movie, TV, Profile, Auth, UI components
│       └── styles/             # CSS files
├── .env.example                # Environment variable template
└── requirements.txt            # Python dependencies
```
