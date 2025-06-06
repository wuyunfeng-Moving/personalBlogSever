from django.urls import path
from . import views

app_name = 'api'

urlpatterns = [
    path('recipes/', views.RecipeListView.as_view(), name='recipe-list'),
    path('recipes/<int:pk>/', views.RecipeDetailView.as_view(), name='recipe-detail'),
    path('recipes/<int:pk>/commands/', views.RecipeCommandsView.as_view(), name='recipe-commands'),
    path('devices/status/', views.DeviceStatusUpdateView.as_view(), name='device-status-update'),
] 