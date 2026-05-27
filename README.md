# 🎬 Movie Recommendation Platform (TMDB-like, End-to-End)

**Live Demo:** [https://venu0807.github.io/Recommendation_System/](https://venu0807.github.io/Recommendation_System/)

This is a professional, full-stack movie recommendation platform inspired by TMDB, built with React.js (frontend), Django REST Framework (backend), and MySQL. It features real-time personalized recommendations, robust authentication, comprehensive automated testing, and a production-grade Docker deployment architecture.

> **Read the Architecture Document:** For a deep dive into the system design, data flow, and SRE observability setup, please read [ARCHITECTURE.md](./ARCHITECTURE.md).

---

## 🌟 End-to-End Features

- **User Authentication:** Secure registration, login, logout via JWT.
- **Movie Discovery:** Browse trending, popular, upcoming, and top-rated movies. Search by title, genre, or year.
- **Movie Details:** Deep-dive into movie overviews, cast & crew, release dates, and trailers.
- **Social Features:** Rate movies (1-10) and manage personal favorites/watchlists.
- **Personalized Recommendations:** Hybrid ML recommendations (collaborative filtering, content-based, popularity).

---

## 🚀 Deployment (Production)

We use a fully orchestrated, multi-stage Docker environment for production deployment.

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/Recommendation_System.git
   cd Recommendation_System
   ```
2. **Setup environment variables:**
   ```sh
   cp .env.example .env
   ```
   *Edit `.env` to add your `TMDB_API_KEY`, `SENTRY_DSN` (for crash reporting), and secure database credentials.*
3. **Deploy the stack:**
   ```sh
   docker-compose -f docker-compose.prod.yml up --build -d
   ```
   This will spin up:
   - **Frontend:** A compiled React SPA served lightning-fast via Nginx.
   - **Backend:** A Django ASGI server running on Daphne.
   - **Database:** A MySQL 8.0 instance.
   - **Cache:** A Redis 7 cluster handling WebSockets and healthchecks.

---

## 🛠️ Local Development Setup

If you want to work on the code locally, use the development Compose file.

1. **Start the development stack:**
   ```sh
   docker-compose up --build
   ```
   *Note: This runs the React development server (`npm start`) with hot-reloading.*

2. **Access the app:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Swagger docs: http://localhost:8000/swagger/

---

## 🧪 Testing

The frontend utilizes Jest and React Testing Library for regression testing.

To run the test suite locally:
```sh
cd films
npm test
```
The test suite covers:
- Initial boot fetching logic (`Promise.allSettled`).
- Authentication workflows and JWT parsing.
- Unauthorized request interception and redirects.

---

## 🦅 Observability & Monitoring (SRE)

The application is built with Site Reliability Engineering best practices in mind:
- **Deep Health Checks:** Hit `/api/health/` to receive a real-time status report on both the Database and Redis layers.
- **Auto-Healing:** The production docker-compose file includes Docker healthchecks. If a container deadlocks, Docker will automatically restart it.
- **Crash Reporting:** If you provide a `SENTRY_DSN` in your `.env` file, the backend will automatically intercept unhandled exceptions and send them to Sentry along with structured JSON logs.

---

## 📚 API Endpoints

The full API documentation is available via Swagger at `http://localhost:8000/swagger/` when the backend is running. 

**Quick Reference:**
- `POST /register/` — Register
- `POST /token/` — Login (JWT)
- `GET /api/health/` — System Health Check
- `GET /movie/trending_today/` — Trending Movies

---

## 📝 Contributing
1. Fork the repository
2. Create a new branch
3. Make your changes and ensure `npm test` passes
4. Submit a pull request

## 📄 License
MIT License — see LICENSE
