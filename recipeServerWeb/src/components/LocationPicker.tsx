import React, { useEffect, useRef, useState } from 'react';
import { Input, Spin, Alert } from 'antd';
import AMapLoader from '@amap/amap-jsapi-loader';

const amapKey = '3cf371023e2316a73be7bacbf95c673f';

interface LocationPickerProps {
  value?: { lat?: number; lng?: number; name?: string };
  onChange?: (value: { lat: number; lng: number; name: string }) => void;
}

const LocationPicker: React.FC<LocationPickerProps> = ({ value, onChange }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchKeyword, setSearchKeyword] = useState(value?.name || '');

  useEffect(() => {
    let map: any;

    AMapLoader.load({
      key: amapKey,
      version: '2.0',
      plugins: ['AMap.Geocoder', 'AMap.ToolBar', 'AMap.AutoComplete'],
    })
      .then((AMap) => {
        if (mapContainerRef.current) {
          map = new AMap.Map(mapContainerRef.current, {
            zoom: 11,
            center: value?.lng && value?.lat ? [value.lng, value.lat] : [116.397428, 39.90923],
          });
          map.addControl(new AMap.ToolBar({ position: 'LT' }));
          mapInstanceRef.current = map;

          const geocoder = new AMap.Geocoder();
          
          // 初始化标记
          if (value?.lng && value?.lat) {
            markerRef.current = new AMap.Marker({
              position: new AMap.LngLat(value.lng, value.lat),
              map: map,
            });
            map.setCenter([value.lng, value.lat]);
          }

          // 地图点击事件
          map.on('click', (e: any) => {
            const lnglat = e.lnglat;
            geocoder.getAddress(lnglat, (status: string, result: any) => {
              const locationName = status === 'complete' && result.regeocode ? result.regeocode.formattedAddress : '';
              updateLocation(lnglat.lat, lnglat.lng, locationName);
            });
          });

          // 搜索功能
          const autoComplete = new AMap.AutoComplete({
            input: 'location-search-input',
          });
          autoComplete.on('select', (e: any) => {
            const { name, location } = e.poi;
            if (location) {
              updateLocation(location.lat, location.lng, name);
              map.setCenter([location.lng, location.lat]);
              map.setZoom(15);
            }
          });

          setLoading(false);
        }
      })
      .catch((e) => {
        console.error('地图加载失败:', e);
        setError('位置选择器加载失败。');
        setLoading(false);
      });

    return () => {
      map?.destroy();
    };
  }, []);

  const updateLocation = (lat: number, lng: number, name: string) => {
    setSearchKeyword(name);
    if (onChange) {
      onChange({ lat, lng, name });
    }
    if (mapInstanceRef.current) {
      if (markerRef.current) {
        markerRef.current.setPosition(new (window as any).AMap.LngLat(lng, lat));
      } else {
        markerRef.current = new (window as any).AMap.Marker({
          position: new (window as any).AMap.LngLat(lng, lat),
          map: mapInstanceRef.current,
        });
      }
    }
  };

  const handleSearch = (keyword: string) => {
    const geocoder = new (window as any).AMap.Geocoder();
    geocoder.getLocation(keyword, (status: string, result: any) => {
      if (status === 'complete' && result.geocodes.length) {
        const { location, formattedAddress } = result.geocodes[0];
        updateLocation(location.lat, location.lng, formattedAddress);
        mapInstanceRef.current.setCenter([location.lng, location.lat]);
        mapInstanceRef.current.setZoom(15);
      } else {
        console.error('根据地址查询经纬度失败');
      }
    });
  };

  if (error) return <Alert message="错误" description={error} type="error" showIcon />;

  return (
    <div>
      <Input.Search
        id="location-search-input"
        placeholder="搜索地点"
        value={searchKeyword}
        onChange={(e) => setSearchKeyword(e.target.value)}
        onSearch={handleSearch}
        style={{ marginBottom: '10px' }}
      />
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px' }}>
          <Spin />
        </div>
      ) : (
        <div ref={mapContainerRef} style={{ width: '100%', height: '300px' }} />
      )}
    </div>
  );
};

export default LocationPicker; 