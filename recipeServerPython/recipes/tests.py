from django.test import TestCase
from django.contrib.auth.models import User
from .models import Recipe, DeviceModel

# Create your tests here.

class RecipeModelTests(TestCase):

    def setUp(self):
        # Create sample data needed for tests
        self.user = User.objects.create_user(username='testuser', password='password')
        self.model1 = DeviceModel.objects.create(model_identifier='ModelX', name='Test Model X')
        self.model2 = DeviceModel.objects.create(model_identifier='ModelY', name='Test Model Y')

    def test_recipe_creation(self):
        """ Test creating a recipe instance """
        recipe = Recipe.objects.create(
            title="Test Recipe",
            instructions="Test instructions.",
            author=self.user
        )
        self.assertEqual(recipe.title, "Test Recipe")
        self.assertEqual(str(recipe), "Test Recipe")
        self.assertEqual(recipe.author, self.user)

    def test_recipe_device_model_relation(self):
        """ Test ManyToMany relationship between Recipe and DeviceModel """
        recipe = Recipe.objects.create(title="Relation Test", instructions="...")
        recipe.compatible_models.add(self.model1, self.model2)

        self.assertEqual(recipe.compatible_models.count(), 2)
        self.assertIn(self.model1, recipe.compatible_models.all())
        self.assertIn(self.model2, recipe.compatible_models.all())

        # Test reverse relation
        self.assertIn(recipe, self.model1.recipes.all())

class DeviceModelTests(TestCase):

    def test_device_model_creation(self):
        """ Test creating a device model instance """
        model = DeviceModel.objects.create(
            model_identifier="UniqueDevice123",
            name="Super Device",
            command_template={"type": "simple"}
        )
        self.assertEqual(model.name, "Super Device")
        self.assertEqual(str(model), "Super Device")
        self.assertEqual(model.model_identifier, "UniqueDevice123")
        self.assertIsNotNone(model.created_at)

    # Add more tests for constraints, default values etc.
