import React, { useEffect, useRef, useState } from 'react';
import { Modal, Input, Button, Spin, Alert, Space, Typography, message } from 'antd';
import { EnvironmentOutlined, SearchOutlined, DeleteOutlined } from '@ant-design/icons';
import AMapLoader from '@amap/amap-jsapi-loader';

const { Text } = Typography;
const amapKey = '3cf371023e2316a73be7bacbf95c673f';

interface LocationSelectorProps {
  value?: { lat?: number; lng?: number; name?: string };
  onChange?: (value: { lat: number; lng: number; name: string } | null) => void;
  placeholder?: string;
}

const LocationSelector: React.FC<LocationSelectorProps> = ({ 
  value, 
  onChange, 
  placeholder = "点击添加地理位置" 
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(value || null);
  const [tempLocation, setTempLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(null);

  // 监听外部value变化
  useEffect(() => {
    if (value) {
      setSelectedLocation(value);
    } else {
      setSelectedLocation(null);
    }
  }, [value]);

  // 打开模态框并初始化地图
  const showModal = () => {
    setIsModalVisible(true);
    setTempLocation(selectedLocation);
    setSearchKeyword(selectedLocation?.name || '');
    
    // 延迟初始化地图，确保模态框已经渲染
    setTimeout(() => {
      initializeMap();
    }, 100);
  };

  const initializeMap = async () => {
    if (!mapContainerRef.current) return;
    
    setLoading(true);
    setError(null);

    try {
      const AMap = await AMapLoader.load({
        key: amapKey,
        version: '2.0',
        plugins: ['AMap.Geocoder', 'AMap.ToolBar', 'AMap.PlaceSearch'],
      });

      const map = new AMap.Map(mapContainerRef.current, {
        zoom: 11,
        center: tempLocation ? [tempLocation.lng, tempLocation.lat] : [116.397428, 39.90923],
        mapStyle: 'amap://styles/normal',
      });

      // 添加工具栏
      map.addControl(new AMap.ToolBar({ position: 'LT' }));
      
      mapInstanceRef.current = map;
      const geocoder = new AMap.Geocoder();

      // 如果有初始位置，添加标记
      if (tempLocation) {
        markerRef.current = new AMap.Marker({
          position: new AMap.LngLat(tempLocation.lng, tempLocation.lat),
          map: map,
          draggable: true, // 使标记可拖拽
        });

        // 标记拖拽事件
        markerRef.current.on('dragend', (e: any) => {
          const lnglat = e.lnglat;
          geocoder.getAddress(lnglat, (status: string, result: any) => {
            if (status === 'complete' && result.regeocode) {
              const locationName = result.regeocode.formattedAddress;
              updateTempLocation(lnglat.lat, lnglat.lng, locationName);
            }
          });
        });
      }

      // 地图点击事件
      map.on('click', (e: any) => {
        const lnglat = e.lnglat;
        geocoder.getAddress(lnglat, (status: string, result: any) => {
          if (status === 'complete' && result.regeocode) {
            const locationName = result.regeocode.formattedAddress;
            updateTempLocation(lnglat.lat, lnglat.lng, locationName);
          } else {
            updateTempLocation(lnglat.lat, lnglat.lng, `位置: ${lnglat.lng.toFixed(6)}, ${lnglat.lat.toFixed(6)}`);
          }
        });
      });

      setLoading(false);
    } catch (e) {
      console.error('地图加载失败:', e);
      setError('地图加载失败，请检查网络连接');
      setLoading(false);
    }
  };

  const updateTempLocation = (lat: number, lng: number, name: string) => {
    setSearchKeyword(name);
    setTempLocation({ lat, lng, name });
    
    if (mapInstanceRef.current) {
      if (markerRef.current) {
        markerRef.current.setPosition(new (window as any).AMap.LngLat(lng, lat));
      } else {
        markerRef.current = new (window as any).AMap.Marker({
          position: new (window as any).AMap.LngLat(lng, lat),
          map: mapInstanceRef.current,
          draggable: true,
        });

        // 为新标记添加拖拽事件
        markerRef.current.on('dragend', (e: any) => {
          const lnglat = e.lnglat;
          const geocoder = new (window as any).AMap.Geocoder();
          geocoder.getAddress(lnglat, (status: string, result: any) => {
            if (status === 'complete' && result.regeocode) {
              const locationName = result.regeocode.formattedAddress;
              updateTempLocation(lnglat.lat, lnglat.lng, locationName);
            }
          });
        });
      }
    }
  };

  const handleSearch = () => {
    if (!searchKeyword.trim()) {
      message.warning('请输入搜索关键词');
      return;
    }

    if (!(window as any).AMap) {
      message.error('地图未加载完成');
      return;
    }

    const placeSearch = new (window as any).AMap.PlaceSearch({
      pageSize: 10,
      pageIndex: 1,
    });

    placeSearch.search(searchKeyword, (status: string, result: any) => {
      if (status === 'complete' && result.poiList && result.poiList.pois.length > 0) {
        const firstPoi = result.poiList.pois[0];
        const { location, name } = firstPoi;
        
        if (location) {
          updateTempLocation(location.lat, location.lng, name);
          mapInstanceRef.current?.setCenter([location.lng, location.lat]);
          mapInstanceRef.current?.setZoom(15);
        }
      } else {
        message.error('未找到相关地点，请尝试其他关键词');
      }
    });
  };

  const handleOk = () => {
    if (tempLocation) {
      setSelectedLocation(tempLocation);
      onChange?.(tempLocation);
      message.success('地理位置设置成功');
    } else {
      message.warning('请选择一个位置');
    }
    handleCancel();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setTempLocation(null);
    setSearchKeyword('');
    setError(null);
    
    // 清理地图实例
    if (mapInstanceRef.current) {
      mapInstanceRef.current.destroy();
      mapInstanceRef.current = null;
    }
    markerRef.current = null;
  };

  const handleRemoveLocation = () => {
    setSelectedLocation(null);
    onChange?.(null);
    message.success('已移除地理位置');
  };

  return (
    <div>
      {/* 显示当前选中的位置或添加按钮 */}
      {selectedLocation ? (
        <div style={{ 
          border: '1px solid #d9d9d9', 
          borderRadius: '6px', 
          padding: '8px 12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: '#fafafa'
        }}>
          <Space>
            <EnvironmentOutlined style={{ color: '#1890ff' }} />
            <div>
              <Text strong>{selectedLocation.name}</Text>
              <br />
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {selectedLocation.lng.toFixed(6)}, {selectedLocation.lat.toFixed(6)}
              </Text>
            </div>
          </Space>
          <Space>
            <Button 
              type="text" 
              icon={<EnvironmentOutlined />} 
              onClick={showModal}
              size="small"
            >
              修改
            </Button>
            <Button 
              type="text" 
              icon={<DeleteOutlined />} 
              onClick={handleRemoveLocation}
              size="small"
              danger
            >
              移除
            </Button>
          </Space>
        </div>
      ) : (
        <Button 
          type="dashed" 
          icon={<EnvironmentOutlined />} 
          onClick={showModal}
          style={{ width: '100%', height: '40px' }}
        >
          {placeholder}
        </Button>
      )}

      {/* 地图选择模态框 */}
      <Modal
        title="选择地理位置"
        open={isModalVisible}
        onOk={handleOk}
        onCancel={handleCancel}
        width={800}
        okText="确认选择"
        cancelText="取消"
        maskClosable={false}
        styles={{
          body: { padding: '16px' }
        }}
      >
        {/* 搜索框 */}
        <div style={{ marginBottom: '12px' }}>
          <Input.Search
            placeholder="搜索地点名称，如：天安门广场"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            onSearch={handleSearch}
            enterButton={<SearchOutlined />}
            size="large"
          />
        </div>

        {/* 当前选择提示 */}
        {tempLocation && (
          <div style={{ 
            marginBottom: '12px', 
            padding: '8px 12px', 
            backgroundColor: '#f6ffed', 
            border: '1px solid #b7eb8f',
            borderRadius: '6px'
          }}>
            <Space>
              <EnvironmentOutlined style={{ color: '#52c41a' }} />
              <div>
                <Text strong style={{ color: '#52c41a' }}>当前选择: {tempLocation.name}</Text>
                <br />
                <Text type="secondary" style={{ fontSize: '12px' }}>
                  经度: {tempLocation.lng.toFixed(6)}, 纬度: {tempLocation.lat.toFixed(6)}
                </Text>
              </div>
            </Space>
          </div>
        )}

        {/* 使用说明 */}
        <div style={{ 
          marginBottom: '12px', 
          padding: '8px 12px', 
          backgroundColor: '#f0f0f0', 
          borderRadius: '6px',
          fontSize: '12px',
          color: '#666'
        }}>
          💡 提示：在地图上点击可选择位置，拖拽标记可精确调整位置
        </div>

        {/* 地图容器 */}
        {error ? (
          <Alert message="错误" description={error} type="error" showIcon />
        ) : loading ? (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '400px',
            border: '1px solid #d9d9d9',
            borderRadius: '6px'
          }}>
            <Spin size="large" tip="地图加载中..." />
          </div>
        ) : (
          <div 
            ref={mapContainerRef} 
            style={{ 
              width: '100%', 
              height: '400px',
              border: '1px solid #d9d9d9',
              borderRadius: '6px'
            }} 
          />
        )}
      </Modal>
    </div>
  );
};

export default LocationSelector; 