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

    person_query = Q()
    for part in query.split():
        part_cleaned = re.sub(r'[^a-zA-Z0-9\s]', '', part)
        person_query |= Q(name__icontains=part) | Q(also_known_as__contains=part)
        person_query |= Q(name__icontains=part_cleaned) | Q(also_known_as__contains=part_cleaned)

    person_query |= Q(name__icontains=normalized_query) | Q(also_known_as__contains=normalized_query)
    person_query |= Q(name__icontains=cleaned_query) | Q(also_known_as__contains=cleaned_query)

    persons = PersonModel.objects.filter(person_query).distinct()
    results['persons'] = PersonSerializer(persons, many=True).data

    genres = GenreModel.objects.filter(
        Q(name__icontains=normalized_query) | 
        Q(name__icontains=cleaned_query)
    ).distinct()
    results['genres'] = GenreSerializer(genres, many=True).data

    return results
