from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

def recommend_movies(user_preferences, movie_data):
    # Assuming user_preferences is a vector of features
    similarity_matrix = cosine_similarity(movie_data)
    recommendations = np.argsort(similarity_matrix[user_preferences])[-10:]  # Top 10 recommendations
    return recommendations





















# import pandas as pd
# from sklearn.feature_extraction.text import TfidfVectorizer
# from sklearn.metrics.pairwise import cosine_similarity
# import faiss
# import requests
# from django.conf import settings
# from surprise import SVD, Dataset, Reader
# from surprise.model_selection import train_test_split
# from surprise.accuracy import rmse

# # Fetch movie data from the API
# def fetch_movies():
#     api_key = settings.TMDB_API_KEY
#     base_url = settings.TMDB_API_URL
#     response = requests.get(f"{base_url}/movie/popular?api_key={api_key}&language=en-US&page=1")
    
#     if response.status_code == 200:
#         return response.json()['results']  # Adjust based on the actual structure of the response
#     else:
#         print(f"Error fetching data: {response.status_code}")
#         return []

# # Load movies into a DataFrame
# movies_data = fetch_movies()
# movies = pd.DataFrame(movies_data)

# # Check if the DataFrame is empty
# if movies.empty:
#     print("No movies found.")
# else:
#     # Combine relevant features into a single string
#     def combine_features(row):
#         return f"{row.get('genres', '')} {row.get('keywords', '')} {row.get('cast', '')} {row.get('crew', '')}"

#     movies['combined_features'] = movies.apply(combine_features, axis=1)

#     # Check for empty combined features
#     print(movies['combined_features'].isnull().sum())  # Check for null values
#     print(movies['combined_features'].str.strip().eq('').sum())  # Check for empty strings

#     # Filter out empty combined features
#     movies = movies[movies['combined_features'].str.strip() != '']

#     # Vectorize the combined features
#     tfidf = TfidfVectorizer(stop_words='english')
#     tfidf_matrix = tfidf.fit_transform(movies['combined_features'])

#     # Compute cosine similarity
#     similarity_matrix = cosine_similarity(tfidf_matrix, tfidf_matrix)

#     # Function to get similar movies
#     def get_similar_movies(movie_title, top_n=10):
#         if movie_title not in movies['title'].values:
#             return f"Movie '{movie_title}' not found in the dataset."
        
#         movie_idx = movies[movies['title'] == movie_title].index[0]
#         similarity_scores = list(enumerate(similarity_matrix[movie_idx]))
#         sorted_movies = sorted(similarity_scores, key=lambda x: x[1], reverse=True)
#         recommended_movies = [movies.iloc[i[0]]['title'] for i in sorted_movies[1:top_n+1]]
#         return recommended_movies

#     # Example usage
#     print(get_similar_movies('Inception'))

#     # Build the FAISS index
#     index = faiss.IndexFlatL2(tfidf_matrix.shape[1])
#     index.add(tfidf_matrix.toarray())

#     # Get similar movies using FAISS
#     def get_similar_movies_faiss(movie_title, top_n=10):
#         if movie_title not in movies['title'].values:
#             return f"Movie '{movie_title}' not found in the dataset."
        
#         movie_idx = movies[movies['title'] == movie_title].index[0]
#         _, indices = index.search(tfidf_matrix[movie_idx].toarray(), top_n)
#         recommended_movies = [movies.iloc[i]['title'] for i in indices[0] if i != movie_idx]
#         return recommended_movies

#     # Load the ratings dataset
#     ratings = pd.read_csv('ratings.csv')  # Ensure this contains userId, movieId, and rating

#     # Prepare the data for Surprise
#     reader = Reader(rating_scale=(0.5, 5.0))
#     data = Dataset.load_from_df(ratings[['userId', 'movieId', 'rating']], reader)

#     # Split into train/test sets
#     trainset, testset = train_test_split(data, test_size=0.25, random_state=42)

#     # Train a collaborative filtering model
#     model = SVD()
#     model.fit(trainset)

