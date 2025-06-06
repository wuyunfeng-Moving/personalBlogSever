from rest_framework import serializers
from recipes.models import Recipe, DeviceModel
from django.contrib.auth.models import User

# Serializer for DeviceModel (used when nested)
class DeviceModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceModel
        fields = ['id', 'model_identifier', 'name']

# Serializer for User (used when nested in Recipe Detail)
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username'] # Only expose basic info

# Serializer for Recipe List View (less detail)
class RecipeListSerializer(serializers.ModelSerializer):
    # You might want to add a field for image thumbnail URL later
    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description',
            'prep_time_minutes', 'cook_time_minutes', 'servings',
            'image' # Use image.url in the view or define a SerializerMethodField
        ]

# Serializer for Recipe Detail View (more detail)
class RecipeDetailSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    compatible_models = DeviceModelSerializer(many=True, read_only=True)
    # Consider using a custom field for ingredients if validation/structure is complex
    ingredients = serializers.JSONField()
    staple_food = serializers.JSONField()
    steps = serializers.JSONField()

    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'ingredients', 'staple_food', 'steps',
            'prep_time_minutes', 'cook_time_minutes', 'servings', 'author',
            'created_at', 'updated_at', 'image', 'compatible_models', 'difficulty',
            'suitable_person', 'tips', 'tags', 'work_modes', 'temperature_value',
            'temperature_unit', 'score', 'collection_count', 'page_view'
        ]

# Serializer for Command Output (Structure depends on generation logic)
# This is a placeholder - adjust based on actual command structure
class CommandSerializer(serializers.Serializer):
    model = serializers.CharField(read_only=True)
    recipe_id = serializers.IntegerField(read_only=True)
    commands = serializers.JSONField(read_only=True) # Or define specific command steps

    # Example of specific command steps if structure is known:
    # class CommandStepSerializer(serializers.Serializer):
    #     step = serializers.IntegerField()
    #     action = serializers.CharField()
    #     # ... other command fields (temperature, duration, etc.)
    # commands = CommandStepSerializer(many=True, read_only=True) 