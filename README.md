# Movie Recommendation System

A sophisticated movie recommendation system built with React, Django Rest Framework (DRF), MySQL, and Python. The system provides personalized movie recommendations using hybrid filtering techniques.

## Features

- User Authentication with JWT
- Personalized Movie Recommendations
- Movie Search and Filtering
- Movie Rating System
- Watchlist Management
- Favorites Management
- Trending Movies
- Popular Movies
- Upcoming Movies
- Now Playing Movies
- Top Rated Movies
- Cast and Crew Information
- User Preferences Management

## Tech Stack

### Frontend
- React.js
- Context API for State Management
- React Router for Navigation
- CSS Modules for Styling
- Fetch for API Calls

### Backend
- Django Rest Framework (DRF)
- MySQL Database
- JWT Authentication
- Python Libraries:
  - scikit-learn
  - pandas
  - numpy
  - surprise

## Setup Instructions

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
