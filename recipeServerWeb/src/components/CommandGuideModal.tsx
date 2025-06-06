import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Space, Divider, message, Alert, Card } from 'antd';
import { PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';

const { TextArea } = Input;

interface CommandStep {
  step: number;
  action: string;
  details: string;
}

interface CommandGuideModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (commandJson: string) => void;
  initialCommand: string;
  deviceModelName: string;
}

const CommandGuideModal: React.FC<CommandGuideModalProps> = ({
  visible,
  onClose,
  onSave,
  initialCommand,
  deviceModelName,
}) => {
  const [form] = Form.useForm();
  const [commandSteps, setCommandSteps] = useState<Partial<CommandStep>[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setParseError(null);
      try {
        // Attempt to parse the initial JSON command string
        if (initialCommand && initialCommand.trim() !== '{}' && initialCommand.trim() !== '') {
          const parsedCommand = JSON.parse(initialCommand);
          if (Array.isArray(parsedCommand)) {
            // Ensure steps have the expected structure, providing defaults if needed
            const validatedSteps = parsedCommand.map((step, index) => ({
              step: typeof step.step === 'number' ? step.step : index + 1,
              action: typeof step.action === 'string' ? step.action : '',
              details: typeof step.details === 'string' ? step.details : '',
            }));
            setCommandSteps(validatedSteps);
            form.setFieldsValue({ steps: validatedSteps });
          } else {
            // Handle cases where the JSON is valid but not an array (or empty)
            setCommandSteps([{ step: 1 }]); // Start with one empty step
            form.setFieldsValue({ steps: [{ step: 1 }] });
            if (initialCommand.trim() !== '{}') {
              setParseError('Current command is valid JSON, but not in the expected array format. Starting fresh.');
            }
          }
        } else {
          // Start with one empty step if initial command is empty or default '{}'
          setCommandSteps([{ step: 1 }]);
          form.setFieldsValue({ steps: [{ step: 1 }] });
        }
      } catch (error) {
        console.error("Error parsing initial command JSON:", error);
        setParseError(`Failed to parse current command JSON. Starting fresh. Error: ${(error as Error).message}`);
        // Reset to a single empty step on parse failure
        setCommandSteps([{ step: 1 }]);
        form.setFieldsValue({ steps: [{ step: 1 }] });
      }
    } else {
      // Reset form when modal is hidden
      form.resetFields();
      setCommandSteps([]);
      setParseError(null);
    }
  }, [visible, initialCommand, form]);

  const handleSave = () => {
    form.validateFields()
      .then(values => {
        // Filter out any potentially empty/invalid steps if necessary
        const finalSteps = values.steps
          ?.filter((step: any) => step && step.action) // Ensure at least an action is present
          .map((step: any, index: number) => ({ // Re-assign step numbers sequentially
             ...step, 
             step: index + 1 
           })); 
           
        if (!finalSteps || finalSteps.length === 0) {
          message.warning('Please add at least one valid command step.');
          return;
        }

        try {
          const commandJson = JSON.stringify(finalSteps, null, 2); // Pretty print JSON
          onSave(commandJson);
          onClose(); // Close modal on successful save
        } catch (error) {
          message.error('Failed to generate command JSON.');
          console.error("Error stringifying command steps:", error);
        }
      })
      .catch(info => {
        console.log('Validate Failed:', info);
        message.error('Please fill in all required fields for command steps.');
      });
  };
  
  // Function to update the preview whenever the form fields change
  const handleValuesChange = (_: any, allValues: any) => {
    if (allValues.steps) {
       // Update internal state for preview, ensure step numbers are sequential for preview
       setCommandSteps(allValues.steps.map((s: Partial<CommandStep>, i: number) => ({...s, step: i+1 })));
    }
  };

  return (
    <Modal
      title={`Generate Command for ${deviceModelName}`}
      visible={visible}
      onCancel={onClose}
      onOk={handleSave}
      okText="Apply Command"
      cancelText="Cancel"
      width={700} // Wider modal for better layout
      maskClosable={false}
      destroyOnClose // Destroy state when closed
    >
      <Form 
        form={form} 
        layout="vertical" 
        autoComplete="off"
        onValuesChange={handleValuesChange} // Update preview on change
      >
        {parseError && <Alert message={parseError} type="warning" showIcon style={{ marginBottom: 16 }} />}
        
        <p>Define the sequence of actions for this device. Each step represents a distinct command.</p>
        
        <Form.List name="steps">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, name, ...restField }, index) => (
                <Card 
                  key={key} 
                  size="small" 
                  style={{ marginBottom: 16, backgroundColor: '#f9f9f9' }}
                  title={`Command Step ${index + 1}`}
                  extra={
                     fields.length > 1 ? (
                       <MinusCircleOutlined onClick={() => remove(name)} style={{ color: 'red' }} />
                     ) : null
                  }
                >
                  {/* Hidden step number managed automatically */}
                  <Form.Item {...restField} name={[name, 'step']} initialValue={index + 1} hidden>
                     <Input type="hidden" />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, 'action']}
                    label="Action"
                    rules={[{ required: true, message: 'Please input the command action (e.g., heat, mix, wait)' }]}
                  >
                    <Input placeholder="e.g., heat, mix, wait" />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, 'details']}
                    label="Details"
                    rules={[{ required: true, message: 'Please provide details for the action' }]}
                  >
                    <TextArea 
                      rows={2} 
                      placeholder={'e.g., {"temperature": 180, "unit": "C"} or {"duration": 300, "unit": "seconds"}'} 
                    />
                  </Form.Item>
                </Card>
              ))}
              <Form.Item>
                <Button type="dashed" onClick={() => add({ step: fields.length + 1 })} block icon={<PlusOutlined />}>
                  Add Command Step
                </Button>
              </Form.Item>
            </>
          )}
        </Form.List>

        <Divider orientation="left">Generated Command Preview</Divider>
        <TextArea
          value={JSON.stringify(commandSteps.map(s => ({step: s.step, action: s.action, details: s.details})), null, 2)} // Ensure preview matches saved structure
          rows={6}
          readOnly
          style={{ fontFamily: 'monospace', backgroundColor: '#eee' }}
        />
      </Form>
    </Modal>
  );
};

export default CommandGuideModal; 