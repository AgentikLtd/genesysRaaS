/**
 * Custom Template Components
 * Enhanced template forms for Simple and Condition templates
 */

import React, { useState } from 'react';
import {
  Form,
  Input,
  Button,
  Space,
  Card,
  Typography,
  Divider,
  message,
  Row,
  Col,
  Tooltip
} from 'antd';
import { PlusOutlined, DeleteOutlined, InfoCircleOutlined } from '@ant-design/icons';
import { Rule } from '../types';

const { Title, Text } = Typography;

interface KeyValuePair {
  key: string;
  value: string;
  id: string;
}

interface CustomTemplateProps {
  onCreateRule: (rule: Rule) => void;
  onCancel: () => void;
  existingRuleNames?: string[];
}

interface SimpleTemplateProps extends CustomTemplateProps {}

interface ConditionTemplateProps extends CustomTemplateProps {}

/**
 * Simple Template Component
 * Allows up to 10 key-value pairs with AND operator
 */
export const SimpleTemplate: React.FC<SimpleTemplateProps> = ({
  onCreateRule,
  onCancel,
  existingRuleNames = []
}) => {
  const [form] = Form.useForm();
  const [keyValuePairs, setKeyValuePairs] = useState<KeyValuePair[]>([
    { key: '', value: '', id: '1' }
  ]);

  const addKeyValuePair = () => {
    if (keyValuePairs.length >= 10) {
      message.warning('Maximum of 10 key-value pairs allowed');
      return;
    }
    const newId = (keyValuePairs.length + 1).toString();
    setKeyValuePairs([...keyValuePairs, { key: '', value: '', id: newId }]);
  };

  const removeKeyValuePair = (id: string) => {
    if (keyValuePairs.length <= 1) return;
    setKeyValuePairs(keyValuePairs.filter(pair => pair.id !== id));
  };

  const updateKeyValuePair = (id: string, field: 'key' | 'value', newValue: string) => {
    setKeyValuePairs(keyValuePairs.map(pair => 
      pair.id === id ? { ...pair, [field]: newValue } : pair
    ));
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const ruleName = values.ruleName;
      
      if (!ruleName) {
        message.error('Please enter a rule name');
        return;
      }

      if (existingRuleNames.includes(ruleName)) {
        message.error('A rule with this name already exists');
        return;
      }

      // Validate key-value pairs
      const validPairs = keyValuePairs.filter(pair => pair.key.trim() && pair.value.trim());
      
      if (validPairs.length === 0) {
        message.error('Please provide at least one valid key-value pair');
        return;
      }

      // Generate rule JSON
      const conditions = validPairs.map(pair => ({
        fact: 'inputValue',
        params: { key: pair.key.trim() },
        operator: 'equal',
        value: pair.value.trim()
      }));

      const rule: Rule = {
        name: ruleName,
        description: `Simple template rule with ${validPairs.length} condition${validPairs.length > 1 ? 's' : ''}`,
        priority: 50,
        defaultDestination: values.defaultDestination || 'Default_Queue',
        conditions: {
          all: conditions
        },
        event: {
          type: 'route_determined',
          params: {
            destination: values.destination || 'Target_Queue',
            reason: 'Simple template rule matched'
          }
        }
      };

      onCreateRule(rule);
      message.success(`Rule "${ruleName}" created successfully`);
    }).catch(error => {
      console.error('Validation failed:', error);
    });
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Title level={4}>Simple Template</Title>
          <Text type="secondary">
            Create a rule with up to 10 key-value conditions using the AND operator
          </Text>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="ruleName"
            label="Rule Name"
            rules={[
              { required: true, message: 'Please enter a rule name' },
              {
                validator: (_, value) => {
                  if (existingRuleNames.includes(value)) {
                    return Promise.reject('A rule with this name already exists');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input placeholder="Enter unique rule name" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="destination"
                label="Target Destination"
                rules={[{ required: true, message: 'Please enter target destination' }]}
              >
                <Input placeholder="Target_Queue" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="defaultDestination"
                label="Default Destination"
                rules={[{ required: true, message: 'Please enter default destination' }]}
              >
                <Input placeholder="Default_Queue" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            <Space>
              Conditions (AND)
              <Tooltip title="All conditions must be met for the rule to match">
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
          </Divider>

          <Space direction="vertical" style={{ width: '100%' }}>
            {keyValuePairs.map((pair, index) => (
              <Row key={pair.id} gutter={16} align="middle">
                <Col span={10}>
                  <Input
                    placeholder={index === 0 ? "intent" : "key"}
                    value={pair.key}
                    onChange={e => updateKeyValuePair(pair.id, 'key', e.target.value)}
                  />
                </Col>
                <Col span={10}>
                  <Input
                    placeholder={index === 0 ? "payInvoice" : "value"}
                    value={pair.value}
                    onChange={e => updateKeyValuePair(pair.id, 'value', e.target.value)}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    {index === keyValuePairs.length - 1 && keyValuePairs.length < 10 && (
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={addKeyValuePair}
                        size="small"
                      />
                    )}
                    {keyValuePairs.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeKeyValuePair(pair.id)}
                        size="small"
                      />
                    )}
                  </Space>
                </Col>
              </Row>
            ))}
          </Space>
        </Form>

        <Divider />

        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit}>Create Rule</Button>
        </Space>
      </Space>
    </Card>
  );
};

