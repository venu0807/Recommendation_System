import csv
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from django.db import transaction # Import transaction for atomic operations
from django.utils import timezone # For handling date fields

# IMPORTANT: Import your MovieModel, GenreModel, KeywordModel, etc. from the correct app.
# If MovieModel is in Users app, use:
from Users.models import MovieModel, GenreModel, KeywordModel, ProductionCompanyModel, PersonModel, MovieCastModel, MovieCrewModel

class Command(BaseCommand):
    help = 'Loads a sample subset of movie data and related objects into the database from a CSV file.'

    def handle(self, *args, **options):
        self.stdout.write("Checking for existing movies...")
        if MovieModel.objects.exists():
            self.stdout.write(self.style.WARNING("Movies already exist in the database. Skipping loading to avoid duplicates."))
            self.stdout.write(self.style.WARNING("If you want to reload, consider clearing the MovieModel table first (e.g., in Django shell, `MovieModel.objects.all().delete()`)."))
            return

        self.stdout.write("Loading sample movie data...")
        sample_data_file_path = os.path.join(settings.BASE_DIR, 'sample_movies.csv')

        if not os.path.exists(sample_data_file_path):
            self.stdout.write(self.style.ERROR(f"Sample data file not found: {sample_data_file_path}"))
            self.stdout.write(self.style.ERROR("Please ensure 'sample_movies.csv' is in your project root and committed."))
            return

        movies_to_create = []
        genres_to_add = {} # To store unique genres
        keywords_to_add = {} # To store unique keywords
        companies_to_add = {} # To store unique production companies
        people_to_add = {} # To store unique persons (for cast/crew)

        # Keep track of many-to-many relationships after bulk creation
        m2m_data = []

        try:
            with open(sample_data_file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for i, row in enumerate(reader):
                    # Optional: Limit for free tier, if your CSV is still too large
                    if i >= 1000: # Limit to first 1000 movies from CSV
                        self.stdout.write(self.style.WARNING("Reached 1000 sample movies limit for loading."))
                        break

                    # --- Prepare main MovieModel data ---
                    # Map CSV column names (row['column_name']) to MovieModel fields
                    # Convert data types as needed (e.g., int(), float(), parse dates)
                    release_date = None
                    if row.get('release_date'):
                        try:
                            release_date = timezone.datetime.strptime(row['release_date'], '%Y-%m-%d').date() # Adjust format if different
                        except ValueError:
                            pass # Handle cases where date might be malformed or missing

                    vote_average = None
                    if row.get('vote_average'):
                        try:
                            vote_average = float(row['vote_average'])
                        except ValueError:
                            pass

                    popularity = None
                    if row.get('popularity'):
                        try:
                            popularity = float(row['popularity'])
                        except ValueError:
                            pass

                    runtime = None
                    if row.get('runtime'):
                        try:
                            runtime = int(row['runtime'])
                        except ValueError:
                            pass

                    vote_count = None
                    if row.get('vote_count'):
                        try:
                            vote_count = int(row['vote_count'])
                        except ValueError:
                            pass

                    budget = None
                    if row.get('budget'):
                        try:
                            budget = int(row['budget'])
                        except ValueError:
                            pass

                    revenue = None
                    if row.get('revenue'):
                        try:
                            revenue = int(row['revenue'])
                        except ValueError:
                            pass

                    movie = MovieModel(
                        tmdb_id=int(row['tmdb_id']), # Ensure tmdb_id is always present and integer
                        title=row['title'],
                        original_title=row.get('original_title'),
                        tagline=row.get('tagline'),
                        overview=row.get('overview'),
                        runtime=runtime,
                        budget=budget,
                        revenue=revenue,
                        release_date=release_date,
                        status=row.get('status'),
                        popularity=popularity,
                        vote_average=vote_average,
                        vote_count=vote_count,
                        original_language=row.get('original_language'),
                        imdb_id=row.get('imdb_id'),
                        poster_path=row.get('poster_path'),
                        backdrop_path=row.get('backdrop_path'),
                        teaser_link=row.get('teaser_link'),
                        trailer_link=row.get('trailer_link'),
                        # For JSON fields, ensure they are valid JSON strings or lists
                        belongs_to_collection=json.loads(row['belongs_to_collection']) if row.get('belongs_to_collection') else [],
                        awards=json.loads(row['awards']) if row.get('awards') else [],
                        streaming_platforms=json.loads(row['streaming_platforms']) if row.get('streaming_platforms') else [],
                        spoken_languages=json.loads(row['spoken_languages']) if row.get('spoken_languages') else [],
                        production_countries=json.loads(row['production_countries']) if row.get('production_countries') else [],
                        # user_ratings_count and cached_average_rating will be updated later or handled by Django defaults
                        homepage=row.get('homepage'),
                        is_active=True, # Assuming newly loaded movies are active
                    )
                    movies_to_create.append(movie)

                    # --- Prepare M2M related objects (Genres, Keywords, ProductionCompanies, Cast, Crew) ---
                    # Collect unique related object data to create them efficiently later
                    # Make sure your export_sample_data.py includes these as separate columns or JSON strings
                    if row.get('genres'):
                        for genre_name in json.loads(row['genres']): # Assuming genres are a JSON list string
                            if genre_name not in genres_to_add:
                                genres_to_add[genre_name] = GenreModel(name=genre_name) # You might need tmdb_id here too if your GenreModel requires it
                            m2m_data.append(('genre', movie.tmdb_id, genre_name))

                    if row.get('keywords'):
                        for keyword_name in json.loads(row['keywords']): # Assuming keywords are a JSON list string
                            if keyword_name not in keywords_to_add:
                                keywords_to_add[keyword_name] = KeywordModel(name=keyword_name) # You might need tmdb_id
                            m2m_data.append(('keyword', movie.tmdb_id, keyword_name))

                    if row.get('production_companies'):
                        for company_data in json.loads(row['production_companies']): # Assuming companies are JSON list of objects
                            company_name = company_data.get('name')
                            company_tmdb_id = company_data.get('tmdb_id')
                            if company_name and company_tmdb_id not in companies_to_add:
                                companies_to_add[company_tmdb_id] = ProductionCompanyModel(
                                    tmdb_id=company_tmdb_id,
                                    name=company_name,
                                    logo_path=company_data.get('logo_path'),
                                    origin_country=company_data.get('origin_country')
                                )
                            m2m_data.append(('company', movie.tmdb_id, company_tmdb_id))

                    # Handle cast (MovieCastModel related to PersonModel)
                    # This is more complex as it involves creating PersonModel first
                    if row.get('cast'):
                        for cast_member_data in json.loads(row['cast']):
                            person_tmdb_id = cast_member_data.get('person_tmdb_id') # You need this in your CSV/JSON
                            if person_tmdb_id and person_tmdb_id not in people_to_add:
                                people_to_add[person_tmdb_id] = PersonModel(
                                    tmdb_id=person_tmdb_id,
                                    name=cast_member_data.get('name'),
                                    gender=cast_member_data.get('gender'),
                                    popularity=cast_member_data.get('popularity'),
                                    profile_path=cast_member_data.get('profile_path'),
                                    known_for_department=cast_member_data.get('known_for_department'),
                                    # ... other PersonModel fields
                                )
                            m2m_data.append(('cast_member', movie.tmdb_id, person_tmdb_id, cast_member_data))

                    # Handle crew (MovieCrewModel related to PersonModel) - similar to cast
                    if row.get('crew'):
                        for crew_member_data in json.loads(row['crew']):
                            person_tmdb_id = crew_member_data.get('person_tmdb_id')
                            if person_tmdb_id and person_tmdb_id not in people_to_add:
                                people_to_add[person_tmdb_id] = PersonModel(
                                    tmdb_id=person_tmdb_id,
                                    name=crew_member_data.get('name'),
                                    gender=crew_member_data.get('gender'),
                                    popularity=crew_member_data.get('popularity'),
                                    profile_path=crew_member_data.get('profile_path'),
                                    known_for_department=crew_member_data.get('known_for_department'),
                                    # ... other PersonModel fields
                                )
                            m2m_data.append(('crew_member', movie.tmdb_id, person_tmdb_id, crew_member_data))


            with transaction.atomic(): # Use atomic transaction for reliability
                # Bulk create main movie objects first
                MovieModel.objects.bulk_create(movies_to_create, ignore_conflicts=True) # ignore_conflicts for re-runs

                # Create related objects (genres, keywords, production companies, persons)
                GenreModel.objects.bulk_create(genres_to_add.values(), ignore_conflicts=True)
                KeywordModel.objects.bulk_create(keywords_to_add.values(), ignore_conflicts=True)
                ProductionCompanyModel.objects.bulk_create(companies_to_add.values(), ignore_conflicts=True)
                PersonModel.objects.bulk_create(people_to_add.values(), ignore_conflicts=True)

                # Fetch newly created/existing related objects for M2M
                genres_map = {g.name: g for g in GenreModel.objects.filter(name__in=genres_to_add.keys())}
                keywords_map = {k.name: k for k in KeywordModel.objects.filter(name__in=keywords_to_add.keys())}
                companies_map = {c.tmdb_id: c for c in ProductionCompanyModel.objects.filter(tmdb_id__in=companies_to_add.keys())}
                people_map = {p.tmdb_id: p for p in PersonModel.objects.filter(tmdb_id__in=people_to_add.keys())}

                # Fetch the created movies to establish M2M relationships
                created_movies = {m.tmdb_id: m for m in MovieModel.objects.filter(tmdb_id__in=[m.tmdb_id for m in movies_to_create])}

                # --- Establish Many-to-Many and ForeignKey relationships ---
                movie_cast_objs = []
                movie_crew_objs = []

                for rel_type, movie_tmdb_id, related_id_or_name, *extra_data in m2m_data:
                    movie_obj = created_movies.get(movie_tmdb_id)
                    if not movie_obj:
                        continue # Skip if movie wasn't created (e.g., due to conflict)

                    if rel_type == 'genre':
                        genre_obj = genres_map.get(related_id_or_name)
                        if genre_obj:
                            movie_obj.genres.add(genre_obj)
                    elif rel_type == 'keyword':
                        keyword_obj = keywords_map.get(related_id_or_name)
                        if keyword_obj:
                            movie_obj.keywords.add(keyword_obj)
                    elif rel_type == 'company':
                        company_obj = companies_map.get(related_id_or_name)
                        if company_obj:
                            movie_obj.production_companies.add(company_obj)
                    elif rel_type == 'cast_member':
                        person_obj = people_map.get(related_id_or_name)
                        if person_obj:
                            cast_data = extra_data[0] # The dictionary with cast details
                            movie_cast_objs.append(
                                MovieCastModel(
                                    member=person_obj,
                                    movie=movie_obj,
                                    name=cast_data.get('name'),
                                    original_name=cast_data.get('original_name'),
                                    gender=cast_data.get('gender'),
                                    popularity=cast_data.get('popularity'),
                                    profile_path=cast_data.get('profile_path'),
                                    known_for_department=cast_data.get('known_for_department'),
                                    cast_id=cast_data.get('cast_id'),
                                    character=cast_data.get('character'),
                                    credit_id=cast_data.get('credit_id'),
                                    order=cast_data.get('order')
                                )
                            )
                    elif rel_type == 'crew_member':
                        person_obj = people_map.get(related_id_or_name)
                        if person_obj:
                            crew_data = extra_data[0] # The dictionary with crew details
                            movie_crew_objs.append(
                                MovieCrewModel(
                                    member=person_obj,
                                    movie=movie_obj,
                                    name=crew_data.get('name'),
                                    original_name=crew_data.get('original_name'),
                                    gender=crew_data.get('gender'),
                                    popularity=crew_data.get('popularity'),
                                    profile_path=crew_data.get('profile_path'),
                                    known_for_department=crew_data.get('known_for_department'),
                                    credit_id=crew_data.get('credit_id'),
                                    department=crew_data.get('department'),
                                    job=crew_data.get('job')
                                )
                            )

                # Bulk create MovieCast and MovieCrew instances
                # Use ignore_conflicts=True if you might re-run and want to skip existing
                MovieCastModel.objects.bulk_create(movie_cast_objs, ignore_conflicts=True)
                MovieCrewModel.objects.bulk_create(movie_crew_objs, ignore_conflicts=True)


            self.stdout.write(self.style.SUCCESS(f"Successfully loaded {MovieModel.objects.count()} sample movies and related data."))

        except Exception as e:
            self.stdout.write(self.style.ERROR(f"Error loading sample movie data: {e}"))
            self.stdout.write(self.style.ERROR("Ensure your sample_movies.csv columns match expected format and data types."))

