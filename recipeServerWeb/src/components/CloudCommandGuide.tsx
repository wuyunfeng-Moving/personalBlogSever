import React, { useState, useEffect } from 'react';
import { Card, Steps, Button, Form, Select, Input, InputNumber, Space, Typography, Alert, Table, Popconfirm, message } from 'antd';
import { ArrowLeftOutlined, ArrowRightOutlined, PlusOutlined, EditOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import CommandEditModal from './CommandEditModal';
import { CloudCommandData, CommandStep } from '../services/recipeService';

const { Title, Text, Paragraph } = Typography;
const { Step } = Steps;
const { Option } = Select;
const { TextArea } = Input;

interface CloudCommandGuideProps {
  visible: boolean;
  deviceTypes: any[];
  initialData?: CloudCommandData;
  onClose: () => void;
  onSave: (data: CloudCommandData) => void;
  isEditing?: boolean;
}

const CloudCommandGuide: React.FC<CloudCommandGuideProps> = ({
  visible,
  deviceTypes,
  initialData,
  onClose,//关闭
  onSave,//保存,保存本次编辑的命令
  isEditing = false//是否编辑
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [form] = Form.useForm();
  const [deviceModel, setDeviceModel] = useState<string>('');
  const [commands, setCommands] = useState<CommandStep[]>([]);
  const [commandModalVisible, setCommandModalVisible] = useState(false);
  const [currentCommand, setCurrentCommand] = useState<CommandStep | null>(null);
  const [isEditingCommand, setIsEditingCommand] = useState(false);
  
  // Initialize form with initial data if available
  useEffect(() => {
    if (visible) {
      if (initialData) {
        setDeviceModel(initialData.model);
        setCommands(initialData.steps || []);
        form.setFieldsValue({
          model: initialData.model,
          steps: initialData.steps
        });
      } else {
        // Reset form when opening for a new command
        const defaultDevice = deviceTypes.length > 0 ? deviceTypes[0].model_identifier : '';
        setDeviceModel(defaultDevice);
        setCommands([]);
        form.setFieldsValue({
          model: defaultDevice,
          steps: []
        });
      }
    }
  }, [visible, initialData, form, deviceTypes]);
  
  // Command handling functions
  const showAddCommandModal = () => {
    setCurrentCommand({
      stepNo: commands.length + 1,
      stepDescription: ''
    });
    setIsEditingCommand(false);
    setCommandModalVisible(true);
  };
  
  const showEditCommandModal = (command: CommandStep) => {
    setCurrentCommand(command);
    setIsEditingCommand(true);
    setCommandModalVisible(true);
  };
  
  const handleSaveCommand = (command: CommandStep) => {
    if (isEditingCommand && currentCommand) {
      // Editing existing command
      const updatedCommands = commands.map(cmd => 
        cmd.stepNo === currentCommand.stepNo ? command : cmd
      );
      setCommands(updatedCommands);
    } else {
      // Adding new command
      setCommands([...commands, command]);
    }
    setCommandModalVisible(false);
  };
  
  const handleDeleteCommand = (stepNo: number) => {
    setCommands(commands.filter(cmd => cmd.stepNo !== stepNo));
  };
  
  // Save the entire cloud command
  const handleFinish = () => {
    if (!deviceModel) {
      message.error('请选择设备类型');
      return;
    }
    
    if (commands.length === 0) {
      message.error('请至少添加一个命令步骤');
      return;
    }
    
    // Create the command data with current values
    const commandData = {
      model: deviceModel,
      // 使用 steps 代替 commands 以符合API要求
      steps: commands,
      hex_command: "111"  // 必填字段，添加默认值
    };
    
    // Log to help debug
    console.log('Saving cloud command data:', commandData);
    
    // Pass the data to parent component
    onSave(commandData as unknown as CloudCommandData);
    onClose();
  };
  
  // Get device name from device model ID
  const getDeviceName = (modelId: string) => {
    const device = deviceTypes.find(d => d.model_identifier === modelId);
    return device ? device.name : modelId;
  };
  
  if (!visible) return null;
  
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'white', zIndex: 1000, padding: '20px', overflowY: 'auto' }}>
      <div style={{ maxWidth: 800, margin: '0 auto' }}>
        <Card 
          title={
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Button 
                icon={<ArrowLeftOutlined />} 
                style={{ marginRight: 16 }}
                onClick={onClose}
              />
              <span>{isEditing ? '编辑云菜谱命令' : '创建云菜谱命令'}</span>
            </div>
          }
        >
          <div style={{ minHeight: 300 }}>
            {/* 设备选择 */}
            <div>
              <Form.Item
                name="model"
                label="设备类型"
                rules={[{ required: true, message: '请选择设备类型' }]}
                initialValue={deviceModel}
              >
                <Select
                  style={{ width: '100%' }}
                  placeholder="选择设备类型"
                  onChange={(value) => setDeviceModel(value)}
                >
                  {deviceTypes.filter(device => device.status === 'approved').map(device => (
                    <Option key={device.model_identifier} value={device.model_identifier}>
                      {device.name}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </div>

            {/* 命令列表 */}
            <div style={{ marginTop: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Title level={4}>命令步骤</Title>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={showAddCommandModal}
                >
                  添加命令步骤
                </Button>
              </div>
              
              {commands.length === 0 ? (
                <Alert
                  message="暂无命令步骤"
                  description="点击上方的添加命令步骤按钮开始配置"
                  type="info"
                  showIcon
                />
              ) : (
                <Table
                  dataSource={commands}
                  rowKey="stepNo"
                  pagination={false}
                  columns={[
                    {
                      title: '步骤',
                      dataIndex: 'stepNo',
                      key: 'stepNo',
                      width: 80,
                    },
                    {
                      title: '内容',
                      dataIndex: 'stepDescription',
                      key: 'stepDescription',
                      ellipsis: true,
                    },
                    {
                      title: '操作',
                      key: 'action',
                      width: 150,
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
            </div>
          </div>
          
          <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              type="primary" 
              icon={<SaveOutlined />}
              onClick={handleFinish}
              disabled={commands.length === 0}
            >
              保存
            </Button>
          </div>
        </Card>
      </div>
      
      <CommandEditModal
        visible={commandModalVisible}
        onClose={() => setCommandModalVisible(false)}
        onSave={handleSaveCommand}
        initialCommand={currentCommand as CommandStep | undefined}
        title={isEditingCommand ? "编辑命令" : "添加命令"}
        isEditing={isEditingCommand}
      />
    </div>
  );
};

export default CloudCommandGuide; 