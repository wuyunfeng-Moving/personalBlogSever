from rest_framework import serializers
from .models import CloudCommand, Device, DeviceStatus, Recipe

# 这是一个示例序列化器，用于演示
# 您可以根据需要进行修改或删除

class RecipeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recipe
        fields = '__all__'

class CloudCommandSerializer(serializers.ModelSerializer):
    class Meta:
        model = CloudCommand
        fields = '__all__'

class DeviceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Device
        fields = '__all__'

class DeviceStatusSerializer(serializers.ModelSerializer):
    class Meta:
        model = DeviceStatus
        fields = '__all__' 