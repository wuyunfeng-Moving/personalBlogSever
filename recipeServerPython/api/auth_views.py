from rest_framework import status, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework import serializers
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

class UserProfileView(APIView):
    """获取用户信息"""
    permission_classes = [permissions.IsAuthenticated]
    
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