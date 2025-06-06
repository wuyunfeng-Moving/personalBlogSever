import React, { ReactNode } from 'react';
import { Spin, Alert, Empty, Typography, Breadcrumb } from 'antd';
import { HomeOutlined } from '@ant-design/icons';

const { Title } = Typography;

interface PageContentProps {
  title: string;
  loading: boolean;
  error: string | null;
  isEmpty?: boolean;
  emptyText?: string;
  breadcrumbs?: { title: string; path?: string; icon?: ReactNode }[];
  children: ReactNode;
}

const PageContent: React.FC<PageContentProps> = ({
  title,
  loading,
  error,
  isEmpty = false,
  emptyText = '暂无数据',
  breadcrumbs,
  children
}) => {
  return (
    <div style={{ padding: '24px' }}>
      {breadcrumbs && (
        <Breadcrumb style={{ marginBottom: '16px' }}>
          <Breadcrumb.Item href="/">
            <HomeOutlined />
          </Breadcrumb.Item>
          {breadcrumbs.map((item, index) => (
            <Breadcrumb.Item key={index} href={item.path}>
              {item.icon && <span style={{ marginRight: 8 }}>{item.icon}</span>}
              {item.title}
            </Breadcrumb.Item>
          ))}
        </Breadcrumb>
      )}
      
      <Title level={2}>{title}</Title>
      
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
        </div>
      ) : error ? (
        <Alert
          message="错误"
          description={error}
          type="error"
          showIcon
        />
      ) : isEmpty ? (
        <Empty description={emptyText} />
      ) : (
        children
      )}
    </div>
  );
};

export default PageContent; 