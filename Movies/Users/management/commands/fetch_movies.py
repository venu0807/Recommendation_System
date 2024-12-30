import requests
from django.core.management.base import BaseCommand
from django.conf import settings
from ...models import *
from time import sleep
from datetime import datetime

class Command(BaseCommand):
    help = 'Fetch all movies from TMDB API and save to the database'

    def fetch_api_data(self, url):
        """Helper method to fetch data from TMDB API and handle errors."""
        try:
            response = requests.get(url)
            response.raise_for_status()
            return response.json()
        except requests.exceptions.RequestException as e:
            self.stderr.write(f"Error fetching data: {e}")
            return None

    def clean_date(self, date_str):
        """Helper method to validate and parse date strings."""
        if not date_str:
            return None
        try:
            return datetime.strptime(date_str, "%Y-%m-%d").date()
        except ValueError:
            return None

    def get_video_links(self, movie_id, api_key):
        """Fetch trailer and teaser links for a movie from YouTube."""
        url = f'https://api.themoviedb.org/3/movie/{movie_id}/videos?api_key={api_key}'
        videos_data = self.fetch_api_data(url)
        video_links = {
            'trailers': [],
            'teasers': []
        }
        if videos_data:
            for video in videos_data.get('results', []):
                if video['site'] == 'YouTube':
                    video_url = f"https://www.youtube.com/watch?v={video['key']}"
                    if video['type'] == 'Trailer':
                        video_links['trailers'].append(video_url)
                    elif video['type'] == 'Teaser':
                        video_links['teasers'].append(video_url)
        return video_links

    
    def save_movie(self, movie_details):
        """Save movie details and associated cast and crew."""
        genres = self.save_genres(movie_details.get('genres', []))

        movie_obj, created = MovieModel.objects.update_or_create(
            tmdb_id=movie_details['id'],
            defaults={
                'title': movie_details.get('title'),
                'original_title': movie_details.get('original_title'),
                'tagline': movie_details.get('tagline'),
                'overview': movie_details.get('overview'),
                'runtime': movie_details.get('runtime'),
                'budget': movie_details.get('budget'),
                'revenue': movie_details.get('revenue'),
                'release_date': self.clean_date(movie_details.get('release_date')),
                'status': movie_details.get('status'),
                'popularity': movie_details.get('popularity'),
                'vote_average': movie_details.get('vote_average'),
                'vote_count': movie_details.get('vote_count'),
                'languages': movie_details.get('spoken_languages', []),
                'homepage': movie_details.get('homepage'),
                'poster_path': movie_details.get('poster_path'),
                'backdrop_path': movie_details.get('backdrop_path'),
                'trailer_link': movie_details.get('trailer_link'),
                'teaser_link': movie_details.get('teaser_link'),
                'collection': movie_details.get('belongs_to_collection', {}),
            }
        )

        # Assign genres to the movie
        movie_obj.genres.set(genres)
        movie_obj.save()

        # Save release dates
        self.save_release_dates(movie_details['release_dates'], movie_obj)

        # Save cast and crew
        self.save_cast(movie_details['credits']['cast'], movie_obj)
        self.save_crew(movie_details['credits']['crew'], movie_obj)

    def save_genres(self, genres_data):
        """Save movie genres."""
        genres = []
        for genre in genres_data:
            genre_obj, created = GenreModel.objects.update_or_create(
                tmdb_id=genre['id'],
                defaults={'name': genre['name'], 'description': genre.get('description', '')}
            )
            genres.append(genre_obj)
        return genres

    def save_cast(self, cast_list, movie_obj):
        """Save cast details."""
        for cast in cast_list:
            cast_obj, created = CastModel.objects.update_or_create(
                tmdb_id=cast['id'],
                defaults={
                    'name': cast.get('name'),
                    'profile_path': cast.get('profile_path'),
                    'known_for_department': cast.get('known_for_department', 'Unknown'),
                    'biography': cast.get('biography'),
                    'birthday': cast.get('birthday'),
                    'deathday': cast.get('deathday'),
                    'place_of_birth': cast.get('place_of_birth'),
                    'popularity': cast.get('popularity'),
                    'gender': cast.get('gender'),
                    'imdb_id': cast.get('imdb_id'),
                    'roles': cast.get('roles', [])
                }
            )
            movie_obj.cast.add(cast_obj)

    def save_crew(self, crew_list, movie_obj):
        """Save crew details."""
        for crew in crew_list:
            crew_obj, created = CrewModel.objects.update_or_create(
                tmdb_id=crew['id'],
                defaults={
                    'name': crew.get('name'),
                    'profile_path': crew.get('profile_path'),
                    'department': crew.get('department'),
                    'job': crew.get('job'),
                    'biography': crew.get('biography'),
                    'birthday': crew.get('birthday'),
                    'deathday': crew.get('deathday'),
                    'place_of_birth': crew.get('place_of_birth'),
                    'gender': crew.get('gender'),
                    'imdb_id': crew.get('imdb_id'),
                    'popularity': crew.get('popularity'),
                    'known_for': crew.get('known_for', [])
                }
            )
            movie_obj.crew.add(crew_obj)
            

    def save_release_dates(self, release_dates, movie_obj):
        """Save movie release dates by country."""
        for release in release_dates:
            for country_data in release_dates.get('countries', []):
                ReleaseDateModel.objects.update_or_create(
                    movie=movie_obj,
                    country=country_data['iso_3166_1'],
                    defaults={'release_date': self.clean_date(country_data.get('release_date'))}
                )


    def save_production_companies(self, production_companies, movie_obj):
        """Save production companies."""
        for company in production_companies:
            company_obj, created = ProductionCompanyModel.objects.update_or_create(
                tmdb_id=company['id'],
                defaults={
                    'name': company.get('name'),
                    'logo_path': company.get('logo_path'),
                    'origin_country': company.get('origin_country'),
                }
            )
            movie_obj.production_companies.add(company_obj)


    def save_keywords(self, keywords, movie_obj):
        """Save movie keywords."""
        for keyword in keywords:
            keyword_obj, created = KeywordModel.objects.update_or_create(
                tmdb_id=keyword['id'],
                defaults={'name': keyword['name']}
            )
            movie_obj.keywords.add(keyword_obj)

    def handle(self, *args, **kwargs):
        api_key = settings.TMDB_API_KEY
        base_url = settings.TMDB_API_URL
        page = 1
        total_pages = 1

        while page <= total_pages:
            movies_url = f'{base_url}/discover/movie?api_key={api_key}&sort_by=release_date.desc&page={page}'
            movies_data = self.fetch_api_data(movies_url)

            if not movies_data:
                break

            total_pages = movies_data.get('total_pages', 1)

            for movie in movies_data.get('results', []):
                movie_id = movie['id']
                movie_details_url = f'{base_url}/movie/{movie_id}?api_key={api_key}&append_to_response=credits,release_dates,keywords'
                movie_details = self.fetch_api_data(movie_details_url)

                if not movie_details:
                    continue

                video_links = self.get_video_links(movie_id, api_key)
                movie_details['trailer_link'] = video_links['trailers'][0] if video_links['trailers'] else None
                movie_details['teaser_link'] = video_links['teasers'][0] if video_links['teasers'] else None

                self.save_movie(movie_details)

            self.stdout.write(self.style.SUCCESS(f'Page {page} processed successfully.'))
            page += 1
            sleep(0.5)  # Respect TMDB rate limits

        self.stdout.write(self.style.SUCCESS('Successfully fetched and saved all movies from TMDB API'))

