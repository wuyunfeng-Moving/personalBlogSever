import React from 'react';
import { Card, List, Button, Tag, Typography, Space, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { CloudCommandData } from '../services/recipeService';

const { Text } = Typography;


// Type for device info passed down
interface DeviceType {
  model_identifier: string;
  name: string;
  status: string; // Include other relevant fields if needed
}

interface CloudCommandSummaryProps {
  commands: CloudCommandData[];
  deviceTypes: DeviceType[]; // Ensure this prop is expected
  onAddCommand: () => void; // Callback to open the guide/modal
  onEditCommand: (command: CloudCommandData) => void; // Callback to edit specific set
  onDeleteCommand: (model: string) => void; // Callback to delete specific set by model
}

const CloudCommandSummary: React.FC<CloudCommandSummaryProps> = ({
  commands = [],
  deviceTypes = [], // Destructure deviceTypes here
  onAddCommand,
  onEditCommand,
  onDeleteCommand,
}) => {

  const getDeviceName = (modelId: string): string => {
    // Find device name, handle case where deviceTypes might be loading/empty
    const device = (deviceTypes || []).find((d: DeviceType) => d.model_identifier === modelId);
    return device ? device.name : modelId || '未知设备';
  };

  return (
    <Card
      title="云菜谱命令"
      size="small"
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          size="small"
          onClick={onAddCommand} // Directly call the prop function
        >
          添加云命令
        </Button>
      }
    >
      {commands.length === 0 ? (
        <Text type="secondary">暂无云菜谱命令。点击右上角“添加云命令”按钮进行配置。</Text>
      ) : (
        <List
          itemLayout="horizontal"
          dataSource={commands} // Use the commands array from props
          renderItem={item => (
            <List.Item
              actions={[
                <Button
                  type="text"
                  size="small"
                  icon={<EditOutlined />}
                  onClick={() => onEditCommand(item)} // Pass the whole item to edit handler
                >
                  编辑
                </Button>,
                <Popconfirm
                  title={`确定要删除设备 "${getDeviceName(item.model)}"?`} // Use model for deletion confirmation
                  onConfirm={() => onDeleteCommand(item.model)} // Pass model string to delete handler
                  okText="确定"
                  cancelText="取消"
                >
                  <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                    删除
                  </Button>
                </Popconfirm>
              ]}
            >
              <List.Item.Meta
                title={<Text strong>{getDeviceName(item.model)}</Text>}
                description={`包含 ${item.steps.length} 个命令步骤`} // Safely access commands length
              />
            </List.Item>
          )}
        />
      )}
    </Card>
  );
};

export default CloudCommandSummary;
