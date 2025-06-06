from django.core.management.base import BaseCommand
from recipe_site.models import Recipe

class Command(BaseCommand):
    help = 'Updates all recipes to published status'

    def handle(self, *args, **options):
        recipes = Recipe.objects.all()
        count = 0
        
        for recipe in recipes:
            recipe.status = 'published'
            recipe.save()
            count += 1
            
        self.stdout.write(
            self.style.SUCCESS(f'Successfully updated {count} recipes to published status')
        ) 