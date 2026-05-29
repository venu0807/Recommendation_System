# 🎬 Movie Recommendation Platform

A full-stack movie discovery and recommendation platform built with **React 18** (frontend) and **Django REST Framework 5.2** (backend). Features personalized AI recommendations, real-time updates via WebSockets, JWT authentication, and comprehensive test coverage (334 tests).

> **Architecture deep-dive:** See [ARCHITECTURE.md](ARCHITECTURE.md) for system design, data flow, and key design decisions.

---

## ✨ Features

### 🎥 Movie & TV Discovery
- Browse **trending**, **popular**, **upcoming**, **now-playing**, and **top-rated** movies
- TV show support: **popular**, **top-rated**, and **currently on-air**
- **Search** movies by title, genre, or person
- **Detailed pages** with cast, crew, trailers, release dates, and ratings
- **Person/actor pages** with filmography

### 🤖 Personalized Recommendations
- **Content-based filtering** using TF-IDF vectorization + cosine similarity
- Recommendations adapt to your ratings in real time
- **Caching** with 3 layers (user recs, TF-IDF matrix, list endpoints)
- **Auto-invalidation** when you rate a movie — new recs pushed via WebSocket

### 👤 User Features
- **JWT authentication** with httpOnly cookies (access 5min + refresh 30 day)
- **Rate movies** on a 1–10 scale
- **Favorites & Watchlists** — curate your personal collections
- **Profile management** with avatar, bio, preferences
- **Real-time notifications** via Django Channels

### 🔧 Developer Experience
- **334 automated tests** (231 frontend + 103 backend)
- **Swagger** (`/api/docs/`) and **ReDoc** (`/api/redoc/`) API documentation
- **GitHub Actions CI** with parallel backend + frontend test pipelines
- **Structured JSON logging** for observability
- **Health check endpoint** (`GET /api/health/`)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, React Router 6, Bootstrap 4, Material UI |
| **Backend** | Django 5.2, DRF 3.17, Django Channels 4.3 |
| **Auth** | JWT (simplejwt) with httpOnly cookies |
| **Database** | SQLite (dev) / PostgreSQL (production) |
| **Cache** | LocMemCache (dev) / Redis (production) |
| **Real-time** | WebSockets via Django Channels + Redis |
| **ML** | scikit-learn (TF-IDF + cosine similarity) |
| **CI** | GitHub Actions (pip + npm caching) |
| **Docs** | drf-spectacular (Swagger + ReDoc) |

---

## 🚀 Local Development Setup

### Prerequisites
- **Python 3.11+**
- **Node.js 18+** (with npm)
- **Git**

---

### 1️⃣ Clone the repository

```powershell
git clone https://github.com/venu0807/Recommendation_System.git
cd Recommendation_System
```

---

### 2️⃣ Backend Setup

**Create and activate a virtual environment:**

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

> If you get a PowerShell execution policy error, run `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` first.

**Install Python dependencies:**

```powershell
pip install -r requirements.txt
```

**Configure environment variables:**

```powershell
copy .env.example .env
```

