from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from recipes.models import Recipe, DeviceModel
from .models import Device, RecipeDevice
import json
from django.utils.html import escape
# Import forms if we need to test form validation directly
# from .forms import DeviceCommandGuideForm # Assuming form name

class WebViewTests(TestCase):
    """测试web应用的视图功能"""
    
    def setUp(self):
        # 创建测试数据
        self.client = Client()
        self.user = User.objects.create_user(
            username='testuser', 
            email='test@example.com',
            password='testpassword'
        )
        self.other_user = User.objects.create_user(
            username='otheruser', 
            email='other@example.com',
            password='otherpassword'
        )
        self.admin_user = User.objects.create_superuser(
            username='adminuser', 
            email='admin@example.com',
            password='adminpassword',
            is_staff=True
        )
        
        self.model1 = DeviceModel.objects.create(
            model_identifier='ModelX', 
            name='Test Model X',
            status='approved'
        )
        
        self.recipe_published = Recipe.objects.create(
            title='Published Recipe',
            description='Published description.',
            author=self.user,
            status='published'
        )
        self.recipe_pending = Recipe.objects.create(
            title='Pending Recipe',
            description='Pending description.',
            author=self.user,
            status='pending'
        )
        self.recipe_other_user = Recipe.objects.create(
            title='Other User Recipe',
            description='Another description.',
            author=self.other_user,
            status='published'
        )
        
        self.device1 = Device.objects.create(
            name="Test Device 1",
            model=self.model1,
            owner=self.user,
            device_id="DEV001"
        )
        
        # 常用URL
        self.home_url = reverse('web:home')
        self.recipe_detail_url = reverse('web:recipe_detail', args=[self.recipe_published.id])
        self.recipe_detail_pending_url = reverse('web:recipe_detail', args=[self.recipe_pending.id])
        self.login_url = reverse('web:login')
        self.register_url = reverse('web:register')
        self.profile_url = reverse('web:profile')
        self.logout_url = reverse('web:logout')
        self.submit_recipe_url = reverse('web:submit_recipe')
        self.device_detail_url = reverse('web:device_detail', args=[self.device1.id])
        # Command Guide URLs (assuming new URL names)
        self.add_command_guide_url = reverse('web:add_device_command_guide', kwargs={'recipe_id': self.recipe_published.id, 'device_id': self.device1.id})
        self.edit_command_guide_url = lambda r_pk, d_pk: reverse('web:edit_device_command_guide', kwargs={'recipe_id': r_pk, 'device_id': d_pk}) # Example for editing

    # --- Existing tests for home, login, register, logout, profile --- 
    # (Keep these as they are, assuming no major changes)
    def test_home_view(self):
        """测试首页视图"""
        response = self.client.get(self.home_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'web/home.html')
        self.assertContains(response, '欢迎使用菜谱服务器')
        self.assertContains(response, self.recipe_published.title)
        self.assertNotContains(response, self.recipe_pending.title)
        self.assertIn('recipes', response.context)

    def test_recipe_detail_view(self):
        """测试菜谱详情页视图 (已发布)"""
        # Create a RecipeDevice with a generated command for testing display
        generated_command = json.dumps([{"step": 1, "time": 10, "mode": "bake"}])
        RecipeDevice.objects.create(
            recipe=self.recipe_published,
            device=self.device1,
            command_content=generated_command
        )
        response = self.client.get(self.recipe_detail_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'web/recipe_detail.html')
        self.assertContains(response, self.recipe_published.title)
        self.assertIn('recipe', response.context)
        self.assertIn('recipe_devices', response.context)
        # Check if the generated command is displayed (might need escaping check)
        self.assertContains(response, escape(generated_command))

    def test_recipe_detail_view_pending_owner(self):
        """测试作者可以查看自己未发布的菜谱详情"""
        self.client.login(username='testuser', password='testpassword')
        response = self.client.get(self.recipe_detail_pending_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'web/recipe_detail.html')
        self.assertContains(response, self.recipe_pending.title)

    def test_recipe_detail_view_pending_admin(self):
        """测试管理员可以查看未发布的菜谱详情"""
        self.client.login(username='adminuser', password='adminpassword')
        response = self.client.get(self.recipe_detail_pending_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'web/recipe_detail.html')
        self.assertContains(response, self.recipe_pending.title)

    def test_recipe_detail_view_pending_other_user(self):
        """测试其他用户无法查看未发布的菜谱详情"""
        self.client.login(username='otheruser', password='otherpassword')
        response = self.client.get(self.recipe_detail_pending_url)
        # Should redirect or return 404/403 depending on implementation
        self.assertIn(response.status_code, [302, 403, 404]) 

    def test_login_view_get(self):
        """测试登录页面GET请求"""
        response = self.client.get(self.login_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'web/login.html')

    def test_login_view_post_success(self):
        """测试成功登录"""
        response = self.client.post(self.login_url, {
            'username': 'testuser',
            'password': 'testpassword'
        }, follow=True) 
        self.assertRedirects(response, self.home_url)
        self.assertTrue(response.context['user'].is_authenticated)

    def test_login_view_post_invalid(self):
        """测试登录失败"""
        response = self.client.post(self.login_url, {
            'username': 'testuser',
            'password': 'wrongpassword'
        })
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.context['user'].is_authenticated)

    def test_register_view_get(self):
        """测试注册页面GET请求"""
        response = self.client.get(self.register_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'web/register.html')

    def test_register_view_post_success(self):
        """测试成功注册"""
        response = self.client.post(self.register_url, {
            'username': 'newuser',
            'email': 'new@example.com',
            'password1': 'ComplexPassword123!',
            'password2': 'ComplexPassword123!'
        }, follow=True)
        self.assertRedirects(response, self.home_url)
        self.assertTrue(response.context['user'].is_authenticated)

    def test_register_view_post_invalid(self):
        """测试注册失败 - 密码不匹配"""
        response = self.client.post(self.register_url, {
            'username': 'anothernewuser',
            'email': 'another@example.com',
            'password1': 'ComplexPassword123!',
            'password2': 'DifferentPassword321!'
        })
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'web/register.html')

    def test_logout_view(self):
        """测试登出功能"""
        self.client.login(username='testuser', password='testpassword')
        response = self.client.get(self.logout_url, follow=True)
        self.assertRedirects(response, self.home_url)
        self.assertFalse(response.context['user'].is_authenticated)

    def test_profile_view_authenticated(self):
        """测试已登录用户访问个人资料页"""
        self.client.login(username='testuser', password='testpassword')
        response = self.client.get(self.profile_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'web/profile.html')
        self.assertContains(response, self.recipe_published.title)
        self.assertContains(response, self.recipe_pending.title) # Should see own pending

    def test_profile_view_unauthenticated(self):
        """测试未登录用户访问个人资料页"""
        response = self.client.get(self.profile_url)
        self.assertRedirects(response, f'{self.login_url}?next={self.profile_url}')

    def test_submit_recipe_view_get(self):
        """测试提交菜谱页面GET请求"""
        self.client.login(username='testuser', password='testpassword')
        response = self.client.get(self.submit_recipe_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'web/submit_recipe.html')

    def test_submit_recipe_view_post_authenticated(self):
        """测试已认证用户提交菜谱"""
        self.client.login(username='testuser', password='testpassword')
        recipe_data = {
            'title': 'Submitted Recipe',
            'description': 'Desc',
            'difficulty': 1,
            'suitable_person': 1,
            'prep_time_minutes': 5,
            'cook_time_minutes': 10,
            'servings': 2,
            'staple_food': '[]', # JSON field
            'ingredients': '[]', # JSON field
            'steps': '[]',       # JSON field
            'compatible_models': [self.model1.id], # M2M
            # --- Adding potentially missing fields --- 
            'tips': 'No tips', # Assuming non-required text field
            'tags': 'test, submit', # Assuming non-required char field
            'work_modes': 'bake', # Assuming non-required char field
            'prep_time_hours': 0, # Assuming NumberInput, default 0
            'cook_time_hours': 0, # Assuming NumberInput, default 0
            'temperature_value': 180, # Assuming NumberInput, default 180
            'temperature_unit': 'C', # Assuming TextInput, default 'C'
            'comal_position': 1, # Assuming NumberInput, default 1
            # 'image': None # FileField is harder to test without actual file upload
        }
        # Note: FileField ('image') is not included here. If it's required,
        # the form will still be invalid. We assume it's optional for now.
        response = self.client.post(self.submit_recipe_url, recipe_data)
        
        # Check for form errors if still failing
        if response.status_code != 302:
            form = response.context.get('form')
            if form:
                print("Submit Recipe Form Errors:", form.errors.as_json())
            else:
                 print("Submit Recipe Test: No form in context, status code:", response.status_code)
                 
        self.assertRedirects(response, self.profile_url) # Redirects to profile
        new_recipe = Recipe.objects.get(title='Submitted Recipe')
        self.assertEqual(new_recipe.status, 'pending')
        self.assertEqual(new_recipe.author, self.user)

    def test_submit_recipe_view_post_unauthenticated(self):
        """测试未认证用户无法提交菜谱"""
        response = self.client.get(self.submit_recipe_url)
        self.assertRedirects(response, f'{self.login_url}?next={self.submit_recipe_url}')
        
    # --- Device Detail Tests --- 
    def test_device_detail_view_requires_login_or_staff(self):
        """测试设备详情页需要登录（所有者）或管理员权限"""
        # Unauthenticated
        response = self.client.get(self.device_detail_url)
        self.assertRedirects(response, f'{self.login_url}?next={self.device_detail_url}')
        
        # Wrong user
        self.client.login(username='otheruser', password='otherpassword')
        response = self.client.get(self.device_detail_url)
        self.assertRedirects(response, self.home_url) # Or check for message
        self.client.logout()

        # Owner
        self.client.login(username='testuser', password='testpassword')
        response = self.client.get(self.device_detail_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'web/device_detail.html')
        self.client.logout()

        # Admin
        self.client.login(username='adminuser', password='adminpassword')
        response = self.client.get(self.device_detail_url)
        self.assertEqual(response.status_code, 200)
        self.client.logout()
        
    def test_device_detail_shows_supported_recipes(self):
        """测试设备详情页正确显示支持的已发布菜谱及其命令"""
        # Create associations
        cmd1 = json.dumps([{"step": 1, "time": 10}])
        cmd2 = json.dumps([{"step": 1, "time": 20}])
        RecipeDevice.objects.create(recipe=self.recipe_published, device=self.device1, command_content=cmd1)
        # Add another published recipe for this device
        recipe_pub2 = Recipe.objects.create(title="Another Pub Recipe", author=self.user, status='published')
        RecipeDevice.objects.create(recipe=recipe_pub2, device=self.device1, command_content=cmd2)
        # Add a pending recipe association (should not show)
        RecipeDevice.objects.create(recipe=self.recipe_pending, device=self.device1, command_content='{}')

        self.client.login(username='testuser', password='testpassword')
        response = self.client.get(self.device_detail_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'web/device_detail.html')
        self.assertContains(response, self.recipe_published.title)
        self.assertContains(response, recipe_pub2.title)
        self.assertNotContains(response, self.recipe_pending.title) # Pending should not show
        self.assertContains(response, escape(cmd1)) # Check generated command display
        self.assertContains(response, escape(cmd2))
        
    def test_device_detail_edit_command_button_permission(self):
        """测试编辑命令按钮只对菜谱作者显示"""
        # Create associations
        cmd_own = json.dumps([{"step": 1, "time": 10}])
        cmd_other = json.dumps([{"step": 1, "time": 5}])
        RecipeDevice.objects.create(recipe=self.recipe_published, device=self.device1, command_content=cmd_own)
        RecipeDevice.objects.create(recipe=self.recipe_other_user, device=self.device1, command_content=cmd_other)
        
        # Log in as device owner (and author of recipe_published)
        self.client.login(username='testuser', password='testpassword')
        response = self.client.get(self.device_detail_url)
        self.assertEqual(response.status_code, 200)
        
        # Expect button for own recipe
        edit_url_own = self.edit_command_guide_url(self.recipe_published.id, self.device1.id)
        self.assertContains(response, f'href="{edit_url_own}"')
        
        # Expect NO button for other user's recipe
        edit_url_other = self.edit_command_guide_url(self.recipe_other_user.id, self.device1.id)
        self.assertNotContains(response, f'href="{edit_url_other}"')

