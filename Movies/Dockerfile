# Backend Dockerfile
FROM python:3.11-slim
WORKDIR /app

# Install system dependencies (often needed for mysqlclient)
RUN apt-get update \
    && apt-get install -y default-libmysqlclient-dev build-essential pkg-config \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY Movies/ .

# Collect static files for production
RUN python manage.py collectstatic --noinput

# Add non-root user for security
RUN useradd -m appuser && chown -R appuser:appuser /app
USER appuser

EXPOSE 8000
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "Movies.asgi:application"]
