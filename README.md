
# 🎬 Movie Recommendation Platform (TMDB-like, End-to-End)

**Live Demo:** [https://venu0807.github.io/Recommendation_System/](https://venu0807.github.io/Recommendation_System/)

This is a professional, full-stack movie recommendation platform inspired by TMDB, built with React.js (frontend), Django REST Framework (backend), and MySQL. It features real-time, personalized recommendations, robust authentication, and a modern, responsive UI.

---



## 🌟 End-to-End Features — Inspired by TMDB

Below is a breakdown of core features found on the TMDB website, mapped to your project. These features are either implemented or recommended for a complete, professional movie platform:

### 1. User Authentication & Profiles
- Secure registration, login, logout (JWT)
- Password reset & email verification
- User profile page (avatar, bio, preferences)
- Account settings (change password, email, etc.)

### 2. Movie Discovery & Browsing
- Home page with featured/trending movies
- Search movies by title, genre, year, etc.
- Filter and sort movies (popularity, rating, release date)
- Browse by categories: Trending, Popular, Upcoming, Now Playing, Top Rated

### 3. Movie Details
- Movie detail page: poster, title, overview, genres, release date, runtime
- Cast & crew listing (with actor/crew profiles)
- Trailers & videos
- Similar/recommended movies
- User reviews & ratings

### 4. User Interaction & Social Features
- Rate movies (1-10 scale)
- Write and read reviews/comments
- Add movies to favorites, watchlist, and custom lists
- Follow other users (optional)
- Activity feed (optional)

### 5. Personalized Recommendations
- Hybrid ML recommendations (collaborative, content-based, popularity)
- Personalized dashboard: recommended, recently watched, rated, favorites

### 6. Lists & Collections
- Create, edit, and share custom lists (e.g., "Best of 2025")
- View public lists from other users

### 7. Admin & Content Management
- Admin dashboard: manage movies, users, reviews, lists
- Add/edit/delete movie data (CRUD)

### 8. API & Integrations
- RESTful API (Django REST Framework)
- API documentation (Swagger/OpenAPI)
- WebSocket support for real-time updates (optional)

### 9. UI/UX & Deployment
- Modern, responsive UI (React.js, CSS Modules, mobile-first)
- Dark/light mode (optional)
- Dockerized deployment (frontend, backend, database)
- Production-ready: HTTPS, CORS, static/media, environment configs

---

> **To fully match TMDB, consider implementing any missing features above. This README and your codebase now reflect a true end-to-end, professional movie platform.**

---

## 🚀 Quick Start (with Docker Compose)

1. **Clone the repository:**
   ```sh
   git clone https://github.com/yourusername/Recommendation_System.git
   cd Recommendation_System
   ```
2. **Copy and edit environment variables:**
   ```sh
   cp .env.example .env
   # Edit .env as needed
   ```
3. **Build and run the full stack:**
   ```sh
   docker-compose up --build
   ```
4. **Access the app:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8000
   - Swagger docs: http://localhost:8000/swagger/

---

## 🛠️ Manual Setup

### Backend (Django + MySQL)
```sh
python -m venv venv
venv\Scripts\activate  # Windows
pip install -r requirements.txt
# Configure MySQL in Movies/settings.py
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

### Frontend (React)
```sh
cd films
npm install
npm start
```

---

## 📚 API Endpoints (Sample)

### Auth
- `POST /register/` — Register
- `POST /token/` — Login (JWT)
- `POST /token/refresh/` — Refresh JWT

### Movies
- `GET /movie/popular/` — Popular
- `GET /movie/trending_today/` — Trending
- `GET /movie/user_recommendations/` — Personalized
- `POST /movie/rate/` — Rate a movie

### User
- `GET /watchlist/my_watchlist/` — Watchlist
- `GET /favorites/my_favorites/` — Favorites

See Swagger docs for full API.

---

## 🧠 Recommendation System

Hybrid approach:
- Collaborative filtering
- Content-based filtering
- Popularity-based
- User preference analysis

---

## 🏗️ Architecture

- **Frontend:** React.js, Context API, React Router, CSS Modules
- **Backend:** Django REST Framework, MySQL, JWT, Channels (optional)
- **Deployment:** Docker, docker-compose

---

## 📝 Contributing
1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## 📄 License
MIT License — see LICENSE


## Full Feature List

- User Authentication (JWT, registration, login, logout, password reset)
- Personalized Movie Recommendations
- Movie Search and Filtering
- Movie Rating System
- Watchlist Management
- Favorites Management
- Trending, Popular, Upcoming, Now Playing, Top Rated Movies
- Movie Details: Cast, Crew, Genres, Overview, Trailers, Similar Movies
- User Dashboard: Profile, Preferences, Activity History
- Custom Lists (create, edit, share)
- User Reviews and Comments
- Admin Dashboard (manage movies, users, reviews)
- Responsive UI (desktop, tablet, mobile)


## Tech Stack

### Frontend
- React.js (with Context API, React Router, CSS Modules)
- Responsive design (mobile-first)
- Fetch/Axios for API Calls

### Backend
- Django Rest Framework (DRF)
- MySQL Database
- JWT Authentication
- Django Channels (WebSockets, optional)
- Python Libraries: scikit-learn, pandas, numpy, surprise

### DevOps
- Docker, docker-compose
- Nginx (production)
- Swagger/OpenAPI for API docs


## Setup Instructions (Manual)

### Backend Setup

1. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows
```

2. Install Python dependencies:
```bash
pip install -r requirements.txt
```

3. Start Django project:
```bash
django-admin startproject Movies
```
4. Navigate to the directory:
```bash
cd Movies
```

5. Start App:
```bash
python manage.py startapp Users
```


6. Configure MySQL database settings in settings.py

7. Run migrations:
```bash
python manage.py makemigrations
python manage.py migrate
```

8. Start the Django server:
```bash
python manage.py runserver
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd Movies/films
```

2. Install Node dependencies:
```bash
npm install
```

3. Start the React development server:
```bash
npm start
```

## API Endpoints

### Authentication
- `POST /register/` - Register new user
- `POST /token/` - Obtain JWT token
- `POST /token/refresh/` - Refresh JWT token

### Movies
- `GET /movie/popular/` - Get popular movies
- `GET /movie/upcoming/` - Get upcoming movies
- `GET /movie/now_playing/` - Get now playing movies
- `GET /movie/trending_today/` - Get trending movies
- `GET /movie/top_rated/` - Get top rated movies
- `GET /movie/user_recommendations/` - Get personalized recommendations
- `POST /movie/rate/` - Rate a movie

### User Features
- `GET /watchlist/my_watchlist/` - Get user's watchlist
- `POST /watchlist/add/` - Add movie to watchlist
- `DELETE /watchlist/{id}/remove/` - Remove movie from watchlist
- `GET /favorites/my_favorites/` - Get user's favorites
- `POST /favorites/add/` - Add movie to favorites
- `DELETE /favorites/{id}/remove/` - Remove movie from favorites

## Recommendation System

The system uses a hybrid recommendation approach combining:
- Collaborative Filtering
- Content-Based Filtering
- Popularity-Based Recommendations
- User Preference Analysis

## Contributing

1. Fork the repository
2. Create a new branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.



