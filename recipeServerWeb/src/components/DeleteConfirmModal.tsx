import React, { useState } from 'react';
import { Modal, Button, Typography, Space } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface DeleteConfirmModalProps {
  visible: boolean;
  title: string;
  itemName: string;
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  visible,
  title,
  itemName,
  onConfirm,
  onCancel,
  loading = false
}) => {
  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleOk = async () => {
    setConfirmLoading(true);
    try {
      await onConfirm();
    } finally {
      setConfirmLoading(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#faad14' }} />
          {title}
        </Space>
      }
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={confirmLoading || loading}
      okText="确认删除"
      cancelText="取消"
      okType="danger"
      width={500}
      maskClosable={false}
    >
      <div style={{ padding: '20px 0' }}>
        <Text>
          确定要删除文章 "<Text strong>{itemName}</Text>" 吗？
        </Text>
        <br />
        <br />
        <Text type="secondary">
          此操作不可撤销，但您仍然可以在历史记录中查看该文章的过往版本。
        </Text>
      </div>
    </Modal>
  );
};

export default DeleteConfirmModal; 