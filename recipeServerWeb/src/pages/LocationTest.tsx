import React, { useState } from 'react';
import { Card, Space, Typography, Divider } from 'antd';
import LocationSelector from '../components/LocationSelector';

const { Title, Text } = Typography;

const LocationTest: React.FC = () => {
  const [location, setLocation] = useState<{
    lat: number;
    lng: number;
    name: string;
  } | null>(null);

  const handleLocationChange = (newLocation: { lat: number; lng: number; name: string } | null) => {
    console.log('Location changed:', newLocation);
    setLocation(newLocation);
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px' }}>
      <Card title="地理位置选择器测试">
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={4}>地理位置选择</Title>
            <LocationSelector 
              value={location}
              onChange={handleLocationChange}
              placeholder="点击选择地理位置"
            />
          </div>

          <Divider />

          <div>
            <Title level={4}>当前选择的位置信息</Title>
            {location ? (
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f6ffed', 
                border: '1px solid #b7eb8f',
                borderRadius: '6px'
              }}>
                <Text strong>位置名称: </Text>
                <Text>{location.name}</Text>
                <br />
                <Text strong>经度: </Text>
                <Text>{location.lng.toFixed(6)}</Text>
                <br />
                <Text strong>纬度: </Text>
                <Text>{location.lat.toFixed(6)}</Text>
              </div>
            ) : (
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f0f0f0', 
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                <Text type="secondary">尚未选择位置</Text>
              </div>
            )}
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default LocationTest; 