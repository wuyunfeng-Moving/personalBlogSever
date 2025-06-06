import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout, authenticate
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.core.paginator import Paginator, PageNotAnInteger, EmptyPage
from django.core.paginator import Paginator
from django.db.models import Q
from django.http import HttpResponseRedirect, JsonResponse
from django.urls import reverse
from .forms import (
    LoginForm, RegisterForm, RecipeSubmitForm, 
    DeviceSubmitForm, DeviceForm, CommandStepForm
)
from recipes.models import Recipe, DeviceModel
from .models import Device, RecipeDevice, RecipeDeviceCompatibility
from django.contrib.auth.models import User
import os
import logging
from django.conf import settings
from django.core.exceptions import ValidationError
from django.forms import formset_factory

# 添加日志模块
logger = logging.getLogger(__name__)

def home(request):
    """首页视图，显示最新的6个菜谱"""
    logger.info(f"访问首页: 用户={request.user.username if request.user.is_authenticated else '匿名用户'}")
    recipes = Recipe.objects.filter(status='published').order_by('-created_at')[:6]
    return render(request, 'web/home.html', {'recipes': recipes})

def recipe_detail(request, recipe_id):
    """显示菜谱详情"""
    recipe = get_object_or_404(Recipe, id=recipe_id)
    
    # 权限检查: 只有 published 状态，或者作者本人，或者管理员才能查看
    can_view = recipe.status == 'published' or \
               (request.user.is_authenticated and recipe.author == request.user) or \
               (request.user.is_authenticated and request.user.is_staff)
               
    if not can_view:
        messages.error(request, "您没有权限查看此菜谱或该菜谱不存在。")
        # 可以选择重定向到首页或列表页，或返回 404/403
        # from django.http import Http404
        # raise Http404("Recipe not found or not accessible.") 
        return redirect('web:home') # 重定向到首页

    # 获取关联的设备
    recipe_devices = RecipeDevice.objects.filter(recipe=recipe)
    
    context = {
        'recipe': recipe,
        'recipe_devices': recipe_devices,
    }
    return render(request, 'web/recipe_detail.html', context)

def recipe_list(request):
    """显示所有已发布的菜谱列表"""
    recipes_list = Recipe.objects.filter(status='published').order_by('-created_at')
    
    # 分页处理
    paginator = Paginator(recipes_list, 9)  # 每页显示9个菜谱
    page = request.GET.get('page')
    
    try:
        recipes = paginator.page(page)
    except PageNotAnInteger:
        recipes = paginator.page(1)
    except EmptyPage:
        recipes = paginator.page(paginator.num_pages)
    
    return render(request, 'web/recipe_list.html', {'recipes': recipes})

def user_login(request):
    if request.method == 'POST':
        form = LoginForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            messages.success(request, f'欢迎回来，{user.username}！')
            return redirect('web:home')
    else:
        form = LoginForm()
    return render(request, 'web/login.html', {'form': form})

def user_logout(request):
    logout(request)
    messages.info(request, '您已成功登出')
    return redirect('web:home')

def user_register(request):
    if request.method == 'POST':
        form = RegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            username = form.cleaned_data.get('username')
            messages.success(request, f'账户已创建，欢迎 {username}！')
            login(request, user)
            return redirect('web:home')
    else:
        form = RegisterForm()
    return render(request, 'web/register.html', {'form': form})

@login_required
def user_profile(request):
    recipes = Recipe.objects.filter(author=request.user).order_by('-created_at')
    return render(request, 'web/profile.html', {'recipes': recipes})

@login_required
def submit_recipe(request):
    """提交新菜谱"""
    if request.method == 'POST':
        form = RecipeSubmitForm(request.POST, request.FILES)
        if form.is_valid():
            recipe = form.save(commit=False)
            recipe.author = request.user
            recipe.status = 'pending'  # 设为待审核状态
            recipe.save()
            form.save_m2m()  # 保存多对多关系（兼容设备）
            messages.success(request, '菜谱已提交，正在等待审核')
            # 确保这里执行了重定向
            return redirect('web:profile') 
        else:
            # 表单无效时，重新渲染页面并显示错误
             messages.error(request, "提交失败，请检查表单错误。")
             # Pass the invalid form back to the template
             return render(request, 'web/submit_recipe.html', {'form': form}) # Explicit render here
             
    # GET 请求时
    else: 
        form = RecipeSubmitForm()
        
    # Only render here for GET request
    return render(request, 'web/submit_recipe.html', {'form': form})

