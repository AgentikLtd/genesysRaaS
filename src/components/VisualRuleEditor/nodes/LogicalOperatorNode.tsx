/**
 * Logical Operator Node Component
 * Visual representation of AND/OR/NOT operators
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, Tag, Typography } from 'antd';
import { 
  MergeCellsOutlined, 
  BranchesOutlined, 
  StopOutlined,
  ArrowDownOutlined,
  PartitionOutlined
} from '@ant-design/icons';

const { Text } = Typography;

/**
 * Node component for logical operators (AND/OR/NOT)
 */
const LogicalOperatorNode: React.FC<NodeProps> = ({ data, selected }) => {
  const operatorConfig = {
    all: {
      label: 'AND',
      color: '#52c41a',
      icon: <MergeCellsOutlined />,
      description: 'All conditions must be true'
    },
    any: {
      label: 'OR',
      color: '#1890ff',
      icon: <BranchesOutlined />,
      description: 'Any condition must be true'
    },
    not: {
      label: 'NOT',
      color: '#ff4d4f',
      icon: <StopOutlined />,
      description: 'Condition must be false'
    }
  };

  const config = operatorConfig[data.type as keyof typeof operatorConfig];

  return (
    <div style={{ position: 'relative' }}>
      {/* MIDDLE Flow Indicator */}
      <div style={{
        position: 'absolute',
        top: -30,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#1890ff',
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
        <PartitionOutlined style={{ fontSize: '10px' }} /> LOGIC
      </div>
      
      <Card
        size="small"
        style={{
          minWidth: 180,
          border: selected ? '3px solid #1890ff' : '2px solid #1890ff',
          borderRadius: '10px',
          background: selected ? '#e6f7ff' : '#f0f9ff',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginTop: '10px',
          marginBottom: '10px'
        }}
        bodyStyle={{ 
          padding: '16px 20px',
          textAlign: 'center'
        }}
        hoverable
      >
        {/* Enhanced Handle */}
        <Handle 
          type="target" 
          position={Position.Top}
          style={{
            background: '#1890ff',
            width: 12,
            height: 12,
            borderRadius: '50%',
            border: '2px solid white',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        />
        
        {/* Operator Display */}
        <div style={{ marginBottom: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginBottom: '6px' }}>
            <span style={{ fontSize: '20px', color: config.color }}>{config.icon}</span>
            <Tag 
              color={config.color} 
              style={{ 
                fontSize: '18px', 
                padding: '6px 16px',
                margin: 0,
                fontWeight: 'bold',
                borderRadius: '6px'
              }}
            >
              {config.label}
            </Tag>
          </div>
          
          <Text style={{ 
            fontSize: '13px', 
            color: '#666', 
            fontWeight: 500
          }}>
            {config.description}
          </Text>
        </div>
        
        {/* Flow continuation indicator */}
        <div style={{
          borderTop: '1px solid #d9d9d9',
          paddingTop: '8px',
          color: '#999',
          fontSize: '11px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4
        }}>
          <Text type="secondary" style={{ fontSize: '11px' }}>Continue evaluation</Text>
          <ArrowDownOutlined style={{ fontSize: '12px' }} />
        </div>
        
        {/* Enhanced Handle */}
        <Handle 
          type="source" 
          position={Position.Bottom}
          style={{
            background: config.color,
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

export default LogicalOperatorNode;