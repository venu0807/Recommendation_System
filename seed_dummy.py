import psycopg2

DB_URL = "postgresql://neondb_owner:npg_m95UHRDQrluh@ep-twilight-flower-aqd4qwps.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require"

movies = [
    {
        "id": 155,
        "title": "The Dark Knight",
        "original_title": "The Dark Knight",
        "overview": "Batman raises the stakes in his war on crime. With the help of Lt. Jim Gordon and District Attorney Harvey Dent, Batman sets out to dismantle the remaining criminal organizations that plague the streets.",
        "release_date": "2008-07-16",
        "poster_path": "https://image.tmdb.org/t/p/w500/qJ2tW6WMUDux911r6m7haRef0WH.jpg"
    },
    {
        "id": 27205,
        "title": "Inception",
        "original_title": "Inception",
        "overview": "Cobb, a skilled thief who commits corporate espionage by infiltrating the subconscious of his targets is offered a chance to regain his old life as payment for a task considered to be impossible: \"inception\", the implantation of another person's idea into a target's subconscious.",
        "release_date": "2010-07-15",
        "poster_path": "https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg"
    },
    {
        "id": 157336,
        "title": "Interstellar",
        "original_title": "Interstellar",
        "overview": "The adventures of a group of explorers who make use of a newly discovered wormhole to surpass the limitations on human space travel and conquer the vast distances involved in an interstellar voyage.",
        "release_date": "2014-11-05",
        "poster_path": "https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg"
    }
]

def seed():
    conn = psycopg2.connect(DB_URL)
    cur = conn.cursor()
    
    for item in movies:
        movie_id = item['id']
        title = item['title']
        
        print(f"Inserting {title}...")
        try:
            # Check if movie exists
            cur.execute("SELECT id FROM \"Users_moviemodel\" WHERE tmdb_id = %s", (movie_id,))
            if not cur.fetchone():
                cur.execute(
                    "INSERT INTO \"Users_moviemodel\" (tmdb_id, title, original_title, overview, release_date, poster_path, is_active, user_ratings_count) "
                    "VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id",
                    (movie_id, item['title'], item['original_title'], item['overview'], item['release_date'], item['poster_path'], True, 0)
                )
                conn.commit()
        except Exception as e:
            print(f"Failed to insert {title}: {e}")
            conn.rollback()

    cur.close()
    conn.close()
    print("Dummy seeding complete.")

if __name__ == "__main__":
    seed()