Then edit `.env` and add your **TMDB API key** (get one free at [themoviedb.org](https://www.themoviedb.org/settings/api)):

```ini
TMDB_API_KEY=your_api_key_here
```

**Run database migrations:**

```powershell
cd Movies
python manage.py migrate
```

**(Optional) Load sample data:**

```powershell
python manage.py seed_sample_data
```

**Start the backend server:**

```powershell
python manage.py runserver
```

The API will be available at **http://localhost:8000**.

---

### 3️⃣ Frontend Setup

Open a **second terminal** (keep the backend running):

```powershell
cd films
npm install
npm start
```

The app will open at **http://localhost:3000**.

---

### 4️⃣ Verify everything works

| URL | What you'll see |
|-----|----------------|
| **http://localhost:3000** | Movie Recommender frontend |
| **http://localhost:8000** | Django API root |
| **http://localhost:8000/api/health/** | Health check (`{"status":"ok"}`) |
| **http://localhost:8000/api/docs/** | Swagger UI documentation |
| **http://localhost:8000/api/redoc/** | ReDoc documentation |
| **http://localhost:8000/admin/** | Django admin (after creating a superuser) |

---

## 🧪 Testing

All **334 tests** should pass before committing changes.

### Backend (103 tests)

```powershell
cd Movies
python manage.py test --verbosity=2
```

### Frontend (231 tests)

```powershell
cd films
npm test
```

Or run specific test files:

```powershell
npx react-scripts test --watchAll=false --testPathPattern="Profile|Context|Register"
```

### Test summary

```
Test Suites: 33 passed, 33 total
Tests:       231 passed, 231 total    ← Frontend
----------------------------------------------------------------------
Ran 103 tests in 43.597s
OK                                        ← Backend
```

---

## 🔐 Environment Variables

Copy `.env.example` to `.env` and configure:

| Variable | Default | Required | Description |
|----------|---------|----------|-------------|
| `SECRET_KEY` | `default-insecure-key` | ✅ (prod) | Django secret key (generate a strong one for production) |
| `DEBUG` | `True` | — | Set to `False` in production |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | ✅ (prod) | Comma-separated hosts |
| `TMDB_API_KEY` | — | ✅ | Get from [themoviedb.org](https://www.themoviedb.org/settings/api) |
| `TMDB_API_URL` | `https://api.themoviedb.org/3` | — | TMDB API base URL |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:3000` | ✅ (prod) | Comma-separated frontend origins |
| `REDIS_URL` | — | ⚠️ (WebSockets) | Redis connection string for production |
| `JWT_REFRESH_DAYS` | `30` | — | JWT refresh token lifetime |
| `SENTRY_DSN` | — | — | Sentry DSN for crash reporting (optional) |
| `COOKIE_SECURE` | `False` | ✅ (prod) | Set to `True` for HTTPS |

---

## 📚 API Quick Reference

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `POST` | `/register/` | ❌ | Register a new user |
| `POST` | `/token/` | ❌ | Login (returns JWT) |
| `POST` | `/token/refresh/` | ❌ | Refresh JWT token |
| `GET` | `/movie/trending_today/` | ❌ | Trending movies |
| `GET` | `/movie/popular/` | ❌ | Popular movies (paginated) |
| `GET` | `/movie/upcoming/` | ❌ | Upcoming movies (paginated) |
| `GET` | `/movie/now_playing/` | ❌ | Now playing movies (paginated) |
| `GET` | `/movie/top_rated/` | ❌ | Top rated movies (paginated) |
| `GET` | `/movie/{id}/` | ❌ | Movie detail |
| `GET` | `/movie/{id}/recommendations/` | ❌ | Similar movies |
| `GET` | `/movie/user_recommendations/` | ✅ | Personalized recommendations |
| `POST` | `/movie/rate/` | ✅ | Rate a movie |
| `GET` | `/tv/popular/` | ❌ | Popular TV shows |
| `GET` | `/tv/top_rated/` | ❌ | Top rated TV shows |
| `GET` | `/tv/on_air/` | ❌ | TV shows currently on air |
| `GET` | `/person/search/` | ❌ | Search people/actors |
| `GET` | `/person/{id}/` | ❌ | Person detail + filmography |
| `GET` | `/favorites/my_favorites/` | ✅ | Get user's favorites |
| `GET` | `/watchlist/my_watchlist/` | ✅ | Get user's watchlist |
| `GET` | `/api/health/` | ❌ | System health check |

> Full interactive docs at **http://localhost:8000/api/docs/** (Swagger).

---

## 📁 Project Structure

```
Recommendation_System/
├── .github/workflows/ci.yml    # GitHub Actions CI pipeline
├── .env.example                 # Environment variable template
│
├── Movies/                      # 🐍 Django backend
│   ├── manage.py                # Django management entry point
│   ├── Movies/                  # Django project config
│   │   ├── settings.py          # Settings (DB, cache, auth, CORS, logging)
│   │   ├── urls.py              # Root URL config
│   │   ├── asgi.py              # ASGI config (WebSockets)
│   │   └── wsgi.py              # WSGI config
│   ├── Users/                   # Main application
│   │   ├── models.py            # 20+ models (Movie, TVShow, Person, etc.)
│   │   ├── views.py             # ViewSets + API views
│   │   ├── serializers.py       # DRF serializers
│   │   ├── services.py          # Business logic (search)
│   │   ├── admin.py             # Django admin config
│   │   ├── authentication.py    # Custom JWT cookie auth
│   │   ├── consumers.py         # WebSocket consumers
│   │   ├── utils.py             # Utility functions
│   │   ├── tests.py             # 103 backend tests
│   │   ├── urls.py              # App URL config
│   │   ├── migrations/          # Database migrations (10 files)
│   │   └── recommender/
│   │       └── recommendations.py  # ML engine with caching│
├── films/                       # ⚛️ React frontend
│   ├── package.json             # Dependencies & scripts
│   ├── jsconfig.json            # Type checking config
│   ├── public/                  # Static assets (index.html, favicon)
│   └── src/
│       ├── index.js             # React entry point
│       ├── App.js               # Root component + routing
│       ├── config.js            # API URL config
│       ├── hooks/               # Custom React hooks
│       │   ├── useAuth.js       # Auth state + profile management
│       │   ├── useMovies.js     # Movie/TV data fetching + recommendations
│       │   └── useProfile.js    # Favorites, watchlist, WebSocket
│       ├── components/
│       │   ├── Context.js       # Global state provider
│       │   ├── Login.js         # Login form
│       │   ├── Register.js      # Registration form
│       │   ├── Search.js        # Search bar + results
│       │   ├── Movies/          # Movie/TV pages & components
│       │   ├── Profile/         # Profile, EditProfile, Favorites, Watchlist
│       │   ├── Menu.js          # Navigation menu
│       │   ├── Footer.js        # Footer
│       │   ├── ErrorBoundary.js # Global error boundary
│       │   └── ...              # Skeleton, Spinner, Notifications, etc.
│       ├── styles/              # CSS files
│       └── index.css            # Global styles
│
├── requirements.txt             # Python dependencies
└── README.md                    # This file
```

---

## 🤖 Recommendation Engine

The engine in `Movies/Users/recommender/recommendations.py` uses **content-based filtering**:

### How it works
1. **With ratings:** Finds your highest-rated movie → matches by genre + language → scores by genre overlap → returns top N
2. **Without ratings:** Falls back to trending/popular movies
3. **Movie similarity:** TF-IDF vectorization on (title + overview + genres) → cosine similarity

### Caching (3 layers)

| Cache | Key Pattern | TTL | Invalidated |
|-------|-------------|-----|-------------|
| User recs | `user_recs_{username}_{num}` | 15 min | On rating a movie |
| TF-IDF matrix | `tfidf_matrix_data` | 30 min | Manual |
| List endpoints | `trending_movies_20`, etc. | 10 min | Manual |

### Real-time updates
When you rate a movie, the backend:
1. Clears your cached recommendations
2. Recomputes them with your new rating
3. Pushes the updated list to your browser via **WebSocket**

---

## 🔄 CI/CD

The project uses **GitHub Actions** (`.github/workflows/ci.yml`):

- **Trigger:** On push to `main`/`master` and PRs targeting them
- **Two parallel jobs:**

| Job | Environment | Steps |
|-----|-------------|-------|
| `backend` | Python 3.11 | pip install → migrate → run 103 tests |
| `frontend` | Node.js 22 | npm install → run 231 tests → build |

Both jobs include **dependency caching** for fast pipeline runs.

---

## 🌐 Deployment

### Backend (Render / Railway / Fly.io)
```powershell
# Build command
pip install -r requirements.txt
python manage.py migrate
python manage.py collectstatic --noinput

# Start command
gunicorn Movies.wsgi:application --bind 0.0.0.0:$PORT
```

### Frontend (Vercel / Netlify)
```powershell
cd films
npm install
npm run build
# Deploy the films/build/ directory
```

---

## 📄 License

MIT License

---

