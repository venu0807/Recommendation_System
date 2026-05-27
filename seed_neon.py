import os
import requests
import psycopg2
import json

TMDB_API_KEY = "57b5f1654695efb88db0e9b69b632b82"
DB_URL = "postgresql://neondb_owner:npg_m95UHRDQrluh@ep-twilight-flower-aqd4qwps.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"

def seed():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    print("Fetching popular movies...")
    url = f"https://api.themoviedb.org/3/movie/popular?api_key={TMDB_API_KEY}&language=en-US&page=1"
    res = requests.get(url).json()
    
    for item in res.get('results', []):
        movie_id = item['id']
        title = item['title'].replace("'", "''")
        overview = item['overview'].replace("'", "''")
        poster_path = item.get('poster_path')
        if poster_path:
            poster_path = "https://image.tmdb.org/t/p/w500" + poster_path
        
        print(f"Inserting {title}...")
        try:
            # Check if movie exists
            cur.execute("SELECT id FROM \"Users_moviemodel\" WHERE tmdb_id = %s", (movie_id,))
            if not cur.fetchone():
                cur.execute(
                    "INSERT INTO \"Users_moviemodel\" (tmdb_id, title, original_title, overview, release_date, poster_url) "
                    "VALUES (%s, %s, %s, %s, %s, %s) RETURNING id",
                    (movie_id, item['title'], item['original_title'], item['overview'], item.get('release_date', '2000-01-01'), poster_path)
                )
                conn.commit()
        except Exception as e:
            print(f"Failed to insert {title}: {e}")
            conn.rollback()

    cur.close()
    conn.close()
    print("Seeding complete.")

if __name__ == "__main__":
    seed()