# Separate class for the new command guide tests
class CommandGuideTests(TestCase):
    """测试命令生成引导视图和逻辑"""
    
    def setUp(self):
        self.client = Client()
        self.user = User.objects.create_user(username='testuser', password='testpassword')
        self.other_user = User.objects.create_user(username='otheruser', password='otherpassword')
        self.model1 = DeviceModel.objects.create(model_identifier='ModelX', name='Test Model X', status='approved')
        self.recipe = Recipe.objects.create(title='Guide Recipe', author=self.user, status='published')
        self.device = Device.objects.create(name="Guide Device", model=self.model1, owner=self.user)
        self.other_recipe = Recipe.objects.create(title='Other Guide Recipe', author=self.other_user, status='published')
        
        # URL for adding new command
        self.add_url = reverse('web:add_device_command_guide', kwargs={'recipe_id': self.recipe.id, 'device_id': self.device.id})
        # URL for editing existing command
        self.edit_url = reverse('web:edit_device_command_guide', kwargs={'recipe_id': self.recipe.id, 'device_id': self.device.id})
        self.edit_url_other = reverse('web:edit_device_command_guide', kwargs={'recipe_id': self.other_recipe.id, 'device_id': self.device.id})

    def test_add_command_guide_view_get_requires_login(self):
        """测试访问命令引导页需要登录"""
        response = self.client.get(self.add_url)
        self.assertRedirects(response, f'{reverse("web:login")}?next={self.add_url}')
        
    def test_add_command_guide_view_get_requires_author(self):
        """测试只有菜谱作者能访问命令引导页"""
        self.client.login(username='otheruser', password='otherpassword')
        response = self.client.get(self.add_url)
        # Should redirect or show permission denied
        self.assertIn(response.status_code, [302, 403, 404])
        if response.status_code == 302:
            self.assertRedirects(response, reverse('web:recipe_detail', args=[self.recipe.id]))

    def test_add_command_guide_view_get_success(self):
        """测试作者成功访问命令引导页"""
        self.client.login(username='testuser', password='testpassword')
        response = self.client.get(self.add_url)
        self.assertEqual(response.status_code, 200)
        # Assuming template name
        self.assertTemplateUsed(response, 'web/device_command_guide.html') 
        self.assertIn('form', response.context) # Check if form/formset is passed
        self.assertIn('recipe', response.context)
        self.assertIn('device', response.context)
        
    def test_add_command_guide_view_post_success(self):
        """测试通过引导页成功提交步骤并生成命令"""
        self.client.login(username='testuser', password='testpassword')
        # Simulate form data for steps (needs to match the actual form implementation)
        # This likely involves FormSets, e.g., form-TOTAL_FORMS, form-INITIAL_FORMS, etc.
        post_data = {
            'steps-TOTAL_FORMS': '2',
            'steps-INITIAL_FORMS': '0',
            'steps-MIN_NUM_FORMS': '0',
            'steps-MAX_NUM_FORMS': '1000',
            'steps-0-time': '15', # Step 1 time
            'steps-0-mode': 'bake', # Step 1 mode
            'steps-0-description': 'First step',
            'steps-1-time': '5',  # Step 2 time
            'steps-1-mode': 'stir',
            'steps-1-description': 'Second step',
        }
        response = self.client.post(self.add_url, post_data)
        
        # Check redirect after success
        self.assertRedirects(response, reverse('web:recipe_detail', args=[self.recipe.id]))
        
        # Check database for created/updated RecipeDevice
        recipe_device = RecipeDevice.objects.filter(recipe=self.recipe, device=self.device)
        self.assertTrue(recipe_device.exists())
        rd_instance = recipe_device.first()
        
        # Check generated command_content (exact structure depends on generation logic)
        try:
            generated_cmd = json.loads(rd_instance.command_content)
            self.assertIsInstance(generated_cmd, list)
            self.assertEqual(len(generated_cmd), 2)
            # Check content based on expected generation logic
            self.assertEqual(generated_cmd[0]['time'], 15)
            self.assertEqual(generated_cmd[0]['mode'], 'bake')
            self.assertEqual(generated_cmd[1]['time'], 5)
            self.assertEqual(generated_cmd[1]['mode'], 'stir')
        except json.JSONDecodeError:
            self.fail("command_content is not valid JSON")
            
    def test_add_command_guide_view_post_invalid_steps(self):
        """测试提交无效步骤数据"""
        self.client.login(username='testuser', password='testpassword')
        post_data = {
            'steps-TOTAL_FORMS': '1',
            'steps-INITIAL_FORMS': '0',
            'steps-0-time': '', # Missing time
            'steps-0-mode': 'bake',
            'steps-0-description': 'Invalid step',
        }
        response = self.client.post(self.add_url, post_data)
        
        self.assertEqual(response.status_code, 200) # Should re-render the form
        self.assertTemplateUsed(response, 'web/device_command_guide.html') 
        self.assertContains(response, '字段是必填项') # Check for form error message
        
        # Check that no RecipeDevice was created
        self.assertFalse(RecipeDevice.objects.filter(recipe=self.recipe, device=self.device).exists())
        
    def test_edit_command_guide_view_get(self):
        """测试访问编辑命令引导页并加载现有数据"""
        # Create existing data first
        initial_command = json.dumps([
            {"step": 1, "time": 20, "mode": "roast", "description": "Roast first"},
            {"step": 2, "time": 10, "mode": "rest", "description": "Let it rest"}
        ])
        RecipeDevice.objects.create(recipe=self.recipe, device=self.device, command_content=initial_command)
        
        self.client.login(username='testuser', password='testpassword')
        response = self.client.get(self.edit_url)
        self.assertEqual(response.status_code, 200)
        self.assertTemplateUsed(response, 'web/device_command_guide.html')
        # Check if formset is pre-populated (difficult to check precisely without knowing form structure)
        # A simpler check might be to see if the known data appears in the response HTML
        self.assertContains(response, '20') # Check if time=20 is present
        self.assertContains(response, 'roast') # Check if mode=roast is present
        self.assertContains(response, '10') # Check if time=10 is present
        self.assertContains(response, 'rest') # Check if mode=rest is present

    def test_edit_command_guide_view_post_success(self):
        """测试成功编辑命令步骤并更新命令"""
        # Create existing data first
        initial_command = json.dumps([{"step": 1, "time": 20, "mode": "roast"}])
        rd_instance = RecipeDevice.objects.create(recipe=self.recipe, device=self.device, command_content=initial_command)
        
        self.client.login(username='testuser', password='testpassword')
        # Simulate editing the first step and adding a second
        post_data = {
            'steps-TOTAL_FORMS': '2',
            'steps-INITIAL_FORMS': '1', # Indicates one existing form
            'steps-0-id': rd_instance.pk, # Need to pass the ID if using ModelFormSet
            'steps-0-time': '25', # Updated time
            'steps-0-mode': 'grill', # Updated mode
            'steps-0-description': 'Updated step',
            'steps-1-time': '5',  # New step
            'steps-1-mode': 'warm',
            'steps-1-description': 'Keep warm',
        }
        response = self.client.post(self.edit_url, post_data)
        
        self.assertRedirects(response, reverse('web:recipe_detail', args=[self.recipe.id]))
        
        # Check database for updated RecipeDevice
        rd_instance.refresh_from_db()
        try:
            updated_cmd = json.loads(rd_instance.command_content)
            self.assertEqual(len(updated_cmd), 2)
            self.assertEqual(updated_cmd[0]['time'], 25)
            self.assertEqual(updated_cmd[0]['mode'], 'grill')
            self.assertEqual(updated_cmd[1]['time'], 5)
            self.assertEqual(updated_cmd[1]['mode'], 'warm')
        except json.JSONDecodeError:
            self.fail("command_content is not valid JSON after edit")

    def test_edit_command_guide_view_not_owner(self):
        """测试非作者无法访问编辑命令引导页"""
        # Create existing data to ensure the URL is valid
        RecipeDevice.objects.create(recipe=self.recipe, device=self.device, command_content='[]')
        
        self.client.login(username='otheruser', password='otherpassword')
        response = self.client.get(self.edit_url)
        self.assertIn(response.status_code, [302, 403, 404])
        if response.status_code == 302:
            self.assertRedirects(response, reverse('web:recipe_detail', args=[self.recipe.id]))

# --- Form Tests (Placeholder - Requires actual form implementation) ---
# class CommandGuideFormTests(TestCase):
#     
#     def test_device_command_guide_form_valid(self):
#         """测试有效的命令引导表单数据"""
#         # Create form data (likely using a FormSet)
#         form_data = { ... }
#         formset = YourCommandStepFormSet(data=form_data) # Replace with actual FormSet name
#         self.assertTrue(formset.is_valid())
# 
#     def test_device_command_guide_form_invalid_steps(self):
#         """测试包含无效步骤的命令引导表单数据"""
#         form_data = { ... } # Data with missing time or invalid mode
#         formset = YourCommandStepFormSet(data=form_data)
#         self.assertFalse(formset.is_valid())
#         # Check specific errors
#         self.assertIn('time', formset.errors[0]) 
