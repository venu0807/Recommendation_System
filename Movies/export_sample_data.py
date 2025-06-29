import mysql.connector
import pandas as pd
import os

# --- MySQL Database Configuration (Your current local MySQL settings) ---
# Make sure these match the 'DATABASES' settings you had for MySQL before switching to SQLite/PostgreSQL logic.
DB_CONFIG = {
    'host': 'localhost',  # Or your MySQL host
    'user': 'moviesuser', # Your MySQL username
    'password': '0807',   # Your MySQL password
    'database': 'movies'  # Your MySQL database name
}

# --- IMPORTANT: Replace 'your_app_name_movie' with your actual table name ---
# To find your table name:
# 1. Look in your Django app's models.py (e.g., Users/models.py).
# 2. Your Movie model will typically map to a table named 'your_app_name_movie' (lowercase, with underscore).
#    For example, if your app is 'Users' and your model is 'Movie', the table name is likely 'users_movie'.
# 3. If you're unsure, connect to your MySQL database with a tool like MySQL Workbench or the command line
#    and run `SHOW TABLES;` to see the exact table names.
MOVIE_TABLE_NAME = 'users_moviemodel' # <--- REPLACE THIS with your actual Movie table name

# --- Number of movies to export ---
NUM_MOVIES_TO_EXPORT = 1000 # You can adjust this (e.g., 500, 2000)

OUTPUT_CSV_FILE = 'sample_movies.csv' # This is the file you will commit to Git

def export_sample_movies():
    conn = None
    try:
        # Establish connection to MySQL
        conn = mysql.connector.connect(**DB_CONFIG)
        if conn.is_connected():
            print(f"Successfully connected to MySQL database: {DB_CONFIG['database']}")

            # Fetch a limited number of movies
            # ORDER BY RAND() is good for randomness but can be slow on very large tables.
            # For 90k rows, it's probably okay for a one-off export.
            # If it's too slow, remove ORDER BY RAND() to just get the first N records.
            query = f"SELECT * FROM {MOVIE_TABLE_NAME} ORDER BY RAND() LIMIT {NUM_MOVIES_TO_EXPORT};"
            df = pd.read_sql(query, conn)

            # Save to CSV
            df.to_csv(OUTPUT_CSV_FILE, index=False, encoding='utf-8')
            print(f"Successfully exported {len(df)} movies to {OUTPUT_CSV_FILE}")

    except mysql.connector.Error as e:
        print(f"Error connecting to or querying MySQL: {e}")
    finally:
        if conn and conn.is_connected():
            conn.close()
            print("MySQL connection closed.")

if __name__ == '__main__':
    export_sample_movies()