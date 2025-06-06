import React, { useState } from 'react';
import { Button, Table, Space, Popconfirm, Typography, Alert, Card } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, ClearOutlined } from '@ant-design/icons';
import CommandEditModal from './CommandEditModal';
import { CommandStep } from '../services/recipeService';


interface CommandListProps {
  commands: CommandStep[];
  deviceModel: string;
  deviceTypes: any[]; // You may want to type this more specifically
  onCommandsChange: (commands: CommandStep[]) => void;
  onDeviceModelChange: (model: string) => void;
}

const CommandList: React.FC<CommandListProps> = ({
  commands,
  deviceModel,
  deviceTypes,
  onCommandsChange,
  onDeviceModelChange
}) => {
  const [commandModalVisible, setCommandModalVisible] = useState(false);
  const [currentCommand, setCurrentCommand] = useState<CommandStep | null>(null);
  const [isEditingCommand, setIsEditingCommand] = useState(false);

  // Function to open the modal for adding a new command
  const showAddCommandModal = () => {
    setCurrentCommand(null);
    setIsEditingCommand(false);
    setCommandModalVisible(true);
  };

  // Function to open the modal for editing an existing command
  const showEditCommandModal = (command: CommandStep) => {
    setCurrentCommand(command);
    setIsEditingCommand(true);
    setCommandModalVisible(true);
  };

  // Function to handle saving a new or edited command
  const handleSaveCommand = (command: CommandStep) => {
    if (isEditingCommand && currentCommand) {
      // Editing an existing command - find and replace it
      const updatedCommands = [...commands];
      const index = updatedCommands.findIndex(cmd => cmd.stepNo === currentCommand.stepNo);
      if (index !== -1) {
        updatedCommands[index] = command;
        onCommandsChange(updatedCommands);
      }
    } else {
      // Adding a new command
      onCommandsChange([...commands, command]);
    }
  };

  // Function to handle deleting a command
  const handleDeleteCommand = (stepNo: number) => {
    const updatedCommands = commands.filter(cmd => cmd.stepNo !== stepNo);
    onCommandsChange(updatedCommands);
  };

  // Function to clear all commands
  const handleClearAllCommands = () => {
    onCommandsChange([]);
  };

  // Function to get a display name for action types
  const getActionDisplayName = (actionType: string) => {
    const actionMap: {[key: string]: string} = {
      'preheat': '预热',
      'cook': '烹饪',
      'stir': '翻炒',
      'turn': '翻面',
      'add': '加料',
      'wait': '等待',
      'other': '其他'
    };
    return actionMap[actionType] || actionType;
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={5} style={{ margin: 0 }}>命令步骤</Typography.Title>
        <Space>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            size="small"
            onClick={showAddCommandModal}
          >
            添加命令步骤
          </Button>
          {commands.length > 0 && (
            <Popconfirm
              title="确定要清空所有命令步骤吗?"
              description="此操作将删除当前设备的所有命令步骤，不可恢复"
              onConfirm={handleClearAllCommands}
              okText="确定"
              cancelText="取消"
            >
              <Button 
                danger
                type="primary" 
                icon={<ClearOutlined />} 
                size="small"
              >
                清空命令步骤
              </Button>
            </Popconfirm>
          )}
        </Space>
      </div>
      
      {commands.length === 0 ? (
        <Alert 
          message="暂无命令步骤" 
          description="点击上方的添加命令步骤按钮创建新的命令步骤" 
          type="info" 
          showIcon 
        />
      ) : (
        <Table
          size="small"
          pagination={false}
          dataSource={commands}
          rowKey="step"
          columns={[
            {
              title: '步骤',
              dataIndex: 'step',
              key: 'step',
              width: 80,
            },
            {
              title: '动作类型',
              dataIndex: 'action',
              key: 'action',
              render: (text) => getActionDisplayName(text),
              width: 120,
            },
            {
              title: '详情',
              dataIndex: 'details',
              key: 'details',
              ellipsis: true,
            },
            {
              title: '操作',
              key: 'action',
              width: 120,
              render: (_, record) => (
                <Space size="small">
                  <Button 
                    type="text" 
                    size="small" 
                    icon={<EditOutlined />} 
                    onClick={() => showEditCommandModal(record)}
                  >
                    编辑
                  </Button>
                  <Popconfirm
                    title="确定要删除这个命令步骤吗?"
                    onConfirm={() => handleDeleteCommand(record.stepNo)}
                    okText="确定"
                    cancelText="取消"
                  >
                    <Button type="text" danger size="small" icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
        />
      )}
      
      <CommandEditModal
        visible={commandModalVisible}
        onClose={() => setCommandModalVisible(false)}
        onSave={handleSaveCommand}
        initialCommand={currentCommand || undefined}
        title={isEditingCommand ? "编辑命令" : "添加命令"}
        isEditing={isEditingCommand}
      />
    </div>
  );
};

export default CommandList; 