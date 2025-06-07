import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Spin, Alert, Card, Typography, Tag } from 'antd';
import AMapLoader from '@amap/amap-jsapi-loader';
import { RootState } from '../store';
import { BlogPost } from '../services/api';

const { Text } = Typography;
const amapKey = '3cf371023e2316a73be7bacbf95c673f';

// 生成组件唯一ID
const generateInstanceId = () => Math.random().toString(36).substr(2, 9);

// 标签颜色映射
const getTagColors = () => {
  const colors = [
    '#f50', '#2db7f5', '#87d068', '#108ee9', '#722ed1',
    '#eb2f96', '#52c41a', '#fa8c16', '#1890ff', '#13c2c2',
    '#fa541c', '#faad14', '#a0d911', '#52c41a', '#13c2c2'
  ];
  return colors;
};

// 根据标签生成标记图标
const createMarkerIcon = (post: BlogPost) => {
  const tags = post.tags || [];
  const colors = getTagColors();
  
  // 如果没有标签，使用默认图标
  if (tags.length === 0) {
    return `
      <div style="
        width: 32px;
        height: 32px;
        background: linear-gradient(135deg, #1890ff, #096dd9);
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        cursor: pointer;
      ">
        <span style="color: white; font-size: 14px; font-weight: bold;">📝</span>
      </div>
    `;
  }

  // 取前3个标签用于显示
  const displayTags = tags.slice(0, 3);
  const tagElements = displayTags.map((tag, index) => {
    const color = colors[index % colors.length];
    return `
      <div style="
        background: ${color};
        color: white;
        padding: 1px 4px;
        border-radius: 8px;
        font-size: 8px;
        white-space: nowrap;
        max-width: 40px;
        overflow: hidden;
        text-overflow: ellipsis;
        margin-bottom: 1px;
        font-weight: 500;
        text-align: center;
      ">${tag.name}</div>
    `;
  }).join('');

  return `
    <div style="
      min-width: 50px;
      max-width: 80px;
      background: white;
      border: 2px solid #1890ff;
      border-radius: 12px;
      padding: 4px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.3);
      cursor: pointer;
      display: flex;
      flex-direction: column;
      align-items: center;
    ">
      ${tagElements}
      ${tags.length > 3 ? `<div style="font-size: 8px; color: #666; margin-top: 1px;">+${tags.length - 3}</div>` : ''}
    </div>
  `;
};