@login_required
def submit_device(request):
    """提交新设备型号"""
    if request.method == 'POST':
        form = DeviceSubmitForm(request.POST)
        if form.is_valid():
            device = form.save(commit=False)
            device.status = 'pending'  # 设为待审核状态
            device.save()
            messages.success(request, '设备型号已提交，正在等待审核')
            return redirect('web:profile')
    else:
        form = DeviceSubmitForm()
    return render(request, 'web/submit_device.html', {'form': form})

def is_admin(user):
    """检查用户是否是管理员"""
    return user.is_authenticated and user.is_staff

@user_passes_test(is_admin)
def review_submissions(request):
    """审核提交的菜谱和设备"""
    # 获取过滤条件
    status_filter = request.GET.get('status', 'pending')
    submission_type = request.GET.get('type', 'all')
    search_query = request.GET.get('search', '')
    page = request.GET.get('page', 1)
    
    # 准备查询集
    recipes = Recipe.objects.all()
    devices = DeviceModel.objects.all()
    
    # 应用状态过滤
    if status_filter != 'all':
        recipes = recipes.filter(status=status_filter)
        devices = devices.filter(status=status_filter)
    
    # 应用搜索查询
    if search_query:
        recipes = recipes.filter(
            Q(title__icontains=search_query) | 
            Q(description__icontains=search_query)
        )
        devices = devices.filter(
            Q(name__icontains=search_query) | 
            Q(description__icontains=search_query) |
            Q(model_identifier__icontains=search_query)
        )
    
    # 应用类型过滤
    if submission_type == 'recipes':
        devices = DeviceModel.objects.none()
    elif submission_type == 'devices':
        recipes = Recipe.objects.none()
    
    # 分页
    recipe_paginator = Paginator(recipes, 10)  # 每页10个菜谱
    device_paginator = Paginator(devices, 10)  # 每页10个设备
    
    try:
        recipes_page = recipe_paginator.page(page)
    except (PageNotAnInteger, EmptyPage):
        recipes_page = recipe_paginator.page(1) if recipes.exists() else None
    
    try:
        devices_page = device_paginator.page(page)
    except (PageNotAnInteger, EmptyPage):
        devices_page = device_paginator.page(1) if devices.exists() else None
    
    context = {
        'recipes': recipes_page,
        'devices': devices_page,
        'status_filter': status_filter,
        'submission_type': submission_type,
        'search_query': search_query,
    }
    
    return render(request, 'web/review_submissions.html', context)

@user_passes_test(is_admin)
def review_recipe(request, pk):
    """审核特定菜谱"""
    recipe = get_object_or_404(Recipe, id=pk)
    
    if request.method == 'POST':
        status = request.POST.get('status')
        comment = request.POST.get('comment', '')
        
        # 记录状态变更
        logger.info(f"Recipe {recipe.id} ({recipe.title}) status change attempt: {status}")
        
        # 验证状态值
        valid_statuses = ['pending', 'published', 'rejected']
        if status not in valid_statuses:
            error_msg = f"Invalid status value: {status}. Expected one of {valid_statuses}"
            logger.error(error_msg)
            messages.error(request, error_msg)
            return redirect('web:review_recipe', pk=pk)
        
        # 检查状态转换是否合法
        if status == 'approved':
            logger.warning(f"Unexpected status 'approved' for recipe {recipe.id}. Converting to 'published'")
            status = 'published'
            messages.warning(request, "状态 'approved' 已自动转换为 'published'")
        
        try:
            recipe.status = status
            recipe.review_comment = comment
            recipe.save()
            
            logger.info(f"Recipe {recipe.id} ({recipe.title}) status successfully changed to {status}")
            messages.success(request, f'菜谱 "{recipe.title}" 已更新为 {recipe.get_status_display()}')
            return redirect('web:review_submissions')
            
        except Exception as e:
            error_msg = f"Error updating recipe status: {str(e)}"
            logger.error(error_msg)
            messages.error(request, error_msg)
            return redirect('web:review_recipe', pk=pk)
    
    ingredients = recipe.ingredients or []
    steps = recipe.steps or []
    compatible_devices = recipe.compatible_models.all()
    
    context = {
        'recipe': recipe,
        'ingredients': ingredients,
        'steps': steps,
        'compatible_devices': compatible_devices,
    }
    
    return render(request, 'web/review_recipe.html', context)

