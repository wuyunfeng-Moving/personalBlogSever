from django import forms
from django.contrib.auth.forms import UserCreationForm, AuthenticationForm
from django.contrib.auth.models import User
from recipes.models import Recipe, DeviceModel
from .models import Device, RecipeDevice, RecipeDeviceCompatibility
import json

class LoginForm(AuthenticationForm):
    username = forms.CharField(
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '请输入用户名'}),
        label='用户名'
    )
    password = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': '请输入密码'}),
        label='密码'
    )

class RegisterForm(UserCreationForm):
    username = forms.CharField(
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '请输入用户名'}),
        label='用户名',
        help_text='用户名长度不超过150个字符，只能包含字母、数字和@/./+/-/_'
    )
    email = forms.EmailField(
        widget=forms.EmailInput(attrs={'class': 'form-control', 'placeholder': '请输入电子邮箱'}),
        label='电子邮箱',
        help_text='请输入有效的电子邮箱地址'
    )
    password1 = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': '请输入密码'}),
        label='密码',
        help_text='密码不能过于简单，至少8个字符'
    )
    password2 = forms.CharField(
        widget=forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': '请再次输入密码'}),
        label='确认密码',
        help_text='请再次输入相同的密码进行确认'
    )

    class Meta:
        model = User
        fields = ('username', 'email', 'password1', 'password2')

class RecipeSubmitForm(forms.ModelForm):
    """菜谱提交表单"""
    tags = forms.CharField(
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '早餐,猪肉,粥汤'}),
        label='标签',
        required=False,
        help_text='用逗号分隔多个标签'
    )
    
    work_modes = forms.CharField(
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '微波,烧烤'}),
        label='工作模式',
        required=False,
        help_text='用逗号分隔多个工作模式'
    )
    
    class Meta:
        model = Recipe
        fields = [
            'title', 'description', 'image', 'difficulty', 'suitable_person', 
            'tips', 'tags', 'work_modes', 'prep_time_hours', 'prep_time_minutes', 
            'cook_time_hours', 'cook_time_minutes', 'temperature_value', 
            'temperature_unit', 'servings', 'staple_food', 'ingredients', 
            'steps', 'comal_position', 'compatible_models'
        ]
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'placeholder': '菜谱名称'}),
            'description': forms.Textarea(attrs={
                'class': 'form-control', 
                'placeholder': '菜谱描述', 
                'rows': 3
            }),
            'difficulty': forms.Select(attrs={'class': 'form-control'}),
            'suitable_person': forms.Select(attrs={'class': 'form-control'}),
            'tips': forms.Textarea(attrs={
                'class': 'form-control', 
                'placeholder': '烹饪小贴士，例如：1、烧烤盘上垫锡纸或者油纸，\n2、如果牛肉刚从冰箱取出直接烹饪，加热时间则应多加1-2分钟。', 
                'rows': 3
            }),
            'prep_time_hours': forms.NumberInput(attrs={
                'class': 'form-control', 
                'placeholder': '0'
            }),
            'prep_time_minutes': forms.NumberInput(attrs={
                'class': 'form-control', 
                'placeholder': '30'
            }),
            'cook_time_hours': forms.NumberInput(attrs={
                'class': 'form-control', 
                'placeholder': '0'
            }),
            'cook_time_minutes': forms.NumberInput(attrs={
                'class': 'form-control', 
                'placeholder': '45'
            }),
            'temperature_value': forms.NumberInput(attrs={
                'class': 'form-control', 
                'placeholder': '180'
            }),
            'temperature_unit': forms.TextInput(attrs={
                'class': 'form-control', 
                'placeholder': '℃'
            }),
            'servings': forms.NumberInput(attrs={
                'class': 'form-control', 
                'placeholder': '4'
            }),
            'staple_food': forms.Textarea(attrs={
                'class': 'form-control', 
                'placeholder': '[{"name": "猪瘦肉", "value": 400, "unit": "g"}, {"name": "无花果", "value": 100, "unit": "g"}]', 
                'rows': 4
            }),
            'ingredients': forms.Textarea(attrs={
                'class': 'form-control', 
                'placeholder': '[{"name": "姜", "value": 3, "unit": "片"}, {"name": "盐", "value": 1, "unit": "汤勺"}]', 
                'rows': 4
            }),
            'steps': forms.Textarea(attrs={
                'class': 'form-control', 
                'placeholder': '[{"stepNo": 1, "stepDescription": "准备好所有食材", "imageUrl": ""}, {"stepNo": 2, "stepDescription": "猪肉切块", "imageUrl": ""}]', 
                'rows': 6
            }),
            'comal_position': forms.NumberInput(attrs={
                'class': 'form-control', 
                'placeholder': '5'
            }),
            'image': forms.FileInput(attrs={'class': 'form-control'}),
            'compatible_models': forms.SelectMultiple(attrs={
                'class': 'form-control', 
                'placeholder': '选择兼容的设备型号'
            }),
        }

class DeviceSubmitForm(forms.ModelForm):
    """设备型号提交表单"""
    
    class Meta:
        model = DeviceModel
        fields = ['model_identifier', 'name', 'command_template', 'description']
        widgets = {
            'model_identifier': forms.TextInput(attrs={
                'class': 'form-control', 
                'placeholder': '设备型号标识符，例如：SmartCooker-X1'
            }),
            'name': forms.TextInput(attrs={
                'class': 'form-control', 
                'placeholder': '设备型号名称，例如：智能电饭煲 X1'
            }),
            'command_template': forms.Textarea(attrs={
                'class': 'form-control', 
                'placeholder': '{"type": "cooker", "max_temperature": 180, "modes": ["煮饭", "炖汤", "蒸煮"]}', 
                'rows': 5
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control', 
                'placeholder': '设备型号的详细描述', 
                'rows': 3
            }),
        }

class DeviceForm(forms.ModelForm):
    """设备添加和编辑表单"""
    
    class Meta:
        model = Device
        fields = ['name', 'model', 'device_id', 'is_active']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '输入设备名称'
            }),
            'model': forms.Select(attrs={
                'class': 'form-select',
            }),
            'device_id': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': '输入设备ID'
            }),
            'is_active': forms.CheckboxInput(attrs={
                'class': 'form-check-input',
            }),
        }
        
    def __init__(self, *args, **kwargs):
        self.user = kwargs.pop('user', None)
        super().__init__(*args, **kwargs)
        
    def save(self, commit=True):
        device = super().save(commit=False)
        if not device.pk:  # 新建设备时
            device.owner = self.user
        if commit:
            device.save()
        return device 

# --- New Form for Command Guide Steps ---

class CommandStepForm(forms.Form):
    """用于命令生成引导界面中单个步骤的表单"""
    # 可以根据需要添加更多字段，例如：
    # description = forms.CharField(widget=forms.Textarea, required=False)
    # temperature = forms.IntegerField(required=False)
    # pressure = forms.IntegerField(required=False)
    # ...等等
    
    time = forms.IntegerField(
        label="时间 (秒)", 
        required=True, # 假设时间是必填的
        min_value=0, 
        widget=forms.NumberInput(attrs={'class': 'form-control', 'placeholder': '例如：60'})
    )
    mode = forms.CharField(
        label="模式/负载", 
        required=False, # 假设模式是可选的
        widget=forms.TextInput(attrs={'class': 'form-control', 'placeholder': '例如：bake, stir, high_power'})
    )
    # 可以添加一个隐藏字段来存储步骤顺序，如果需要的话
    # order = forms.IntegerField(widget=forms.HiddenInput(), required=False) 