const PostsMap: React.FC = () => {
  const instanceId = useRef(generateInstanceId());
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const initializingRef = useRef<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const { items: posts, loading: postsLoading } = useSelector((state: RootState) => state.posts);
  const navigate = useNavigate();

  const addDebugInfo = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const logMessage = `[${timestamp}] [${instanceId.current}] ${message}`;
    setDebugInfo(prev => [...prev, logMessage]);
    console.log(`[地图调试] ${logMessage}`);
  };

  // 组件挂载时的日志
  useEffect(() => {
    addDebugInfo(`PostsMap组件实例创建 - ID: ${instanceId.current}`);
    addDebugInfo(`初始loading状态: ${loading}`);
    addDebugInfo(`容器ref初始状态: ${mapContainerRef.current ? '存在' : 'null'}`);
    
    return () => {
      addDebugInfo(`PostsMap组件实例销毁 - ID: ${instanceId.current}`);
    };
  }, []);

  // 监控ref变化
  useEffect(() => {
    addDebugInfo(`ref状态变化: ${mapContainerRef.current ? `存在 (${mapContainerRef.current.tagName})` : 'null'}`);
  }, [mapContainerRef.current]);

  // 添加一个检查DOM元素的函数
  const checkContainer = () => {
    const container = mapContainerRef.current;
    if (container) {
      addDebugInfo(`容器检查 - 存在: 是, 尺寸: ${container.offsetWidth}x${container.offsetHeight}, 在DOM中: ${document.contains(container)}`);
      return true;
    } else {
      addDebugInfo(`容器检查 - 存在: 否, ref值: ${container}`);
      return false;
    }
  };

  useEffect(() => {
    addDebugInfo(`地图初始化effect触发 - 容器状态: ${mapContainerRef.current ? '存在' : 'null'}`);
    
    let map: any;
    let mounted = true;

    // 防止重复初始化
    if (initializingRef.current) {
      addDebugInfo('检测到重复初始化尝试，忽略');
      return;
    }

    // 简化初始化逻辑 - 立即检查容器是否存在
    if (!mapContainerRef.current) {
      addDebugInfo('初始化跳过：容器ref为null，等待下次渲染');
      return;
    }

    initializingRef.current = true;
    addDebugInfo('开始初始化地图...');
    addDebugInfo(`API Key: ${amapKey}`);

    const initMap = async () => {
      try {
        // 立即检查一次容器状态
        addDebugInfo('初始化前容器状态检查:');
        if (!checkContainer()) {
          throw new Error('容器在初始化时消失');
        }

        const container = mapContainerRef.current!;
        
        // 等待容器有实际尺寸
        let attempt = 0;
        const maxAttempts = 15; // 减少等待时间到1.5秒
        while ((container.offsetWidth === 0 || container.offsetHeight === 0) && attempt < maxAttempts && mounted) {
          addDebugInfo(`等待容器获得尺寸 (尝试 ${attempt + 1}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, 100));
          attempt++;
        }

        if (container.offsetWidth === 0 || container.offsetHeight === 0) {
          if (!mounted) {
            addDebugInfo('组件已卸载，初始化中止');
            return;
          }
          throw new Error(`容器尺寸无效: ${container.offsetWidth}x${container.offsetHeight}`);
        }

        addDebugInfo(`容器准备就绪! 尺寸: ${container.offsetWidth}x${container.offsetHeight}`);
        addDebugInfo('开始加载高德地图SDK...');

        const AMap = await AMapLoader.load({
          key: amapKey,
          version: '2.0',
          plugins: ['AMap.ToolBar', 'AMap.Scale', 'AMap.InfoWindow'],
        });

        if (!mounted) {
          addDebugInfo('组件已卸载，停止地图初始化');
          return;
        }

        addDebugInfo('高德地图SDK加载成功，创建地图实例...');
        
        map = new AMap.Map(container, {
          zoom: 5,
          center: [116.397428, 39.90923],
          viewMode: '2D',
          resizeEnable: true,
          mapStyle: 'amap://styles/normal',
        });

        if (!mounted) {
          map?.destroy();
          return;
        }

        addDebugInfo('地图实例创建成功，添加控件...');

        // 添加控件
        try {
          map.addControl(new AMap.ToolBar());
          map.addControl(new AMap.Scale());
          addDebugInfo('地图控件添加成功');
        } catch (controlError: any) {
          addDebugInfo(`控件添加失败: ${controlError.message}`);
        }
        
        mapInstanceRef.current = map;
        setLoading(false);
        setError(null);
        addDebugInfo('地图初始化完成，loading设置为false');

        // 地图事件
        map.on('complete', () => addDebugInfo('地图渲染完成'));
        map.on('error', (e: any) => addDebugInfo(`地图错误: ${e.message || '未知错误'}`));

      } catch (e: any) {
        if (!mounted) return;
        console.error('地图加载失败:', e);
        const errorMessage = `地图加载失败: ${e.message || '未知错误'}`;
        addDebugInfo(errorMessage);
        setError(errorMessage);
        setLoading(false);
        addDebugInfo('因错误，loading设置为false');
      } finally {
        initializingRef.current = false;
        addDebugInfo('初始化过程结束，initializingRef重置为false');
      }
    };

    initMap();

    return () => {
      mounted = false;
      initializingRef.current = false;
      if (map) {
        addDebugInfo('清理地图实例');
        try {
          map.destroy();
        } catch (e) {
          console.warn('地图销毁失败:', e);
        }
      }
    };
  }, [mapContainerRef.current]); // 当ref变化时重新初始化

  useEffect(() => {
    addDebugInfo(`数据变化 - 地图实例: ${mapInstanceRef.current ? '存在' : '不存在'}, 文章: ${posts ? `${Array.isArray(posts) ? posts.length : '类型错误'}篇` : '空'}`);
    
    // 确保地图实例存在且文章数据已加载
    if (mapInstanceRef.current && posts && Array.isArray(posts)) {
      const map = mapInstanceRef.current;
      
      addDebugInfo(`处理文章数据: 共${posts.length}篇文章`);
      
      // 清除旧的标记
      try {
        map.clearMap();
        addDebugInfo('清除旧标记成功');
      } catch (clearError: any) {
        addDebugInfo(`清除标记失败: ${clearError.message}`);
      }

      // 创建信息窗口
      let infoWindow: any;
      try {
        infoWindow = new map.InfoWindow({
          offset: new map.Pixel(0, -30),
        });
        addDebugInfo('信息窗口创建成功');
      } catch (infoError: any) {
        addDebugInfo(`信息窗口创建失败: ${infoError.message}`);
        return;
      }

      let markerCount = 0;
      const validPosts: BlogPost[] = [];

      posts.forEach((post: BlogPost, index: number) => {
        const hasValidCoords = post.latitude && post.longitude && 
                              typeof post.latitude === 'number' && 
                              typeof post.longitude === 'number' &&
                              !isNaN(post.latitude) && !isNaN(post.longitude);

        const tagNames = post.tags ? post.tags.map(tag => tag.name).join(', ') : '无标签';
        addDebugInfo(`文章${index + 1}: "${post.title}" - 位置: ${hasValidCoords ? `[${post.longitude}, ${post.latitude}]` : '无'} - 标签: ${tagNames}`);

        if (hasValidCoords) {
          markerCount++;
          validPosts.push(post);
          
          try {
            // 创建自定义HTML标记
            const markerIcon = createMarkerIcon(post);
            
            const marker = new map.Marker({
              position: new map.LngLat(post.longitude, post.latitude),
              content: markerIcon,
              title: post.title,
            });

            // 创建信息窗口内容，包含标签信息
            const tagsHtml = post.tags && post.tags.length > 0 
              ? post.tags.map(tag => `<span style="
                  display: inline-block;
                  background: #f0f0f0;
                  color: #666;
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 10px;
                  margin: 1px;
                ">${tag.name}</span>`).join('')
              : '<span style="color: #999; font-size: 10px;">暂无标签</span>';

            const categoriesHtml = post.categories && post.categories.length > 0
              ? post.categories.map(category => `<span style="
                  display: inline-block;
                  background: #e6f7ff;
                  color: #1890ff;
                  padding: 2px 6px;
                  border-radius: 4px;
                  font-size: 10px;
                  margin: 1px;
                ">${category.name}</span>`).join('')
              : '<span style="color: #999; font-size: 10px;">未分类</span>';

            const content = `
              <div style="padding: 12px; max-width: 320px; font-family: 'Arial', sans-serif;">
                <h4 style="margin: 0 0 8px 0; color: #333; font-size: 14px;">${post.title}</h4>
                ${post.location_name ? `<p style="font-size: 11px; color: #999; margin: 0 0 8px 0;"><strong>📍 ${post.location_name}</strong></p>` : ''}
                
                <div style="margin: 6px 0;">
                  <div style="font-size: 11px; color: #666; margin-bottom: 4px;">🏷️ 标签:</div>
                  <div style="margin-bottom: 6px;">${tagsHtml}</div>
                </div>
                
                <div style="margin: 6px 0;">
                  <div style="font-size: 11px; color: #666; margin-bottom: 4px;">📂 分类:</div>
                  <div style="margin-bottom: 8px;">${categoriesHtml}</div>
                </div>
                
                <p style="font-size: 12px; color: #666; margin: 0 0 10px 0; line-height: 1.4;">${post.excerpt || '暂无摘要'}</p>
                <a href="#" onclick="window.location.href='/posts/${post.slug}'" style="
                  font-size: 12px; 
                  color: #1890ff; 
                  text-decoration: none; 
                  margin-top: 8px; 
                  display: inline-block;
                  padding: 4px 8px;
                  border: 1px solid #1890ff;
                  border-radius: 4px;
                  transition: all 0.2s;
                " onmouseover="this.style.background='#1890ff'; this.style.color='white';" 
                   onmouseout="this.style.background='transparent'; this.style.color='#1890ff';">
                  阅读全文 →
                </a>
              </div>
            `;

            marker.on('click', () => {
              infoWindow.setContent(content);
              infoWindow.open(map, marker.getPosition());
            });

            map.add(marker);
            addDebugInfo(`自定义标记添加成功: ${post.title} (标签: ${post.tags?.length || 0}个)`);
          } catch (markerError: any) {
            addDebugInfo(`创建标记失败: ${post.title} - ${markerError.message}`);
          }
        }
      });
      
      addDebugInfo(`标记处理完成: 成功添加${markerCount}个带标签样式的标记`);

      // 如果有标记，调整地图视野
      if (validPosts.length > 0) {
        try {
          const bounds = new map.Bounds();
          validPosts.forEach(post => {
            bounds.extend(new map.LngLat(post.longitude!, post.latitude!));
          });
          map.setBounds(bounds, false, [30, 30, 30, 30]);
          addDebugInfo('地图视野调整成功');
        } catch (boundsError: any) {
          addDebugInfo(`调整视野失败: ${boundsError.message}`);
        }
      } else {
        addDebugInfo('无有效标记，保持默认视野');
      }
    } else {
      if (!mapInstanceRef.current) {
        addDebugInfo('跳过数据处理: 地图实例不存在');
      }
      if (!posts) {
        addDebugInfo('跳过数据处理: 文章数据为空');
      } else if (!Array.isArray(posts)) {
        addDebugInfo(`跳过数据处理: 文章数据类型错误 (${typeof posts})`);
      }
    }
  }, [posts, navigate]);

  // 计算统计信息
  const postsWithLocation = posts && Array.isArray(posts) ? 
    posts.filter(post => post.latitude && post.longitude && 
                        typeof post.latitude === 'number' && 
                        typeof post.longitude === 'number' &&
                        !isNaN(post.latitude) && !isNaN(post.longitude)) : [];
  const totalPosts = posts && Array.isArray(posts) ? posts.length : 0;
  
  // 统计标签信息
  const allTags = posts && Array.isArray(posts) ? 
    posts.flatMap(post => post.tags || []) : [];
  const uniqueTags = Array.from(new Set(allTags.map(tag => tag.name))).length;

  return (
    <div>
      {/* 地图统计信息 */}
      <div style={{ marginBottom: '16px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <Tag color="blue">
          总文章数: {totalPosts}
        </Tag>
        <Tag color="green">
          有位置信息: {postsWithLocation.length}
        </Tag>
        <Tag color="purple">
          标签总数: {uniqueTags}
        </Tag>
        <Tag color={postsLoading ? 'orange' : 'default'}>
          {postsLoading ? '数据加载中...' : '数据加载完成'}
        </Tag>
        <Tag color={loading ? 'orange' : 'green'}>
          地图: {loading ? '初始化中...' : '就绪'}
        </Tag>
        {postsWithLocation.length === 0 && totalPosts > 0 && (
          <Tag color="red">
            ⚠️ 没有文章包含地理位置信息
          </Tag>
        )}
        {totalPosts === 0 && !postsLoading && (
          <Tag color="orange">
            ⚠️ 没有文章数据
          </Tag>
        )}
      </div>

      {/* 标签图例 */}
      {postsWithLocation.length > 0 && (
        <Card 
          size="small" 
          title="📍 地图图例" 
          style={{ marginBottom: '16px' }}
          bodyStyle={{ padding: '12px' }}
        >
          <div style={{ fontSize: '12px', color: '#666' }}>
            <div style={{ marginBottom: '8px' }}>
              <strong>标记样式说明：</strong>
            </div>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  background: 'linear-gradient(135deg, #1890ff, #096dd9)',
                  border: '1px solid white',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <span style={{ color: 'white', fontSize: '8px' }}>📝</span>
                </div>
                <span>无标签文章</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <div style={{
                  width: '24px',
                  height: '20px',
                  background: 'white',
                  border: '1px solid #1890ff',
                  borderRadius: '6px',
                  padding: '1px',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ height: '4px', background: '#f50', borderRadius: '2px', marginBottom: '1px' }}></div>
                  <div style={{ height: '4px', background: '#2db7f5', borderRadius: '2px' }}></div>
                </div>
                <span>有标签文章</span>
              </div>
            </div>
            <div style={{ marginTop: '6px', fontSize: '11px', color: '#999' }}>
              • 彩色条块表示文章标签，不同颜色代表不同标签<br/>
              • 点击标记查看文章详情和完整标签信息
            </div>
          </div>
        </Card>
      )}

      {/* 地图容器 - 始终渲染 */}
      <div 
        ref={mapContainerRef} 
        style={{ 
          width: '100%', 
          height: 'calc(100vh - 350px)', 
          minHeight: '400px',
          borderRadius: '8px',
          border: '1px solid #d9d9d9',
          overflow: 'hidden',
          backgroundColor: '#f5f5f5',
          position: 'relative'
        }} 
      >
        {/* 在容器内显示加载状态或错误信息 */}
        {loading && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 1000
          }}>
            <Spin size="large" />
            <div style={{ marginTop: 16, textAlign: 'center', color: '#666' }}>
              地图加载中...
            </div>
          </div>
        )}
        
        {error && (
          <div style={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            zIndex: 1000,
            textAlign: 'center',
            maxWidth: '80%'
          }}>
            <Alert 
              message="地图加载错误" 
              description={error} 
              type="error" 
              showIcon 
            />
          </div>
        )}
      </div>
      
      {/* 调试信息（开发环境） */}
      {import.meta.env.DEV && (
        <Card title="实时调试日志" size="small" style={{ marginTop: '16px' }}>
          <div style={{ fontSize: '12px', maxHeight: '150px', overflow: 'auto', fontFamily: 'monospace' }}>
            {debugInfo.slice(-10).map((info, index) => (
              <div key={index} style={{ 
                padding: '1px 0', 
                color: info.includes('错误') || info.includes('失败') ? '#ff4d4f' : 
                       info.includes('成功') ? '#52c41a' : '#333'
              }}>
                {info}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
};

export default PostsMap; 