"""
Management command to seed sample movie data for development/testing.
Creates 20 movies with genres, cast, and crew relationships so the
app has data to work with without needing a TMDB API key.

Usage:
    python manage.py seed_sample_data
    python manage.py seed_sample_data --count=50
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import date, timedelta
import random

from Users.models import (
    MovieModel, GenreModel, PersonModel, MovieCastModel,
    MovieCrewModel, KeywordModel, ProductionCompanyModel
)


SAMPLE_TITLES = [
    "The Lost City", "Beyond the Horizon", "Midnight Echo", "Iron Thunder",
    "Crimson Dawn", "Whispering Pines", "Neon Nights", "The Last Voyage",
    "Shadow Protocol", "Golden Hour", "Starlight Express", "The Deep End",
    "Velocity", "Wildfire", "Crystal Lake", "Operation Eclipse",
    "The Silent Witness", "Dragon's Breath", "Parallel Worlds", "Fury Road"
]


def _get_title(i):
    """Return a movie title for index i, wrapping around or generating if needed."""
    if i < len(SAMPLE_TITLES):
        return SAMPLE_TITLES[i]
    return f"Sample Movie {i + 1}"

SAMPLE_OVERVIEWS = [
    "A thrilling adventure that takes viewers on an unforgettable journey through uncharted territories.",
    "When darkness falls, unlikely heroes emerge in this gripping tale of survival and redemption.",
    "In a world where nothing is as it seems, one person must uncover the truth before it's too late.",
    "An action-packed story of courage, betrayal, and the relentless pursuit of justice.",
    "A heartwarming tale of friendship and discovery set against breathtaking landscapes.",
    "The fate of humanity hangs in the balance as a team of specialists races against time.",
    "A mind-bending journey through parallel dimensions where reality and illusion collide.",
    "Two strangers find an unexpected connection during a chance encounter that changes everything.",
    "A gripping psychological thriller that keeps you guessing until the very end.",
    "An epic saga of power, passion, and destiny spanning generations.",
]

SAMPLE_TAGLINES = [
    "The adventure begins now.",
    "Every hero has a beginning.",
    "Nothing is as it seems.",
    "The truth will set you free.",
    "Beyond fear lies courage.",
    "When the world needed a hero, they found each other.",
    "Some secrets are worth dying for.",
    "The journey changes everything.",
    "Love knows no boundaries.",
    "The final chapter awaits.",
]

GENRES = [
    ("Action", 28), ("Adventure", 12), ("Comedy", 35), ("Drama", 18),
    ("Thriller", 53), ("Sci-Fi", 878), ("Romance", 10749), ("Horror", 27),
    ("Mystery", 9648), ("Fantasy", 14),
]

PERSON_NAMES = [
    ("James Mitchell", "Actor"), ("Sarah Chen", "Actress"),
    ("Marcus Williams", "Actor"), ("Elena Rodriguez", "Actress"),
    ("David Kim", "Actor"), ("Priya Patel", "Actress"),
    ("Thomas Anderson", "Actor"), ("Olivia Brown", "Actress"),
    ("Ryan Cooper", "Actor"), ("Emily Foster", "Actress"),
    ("Michael Torres", "Director"), ("Jennifer Blake", "Director"),
    ("Christopher Lee", "Director"), ("Amanda White", "Director"),
    ("Robert Taylor", "Producer"),
]


class Command(BaseCommand):
    help = "Seed the database with sample movie data for development/testing"

    def add_arguments(self, parser):
        parser.add_argument(
            '--count', type=int, default=20,
            help='Number of movies to create (default: 20)'
        )
        parser.add_argument(
            '--force', action='store_true',
            help='Skip existing-data check'
        )

    def handle(self, *args, **options):
        count = options['count']
        force = options['force']

        if not force and MovieModel.objects.exists():
            self.stdout.write(
                self.style.WARNING(
                    f"Movies already exist ({MovieModel.objects.count()} found). "
                    "Use --force to seed additional data."
                )
            )
            return

        self.stdout.write(f"Seeding {count} sample movies...")

        # Create genres
        genres = {}
        for name, tmdb_id in GENRES:
            genre, _ = GenreModel.objects.get_or_create(
                tmdb_id=tmdb_id,
                defaults={'name': name}
            )
            genres[name] = genre
        self.stdout.write(self.style.SUCCESS(f"  Created {len(genres)} genres"))

        # Create keywords
        keyword_names = ["blockbuster", "independent", "award-winning", "cult-classic",
                         "high-octane", "thought-provoking", "feel-good", "suspenseful",
                         "visually-stunning", "character-driven"]
        keywords = []
        for name in keyword_names:
            kw, _ = KeywordModel.objects.get_or_create(
                name=name,
                defaults={'tmdb_id': random.randint(10000, 99999)}
            )
            keywords.append(kw)
        self.stdout.write(self.style.SUCCESS(f"  Created {len(keywords)} keywords"))

        # Create production company
        company, _ = ProductionCompanyModel.objects.get_or_create(
            name="Sample Productions",
            defaults={
                'tmdb_id': 1,
                'origin_country': 'US',
            }
        )

        # Create people
        people = []
        for name, known_for in PERSON_NAMES:
            person, _ = PersonModel.objects.get_or_create(
                name=name,
                defaults={
                    'tmdb_id': random.randint(100000, 999999),
                    'known_for_department': 'Acting' if known_for in ('Actor', 'Actress') else 'Directing',
                    'popularity': round(random.uniform(5, 95), 1),
                    'gender': 2 if known_for == 'Actor' else 1 if known_for in ('Actress',) else 0,
                }
            )
            people.append(person)
        self.stdout.write(self.style.SUCCESS(f"  Created {len(people)} people"))

        # Create movies
        movies_created = 0
        today = date.today()

        for i in range(count):
            title = _get_title(i)
            release_date = today - timedelta(days=random.randint(1, 365 * 3))
            movie_genres = random.sample(list(genres.values()), k=random.randint(2, 4))
            movie_keywords = random.sample(keywords, k=random.randint(2, 4))

            movie, created = MovieModel.objects.get_or_create(
                title=title,
                defaults={
                    'tmdb_id': random.randint(1000000, 9999999),
                    'original_title': title,
                    'tagline': random.choice(SAMPLE_TAGLINES),
                    'overview': random.choice(SAMPLE_OVERVIEWS),
                    'runtime': random.randint(85, 180),
                    'budget': random.randint(1000000, 200000000),
                    'revenue': random.randint(1000000, 500000000),
                    'release_date': release_date,
                    'status': 'Released',
                    'popularity': round(random.uniform(10, 100), 1),
                    'vote_average': round(random.uniform(5.0, 9.5), 1),
                    'vote_count': random.randint(100, 50000),
                    'original_language': 'en',
                    'poster_path': None,
                    'backdrop_path': None,
                    'is_active': True,
                }
            )

            if created:
                # Add M2M relationships
                movie.genres.add(*movie_genres)
                movie.keywords.add(*movie_keywords)
                movie.production_companies.add(company)

                # Add cast (2-5 actors)
                cast_pool = [p for p in people if p.known_for_department == 'Acting']
                selected_cast = random.sample(cast_pool, k=min(random.randint(2, 5), len(cast_pool)))
                for order, person in enumerate(selected_cast):
                    MovieCastModel.objects.get_or_create(
                        member=person,
                        movie=movie,
                        defaults={
                            'name': person.name,
                            'character': f"Character {order + 1}",
                            'order': order,
                            'cast_id': order,
                            'gender': person.gender,
                            'popularity': person.popularity,
                            'credit_id': f"cast_{movie.tmdb_id}_{person.tmdb_id}",
                        }
                    )

                # Add crew (1-2 directors)
                crew_pool = [p for p in people if p.known_for_department == 'Directing']
                selected_crew = random.sample(crew_pool, k=min(random.randint(1, 2), len(crew_pool)))
                for person in selected_crew:
                    MovieCrewModel.objects.get_or_create(
                        member=person,
                        movie=movie,
                        department='Directing',
                        job='Director',
                        defaults={
                            'name': person.name,
                            'gender': person.gender,
                            'popularity': person.popularity,
                            'credit_id': f"crew_{movie.tmdb_id}_{person.tmdb_id}",
                        }
                    )

                movies_created += 1

        self.stdout.write(self.style.SUCCESS(
            f"\nDone! Created {movies_created} movies with genres, cast, and crew."
        ))
        self.stdout.write(
            f"Total: {MovieModel.objects.count()} movies, "
            f"{GenreModel.objects.count()} genres, "
            f"{PersonModel.objects.count()} people"
        )
