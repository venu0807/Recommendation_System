# 🎬 Movie Recommendation Platform (TMDB-like, End-to-End)

A full-stack movie recommendation platform inspired by TMDB, built with **React.js** (frontend) and **Django REST Framework** (backend). Features real-time personalized recommendations, JWT authentication, comprehensive automated testing, and a recommendation engine with caching.

> **Architecture Document:** For a deep dive into the system design and data flow, see [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 🌟 Features

- **User Authentication:** Secure registration, login, logout via JWT (httpOnly cookies).
- **Movie Discovery:** Browse trending, popular, upcoming, now-playing, and top-rated movies. Search by title, genre, or person.
- **Movie Details:** Deep-dive into movie overviews, cast & crew, release dates, and trailers.
- **Social Features:** Rate movies (1-10) and manage personal favorites/watchlists.
- **Personalized Recommendations:** Content-based + hybrid ML recommendations with **caching** (15min TTL for user recs, 30min for TF-IDF, 10min for list endpoints). Cache auto-invalidates when you rate a movie.
- **TV Shows:** Browse popular, top-rated, and on-air TV shows with ratings and watchlists.
- **Real-Time Updates:** Django Channels pushes updated recommendations after rating via WebSocket.

---

## 🛠️ Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm

### Backend

```sh
# Clone and enter the project
cd Recommendation_System

# Create virtual environment and install deps
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt

# Copy environment config
copy .env.example .env
# Edit .env and add your TMDB_API_KEY

# Run migrations
.venv\Scripts\python Movies\manage.py migrate

# Start the server
.venv\Scripts\python Movies\manage.py runserver
```

### Frontend

```sh
# In a separate terminal
cd films
npm install
npm start
```

### Access the app
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8000
- **Swagger docs:** http://localhost:8000/api/docs/
- **ReDoc:** http://localhost:8000/api/redoc/

---

## 🧪 Testing

### Backend (103 tests)
```sh
.venv\Scripts\python Movies\manage.py test --verbosity=2
```

### Frontend (231 tests)
```sh
cd films
npm test
```

---

## 🧠 Recommendation Engine

The engine uses **content-based filtering** with TF-IDF vectorization and cosine similarity:

- **User Recommendations:** Matches movies by genre + language to your highest-rated movies.
- **Movie Recommendations:** Finds similar movies via TF-IDF on title, overview, and genres.
- **Caching:** 3-layer cache (user recs, TF-IDF matrix, list endpoints) with configurable TTLs.
- **Cache Invalidation:** Your personal recommendations refresh immediately when you rate a movie.

---

## 📚 API Quick Reference

| Endpoint | Description |
|----------|-------------|
| `POST /register/` | Register a new user |
| `POST /token/` | Login (JWT) |
| `GET /movie/trending_today/` | Trending movies |
| `GET /movie/popular/` | Popular movies |
| `GET /movie/upcoming/` | Upcoming movies |
| `GET /movie/{id}/recommendations/` | Similar movies |
| `GET /movie/user_recommendations/` | Personalized recs |
| `POST /movie/rate/` | Rate a movie |
| `GET /api/health/` | System health check |
| `GET /api/docs/` | Swagger documentation |

---

## 🦅 Observability

- **Health Checks:** `GET /api/health/` verifies DB connectivity.
- **Structured Logging:** JSON-formatted logs for ELK/Datadog ingestion.
- **Crash Reporting:** Optional Sentry integration via `SENTRY_DSN` env var.

---

## 📂 Project Structure

```
Recommendation_System/
├── Movies/              # Django backend
│   ├── Movies/          # Project settings
│   └── Users/           # Main app (models, views, serializers, recommender)
│       └── recommender/ # Recommendation engine with caching
├── films/               # React frontend
│   └── src/             # Components, context, styles
├── .env.example         # Environment template
└── requirements.txt     # Python dependencies
```

---

## 📄 License
MIT License
