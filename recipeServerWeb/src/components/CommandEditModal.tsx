import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Select, InputNumber, Space, Divider, message, Alert, Card } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import { CommandStep } from '../services/recipeService';

const { TextArea } = Input;
const { Option } = Select;

interface CommandEditModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (command: CommandStep) => void;
  initialCommand?: CommandStep;
  title?: string;
  isEditing?: boolean;
}

const CommandEditModal: React.FC<CommandEditModalProps> = ({
  visible,
  onClose,
  onSave,
  initialCommand,
  title = "编辑命令",
  isEditing = true
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && initialCommand) {
      form.setFieldsValue(initialCommand);
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, initialCommand, form]);

  const handleSave = () => {
    form.validateFields()
      .then(values => {
        onSave(values as CommandStep);
        onClose();
      })
      .catch(info => {
        console.log('Validate Failed:', info);
        message.error('请填写所有必填字段');
      });
  };

  return (
    <Modal
      title={title}
      open={visible}
      onCancel={onClose}
      onOk={handleSave}
      okText={isEditing ? "保存修改" : "添加命令"}
      cancelText="取消"
      maskClosable={false}
      destroyOnClose
    >
      <Form 
        form={form} 
        layout="vertical" 
        autoComplete="off"
        initialValues={initialCommand || { stepNo: 1, stepDescription: '' }}
      >
        <Form.Item
          name="stepNo"
          label="步骤编号"
          rules={[{ required: true, message: '请输入步骤编号' }]}
        >
          <InputNumber min={1} style={{ width: '100%' }} />
        </Form.Item>
        
        <Form.Item
          name="stepDescription"
          label="命令内容"
          rules={[{ required: true, message: '请输入命令内容' }]}
        >
          <TextArea placeholder="请输入命令内容，例如：预热炉子至180度" rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CommandEditModal; 