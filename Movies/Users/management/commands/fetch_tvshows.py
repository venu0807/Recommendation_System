import aiohttp
import asyncio
import datetime
import logging

from django.core.management.base import BaseCommand
from django.conf import settings
from asgiref.sync import sync_to_async

from ...models import TVShowModel, SeasonModel, GenreModel, PersonModel, MovieCastModel, MovieCrewModel

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Fetch popular TV shows from TMDB API and save to the database'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.api_key = settings.TMDB_API_KEY

    max_concurrent_requests = 5
    max_shows = 100  # Target number of shows to fetch

    def clean_date(self, date_string):
        """Clean and format the air date to a valid format."""
        if date_string:
            try:
                date_string = date_string.split('T')[0]
                return datetime.datetime.strptime(date_string, "%Y-%m-%d").date()
            except ValueError:
                logger.error(f"Invalid date format: {date_string}")
        return None

    async def fetch_api_data(self, url, session, retries=3):
        if not hasattr(self, 'semaphore'):
            self.semaphore = asyncio.Semaphore(10)

        async with self.semaphore:
            for attempt in range(retries):
                try:
                    async with session.get(url, timeout=180) as response:
                        response.raise_for_status()
                        return await response.json()
                except (aiohttp.ClientError, asyncio.TimeoutError) as e:
                    logger.error(f"Error fetching data: {e}, URL: {url}, Attempt: {attempt + 1}")
                    if attempt < retries - 1:
                        await asyncio.sleep(5 * (2 ** attempt))
                except Exception as e:
                    logger.error(f"Unexpected error: {e}, URL: {url}, Attempt: {attempt + 1}")
                    return None
            return None

    async def save_show(self, details, session):
        show, _created = await sync_to_async(TVShowModel.objects.update_or_create)(
            tmdb_id=details['id'],
            defaults={
                'name': details.get('name'),
                'overview': details.get('overview'),
                'first_air_date': self.clean_date(details.get('first_air_date')),
                'last_air_date': self.clean_date(details.get('last_air_date')),
                'number_of_seasons': details.get('number_of_seasons'),
                'number_of_episodes': details.get('number_of_episodes'),
                'poster_path': details.get('poster_path'),
                'backdrop_path': details.get('backdrop_path'),
                'popularity': details.get('popularity'),
                'vote_average': details.get('vote_average'),
                'vote_count': details.get('vote_count'),
                'status': details.get('status'),
                'homepage': details.get('homepage'),
            }
        )

        # Genres (shared with movies — keyed by TMDB genre id)
        for g in details.get('genres', []):
            genre_obj = await sync_to_async(lambda: GenreModel.objects.filter(tmdb_id=g['id']).first())()
            if genre_obj:
                await sync_to_async(show.genres.add)(genre_obj)

        # Cast & crew: the shared MovieCast/MovieCrew tables have a NON-NULL
        # movie FK, so TV member rows are best-effort — skip members that the
        # schema rejects rather than aborting the show (genres/seasons still
        # attach below).
        credits = details.get('credits', {})
        for member in credits.get('cast', [])[:15]:
          try:
            person = await sync_to_async(lambda: PersonModel.objects.filter(name=member.get('name')).first())()
            if not person:
                person = await sync_to_async(PersonModel.objects.create)(
                    tmdb_id=member.get('id'),
                    name=member.get('name'),
                    gender=member.get('gender'),
                    popularity=member.get('popularity'),
                    profile_path=member.get('profile_path'),
                    known_for_department=member.get('known_for_department'),
                )
            cast_obj = await sync_to_async(MovieCastModel.objects.create)(
                member=person,
                name=member.get('name'),
                original_name=member.get('original_name'),
                gender=member.get('gender'),
                popularity=member.get('popularity'),
                profile_path=member.get('profile_path'),
                known_for_department=member.get('known_for_department'),
                cast_id=member.get('cast_id'),
                character=member.get('character'),
                credit_id=member.get('credit_id'),
                order=member.get('order'),
            )
            await sync_to_async(show.cast.add)(cast_obj)
          except Exception:
            pass

        for member in credits.get('crew', [])[:10]:
          try:
            person = await sync_to_async(lambda: PersonModel.objects.filter(name=member.get('name')).first())()
            if not person:
                person = await sync_to_async(PersonModel.objects.create)(
                    tmdb_id=member.get('id'),
                    name=member.get('name'),
                    gender=member.get('gender'),
                    popularity=member.get('popularity'),
                    profile_path=member.get('profile_path'),
                    known_for_department=member.get('known_for_department'),
                )
            crew_obj = await sync_to_async(MovieCrewModel.objects.create)(
                member=person,
                name=member.get('name'),
                original_name=member.get('original_name'),
                gender=member.get('gender'),
                popularity=member.get('popularity'),
                profile_path=member.get('profile_path'),
                known_for_department=member.get('known_for_department'),
                credit_id=member.get('credit_id'),
                department=member.get('department'),
                job=member.get('job'),
            )
            await sync_to_async(show.crew.add)(crew_obj)
          except Exception:
            pass

        # Seasons
        for s in details.get('seasons', []):
            await sync_to_async(SeasonModel.objects.update_or_create)(
                tv_show=show,
                season_number=s.get('season_number'),
                defaults={
                    'name': s.get('name'),
                    'overview': s.get('overview'),
                    'air_date': self.clean_date(s.get('air_date')),
                    'poster_path': s.get('poster_path'),
                }
            )
        return show

    async def fetch_and_save_show(self, show, session):
        show_id = show['id']
        details_url = (
            f'https://api.themoviedb.org/3/tv/{show_id}'
            f'?api_key={self.api_key}&append_to_response=credits'
        )
        details = await self.fetch_api_data(details_url, session)
        if not details:
            return None
        try:
            return await self.save_show(details, session)
        except Exception as e:
            logger.error(f"Error saving show {show_id}: {e}")
            return None

    async def async_handle(self, *args, **kwargs):
        logger.info(f"Using TMDB API Key: {self.api_key[:8]}...")
        total_fetched = 0

        connector = aiohttp.TCPConnector(limit_per_host=self.max_concurrent_requests)
        async with aiohttp.ClientSession(connector=connector) as session:
            for list_name in ['popular', 'top_rated', 'on_the_air']:
                if total_fetched >= self.max_shows:
                    break
                for page in range(1, 6):
                    if total_fetched >= self.max_shows:
                        break
                    url = (
                        f'https://api.themoviedb.org/3/tv/{list_name}'
                        f'?api_key={self.api_key}&language=en-US&page={page}'
                    )
                    data = await self.fetch_api_data(url, session)
                    if not data or not data.get('results'):
                        break
                    for show in data['results']:
                        if total_fetched >= self.max_shows:
                            break
                        saved = await self.fetch_and_save_show(show, session)
                        if saved:
                            total_fetched += 1
                            if total_fetched % 10 == 0:
                                self.stdout.write(f'Saved {total_fetched} shows...')

        self.stdout.write(self.style.SUCCESS(f'Finished. Total TV shows fetched: {total_fetched}'))

    def handle(self, *args, **kwargs):
        asyncio.run(self.async_handle(*args, **kwargs))
