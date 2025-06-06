import random
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from recipes.models import Recipe, DeviceModel
from django.utils.text import slugify

class Command(BaseCommand):
    help = '创建示例菜谱和设备型号数据'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.SUCCESS('开始创建示例数据...'))
        
        # 创建示例设备型号
        device_models = self._create_device_models()
        
        # 创建示例用户
        users = self._create_users()
        
        # 创建示例菜谱
        self._create_recipes(users, device_models)
        
        self.stdout.write(self.style.SUCCESS('示例数据创建完成！'))
    
    def _create_device_models(self):
        models = [
            {
                'model_identifier': 'smartcooker-pro',
                'name': '智能电饭煲Pro',
                'command_template': {
                    'type': 'cooker',
                    'max_temperature': 180,
                    'modes': ['煮饭', '炖汤', '蒸煮', '煲粥', '焖饭']
                },
                'description': '功能强大的智能电饭煲，支持多种烹饪模式和远程控制。'
            },
            {
                'model_identifier': 'airfryer-max',
                'name': '空气炸锅Max',
                'command_template': {
                    'type': 'airfryer',
                    'max_temperature': 220,
                    'modes': ['炸', '烤', '烘焙', '翻炒']
                },
                'description': '大容量空气炸锅，无油低脂，多功能一体。'
            },
            {
                'model_identifier': 'blender-v3',
                'name': '破壁料理机V3',
                'command_template': {
                    'type': 'blender',
                    'max_speed': 10,
                    'modes': ['搅拌', '绞肉', '榨汁', '研磨']
                },
                'description': '高速破壁料理机，可制作果汁、豆浆、辅食等。'
            }
        ]
        
        created_models = []
        for model_data in models:
            device_model, created = DeviceModel.objects.get_or_create(
                model_identifier=model_data['model_identifier'],
                defaults=model_data
            )
            action = '创建' if created else '已存在'
            self.stdout.write(f"设备型号：{device_model.name} - {action}")
            created_models.append(device_model)
        
        return created_models
    
    def _create_users(self):
        users = []
        user_data = [
            {'username': 'admin', 'email': 'admin@example.com', 'password': 'Admin123!', 'is_staff': True, 'is_superuser': True},
            {'username': 'chef', 'email': 'chef@example.com', 'password': 'Chef123!', 'is_staff': False, 'is_superuser': False},
            {'username': 'user', 'email': 'user@example.com', 'password': 'User123!', 'is_staff': False, 'is_superuser': False},
        ]
        
        for data in user_data:
            username = data.pop('username')
            password = data.pop('password')
            
            user, created = User.objects.get_or_create(
                username=username,
                defaults=data
            )
            
            if created:
                user.set_password(password)
                user.save()
                self.stdout.write(f"用户：{username} - 创建")
            else:
                self.stdout.write(f"用户：{username} - 已存在")
            
            users.append(user)
        
        return users
    
    def _create_recipes(self, users, device_models):
        recipes_data = [
            {
                'title': '香菇滑鸡粥',
                'description': '香糯可口的经典粥品，鸡肉滑嫩，香菇鲜香。',
                'steps': [
                    {
                        'stepNo': 1,
                        'stepDescription': '大米洗净，提前浸泡30分钟。',
                        'imageUrl': ''
                    },
                    {
                        'stepNo': 2,
                        'stepDescription': '鸡胸肉切丁，加入少量盐、胡椒粉和淀粉抓匀。',
                        'imageUrl': ''
                    },
                    {
                        'stepNo': 3,
                        'stepDescription': '香菇洗净切片。',
                        'imageUrl': ''
                    },
                    {
                        'stepNo': 4,
                        'stepDescription': '锅中放入大米和适量水，煮开后转小火慢煮。',
                        'imageUrl': ''
                    },
                    {
                        'stepNo': 5,
                        'stepDescription': '粥熬至浓稠时加入鸡肉和香菇，继续煮至鸡肉熟透。',
                        'imageUrl': ''
                    },
                    {
                        'stepNo': 6,
                        'stepDescription': '加入调味料，撒上葱花即可。',
                        'imageUrl': ''
                    }
                ],
                'prep_time_minutes': 40,
                'cook_time_minutes': 60,
                'servings': 4,
                'ingredients': [
                    {'name': '大米', 'value': 250, 'unit': '克'},
                    {'name': '鸡胸肉', 'value': 200, 'unit': '克'},
                    {'name': '香菇', 'value': 100, 'unit': '克'},
                    {'name': '葱', 'value': 10, 'unit': '克'},
                    {'name': '盐', 'value': 5, 'unit': '克'},
                    {'name': '胡椒粉', 'value': 3, 'unit': '克'},
                    {'name': '生抽', 'value': 5, 'unit': '毫升'}
                ],
                'compatible_models': ['smartcooker-pro']
            },
            {
                'title': '香脆炸鸡翅',
                'description': '外酥里嫩的空气炸锅版炸鸡翅，低脂又健康。',
                'steps': [
                    {
                        'stepNo': 1,
                        'stepDescription': '鸡翅洗净擦干水分，用刀在肉厚处划几刀。',
                        'imageUrl': ''
                    },
                    {
                        'stepNo': 2,
                        'stepDescription': '将鸡翅放入碗中，加入所有调料，抓匀腌制1小时以上。',
                        'imageUrl': ''
                    },
                    {
                        'stepNo': 3,
                        'stepDescription': '空气炸锅预热5分钟，温度设为200℃。',
                        'imageUrl': ''
                    },
                    {
                        'stepNo': 4,
                        'stepDescription': '将腌好的鸡翅放入炸篮，单层排列不要重叠。',
                        'imageUrl': ''
                    },
                    {
                        'stepNo': 5,
                        'stepDescription': '200℃烤15分钟，翻面后再烤10分钟。',
                        'imageUrl': ''
                    },
                    {
                        'stepNo': 6,
                        'stepDescription': '烤好的鸡翅取出稍晾，撒上辣椒粉即可食用。',
                        'imageUrl': ''
                    }
                ],
                'prep_time_minutes': 70,
                'cook_time_minutes': 25,
                'servings': 2,
                'ingredients': [
                    {'name': '鸡翅中', 'value': 500, 'unit': '克'},
                    {'name': '料酒', 'value': 15, 'unit': '毫升'},
                    {'name': '姜粉', 'value': 5, 'unit': '克'},
                    {'name': '蒜粉', 'value': 5, 'unit': '克'},
                    {'name': '五香粉', 'value': 3, 'unit': '克'},
                    {'name': '盐', 'value': 5, 'unit': '克'},
                    {'name': '辣椒粉', 'value': 3, 'unit': '克'},
                    {'name': '食用油', 'value': 5, 'unit': '毫升'}
                ],
                'compatible_models': ['airfryer-max']
            },
            {
                'title': '蓝莓香蕉思慕雪',
                'description': '营养健康的水果混合思慕雪，清爽可口。',
                'steps': [
                    {
                        'stepNo': 1,
                        'stepDescription': '香蕉去皮切段后放入冰箱冷冻2小时以上。',
                        'imageUrl': ''
                    },
                    {
                        'stepNo': 2,
                        'stepDescription': '将冷冻香蕉、新鲜或冷冻蓝莓、酸奶和蜂蜜放入破壁机中。',
                        'imageUrl': ''
                    },
                    {
                        'stepNo': 3,
                        'stepDescription': '以高速搅拌约1分钟，直至顺滑。',
                        'imageUrl': ''
                    },
                    {
                        'stepNo': 4,
                        'stepDescription': '倒入杯中，可选择撒上燕麦片或坚果碎。',
                        'imageUrl': ''
                    }
                ],
                'prep_time_minutes': 120,
                'cook_time_minutes': 5,
                'servings': 2,
                'ingredients': [
                    {'name': '香蕉', 'value': 2, 'unit': '根'},
                    {'name': '蓝莓', 'value': 100, 'unit': '克'},
                    {'name': '酸奶', 'value': 150, 'unit': '毫升'},
                    {'name': '蜂蜜', 'value': 15, 'unit': '毫升'},
                    {'name': '燕麦片', 'value': 20, 'unit': '克', 'optional': True}
                ],
                'compatible_models': ['blender-v3']
            }
        ]
        
        for recipe_data in recipes_data:
            compatible_model_ids = recipe_data.pop('compatible_models')
            
            # 随机选择一个用户作为作者
            author = random.choice(users)
            
            title = recipe_data['title']
            try:
                recipe, created = Recipe.objects.get_or_create(
                    title=title,
                    defaults={**recipe_data, 'author': author}
                )
                
                # 添加兼容设备型号
                for model_id in compatible_model_ids:
                    for device_model in device_models:
                        if device_model.model_identifier == model_id:
                            recipe.compatible_models.add(device_model)
                
                action = '创建' if created else '已存在'
                self.stdout.write(f"菜谱：{recipe.title} - {action}")
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"创建菜谱 {title} 失败: {str(e)}")) 