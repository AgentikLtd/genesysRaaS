
/**
 * Fact Condition Node Component
 * Visual representation of a condition check
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, Tag, Space, Typography, Tooltip } from 'antd';
import { 
  FieldStringOutlined,
  NumberOutlined,
  CalendarOutlined,
  OrderedListOutlined,
  CheckCircleOutlined,
  QuestionCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;

/**
 * Get icon for value type
 */
const getValueIcon = (value: any) => {
  if (Array.isArray(value)) return <OrderedListOutlined />;
  if (typeof value === 'number') return <NumberOutlined />;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return <CalendarOutlined />;
  return <FieldStringOutlined />;
};

/**
 * Format display value
 */
const formatValue = (value: any): string => {
  if (value === null) return 'null';
  if (value === undefined) return 'undefined';
  if (Array.isArray(value)) return `[${value.join(', ')}]`;
  if (typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'string' && value.length > 20) {
    return value.substring(0, 20) + '...';
  }
  return String(value);
};

/**
 * Get operator display label
 */
const getOperatorLabel = (operator: string): string => {
  const operatorLabels: Record<string, string> = {
    equal: '=',
    notEqual: '≠',
    greaterThan: '>',
    greaterThanInclusive: '≥',
    lessThan: '<',
    lessThanInclusive: '≤',
    in: 'IN',
    notIn: 'NOT IN',
    contains: 'CONTAINS',
    doesNotContain: 'NOT CONTAINS',
    containsAny: 'CONTAINS ANY',
    matchesPattern: 'MATCHES',
    startsWith: 'STARTS WITH',
    endsWith: 'ENDS WITH'
  };
  return operatorLabels[operator] || operator;
};

/**
 * Node component for fact conditions
 */
const FactConditionNode: React.FC<NodeProps> = ({ data, selected }) => {
  const isInputValue = data.fact === 'inputValue';
  const displayKey = isInputValue && data.params?.key ? data.params.key : data.fact;
  
  return (
    <div style={{ position: 'relative' }}>
      {/* CONDITION Indicator */}
      <div style={{
        position: 'absolute',
        top: -25,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#722ed1',
        color: 'white',
        padding: '2px 8px',
        borderRadius: '8px',
        fontSize: '10px',
        fontWeight: 'bold',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        boxShadow: 'none'
      }}>
        <QuestionCircleOutlined style={{ fontSize: '10px' }} /> CHECK
      </div>
      
      <Card
        size="small"
        style={{
          minWidth: 300,
          maxWidth: 360,
          border: selected ? '3px solid #722ed1' : '2px solid #722ed1',
          borderRadius: '10px',
          background: selected ? '#f9f0ff' : '#fafbff',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginTop: '10px',
          marginBottom: '10px'
        }}
        bodyStyle={{ padding: '16px' }}
        hoverable
      >
        {/* Enhanced Handle */}
        <Handle 
          type="target" 
          position={Position.Top}
          style={{
            background: '#722ed1',
            width: 12,
            height: 12,
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        />
        
        {/* Header */}
        <div style={{
          textAlign: 'center',
          marginBottom: '12px',
          padding: '4px 8px',
          background: 'linear-gradient(135deg, #f0f9ff, #e6f7ff)',
          borderRadius: '6px',
          border: '1px solid #d6e4ff'
        }}>
          <Text strong style={{ color: '#722ed1', fontSize: '14px' }}>
            Condition Evaluation
          </Text>
        </div>
        
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {/* Fact/Key */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>
              {isInputValue ? 'Key:' : 'Fact:'}
            </Text>
            <Tag color="blue" style={{ 
              margin: 0, 
              fontSize: '14px',
              padding: '4px 12px',
              borderRadius: '6px'
            }}>
              {displayKey}
            </Tag>
          </div>

          {/* Operator */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>
              Operator:
            </Text>
            <Tag color="orange" style={{ 
              margin: 0, 
              fontFamily: 'monospace',
              fontSize: '14px',
              padding: '4px 12px',
              borderRadius: '6px',
              fontWeight: 'bold'
            }}>
              {getOperatorLabel(data.operator)}
            </Tag>
          </div>

          {/* Value */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>
              Value:
            </Text>
            <Tooltip title={JSON.stringify(data.value, null, 2)}>
              <Tag 
                icon={getValueIcon(data.value)} 
                style={{ 
                  margin: 0,
                  maxWidth: '180px',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  fontSize: '14px',
                  padding: '4px 12px',
                  borderRadius: '6px'
                }}
              >
                {formatValue(data.value)}
              </Tag>
            </Tooltip>
          </div>

          {/* Additional params */}
          {data.params && Object.keys(data.params).length > 1 && (
            <div style={{ 
              fontSize: '12px', 
              color: '#666',
              borderTop: '1px solid #f0f0f0',
              paddingTop: '8px',
              marginTop: '8px',
              textAlign: 'center'
            }}>
              <Text type="secondary">
                +{Object.keys(data.params).length - 1} additional parameter(s)
              </Text>
            </div>
          )}
          
          {/* Result indicator */}
          <div style={{
            borderTop: '1px solid #e1d5f0',
            paddingTop: '8px',
            textAlign: 'center',
            background: 'linear-gradient(to right, #f6ffed, transparent, #f6ffed)',
            margin: '0 -8px -8px -8px',
            padding: '8px',
            borderRadius: '0 0 8px 8px'
          }}>
            <Space size="small">
              <CheckCircleOutlined style={{ color: '#52c41a', fontSize: '12px' }} />
              <Text type="secondary" style={{ fontSize: '11px' }}>
                Evaluate condition result
              </Text>
            </Space>
          </div>
        </Space>
        
        {/* Enhanced Handle */}
        <Handle 
          type="source" 
          position={Position.Bottom}
          style={{
            background: '#52c41a',
            width: 12,
            height: 12,
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        />
      </Card>
    </div>
  );
};

export default FactConditionNode;