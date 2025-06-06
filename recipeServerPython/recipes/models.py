from django.db import models
from django.contrib.auth.models import User
from django.utils.translation import gettext_lazy as _
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

class DeviceModel(models.Model):
    STATUS_CHOICES = [
        ('pending', '待审核'),
        ('approved', '已批准'),
        ('rejected', '已拒绝'),
    ]
    model_identifier = models.CharField(
        _("型号标识"),
        max_length=100,
        unique=True,
        help_text=_("设备或App用于识别型号的唯一字符串，例如 SuperCooker-X1")
    )
    name = models.CharField(_("型号名称"), max_length=150)
    command_template = models.JSONField(
        _("命令模板"),
        blank=True,
        null=True,
        help_text=_("用于生成设备特定命令的JSON结构或模板")
    )
    description = models.TextField(_("描述"), blank=True)
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    updated_at = models.DateTimeField(_("更新时间"), auto_now=True)
    status = models.CharField(
        _("状态"),
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='pending'
    )
    review_comment = models.TextField(
        _("审核意见"),
        blank=True, 
        null=True
    )

    class Meta:
        verbose_name = _("设备型号")
        verbose_name_plural = _("设备型号")
        ordering = ['name']

    def __str__(self):
        return self.name

class Recipe(models.Model):
    STATUS_CHOICES = [
        ('draft', '草稿'),
        ('pending', '待审核'),
        ('published', '已发布'),
        ('rejected', '已拒绝'),
    ]
    DIFFICULTY_CHOICES = [
        (1, '简单'),
        (2, '适中'),
        (3, '困难'),
    ]
    SUITABLE_PERSON_CHOICES = [
        (1, '老人'),
        (2, '成人'),
        (3, '儿童'),
        (4, '婴幼儿'),
    ]
    
    # 基本信息
    title = models.CharField(_("菜谱名称"), max_length=200)
    description = models.TextField(_("描述"), blank=True)
    image = models.ImageField(
        _("图片"),
        upload_to='recipe_images/',
        blank=True,
        null=True
    )
    
    # 评分和统计
    score = models.IntegerField(_("评分"), default=0, blank=True)
    collection_count = models.PositiveIntegerField(_("收藏数"), default=0, blank=True)
    page_view = models.PositiveIntegerField(_("浏览量"), default=0, blank=True)
    
    # 菜谱特性
    difficulty = models.IntegerField(_("难度"), choices=DIFFICULTY_CHOICES, default=1)
    suitable_person = models.IntegerField(_("适合人群"), choices=SUITABLE_PERSON_CHOICES, default=2)
    tips = models.TextField(_("小贴士"), blank=True)
    tags = models.CharField(_("标签"), max_length=200, blank=True, help_text=_("用逗号分隔，如：早餐,猪肉,粥汤"))
    work_modes = models.CharField(_("工作模式"), max_length=200, blank=True, help_text=_("用逗号分隔，如：微波,烧烤"))
    
    # 烹饪时间
    prep_time_hours = models.PositiveIntegerField(_("准备时间(小时)"), default=0)
    prep_time_minutes = models.PositiveIntegerField(_("准备时间(分钟)"), default=0)
    cook_time_hours = models.PositiveIntegerField(_("烹饪时间(小时)"), default=0)
    cook_time_minutes = models.PositiveIntegerField(_("烹饪时间(分钟)"), default=0)
    
    # 温度设置
    temperature_value = models.PositiveIntegerField(_("温度值"), blank=True, null=True)
    temperature_unit = models.CharField(_("温度单位"), max_length=10, blank=True, default="℃")
    
    # 食材信息
    servings = models.PositiveIntegerField(_("份量"), blank=True, null=True)
    staple_food = models.JSONField(
        _("主料"),
        blank=True,
        null=True,
        help_text=_("结构化主料列表，例如 [{'name': '猪瘦肉', 'value': 400, 'unit': 'g'}]")
    )
    ingredients = models.JSONField(
        _("辅料"),
        blank=True,
        null=True,
        help_text=_("结构化辅料列表，例如 [{'name': '姜', 'value': 3, 'unit': '片'}]")
    )
    
    # 步骤信息
    steps = models.JSONField(
        _("步骤"),
        blank=True,
        null=True,
        help_text=_("结构化步骤列表，例如 [{'stepNo': 1, 'stepDescription': '准备食材', 'imageUrl': 'http://example.com/img.jpg'}]")
    )
    
    # 设备相关
    order = models.CharField(_("指令码"), max_length=200, blank=True)
    comal_position = models.IntegerField(_("烤盘位置"), blank=True, null=True)
    
    # 关联信息
    author = models.ForeignKey(
        User,
        verbose_name=_("作者"),
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    compatible_models = models.ManyToManyField(
        DeviceModel,
        verbose_name=_("兼容型号"),
        blank=True,
        related_name='recipes'
    )
    
    # 元数据
    created_at = models.DateTimeField(_("创建时间"), auto_now_add=True)
    updated_at = models.DateTimeField(_("更新时间"), auto_now=True)
    status = models.CharField(
        _("状态"),
        max_length=10, 
        choices=STATUS_CHOICES, 
        default='draft'
    )
    review_comment = models.TextField(
        _("审核意见"),
        blank=True, 
        null=True
    )

    class Meta:
        verbose_name = _("菜谱")
        verbose_name_plural = _("菜谱")
        ordering = ['-created_at', 'title']

    def __str__(self):
        return self.title

    def clean(self):
        """验证状态转换是否合法"""
        if self.pk:  # 只在更新时检查
            try:
                old_instance = Recipe.objects.get(pk=self.pk)
                if old_instance.status != self.status:
                    logger.info(f"Recipe {self.pk} status transition: {old_instance.status} -> {self.status}")
                    
                    # 检查状态转换是否合法
                    valid_transitions = {
                        'draft': ['pending'],
                        'pending': ['published', 'rejected'],
                        'published': ['rejected'],
                        'rejected': ['pending']
                    }
                    
                    if self.status not in valid_transitions.get(old_instance.status, []):
                        raise ValidationError({
                            'status': f'不能从 {old_instance.get_status_display()} 转换为 {self.get_status_display()}'
                        })
            except Recipe.DoesNotExist:
                pass
    
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
