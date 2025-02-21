import time
import requests
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Fetch movies from TMDB'

    def handle(self, *args, **kwargs):
        urls = [
            "https://api.themoviedb.org/3/movie/762509/videos?api_key=57b5f1654695efb88db0e9b69b632b82",
            "https://api.themoviedb.org/3/movie/912649?api_key=57b5f1654695efb88db0e9b69b632b82&append_to_response=credits,release_dates,keywords",
            "https://api.themoviedb.org/3/movie/558449/videos?api_key=57b5f1654695efb88db0e9b69b632b82"
        ]
        for url in urls:
            self.fetch_data_with_retries(url)

    def fetch_data_with_retries(self, url, max_retries=3, backoff_factor=1):
        for attempt in range(1, max_retries + 1):
            try:
                response = requests.get(url)
                response.raise_for_status()
                # Process the response data
                print(f"Successfully fetched data for URL: {url}")
                return response.json()
            except requests.exceptions.RequestException as e:
                print(f"Attempt {attempt} failed for URL: {url}. Error: {e}")
                if attempt == max_retries:
                    print(f"Max retries reached for URL: {url}. Skipping.")
                    return None
                sleep_time = backoff_factor * (2 ** (attempt - 1))
                print(f"Retrying in {sleep_time} seconds...")
                time.sleep(sleep_time)
