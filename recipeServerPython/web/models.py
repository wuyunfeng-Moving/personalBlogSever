from django.db import models
from django.contrib.auth.models import User
from recipes.models import Recipe, DeviceModel

# Create your models here.

class Device(models.Model):
    """用户拥有的具体设备"""
    name = models.CharField("设备名称", max_length=100)
    model = models.ForeignKey(DeviceModel, on_delete=models.CASCADE, verbose_name="设备型号")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="所有者")
    device_id = models.CharField("设备ID", max_length=100, unique=True)
    is_active = models.BooleanField("是否激活", default=True)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)
    updated_at = models.DateTimeField("更新时间", auto_now=True)

    class Meta:
        verbose_name = "设备"
        verbose_name_plural = "设备"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.model.name})"

class RecipeDevice(models.Model):
    """菜谱与设备的关联，包含每个设备特定的命令内容"""
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, verbose_name="菜谱")
    device = models.ForeignKey(Device, on_delete=models.CASCADE, verbose_name="设备")
    command_content = models.TextField("命令内容", help_text="JSON格式的命令内容")
    created_at = models.DateTimeField("创建时间", auto_now_add=True)
    updated_at = models.DateTimeField("更新时间", auto_now=True)

    class Meta:
        verbose_name = "菜谱设备关联"
        verbose_name_plural = "菜谱设备关联"
        unique_together = ('recipe', 'device')

    def __str__(self):
        return f"{self.recipe.title} - {self.device.name}"

# 从forms.py中移除，只在models.py中定义
class RecipeDeviceCompatibility(models.Model):
    """菜谱与设备型号的兼容性"""
    recipe = models.ForeignKey(Recipe, on_delete=models.CASCADE, verbose_name="菜谱")
    device_model = models.ForeignKey(DeviceModel, on_delete=models.CASCADE, verbose_name="设备型号")
    command_template = models.TextField("命令模板", help_text="JSON格式的命令模板")
    created_at = models.DateTimeField("创建时间", auto_now_add=True)
    updated_at = models.DateTimeField("更新时间", auto_now=True)

    class Meta:
        verbose_name = "菜谱设备兼容性"
        verbose_name_plural = "菜谱设备兼容性"
        unique_together = ('recipe', 'device_model')

    def __str__(self):
        return f"{self.recipe.title} - {self.device_model.name}"