@user_passes_test(is_admin)
def review_device(request, pk):
    """审核特定设备"""
    device = get_object_or_404(DeviceModel, id=pk)
    
    if request.method == 'POST':
        status = request.POST.get('status')
        comment = request.POST.get('comment', '')
        
        if status in ['approved', 'rejected']:
            device.status = status
            device.review_comment = comment
            device.save()
            messages.success(request, f'设备型号 "{device.name}" 已更新为 {device.get_status_display()}')
            return redirect('web:review_submissions')
    
    context = {
        'device': device,
    }
    
    return render(request, 'web/review_device.html', context)

@login_required
def device_list(request):
    """管理员设备列表页面"""
    # 只有管理员可以查看设备列表
    if not request.user.is_staff:
        messages.error(request, '只有管理员可以查看设备列表')
        return redirect('web:home')
    
    devices = Device.objects.all()
    context = {
        'devices': devices
    }
    return render(request, 'web/device_list.html', context)

@login_required
def add_device(request):
    """添加新设备"""
    # 只有管理员可以添加设备
    if not request.user.is_staff:
        messages.error(request, '只有管理员可以添加设备')
        return redirect('web:home')
    
    if request.method == 'POST':
        form = DeviceForm(request.POST, user=request.user)
        if form.is_valid():
            form.save()
            messages.success(request, '设备添加成功')
            return redirect('web:device_list')
    else:
        form = DeviceForm(user=request.user)
    
    context = {
        'form': form,
        'is_add': True
    }
    return render(request, 'web/device_form.html', context)

@login_required
def edit_device(request, pk):
    """编辑设备"""
    # 只有管理员可以编辑设备
    if not request.user.is_staff:
        messages.error(request, '只有管理员可以编辑设备')
        return redirect('web:home')
    
    device = get_object_or_404(Device, id=pk)
    
    if request.method == 'POST':
        form = DeviceForm(request.POST, request.FILES, instance=device)
        if form.is_valid():
            form.save()
            messages.success(request, '设备更新成功')
            return redirect('web:device_list')
    else:
        form = DeviceForm(instance=device)
    
    context = {
        'form': form,
        'is_add': False,
        'device': device
    }
    return render(request, 'web/device_form.html', context)

@login_required
def delete_device(request, pk):
    """删除设备"""
    # 只有管理员可以删除设备
    if not request.user.is_staff:
        messages.error(request, '只有管理员可以删除设备')
        return redirect('web:home')
    
    device = get_object_or_404(Device, id=pk)
    
    if request.method == 'POST':
        device.delete()
        messages.success(request, '设备已删除')
        return redirect('web:device_list')
    
    context = {
        'device': device
    }
    return render(request, 'web/device_confirm_delete.html', context)

@login_required
def view_logs(request):
    """日志查看页面"""
    # 只有管理员可以查看日志
    if not request.user.is_staff:
        messages.error(request, '只有管理员可以查看日志')
        return redirect('web:home')
    
    log_file = os.path.join(settings.LOGS_DIR, 'django.log')
    lines = 100  # 默认显示最后100行
    
    if request.GET.get('lines'):
        try:
            lines = int(request.GET.get('lines'))
            if lines < 1:
                lines = 100
        except ValueError:
            lines = 100
    
    if os.path.exists(log_file):
        with open(log_file, 'r', encoding='utf-8', errors='replace') as f:
            # 读取最后N行
            try:
                log_content = ''.join(f.readlines()[-lines:])
            except IndexError:
                # 如果文件行数少于请求的行数
                f.seek(0)
                log_content = f.read()
    else:
        log_content = '日志文件不存在'
    
    context = {
        'log_content': log_content,
        'lines': lines,
    }
    return render(request, 'web/view_logs.html', context)