#     # Evaluate the model
#     predictions = model.test(testset)
#     print("RMSE:", rmse(predictions))

#     # Recommend movies for a user
#     def get_recommendations_for_user(user_id, top_n=10):
#         user_rated_movies = ratings[ratings['userId'] == user_id]['movieId'].tolist()
#         all_movies = set(ratings['movieId'])
#         movies_to_predict = all_movies - set(user_rated_movies)
        
#         predictions = [(movie, model.predict(user_id, movie).est) for movie in movies_to_predict]
#         sorted_predictions = sorted(predictions, key=lambda x: x[1], reverse=True)
#         recommended_movies = [movie for movie, _ in sorted_predictions[:top_n]]
#         return recommended_movies

#     # Example usage
#     print(get_recommendations_for_user(1))

#     def hybrid_recommendation(user_id, movie_title, top_n=10, content_weight=0.6, collaborative_weight=0.4):
#         # Get recommendations
#         similar_movies = get_similar_movies(movie_title, top_n=top_n)
#         collaborative_movies = get_recommendations_for_user(user_id, top_n=top_n)
        
#         # Combine with weights
#         combined_scores = {}
#         for movie in similar_movies:
#             combined_scores[movie] = combined_scores.get(movie, 0) + content_weight
#         for movie in collaborative_movies:
#             combined_scores[movie] = combined_scores.get(movie, 0) + collaborative_weight
        
#         # Rank based on combined scores
#         ranked_movies = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)
#         return [movie for movie, _ in ranked_movies[:top_n]]

#     def display_content_based_recommendations(movie_title, top_n=10, use_faiss=False):
#         """Displays content-based recommendations."""
#         if use_faiss:
#             recommended_movies = get_similar_movies_faiss(movie_title, top_n)
#         else:
#             recommended_movies = get_similar_movies(movie_title, top_n)
        
#         print(f"Content-Based Recommendations for '{movie_title}':")
#         for idx, movie in enumerate(recommended_movies, 1):
#             print(f"{idx}. {movie}")

#     def display_collaborative_recommendations(user_id, top_n=10):
#         """Displays collaborative filtering recommendations for a user."""
#         recommended_movies = get_recommendations_for_user(user_id, top_n)
        
#         print(f"Collaborative Filtering Recommendations for User {user_id}:")
#         for idx, movie in enumerate(recommended_movies, 1):
#             print(f"{idx}. {movie}")

#     def display_hybrid_recommendations(user_id, movie_title, top_n=10, content_weight=0.6, collaborative_weight=0.4):
#         """Displays hybrid recommendations (content-based + collaborative)."""
#         recommended_movies = hybrid_recommendation(user_id, movie_title, top_n, content_weight, collaborative_weight)
        
#         print(f"Hybrid Recommendations for User {user_id} and Movie '{movie_title}':")
#         for idx, movie in enumerate(recommended_movies, 1):
#             print(f"{idx}. {movie}")

#     def display_recommendations(movie_title, user_id, top_n=10, content_weight=0.6, collaborative_weight=0.4):
#         # Display content-based recommendations (either with cosine similarity or FAISS)
#         print("\n--- Content-Based Recommendations ---")
#         display_content_based_recommendations(movie_title, top_n, use_faiss=False)
        
#         # Display collaborative filtering recommendations
#         print("\n--- Collaborative Filtering Recommendations ---")
#         display_collaborative_recommendations(user_id, top_n)
        
#         # Display hybrid recommendations
#         print("\n--- Hybrid Recommendations ---")
#         display_hybrid_recommendations(user_id, movie_title, top_n, content_weight, collaborative_weight)

#     # Display all recommendations for a user and movie
#     display_recommendations('Inception', user_id=1, top_n=5) 
#     # Your code for the movie recommendation system looks well-structured and covers both content-based and collaborative filtering approaches. However, there are a few areas where you might want to make improvements or checks to ensure everything works smoothly. Below are some suggestions and checks:
