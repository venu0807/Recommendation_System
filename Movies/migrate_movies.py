import os
import MySQLdb
import psycopg2
from datetime import datetime

# Use env vars for all credentials — never hardcode database URLs.
MYSQL_DB = os.environ.get("MYSQL_DB", "movies")
MYSQL_USER = os.environ.get("MYSQL_USER", "root")
MYSQL_PASS = os.environ.get("MYSQL_PASS", "rootpassword")
MYSQL_HOST = os.environ.get("MYSQL_HOST", "db")

# Remote Neon PostgreSQL Database
NEON_URL = os.environ.get("NEON_DATABASE_URL")

def migrate():
    print("Connecting to local MySQL...")
    try:
        mysql_conn = MySQLdb.connect(host=MYSQL_HOST, user=MYSQL_USER, passwd=MYSQL_PASS, db=MYSQL_DB)
        mysql_cur = mysql_conn.cursor()
    except Exception as e:
        print(f"Failed to connect to MySQL: {e}")
        return

    if not NEON_URL:
        print("NEON_DATABASE_URL not set — skipping Neon migration.")
        return

    print("Connecting to remote Neon DB...")
    try:
        pg_conn = psycopg2.connect(NEON_URL)
        pg_cur = pg_conn.cursor()
    except Exception as e:
        print(f"Failed to connect to Neon DB: {e}")
        return

    # 1. Fetch all movies
    print("Fetching movies from MySQL...")
    mysql_cur.execute("SELECT id, tmdb_id, title, original_title, overview, release_date, poster_path, is_active, user_ratings_count FROM Users_moviemodel")
    movies = mysql_cur.fetchall()
    
    print(f"Found {len(movies)} movies to migrate.")
    
    # 2. Insert into Neon
    inserted_count = 0
    for movie in movies:
        m_id, tmdb_id, title, original_title, overview, release_date, poster_path, is_active, user_ratings_count = movie
        
        # Check if already exists to avoid dupes
        pg_cur.execute("SELECT id FROM \"Users_moviemodel\" WHERE tmdb_id = %s", (tmdb_id,))
        if not pg_cur.fetchone():
            try:
                pg_cur.execute(
                    "INSERT INTO \"Users_moviemodel\" (tmdb_id, title, original_title, overview, release_date, poster_path, is_active, user_ratings_count) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s)",
                    (tmdb_id, title, original_title, overview, release_date, poster_path, is_active, user_ratings_count)
                )
                inserted_count += 1
            except Exception as e:
                print(f"Error inserting {title}: {e}")
                pg_conn.rollback()
                continue
    
    pg_conn.commit()
    print(f"Successfully inserted {inserted_count} movies into Neon!")
    
    mysql_cur.close()
    mysql_conn.close()
    pg_cur.close()
    pg_conn.close()

if __name__ == "__main__":
    migrate()