@login_required
def device_detail(request, pk):
    """显示设备详情和支持的菜谱"""
    device = get_object_or_404(Device, id=pk)
    
    # 检查用户权限
    if not request.user.is_staff and device.owner != request.user:
        messages.error(request, '您没有权限查看此设备')
        return redirect('web:home')
    
    # 获取支持此设备的菜谱
    recipe_devices = RecipeDevice.objects.filter(
        device=device,
        recipe__status='published'
    ).select_related('recipe', 'recipe__author').order_by('-recipe__created_at')
    
    context = {
        'device': device,
        'recipe_devices': recipe_devices,
    }
    return render(request, 'web/device_detail.html', context)

# Define the formset for command steps
CommandStepFormSet = formset_factory(CommandStepForm, extra=1, can_delete=True)

@login_required
def add_edit_device_command_guide(request, recipe_id, device_id):
    """处理添加或编辑菜谱设备命令的引导界面"""
    recipe = get_object_or_404(Recipe, id=recipe_id)
    device = get_object_or_404(Device, id=device_id)
    
    # 权限检查: 必须是菜谱作者
    if recipe.author != request.user:
        messages.error(request, "您不是该菜谱的作者，无法编辑设备命令")
        return redirect('web:recipe_detail', recipe_id=recipe_id)
        
    # 尝试获取现有关联 (用于编辑模式)
    try:
        recipe_device = RecipeDevice.objects.get(recipe=recipe, device=device)
        is_edit = True
        # 从现有 command_content (JSON) 解析初始数据
        try:
            initial_steps_data = json.loads(recipe_device.command_content or '[]')
            if not isinstance(initial_steps_data, list):
                 initial_steps_data = [] # Handle non-list JSON
        except json.JSONDecodeError:
            initial_steps_data = []
            messages.warning(request, "无法解析现有的命令内容，请重新输入步骤。")
            
    except RecipeDevice.DoesNotExist:
        recipe_device = None
        is_edit = False
        initial_steps_data = []

    if request.method == 'POST':
        formset = CommandStepFormSet(request.POST, prefix='steps')
        if formset.is_valid():
            # 1. 从 formset 获取有效的步骤数据
            steps_data = []
            for form in formset.cleaned_data:
                if form and not form.get('DELETE', False): # 忽略空表单和标记为删除的表单
                    # 这里可以添加更多字段，如 description, mode 等
                    steps_data.append({
                        'time': form.get('time'),
                        'mode': form.get('mode'), # 假设有 mode 字段
                        # 添加其他需要的步骤参数...
                    })
            
            # 2. **调用命令生成逻辑 (Placeholder)**
            #    需要一个函数将 steps_data 转换为最终的 JSON command_content
            #    generated_command_json = generate_command_json(steps_data, device)
            #    现在暂时直接使用 steps_data 作为 JSON
            generated_command_json = json.dumps(steps_data)

            # 3. 创建或更新 RecipeDevice
            if is_edit and recipe_device:
                recipe_device.command_content = generated_command_json
                recipe_device.save()
                messages.success(request, f"成功更新了设备 {device.name} 的命令。")
            else:
                RecipeDevice.objects.create(
                    recipe=recipe,
                    device=device,
                    command_content=generated_command_json
                )
                messages.success(request, f"成功为设备 {device.name} 添加了命令。")
                
            return redirect('web:recipe_detail', recipe_id=recipe_id)
        else:
            # 表单无效，重新渲染页面显示错误
            messages.error(request, "请修正表单中的错误。")
            pass # 继续执行到下面的 render
    else:
        # GET 请求
        formset = CommandStepFormSet(initial=initial_steps_data, prefix='steps')

    context = {
        'recipe': recipe,
        'device': device,
        'formset': formset,
        'is_edit': is_edit,
    }
    return render(request, 'web/device_command_guide.html', context)

# --- Placeholder for Command Generation Logic --- 
def generate_command_json(steps_data, device):
    # TODO: 实现将结构化步骤数据转换为最终命令 JSON 的逻辑
    # - 可能需要考虑 device.model.command_template
    # - 进行必要的验证和格式化
    # - 返回 JSON 字符串
    logger.warning(f"Command generation logic not implemented yet for device {device.name}. Using raw steps data.")
    return json.dumps(steps_data) # 临时实现
