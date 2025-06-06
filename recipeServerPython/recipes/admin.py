from django.contrib import admin
from .models import Recipe, DeviceModel

@admin.register(DeviceModel)
class DeviceModelAdmin(admin.ModelAdmin):
    list_display = ('name', 'model_identifier', 'created_at', 'updated_at')
    search_fields = ('name', 'model_identifier')

@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('title', 'author', 'created_at', 'updated_at')
    list_filter = ('author', 'created_at', 'compatible_models')
    search_fields = ('title', 'description', 'ingredients', 'instructions')
    filter_horizontal = ('compatible_models',) # Easier selection for ManyToMany
    readonly_fields = ('created_at', 'updated_at')
    fieldsets = (
        (None, {
            'fields': ('title', 'description', 'author', 'image')
        }),
        ('详细信息', {
            'fields': ('ingredients', 'instructions', 'prep_time_minutes', 'cook_time_minutes', 'servings')
        }),
        ('设备兼容性', {
            'fields': ('compatible_models',)
        }),
        ('时间戳', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
