from django.contrib import admin
from django.urls import path, include
# Basic configuration for serving media files during development
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import RedirectView

urlpatterns = [
    # Django admin
    path('admin/', admin.site.urls),
    
    # API接口
    path('api/v1/', include('api.urls', namespace='api_v1')),
    
    # 监控与管理
    path('manage/reviews/', RedirectView.as_view(pattern_name='web:review_submissions'), name='manage_reviews'),
    path('manage/devices/', RedirectView.as_view(pattern_name='web:device_list'), name='manage_devices'),
    path('manage/logs/', RedirectView.as_view(pattern_name='web:view_logs'), name='manage_logs'),
    
    # Web前端
    path('', include('web.urls', namespace='web')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 