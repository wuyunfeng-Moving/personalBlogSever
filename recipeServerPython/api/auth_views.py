from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers
from drf_spectacular.utils import extend_schema, OpenApiExample
import logging

logger = logging.getLogger(__name__)

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password2 = serializers.CharField(write_only=True)
    
    class Meta:
        model = User
        fields = ('username', 'email', 'password', 'password2', 'first_name', 'last_name')
        
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError("密码不匹配")
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    is_admin = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'name', 'is_admin', 'is_staff')
        read_only_fields = ('id', 'username', 'date_joined', 'is_staff')
    
    def get_name(self, obj):
        return f"{obj.first_name} {obj.last_name}".strip() or obj.username
    
    def get_is_admin(self, obj):
        return obj.is_superuser or obj.is_staff

class CustomTokenObtainPairSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField()
    
    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')
        
        if username and password:
            user = authenticate(username=username, password=password)
            if user:
                if user.is_active:
                    refresh = RefreshToken.for_user(user)
                    return {
                        'access': str(refresh.access_token),
                        'refresh': str(refresh),
                        'user': UserProfileSerializer(user).data
                    }
                else:
                    raise serializers.ValidationError('用户账号已被禁用')
            else:
                raise serializers.ValidationError('用户名或密码错误')
        else:
            raise serializers.ValidationError('必须提供用户名和密码')

@extend_schema(
    tags=['认证'],
    operation_id='user_register',
    summary='用户注册',
    description='创建新用户账号并返回JWT令牌',
    request=UserRegistrationSerializer,
    examples=[
        OpenApiExample(
            name='注册示例',
            value={
                "username": "newuser",
                "email": "user@example.com",
                "password": "securepassword123",
                "password2": "securepassword123",
                "first_name": "张",
                "last_name": "三"
            }
        )
    ]
)
class RegisterView(APIView):
    """用户注册"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            serializer = UserRegistrationSerializer(data=request.data)
            if serializer.is_valid():
                user = serializer.save()
                
                # 创建JWT令牌
                refresh = RefreshToken.for_user(user)
                
                response_data = {
                    'message': '注册成功',
                    'user': UserProfileSerializer(user).data,
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                }
                
                logger.info(f"新用户注册成功: {user.username}")
                return Response(response_data, status=status.HTTP_201_CREATED)
            else:
                return Response({
                    'error': '注册失败',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"注册过程中出错: {str(e)}")
            return Response({
                'error': '服务器内部错误',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@extend_schema(
    tags=['认证'],
    operation_id='user_login',
    summary='用户登录',
    description='使用用户名和密码获取JWT访问令牌',
    request=CustomTokenObtainPairSerializer,
    examples=[
        OpenApiExample(
            name='登录示例',
            value={
                "username": "testuser",
                "password": "password123"
            }
        )
    ]
)
class LoginView(APIView):
    """用户登录"""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        try:
            serializer = CustomTokenObtainPairSerializer(data=request.data)
            if serializer.is_valid():
                data = serializer.validated_data
                logger.info(f"用户登录成功: {data['user']['username']}")
                return Response(data, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': '登录失败',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"登录过程中出错: {str(e)}")
            return Response({
                'error': '服务器内部错误',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@extend_schema(
    tags=['认证'],
    operation_id='user_profile',
    summary='获取用户信息',
    description='获取当前登录用户的详细信息',
    responses=UserProfileSerializer
)
class UserProfileView(APIView):
    """获取用户信息"""
    permission_classes = [permissions.IsAuthenticated]
    
    @extend_schema(
        operation_id='get_user_profile',
        summary='获取用户资料'
    )
    def get(self, request):
        try:
            serializer = UserProfileSerializer(request.user)
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"获取用户信息出错: {str(e)}")
            return Response({
                'error': '获取用户信息失败',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    @extend_schema(
        operation_id='update_user_profile',
        summary='更新用户资料',
        request=UserProfileSerializer
    )
    def put(self, request):
        try:
            serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            else:
                return Response({
                    'error': '更新失败',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            logger.error(f"更新用户信息出错: {str(e)}")
            return Response({
                'error': '更新用户信息失败',
                'message': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

# 使用函数视图的替代方案
@extend_schema(
    tags=['认证'],
    operation_id='refresh_token',
    summary='刷新访问令牌',
    description='使用refresh token获取新的access token',
    examples=[
        OpenApiExample(
            name='令牌刷新示例',
            value={
                "refresh": "your_refresh_token_here"
            }
        )
    ]
)
@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def refresh_token_view(request):
    """刷新JWT令牌"""
    try:
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({
                'error': '缺少refresh token'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        refresh = RefreshToken(refresh_token)
        return Response({
            'access': str(refresh.access_token)
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({
            'error': '令牌刷新失败',
            'message': str(e)
        }, status=status.HTTP_400_BAD_REQUEST) 