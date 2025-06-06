from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from recipes.models import Recipe, DeviceModel
from django.contrib.auth.models import User

# Create your tests here.

class RecipeAPITests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        # Set up data for the whole TestCase
        cls.user = User.objects.create_user(username='testuser', password='password')
        cls.model_x = DeviceModel.objects.create(model_identifier='ModelX', name='Test Model X')
        cls.model_y = DeviceModel.objects.create(model_identifier='ModelY', name='Test Model Y')

        cls.recipe1 = Recipe.objects.create(title='Recipe 1', instructions='Steps 1', author=cls.user)
        cls.recipe1.compatible_models.add(cls.model_x)

        cls.recipe2 = Recipe.objects.create(title='Recipe 2', instructions='Steps 2', author=cls.user)
        cls.recipe2.compatible_models.add(cls.model_x, cls.model_y)

        cls.recipe3 = Recipe.objects.create(title='Recipe 3', instructions='Steps 3') # No author
        cls.recipe3.compatible_models.add(cls.model_y)

        # URLS
        cls.list_url = reverse('api_v1:recipe-list') # Use namespace
        cls.detail_url = lambda pk: reverse('api_v1:recipe-detail', kwargs={'pk': pk})
        cls.commands_url = lambda pk: reverse('api_v1:recipe-commands', kwargs={'pk': pk})

    def test_list_recipes_unfiltered(self):
        """ TC-API-RECIPE-LIST-001: Ensure we can list all recipes (paginated) """
        response = self.client.get(self.list_url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 3)
        self.assertEqual(len(response.data['results']), 3) # Assuming default page size >= 3

    def test_list_recipes_filtered_by_model(self):
        """ TC-API-RECIPE-LIST-005: Ensure filtering by model works """
        response = self.client.get(self.list_url + '?model=ModelX', format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 2)
        # Check IDs or titles if needed
        recipe_titles = [r['title'] for r in response.data['results']]
        self.assertIn('Recipe 1', recipe_titles)
        self.assertIn('Recipe 2', recipe_titles)

        response_y = self.client.get(self.list_url + '?model=ModelY', format='json')
        self.assertEqual(response_y.status_code, status.HTTP_200_OK)
        self.assertEqual(response_y.data['count'], 2)
        recipe_titles_y = [r['title'] for r in response_y.data['results']]
        self.assertIn('Recipe 2', recipe_titles_y)
        self.assertIn('Recipe 3', recipe_titles_y)

    def test_list_recipes_filter_model_not_found(self):
        """ TC-API-RECIPE-LIST-006: Ensure filtering by non-existent model returns empty/404 """
        response = self.client.get(self.list_url + '?model=NotFoundModel', format='json')
        # Check depends on view implementation (empty list or 404)
        # Here we assume empty list (status 200)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['count'], 0)
        self.assertEqual(len(response.data['results']), 0)

    def test_retrieve_recipe_detail(self):
        """ TC-API-RECIPE-DETAIL-001: Ensure we can retrieve a single recipe's details """
        response = self.client.get(self.detail_url(self.recipe1.pk), format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['id'], self.recipe1.pk)
        self.assertEqual(response.data['title'], 'Recipe 1')
        self.assertEqual(response.data['author']['username'], 'testuser')
        self.assertEqual(len(response.data['compatible_models']), 1)
        self.assertEqual(response.data['compatible_models'][0]['model_identifier'], 'ModelX')

    def test_retrieve_recipe_detail_not_found(self):
        """ TC-API-RECIPE-DETAIL-005: Ensure 404 is returned for non-existent recipe """
        response = self.client.get(self.detail_url(999), format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_commands_success(self):
        """ TC-API-COMMANDS-001: Test getting commands successfully """
        url = self.commands_url(self.recipe1.pk) + '?model=ModelX'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Check basic structure - real check depends on placeholder/actual logic
        self.assertEqual(response.data['model'], 'ModelX')
        self.assertEqual(response.data['recipe_id'], self.recipe1.pk)
        self.assertIn('commands', response.data)
        # Example check for placeholder:
        self.assertEqual(response.data['commands']['action'], 'PLACEHOLDER')

    def test_get_commands_missing_model_param(self):
        """ TC-API-COMMANDS-002: Test missing 'model' parameter returns 400 """
        url = self.commands_url(self.recipe1.pk)
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_get_commands_recipe_not_found(self):
        """ TC-API-COMMANDS-004: Test 404 for non-existent recipe """
        url = self.commands_url(999) + '?model=ModelX'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_commands_model_not_found(self):
        """ TC-API-COMMANDS-003: Test 404 for non-existent model """
        url = self.commands_url(self.recipe1.pk) + '?model=NotFoundModel'
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_get_commands_incompatible_model(self):
        """ TC-API-COMMANDS-005: Test 404 if recipe is not compatible with model """
        url = self.commands_url(self.recipe1.pk) + '?model=ModelY' # recipe1 only compatible with ModelX
        response = self.client.get(url, format='json')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

class DeviceStatusUpdateAPITests(APITestCase):

    @classmethod
    def setUpTestData(cls):
        cls.status_url = reverse('api_v1:device-status-update')
        # cls.user = User.objects.create_user(...) # Create user if auth is needed

    def test_post_status_success(self):
        """ TC-API-STATUS-001: Test posting a valid status update (placeholder format) """
        # self.client.force_authenticate(user=self.user) # Authenticate if needed
        payload = {
            "deviceId": "Device123",
            "timestamp": 1678886400,
            "status": "IDLE",
            "temperature": 25.0
        }
        response = self.client.post(self.status_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['message'], "Status received successfully.")

    def test_post_status_invalid_format(self):
        """ TC-API-STATUS-003/004: Test posting invalid/incomplete data """
        payload = {
            "deviceId": "Device456" # Missing timestamp and status
        }
        response = self.client.post(self.status_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data) # Or check specific detail message

    # Add TC-API-STATUS-005 test once authentication is implemented
