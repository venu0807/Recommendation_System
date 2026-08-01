# Recommendation System Django Backend — Dockerfile
# Multi-stage build for production

# ── Build Stage ──────────────────────────────────────────────────────────────
FROM python:3.13-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Create virtual environment
RUN python -m venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt


# ── Runtime Stage ────────────────────────────────────────────────────────────
FROM python:3.13-slim AS runtime

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpq5 \
    gettext \
    && rm -rf /var/lib/apt/lists/*

# Copy virtual environment from builder
COPY --from=builder /opt/venv /opt/venv
ENV PATH="/opt/venv/bin:$PATH"

# Create non-root user
RUN groupadd -r django && useradd -r -g django django
WORKDIR /app

# Copy application code
COPY --chown=django:django Movies/ ./Movies/
# manage.py lives inside Movies/ (project package dir)
COPY --chown=django:django Movies/manage.py ./Movies/manage.py

# Static files directory
RUN mkdir -p /app/staticfiles /app/mediafiles && chown -R django:django /app

# Switch to non-root user
USER django

# Expose port
EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/api/health/', timeout=3)" || exit 1

# Run with gunicorn
CMD ["gunicorn", "Movies.wsgi:application", \
     "-w", "4", \
     "-k", "gthread", \
     "--threads", "2", \
     "--bind", "0.0.0.0:8000", \
     "--timeout", "60", \
     "--access-logfile", "-", \
     "--error-logfile", "-", \
     "--log-level", "info"]