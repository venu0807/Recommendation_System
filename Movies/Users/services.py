import re
from django.db.models import Q
from .models import MovieModel, PersonModel, GenreModel
from .serializers import MovieSerializer, PersonSerializer, GenreSerializer

def get_search_results(query):
    results = {
        'movies': [],
        'persons': [],
        'genres': []
    }
    if not query:
        return results

    normalized_query = query.lower()
    cleaned_query = re.sub(r'[^a-zA-Z0-9\s]', '', normalized_query)

    movies = MovieModel.objects.filter(
        Q(title__icontains=normalized_query) | 
        Q(title__icontains=cleaned_query)
    ).distinct().prefetch_related('genres', 'cast', 'crew', 'keywords', 'production_companies')
    
    results['movies'] = MovieSerializer(movies, many=True).data

    # DB-level name matching (also_known_as is matched in Python for SQLite compatibility)
    person_query = Q()
    for part in query.split():
        part_cleaned = re.sub(r'[^a-zA-Z0-9\s]', '', part)
        person_query |= Q(name__icontains=part) | Q(name__icontains=part_cleaned)
    person_query |= Q(name__icontains=normalized_query) | Q(name__icontains=cleaned_query)

    persons = PersonModel.objects.filter(person_query).distinct()

    # Also match against also_known_as in Python (SQLite doesn't support JSONField contains)
    query_parts_lower = [p.lower() for p in query.split() if p]
    if query_parts_lower:
        # Only check persons that already matched the name query to reduce iterations
        aka_ids = []
        for person in persons.only('id', 'also_known_as'):
            if person.also_known_as:
                for aka in (person.also_known_as if isinstance(person.also_known_as, list) else []):
                    if isinstance(aka, str) and any(qp in aka.lower() for qp in query_parts_lower):
                        aka_ids.append(person.id)
                        break
        if aka_ids:
            persons = persons | PersonModel.objects.filter(id__in=aka_ids)
    results['persons'] = PersonSerializer(persons, many=True).data

    genres = GenreModel.objects.filter(
        Q(name__icontains=normalized_query) | 
        Q(name__icontains=cleaned_query)
    ).distinct()
    results['genres'] = GenreSerializer(genres, many=True).data

    return results
