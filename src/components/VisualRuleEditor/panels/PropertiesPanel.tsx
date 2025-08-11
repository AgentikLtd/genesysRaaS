/**
 * Properties Panel Component
 * Allows editing of selected node properties
 */

import React, { useState, useEffect } from 'react';
import { 
  Drawer, 
  Form, 
  Input, 
  Select, 
  InputNumber, 
  Button, 
  Space, 
  Divider,
  Alert,
  Tag,
  Modal
} from 'antd';
import { Node } from 'reactflow';
import { SaveOutlined, DeleteOutlined } from '@ant-design/icons';
import { AVAILABLE_OPERATORS } from '../types';
import { validateNodeData } from '../utils/validation';

const { TextArea } = Input;
const { Option } = Select;

interface PropertiesPanelProps {
  node: Node;
  onUpdate: (nodeId: string, data: any) => void;
  onDelete: (nodeId: string) => void;
  onClose: () => void;
}

/**
 * Panel for editing node properties
 */
const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ 
  node, 
  onUpdate, 
  onDelete,
  onClose 
}) => {
  const [form] = Form.useForm();
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  /**
   * Initialize form with node data
   */
  useEffect(() => {
    form.setFieldsValue(node.data);
  }, [node, form]);

  /**
   * Handle form submission
   */
  const handleSubmit = (values: any) => {
    // Validate data
    const validation = validateNodeData(node.type!, values);
    
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    // Update node
    onUpdate(node.id, values);
    setValidationErrors([]);
    onClose();
  };

  /**
   * Handle node deletion
   */
  const handleDelete = () => {
    // Don't allow deletion of header or event nodes
    if (node.type === 'ruleHeader' || node.type === 'eventNode') {
      Modal.error({
        title: 'Cannot Delete',
        content: 'Header and event nodes cannot be deleted.',
      });
      return;
    }

    Modal.confirm({
      title: 'Delete Node',
      content: 'Are you sure you want to delete this condition node? This action cannot be undone.',
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      icon: <DeleteOutlined style={{ color: '#ff4d4f' }} />,
      onOk() {
        onDelete(node.id);
        onClose();
      },
    });
  };

  /**
   * Render form fields based on node type
   */
  const renderFormFields = () => {
    switch (node.type) {
      case 'ruleHeader':
        return (
          <>
            <Form.Item
              label="Rule Name"
              name="name"
              rules={[{ required: true, message: 'Rule name is required' }]}
            >
              <Input placeholder="Enter rule name" />
            </Form.Item>

            <Form.Item
              label="Priority"
              name="priority"
              rules={[
                { required: true, message: 'Priority is required' },
                { type: 'number', min: 1, max: 999, message: 'Priority must be between 1-999' }
              ]}
            >
              <InputNumber 
                min={1} 
                max={999} 
                style={{ width: '100%' }}
                placeholder="1-999 (higher = evaluated first)"
              />
            </Form.Item>

            <Form.Item
              label="Default Destination"
              name="defaultDestination"
              rules={[{ required: true, message: 'Default destination is required' }]}
            >
              <Input placeholder="Default queue/destination for this rule" />
            </Form.Item>

            <Form.Item
              label="Description"
              name="description"
            >
              <TextArea 
                rows={3} 
                placeholder="Optional description of what this rule does"
              />
            </Form.Item>
          </>
        );

      case 'factCondition':
        return (
          <>
            <Form.Item
              label="Fact"
              name="fact"
              rules={[{ required: true, message: 'Fact is required' }]}
            >
              <Select placeholder="Select fact type">
                <Option value="inputValue">inputValue</Option>
                <Option value="fullInput">fullInput</Option>
                <Option value="inputKeys">inputKeys</Option>
                <Option value="isBusinessHours">isBusinessHours</Option>
                <Option value="hasKey">hasKey</Option>
                <Option value="keyCount">keyCount</Option>
                <Option value="alwaysTrue">alwaysTrue</Option>
              </Select>
            </Form.Item>

            {form.getFieldValue('fact') === 'inputValue' && (
              <Form.Item
                label="Key"
                name={['params', 'key']}
                rules={[{ required: true, message: 'Key is required for inputValue fact' }]}
              >
                <Input placeholder="Enter the input key to check" />
              </Form.Item>
            )}

            <Form.Item
              label="Operator"
              name="operator"
              rules={[{ required: true, message: 'Operator is required' }]}
            >
              <Select placeholder="Select operator">
                {AVAILABLE_OPERATORS.map(op => (
                  <Option key={op} value={op}>{op}</Option>
                ))}
              </Select>
            </Form.Item>

            <Form.Item
              label="Value"
              name="value"
              rules={[{ required: true, message: 'Value is required' }]}
            >
              <Input.TextArea 
                rows={2}
                placeholder="Enter expected value (use JSON format for arrays/objects)"
                onBlur={(e) => {
                  // Try to parse as JSON if it looks like JSON
                  const value = e.target.value;
                  if (value.startsWith('[') || value.startsWith('{')) {
                    try {
                      const parsed = JSON.parse(value);
                      form.setFieldValue('value', parsed);
                    } catch {
                      // Keep as string if not valid JSON
                    }
                  }
                }}
              />
            </Form.Item>

            <Divider />
            
            <div style={{ marginBottom: 16 }}>
              <Space>
                <span>Value Type:</span>
                <Tag color="blue">
                  {typeof form.getFieldValue('value')}
                </Tag>
              </Space>
            </div>
          </>
        );

      case 'eventNode':
        return (
          <>
            <Form.Item
              label="Destination"
              name="destination"
              rules={[{ required: true, message: 'Destination is required' }]}
            >
              <Input placeholder="Queue or flow name" />
            </Form.Item>

            <Form.Item
              label="Priority"
              name="priority"
            >
              <Select placeholder="Optional priority" allowClear>
                <Option value="high">High</Option>
                <Option value="medium">Medium</Option>
                <Option value="low">Low</Option>
              </Select>
            </Form.Item>

            <Form.Item
              label="Reason"
              name="reason"
            >
              <TextArea 
                rows={2} 
                placeholder="Optional reason for this routing decision"
              />
            </Form.Item>
          </>
        );

      case 'logicalOperator':
        return (
          <>
            <Form.Item
              label="Operator Type"
              name="type"
              rules={[{ required: true, message: 'Operator type is required' }]}
            >
              <Select placeholder="Select logical operator">
                <Option value="all">AND - All conditions must be true</Option>
                <Option value="any">OR - Any condition must be true</Option>
                <Option value="not">NOT - Condition must be false</Option>
              </Select>
            </Form.Item>
            
            <Alert
              message="Logical Operator"
              description="This operator controls how child conditions are evaluated. Changes will update the visual representation immediately."
              type="info"
              showIcon
              style={{ marginBottom: 24 }}
            />
          </>
        );

      default:
        return <div>No properties available for this node type</div>;
    }
  };

  return (
    <Drawer
      title={`Edit ${node.type === 'ruleHeader' ? 'Rule' : node.type === 'factCondition' ? 'Condition' : node.type === 'eventNode' ? 'Event' : 'Node'}`}
      placement="right"
      width={400}
      open={true}
      closable={false}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
        autoComplete="off"
      >
        {validationErrors.length > 0 && (
          <Alert
            message="Validation Errors"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            }
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {renderFormFields()}

        <Form.Item style={{ marginTop: 32 }}>
          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
            <Button onClick={onClose}>
              Cancel
            </Button>
            <Space>
              {node.type !== 'ruleHeader' && node.type !== 'eventNode' && (
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                >
                  Delete
                </Button>
              )}
              <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>
                Save Changes
              </Button>
            </Space>
          </Space>
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default PropertiesPanel;