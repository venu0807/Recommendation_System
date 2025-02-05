from django.core.management.base import BaseCommand
from django.db.models import Count
from ...models import (
    MovieModel, PersonModel, GenreModel, KeywordModel,
    ProductionCompanyModel, MovieCastModel, MovieCrewModel,
    RatingModel, UserMovieHistoryModel, ReleaseDateModel
)

class Command(BaseCommand):
    help = 'Remove duplicate entries from all models'

    def add_arguments(self, parser):
        pass

    def handle(self, *args, **options):
        self.stdout.write('Starting duplicate removal process...')

        # Special handling for MovieCastModel duplicates
        self.remove_cast_duplicates()

        # Handle other models
        models_to_clean = [
            (MovieModel, ['tmdb_id'], '-vote_count'),
            (PersonModel, ['tmdb_id'], '-popularity'),
            (KeywordModel, ['tmdb_id'], 'id'),
            (ProductionCompanyModel, ['tmdb_id'], 'id'),
            (MovieCrewModel, ['member', 'movie'], 'id'),
            (RatingModel, ['user', 'movie'], '-timestamp'),
            (UserMovieHistoryModel, ['user', 'movie'], '-watched_at'),
            (ReleaseDateModel, ['movie', 'country'], '-release_date')
        ]

        for model, fields, order_by in models_to_clean:
            self.remove_duplicates(model, fields, order_by)

        # Handle GenreModel separately for both fields
        for field in ['tmdb_id', 'name']:
            self.remove_duplicates(GenreModel, [field], '-popularity_score')

        self.stdout.write(self.style.SUCCESS('Successfully removed duplicates from all models'))

    def remove_cast_duplicates(self):
        """Special handling for MovieCastModel duplicates"""
        self.stdout.write('Processing MovieCastModel...')
        
        # First, find duplicates based on member and movie
        duplicates = (MovieCastModel.objects.values('member', 'movie')
                     .annotate(count=Count('id'))
                     .filter(count__gt=1))
        
        total_removed = 0
        for dup in duplicates:
            # Get all entries for this member-movie combination
            items = MovieCastModel.objects.filter(
                member=dup['member'],
                movie=dup['movie']
            ).order_by('order')  # Order by casting order
            
            if len(items) <= 1:
                continue
                
            # Keep the item with the lowest order number
            kept_item = items[0]
            
            # Delete other entries
            for item in items[1:]:
                item.delete()
                total_removed += 1
                
        if total_removed:
            self.stdout.write(f'Removed {total_removed} duplicate cast entries')

    def remove_duplicates(self, model, fields, order_by):
        """
        Generic method to remove duplicates from a model
        
        Args:
            model: The Django model class
            fields: List of fields to check for duplicates
            order_by: Field to use for ordering (keep first/last)
        """
        self.stdout.write(f'Processing {model.__name__}...')
        
        # Get all duplicate groups
        duplicates = (
            model.objects.values(*fields)
            .annotate(count=Count('id'))
            .filter(count__gt=1)
        )
        
        total_duplicates = 0
        for dup in duplicates:
            # Create filter for this duplicate group
            filter_kwargs = {field: dup[field] for field in fields}
            items = model.objects.filter(**filter_kwargs).order_by(order_by)
            
            # Keep the first item, delete the rest
            for item in items[1:]:
                item.delete()
                total_duplicates += 1

        if total_duplicates:
            self.stdout.write(f'Removed {total_duplicates} duplicates from {model.__name__}')