/**
 * Condition Template Component  
 * Allows up to 3 AND conditions and up to 7 OR conditions
 */
export const ConditionTemplate: React.FC<ConditionTemplateProps> = ({
  onCreateRule,
  onCancel,
  existingRuleNames = []
}) => {
  const [form] = Form.useForm();
  const [andConditions, setAndConditions] = useState<KeyValuePair[]>([
    { key: '', value: '', id: 'and-1' }
  ]);
  const [orConditions, setOrConditions] = useState<KeyValuePair[]>([
    { key: '', value: '', id: 'or-1' }
  ]);

  const addAndCondition = () => {
    if (andConditions.length >= 3) {
      message.warning('Maximum of 3 AND conditions allowed');
      return;
    }
    const newId = `and-${andConditions.length + 1}`;
    setAndConditions([...andConditions, { key: '', value: '', id: newId }]);
  };

  const removeAndCondition = (id: string) => {
    if (andConditions.length <= 1) return;
    setAndConditions(andConditions.filter(condition => condition.id !== id));
  };

  const addOrCondition = () => {
    if (orConditions.length >= 7) {
      message.warning('Maximum of 7 OR conditions allowed');
      return;
    }
    const newId = `or-${orConditions.length + 1}`;
    setOrConditions([...orConditions, { key: '', value: '', id: newId }]);
  };

  const removeOrCondition = (id: string) => {
    if (orConditions.length <= 1) return;
    setOrConditions(orConditions.filter(condition => condition.id !== id));
  };

  const updateCondition = (
    conditions: KeyValuePair[], 
    setConditions: React.Dispatch<React.SetStateAction<KeyValuePair[]>>,
    id: string, 
    field: 'key' | 'value', 
    newValue: string
  ) => {
    setConditions(conditions.map(condition => 
      condition.id === id ? { ...condition, [field]: newValue } : condition
    ));
  };

  const handleSubmit = () => {
    form.validateFields().then(values => {
      const ruleName = values.ruleName;
      
      if (!ruleName) {
        message.error('Please enter a rule name');
        return;
      }

      if (existingRuleNames.includes(ruleName)) {
        message.error('A rule with this name already exists');
        return;
      }

      // Validate conditions
      const validAndConditions = andConditions.filter(condition => 
        condition.key.trim() && condition.value.trim()
      );
      const validOrConditions = orConditions.filter(condition => 
        condition.key.trim() && condition.value.trim()
      );
      
      if (validAndConditions.length === 0 && validOrConditions.length === 0) {
        message.error('Please provide at least one valid condition');
        return;
      }

      // Generate rule JSON
      const ruleConditions: any = {};

      if (validAndConditions.length > 0 && validOrConditions.length > 0) {
        // Both AND and OR conditions
        ruleConditions.all = [
          {
            all: validAndConditions.map(condition => ({
              fact: 'inputValue',
              params: { key: condition.key.trim() },
              operator: 'equal',
              value: condition.value.trim()
            }))
          },
          {
            any: validOrConditions.map(condition => ({
              fact: 'inputValue',
              params: { key: condition.key.trim() },
              operator: 'equal',
              value: condition.value.trim()
            }))
          }
        ];
      } else if (validAndConditions.length > 0) {
        // Only AND conditions
        ruleConditions.all = validAndConditions.map(condition => ({
          fact: 'inputValue',
          params: { key: condition.key.trim() },
          operator: 'equal',
          value: condition.value.trim()
        }));
      } else {
        // Only OR conditions
        ruleConditions.any = validOrConditions.map(condition => ({
          fact: 'inputValue',
          params: { key: condition.key.trim() },
          operator: 'equal',
          value: condition.value.trim()
        }));
      }

      const rule: Rule = {
        name: ruleName,
        description: `Condition template rule with ${validAndConditions.length} AND and ${validOrConditions.length} OR condition${validAndConditions.length + validOrConditions.length > 1 ? 's' : ''}`,
        priority: 60,
        defaultDestination: values.defaultDestination || 'Default_Queue',
        conditions: ruleConditions,
        event: {
          type: 'route_determined',
          params: {
            destination: values.destination || 'Target_Queue',
            reason: 'Condition template rule matched'
          }
        }
      };

      onCreateRule(rule);
      message.success(`Rule "${ruleName}" created successfully`);
    }).catch(error => {
      console.error('Validation failed:', error);
    });
  };

  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <div>
          <Title level={4}>Condition Template</Title>
          <Text type="secondary">
            Create a rule with up to 3 AND conditions and up to 7 OR conditions
          </Text>
        </div>

        <Form form={form} layout="vertical">
          <Form.Item
            name="ruleName"
            label="Rule Name"
            rules={[
              { required: true, message: 'Please enter a rule name' },
              {
                validator: (_, value) => {
                  if (existingRuleNames.includes(value)) {
                    return Promise.reject('A rule with this name already exists');
                  }
                  return Promise.resolve();
                }
              }
            ]}
          >
            <Input placeholder="Enter unique rule name" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="destination"
                label="Target Destination"
                rules={[{ required: true, message: 'Please enter target destination' }]}
              >
                <Input placeholder="Target_Queue" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="defaultDestination"
                label="Default Destination"
                rules={[{ required: true, message: 'Please enter default destination' }]}
              >
                <Input placeholder="Default_Queue" />
              </Form.Item>
            </Col>
          </Row>

          <Divider orientation="left">
            <Space>
              AND Conditions (All must match)
              <Tooltip title="All AND conditions must be met">
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
          </Divider>

          <Space direction="vertical" style={{ width: '100%' }}>
            {andConditions.map((condition, index) => (
              <Row key={condition.id} gutter={16} align="middle">
                <Col span={10}>
                  <Input
                    placeholder={index === 0 ? "intent" : "key"}
                    value={condition.key}
                    onChange={e => updateCondition(andConditions, setAndConditions, condition.id, 'key', e.target.value)}
                  />
                </Col>
                <Col span={10}>
                  <Input
                    placeholder={index === 0 ? "payInvoice" : "value"}
                    value={condition.value}
                    onChange={e => updateCondition(andConditions, setAndConditions, condition.id, 'value', e.target.value)}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    {index === andConditions.length - 1 && andConditions.length < 3 && (
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={addAndCondition}
                        size="small"
                      />
                    )}
                    {andConditions.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeAndCondition(condition.id)}
                        size="small"
                      />
                    )}
                  </Space>
                </Col>
              </Row>
            ))}
          </Space>

          <Divider orientation="left">
            <Space>
              OR Conditions (Any can match)
              <Tooltip title="At least one OR condition must be met">
                <InfoCircleOutlined />
              </Tooltip>
            </Space>
          </Divider>

          <Space direction="vertical" style={{ width: '100%' }}>
            {orConditions.map((condition, index) => (
              <Row key={condition.id} gutter={16} align="middle">
                <Col span={10}>
                  <Input
                    placeholder={index === 0 ? "customerType" : "key"}
                    value={condition.key}
                    onChange={e => updateCondition(orConditions, setOrConditions, condition.id, 'key', e.target.value)}
                  />
                </Col>
                <Col span={10}>
                  <Input
                    placeholder={index === 0 ? "premium" : "value"}
                    value={condition.value}
                    onChange={e => updateCondition(orConditions, setOrConditions, condition.id, 'value', e.target.value)}
                  />
                </Col>
                <Col span={4}>
                  <Space>
                    {index === orConditions.length - 1 && orConditions.length < 7 && (
                      <Button
                        type="dashed"
                        icon={<PlusOutlined />}
                        onClick={addOrCondition}
                        size="small"
                      />
                    )}
                    {orConditions.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => removeOrCondition(condition.id)}
                        size="small"
                      />
                    )}
                  </Space>
                </Col>
              </Row>
            ))}
          </Space>
        </Form>

        <Divider />

        <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
          <Button onClick={onCancel}>Cancel</Button>
          <Button type="primary" onClick={handleSubmit}>Create Rule</Button>
        </Space>
      </Space>
    </Card>
  );
};