import aiohttp
import asyncio
from django.core.management.base import BaseCommand
from django.db import IntegrityError  # Import IntegrityError
from ...models import *
import logging
from asgiref.sync import sync_to_async
import datetime

logger = logging.getLogger(__name__)

class Command(BaseCommand):
    help = 'Fetch all movies from TMDB API and save to the database'

    api_key = '57b5f1654695efb88db0e9b69b632b82'  # Replace with your actual TMDB API key
    max_concurrent_requests = 20  # Limit concurrent requests per batch
    retries = 3  # Max retries for API requests
    max_movies = 100000  # Target number of movies to fetch

    def clean_date(self, date_string):
        """Clean and format the release date to a valid format."""
        if date_string:
            try:
                # Strip off time and Z at the end
                date_string = date_string.split('T')[0]
                # Convert date string (e.g. '2025-01-23') to a datetime object
                return datetime.datetime.strptime(date_string, "%Y-%m-%d").date()
            except ValueError:
                logger.error(f"Invalid date format: {date_string}")
        return None

    async def fetch_api_data(self, url, session, retries=3):
        for attempt in range(retries):
            try:
                async with session.get(url, timeout=180) as response:
                    response.raise_for_status()
                    return await response.json()
            except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                logger.error(f"Error fetching data: {e}, URL: {url}, Attempt: {attempt + 1}")
                if attempt < retries - 1:
                    await asyncio.sleep(5 * (2 ** attempt))  # Exponential backoff
            except Exception as e:
                logger.error(f"Unexpected error: {e}, URL: {url}, Attempt: {attempt + 1}")
                return None
        return None

    async def fetch_and_save_movie(self, movie, session):
        movie_id = movie['id']
        
        # Fetch movie details and credits separately
        movie_details_url = f'https://api.themoviedb.org/3/movie/{movie_id}?api_key={self.api_key}&append_to_response=genres,keywords,release_dates,production_companies,videos'
        credits_url = f'https://api.themoviedb.org/3/movie/{movie_id}/credits?api_key={self.api_key}'
        
        # Fetch both in parallel
        movie_details, credits_data = await asyncio.gather(
            self.fetch_api_data(movie_details_url, session),
            self.fetch_api_data(credits_url, session)
        )

        if not movie_details:
            logger.error(f"Skipping movie ID {movie_id} due to repeated fetch failures.")
            return

        # Merge credits data into movie_details
        if credits_data:
            movie_details['credits'] = credits_data
        else:
            movie_details['credits'] = {'cast': [], 'crew': []}

        # Ensure keywords are fetched correctly
        keywords_url = f'https://api.themoviedb.org/3/movie/{movie_id}/keywords?api_key={self.api_key}'
        keywords_data = await self.fetch_api_data(keywords_url, session)
        movie_details['keywords'] = keywords_data.get('keywords', [])

        video_links = self.get_video_links(movie_details)
        movie_details['trailer_link'] = video_links['trailers'][0] if video_links['trailers'] else None
        movie_details['teaser_link'] = video_links['teasers'][0] if video_links['teasers'] else None

        # Save the movie data
        movie_instance = await self.save_movie(movie_details)

        # Fetch and save cast and crew details in parallel
        tasks = [
            self.fetch_and_save_people(movie_details['credits']['cast'], session, 'cast', movie_instance),
            self.fetch_and_save_people(movie_details['credits']['crew'], session, 'crew', movie_instance),
            self.save_genres(movie_details.get('genres', []), movie_instance),
            self.save_keywords(movie_details.get('keywords', []), movie_instance),
            self.save_production_companies(movie_details.get('production_companies', []), movie_instance),
            self.save_release_dates(movie_details.get('release_dates', {}), movie_instance)
        ]
        await asyncio.gather(*tasks)

    def get_video_links(self, movie_details):
        """Extract trailer and teaser links from movie details."""
        video_links = {
            'trailers': [],
            
            'teasers': []
        }
        videos_data = movie_details.get('videos', {}).get('results', [])
        for video in videos_data:
            if video['site'] == 'YouTube':
                video_url = f"https://www.youtube.com/watch?v={video['key']}"
                if video['type'] == 'Trailer':
                    video_links['trailers'].append(video_url)
                elif video['type'] == 'Teaser':
                    video_links['teasers'].append(video_url)
        return video_links

    async def fetch_and_save_people(self, people_data, session, role, movie_instance):
        # Process people in smaller batches to avoid overwhelming the database
        batch_size = 50
        for i in range(0, len(people_data), batch_size):
            batch = people_data[i:i + batch_size]
            tasks = []
            
            for index, person_data in enumerate(batch, start=i):
                try:
                    person_id = person_data['id']
                    person_details_url = f'https://api.themoviedb.org/3/person/{person_id}?api_key={self.api_key}'
                    
                    # Create task for each person
                    tasks.append(self.process_person(
                        person_details_url, 
                        session, 
                        role, 
                        movie_instance, 
                        person_data, 
                        index
                    ))
                except Exception as e:
                    logger.error(f"Error creating task for person: {e}")
                    continue
            
            if tasks:
                # Process batch of people concurrently
                await asyncio.gather(*tasks)
            
            # Small delay between batches to prevent rate limiting
            await asyncio.sleep(0.1)

    async def process_person(self, person_details_url, session, role, movie_instance, person_data, index):
        try:
            person_details = await self.fetch_api_data(person_details_url, session)
            if not person_details:
                return

            person = await self.save_people(person_details)
            
            if role == 'cast':
                cast_member = await self.save_cast(
                    person, 
                    movie_instance, 
                    person_data.get('character', ''), 
                    person_data.get('order', index),  # Use original order from TMDB
                    person_data.get('credit_id', f'cast_{person.tmdb_id}')
                )
                if cast_member:
                    await sync_to_async(movie_instance.cast.add)(cast_member)
            elif role == 'crew':
                crew_member = await self.save_crew(
                    person, 
                    movie_instance, 
                    person_data.get('department', ''), 
                    person_data.get('job', ''),
                    person_data.get('credit_id', f'crew_{person.tmdb_id}')
                )
                if crew_member:
                    await sync_to_async(movie_instance.crew.add)(crew_member)

        except Exception as e:
            logger.error(f"Error processing person: {e}")

    async def save_people(self, person_details):
        person, created = await sync_to_async(PersonModel.objects.update_or_create)(
            tmdb_id=person_details['id'],
            defaults={
                'name': person_details['name'],
                'gender': person_details.get('gender'),
                'popularity': person_details.get('popularity'),
                'profile_path': person_details.get('profile_path'),
                'known_for_department': person_details.get('known_for_department'),
                'also_known_as': person_details.get('also_known_as', []),
                'biography': person_details.get('biography'),
                'birthday': person_details.get('birthday'),
                'deathday': person_details.get('deathday'),
                'place_of_birth': person_details.get('place_of_birth'),
                'imdb_id': person_details.get('imdb_id'),
                'homepage': person_details.get('homepage'),
            }
        )
        return person

    async def save_cast(self, person, movie_instance, character, order, credit_id):
        try:
            # Get the cast_id from the original person_data
            cast_member, created = await sync_to_async(MovieCastModel.objects.update_or_create)(
                member=person,
                movie=movie_instance,
                credit_id=credit_id,  # Use credit_id for uniqueness instead of order
                defaults={
                    'name': person.name,
                    'original_name': person.name,
                    'character': character,
                    'gender': person.gender,
                    'popularity': person.popularity,
                    'profile_path': person.profile_path,
                    'known_for_department': person.known_for_department,
                    'cast_id': order,  # Use order as cast_id
                    'order': order,
                }
            )
            return cast_member
        except Exception as e:
            logger.error(f"Error saving cast member {person.name}: {e}")
            return None

    async def get_unique_order_for_cast(self, movie_instance):
        max_order = await sync_to_async(MovieCastModel.objects.filter(movie=movie_instance).aggregate)(models.Max('order'))
        return (max_order['order__max'] or 0) + 1

    async def save_crew(self, person, movie_instance, department, job, credit_id):
        try:
            crew_member, created = await sync_to_async(MovieCrewModel.objects.update_or_create)(
                member=person,
                movie=movie_instance,
                department=department,  # Include department in the lookup
                job=job,  # Include job in the lookup
                defaults={
                    'name': person.name,
                    'original_name': person.name,
                    'gender': person.gender,
                    'popularity': person.popularity,
                    'profile_path': person.profile_path,
                    'known_for_department': person.known_for_department,
                    'credit_id': credit_id,
                }
            )
            return crew_member
        except Exception as e:
            # logger.error(f"Error saving crew member {person.name}: {e}")
            return None

    async def save_genres(self, genres, movie_instance):
        for genre in genres:
            genre_obj, created = await sync_to_async(GenreModel.objects.update_or_create)(
                tmdb_id=genre['id'],
                defaults={'name': genre['name']}
            )
            await sync_to_async(movie_instance.genres.add)(genre_obj)

    async def save_keywords(self, keywords, movie_instance):
        for keyword in keywords:
            keyword_obj, created = await sync_to_async(KeywordModel.objects.update_or_create)(
                tmdb_id=keyword['id'],
                defaults={'name': keyword['name']}
            )
            await sync_to_async(movie_instance.keywords.add)(keyword_obj)

    async def save_production_companies(self, production_companies, movie_instance):
        for company in production_companies:
            company_obj, created = await sync_to_async(ProductionCompanyModel.objects.update_or_create)(
                tmdb_id=company['id'],
                defaults={
                    'name': company.get('name'),
                    'logo_path': company.get('logo_path'),
                    'origin_country': company.get('origin_country'),
                }
            )
            await sync_to_async(movie_instance.production_companies.add)(company_obj)

    async def save_release_dates(self, release_dates, movie_instance):
        if 'results' in release_dates and release_dates['results']:
            for country_data in release_dates['results']:
                country_code = country_data.get('iso_3166_1') 
                for release in country_data.get('release_dates', []):
                    release_date = self.clean_date(release.get('release_date'))
                    if release_date:  # Only save if release_date is valid
                        await sync_to_async(ReleaseDateModel.objects.update_or_create)(
                            movie=movie_instance,
                            country=country_code,
                            defaults={'release_date': release_date}
                        )

    async def save_movie(self, movie_details):
        movie, created = await sync_to_async(MovieModel.objects.update_or_create)(
            tmdb_id=movie_details['id'],
            defaults={
                'title': movie_details['title'],
                'original_title': movie_details.get('original_title'),
                'tagline': movie_details.get('tagline'),
                'overview': movie_details.get('overview'),
                'runtime': movie_details.get('runtime'),
                'budget': movie_details.get('budget'),
                'revenue': movie_details.get('revenue'),
                'release_date': movie_details.get('release_date') or None,
                'status': movie_details.get('status'),
                'popularity': movie_details.get('popularity'),
                'vote_average': movie_details.get('vote_average'),
                'vote_count': movie_details.get('vote_count'),
                'poster_path': movie_details.get('poster_path'),
                'backdrop_path': movie_details.get('backdrop_path'),
                'trailer_link': movie_details.get('trailer_link'),
                'teaser_link': movie_details.get('teaser_link'),
                'is_active': True,
            }
        )
        return movie

    async def async_handle(self, *args, **kwargs):
        logger.info(f"Using TMDB API Key: {self.api_key}")
        
        total_movies_fetched = 0
        current_year = datetime.datetime.now().year + 2  # Fetch movies up to 2 years in the future
        start_year = 1900

        connector = aiohttp.TCPConnector(limit_per_host=self.max_concurrent_requests)
        async with aiohttp.ClientSession(connector=connector) as session:
            # Iterate through years in reverse order
            for year in range(current_year, start_year, -1):
                if total_movies_fetched >= self.max_movies:
                    break

                page = 1
                while total_movies_fetched < self.max_movies:
                    # Use both primary_release_year and year parameters to get more results
                    movies_url = (
                        f'https://api.themoviedb.org/3/discover/movie'
                        f'?api_key={self.api_key}'
                        f'&primary_release_year={year}'
                        f'&sort_by=popularity.desc'
                        f'&page={page}'
                        f'&include_adult=false'
                        f'&include_video=false'
                        f'&vote_count.gte=1'
                    )

                    movies_data = await self.fetch_api_data(movies_url, session)

                    if not movies_data or not movies_data.get('results'):
                        logger.info(f"No more results for year {year}")
                        break

                    tasks = []
                    for movie in movies_data.get('results', []):
                        if total_movies_fetched >= self.max_movies:
                            break
                        tasks.append(self.fetch_and_save_movie(movie, session))
                        total_movies_fetched += 1

                    if tasks:
                        try:
                            await asyncio.gather(*tasks)
                            logger.info(f'Year {year}, Page {page} processed. Total movies: {total_movies_fetched}')
                        except Exception as e:
                            logger.error(f'Error processing year {year}, page {page}: {e}')

                    # If we didn't get a full page of results, move to next year
                    if len(movies_data.get('results', [])) < 20:
                        break

                    page += 1
                    await asyncio.sleep(0.25)  # Increased delay to avoid rate limiting

                logger.info(f'Finished processing year {year}. Total movies: {total_movies_fetched}')

        logger.info(f'Finished processing all years. Total movies fetched: {total_movies_fetched}')

    def handle(self, *args, **kwargs):
        asyncio.run(self.async_handle(*args, **kwargs))
