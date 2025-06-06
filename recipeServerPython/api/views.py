from django.shortcuts import render
from rest_framework import generics, views, status
from rest_framework.response import Response
from rest_framework.exceptions import NotFound, ParseError
from recipes.models import Recipe, DeviceModel
from .serializers import (
    RecipeListSerializer, RecipeDetailSerializer, CommandSerializer
)
# Basic Pagination (can be customized in settings.py later)
from rest_framework.pagination import PageNumberPagination

import logging

# Get an instance of a logger
logger = logging.getLogger(__name__)

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 50

class RecipeListView(generics.ListAPIView):
    """
    API view to retrieve a list of recipes.
    Supports filtering by `model` identifier and pagination.
    """
    serializer_class = RecipeListSerializer
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        queryset = Recipe.objects.select_related('author').prefetch_related('compatible_models').order_by('-created_at')
        model_identifier = self.request.query_params.get('model', None)

        if model_identifier:
            # Check if the device model exists
            try:
                device_model = DeviceModel.objects.get(model_identifier=model_identifier)
                # Filter recipes compatible with this model
                queryset = queryset.filter(compatible_models=device_model)
                logger.info(f"Filtering recipes for model: {model_identifier}")
            except DeviceModel.DoesNotExist:
                logger.warning(f"Device model not found: {model_identifier}")
                # Option 1: Return 404 (stricter)
                # raise NotFound(detail=f"Device model '{model_identifier}' not found.")
                # Option 2: Return empty list (more lenient)
                return Recipe.objects.none() # Return an empty queryset

        return queryset

class RecipeDetailView(generics.RetrieveAPIView):
    """
    API view to retrieve details of a single recipe.
    """
    queryset = Recipe.objects.select_related('author').prefetch_related('compatible_models').all()
    serializer_class = RecipeDetailSerializer
    # lookup_field = 'id' is the default

class RecipeCommandsView(views.APIView):
    """
    API view to retrieve device-specific commands for a recipe.
    Requires 'model' query parameter.
    """
    def get(self, request, pk, format=None):
        model_identifier = request.query_params.get('model', None)

        if not model_identifier:
            logger.error("Missing 'model' query parameter for command request.")
            raise ParseError(detail="'model' query parameter is required.")

        try:
            recipe = Recipe.objects.prefetch_related('compatible_models').get(id=pk)
            logger.info(f"Fetching commands for recipe {pk} and model {model_identifier}")
        except Recipe.DoesNotExist:
            logger.warning(f"Recipe not found for command request: {pk}")
            raise NotFound(detail="Recipe not found.")

        try:
            device_model = DeviceModel.objects.get(model_identifier=model_identifier)
        except DeviceModel.DoesNotExist:
            logger.warning(f"Device model not found for command request: {model_identifier}")
            raise NotFound(detail=f"Device model '{model_identifier}' not found.")

        # Check compatibility
        if device_model not in recipe.compatible_models.all():
            logger.error(f"Recipe {pk} is not compatible with model {model_identifier}")
            raise NotFound(detail=f"Recipe is not compatible with device model '{model_identifier}'.")

        # --- Placeholder for Command Generation Logic ---
        # This is where you would use recipe data and device_model.command_template
        # to generate the actual commands.
        # For now, return placeholder data.
        generated_commands = {
            "step": 1,
            "action": "PLACEHOLDER",
            "details": f"Commands for {recipe.title} on {device_model.name}"
            # Replace with real command structure based on command_template
        }
        logger.info(f"Generated placeholder commands for recipe {pk}, model {model_identifier}")
        # --- End Placeholder ---

        # 创建要序列化的数据对象
        command_data = {
            'model': device_model.model_identifier,
            'recipe_id': recipe.id,
            'commands': generated_commands # Use the actual generated commands here
        }
        
        # 直接序列化数据对象，而不是使用data参数
        serializer = CommandSerializer(command_data)
        return Response(serializer.data, status=status.HTTP_200_OK)

class DeviceStatusUpdateView(views.APIView):
    """
    API view to receive device status updates.
    (Requires implementation for parsing and handling)
    """
    # permission_classes = [permissions.IsAuthenticated] # Add authentication later if needed

    def post(self, request, format=None):
        # --- Placeholder for Status Parsing and Handling Logic ---
        raw_data = request.data
        logger.info(f"Received device status update: {raw_data}")

        # Add logic here to parse raw_data (could be JSON, form data, etc.)
        # based on what the WiFi module sends.
        # Validate the data.
        # Store it (e.g., in DeviceStatus model or log file).
        # Potentially trigger notifications or other actions.

        # Example parsing (assuming JSON):
        try:
            device_id = raw_data.get('deviceId')
            timestamp = raw_data.get('timestamp')
            status_info = raw_data.get('status')
            # ... parse other fields

            if not device_id or not timestamp or not status_info:
                logger.error(f"Invalid status update format received: {raw_data}")
                raise ParseError(detail="Invalid status update format. Missing required fields.")

            # Add saving/processing logic here...
            logger.info(f"Successfully processed status for device {device_id}")

        except Exception as e:
            logger.error(f"Error processing status update: {e}\nData: {raw_data}")
            # Return a more specific error if possible
            return Response({"error": "Failed to process status update."}, status=status.HTTP_400_BAD_REQUEST)
        # --- End Placeholder ---

        return Response({"message": "Status received successfully."}, status=status.HTTP_200_OK)
