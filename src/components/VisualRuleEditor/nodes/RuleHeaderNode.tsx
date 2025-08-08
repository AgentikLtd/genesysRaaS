
/**
 * Rule Header Node Component
 * Visual representation of the rule metadata
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, Tag, Space, Typography, Badge } from 'antd';
import { 
  CrownOutlined,
  FileTextOutlined,
  ThunderboltOutlined,
  ArrowDownOutlined,
  PlayCircleOutlined,
  EnvironmentOutlined
} from '@ant-design/icons';

const { Text, Title } = Typography;

/**
 * Get priority level and color
 */
const getPriorityLevel = (priority: number): { label: string; color: string } => {
  if (priority >= 90) return { label: 'Critical', color: 'red' };
  if (priority >= 70) return { label: 'High', color: 'orange' };
  if (priority >= 50) return { label: 'Medium', color: 'blue' };
  if (priority >= 30) return { label: 'Low', color: 'cyan' };
  return { label: 'Minimal', color: 'default' };
};

/**
 * Node component for rule header/metadata
 */
const RuleHeaderNode: React.FC<NodeProps> = ({ data, selected }) => {
  const priorityLevel = getPriorityLevel(data.priority);
  
  return (
    <div style={{ position: 'relative' }}>
      {/* START Indicator */}
      <div style={{
        position: 'absolute',
        top: -40,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#722ed1',
        color: 'white',
        padding: '4px 12px',
        borderRadius: '12px',
        fontSize: '12px',
        fontWeight: 'bold',
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        boxShadow: 'none'
      }}>
        <PlayCircleOutlined /> START
      </div>
      
      <Card
        size="small"
        style={{
          minWidth: 380,
          border: selected ? '3px solid #722ed1' : '2px solid #722ed1',
          borderRadius: '12px',
          background: selected ? '#f9f0ff' : '#f9f0ff',
          cursor: 'pointer',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginTop: '20px'
        }}
        bodyStyle={{ padding: '20px' }}
        hoverable
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Rule Name */}
          <div style={{ textAlign: 'center' }}>
            <Space align="center" size="middle">
              <CrownOutlined style={{ fontSize: '28px', color: '#722ed1' }} />
              <Title level={3} style={{ margin: 0, color: '#722ed1' }}>
                {data.name}
              </Title>
            </Space>
          </div>

          {/* Priority Badge */}
          <div style={{ textAlign: 'center' }}>
            <Space size="middle">
              <ThunderboltOutlined style={{ fontSize: '16px' }} />
              <Text type="secondary" style={{ fontSize: '14px' }}>Priority:</Text>
              <Badge 
                count={data.priority} 
                style={{ 
                  backgroundColor: priorityLevel.color,
                  fontSize: '18px',
                  padding: '2px 10px',
                  borderRadius: '6px'
                }} 
              />
              <Tag color={priorityLevel.color} style={{ margin: 0, fontSize: '14px', padding: '2px 8px' }}>
                {priorityLevel.label}
              </Tag>
            </Space>
          </div>

          {/* Description */}
          {data.description && (
            <div style={{ 
              background: '#fff', 
              padding: '12px 16px', 
              borderRadius: '8px',
              border: '1px solid #e1d5f0',
              margin: '0 8px'
            }}>
              <Space size="middle">
                <FileTextOutlined style={{ color: '#722ed1', fontSize: '16px' }} />
                <Text type="secondary" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                  {data.description}
                </Text>
              </Space>
            </div>
          )}

          {/* Default Destination */}
          {data.defaultDestination && (
            <div style={{ 
              background: '#fff', 
              padding: '12px 16px', 
              borderRadius: '8px',
              border: '1px solid #e1d5f0',
              margin: '0 8px'
            }}>
              <Space size="middle">
                <EnvironmentOutlined style={{ color: '#722ed1', fontSize: '16px' }} />
                <Text type="secondary" style={{ fontSize: '13px' }}>Default Destination:</Text>
                <Tag color="blue" style={{ fontSize: '13px', padding: '2px 8px' }}>
                  {data.defaultDestination}
                </Tag>
              </Space>
            </div>
          )}

          {/* Flow Direction Indicator */}
          <div style={{ 
            textAlign: 'center', 
            fontSize: '13px', 
            color: '#666',
            borderTop: '1px solid #e1d5f0',
            paddingTop: '12px',
            background: 'linear-gradient(to bottom, transparent, #f0f5ff)'
          }}>
            <Space>
              <Text>Rule will be evaluated when conditions below are met</Text>
              <ArrowDownOutlined style={{ color: '#722ed1', fontSize: '16px' }} />
            </Space>
          </div>
        </Space>
        
        {/* Enhanced Handle */}
        <Handle 
          type="source" 
          position={Position.Bottom}
          style={{
            background: '#722ed1',
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: '3px solid white',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        />
      </Card>
    </div>
  );
};

export default RuleHeaderNode;