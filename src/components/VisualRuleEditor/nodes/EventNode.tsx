
/**
 * Event Node Component
 * Visual representation of the rule's action/destination
 */

import React from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Card, Tag, Space, Typography } from 'antd';
import { 
  SendOutlined, 
  RiseOutlined,
  FallOutlined,
  MinusOutlined,
  InfoCircleOutlined,
  CheckCircleOutlined,
  ArrowRightOutlined
} from '@ant-design/icons';

const { Text } = Typography;

/**
 * Get priority icon and color
 */
const getPriorityConfig = (priority?: string) => {
  switch (priority) {
    case 'high':
      return { icon: <RiseOutlined />, color: 'red' };
    case 'medium':
      return { icon: <MinusOutlined />, color: 'orange' };
    case 'low':
      return { icon: <FallOutlined />, color: 'blue' };
    default:
      return { icon: null, color: 'default' };
  }
};

/**
 * Node component for rule events/actions
 */
const EventNode: React.FC<NodeProps> = ({ data, selected }) => {
  const priorityConfig = getPriorityConfig(data.priority);
  
  return (
    <div style={{ position: 'relative' }}>
      
      <Card
        size="small"
        style={{
          minWidth: 320,
          border: selected ? '3px solid #52c41a' : '2px solid #52c41a',
          borderRadius: '12px',
          background: selected ? '#f6ffed' : '#f6ffed',
          cursor: 'move', // Changed to move cursor to indicate draggable
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}
        bodyStyle={{ padding: '20px' }}
        hoverable
      >
        {/* Enhanced Handle */}
        <Handle 
          type="target" 
          position={Position.Top}
          style={{
            background: '#52c41a',
            width: 14,
            height: 14,
            borderRadius: '50%',
            border: '3px solid white',
            boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
          }}
        />
        
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Header with flow indicator */}
          <div style={{ 
            textAlign: 'center',
            background: 'linear-gradient(to bottom, #f0f9ff, transparent)',
            paddingBottom: '12px',
            borderBottom: '1px solid #d9f7be'
          }}>
            <Space size="middle">
              <ArrowRightOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
              <Text>Processing complete - routing to:</Text>
            </Space>
          </div>
          
          <div style={{ textAlign: 'center' }}>
            <Space size="middle">
              <SendOutlined style={{ fontSize: '24px', color: '#52c41a' }} />
              <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>Route Destination</Text>
            </Space>
          </div>

          {/* Destination */}
          <div style={{ 
            background: '#fff', 
            padding: '16px 20px', 
            borderRadius: '8px',
            border: '2px solid #d9f7be',
            margin: '0 8px'
          }}>
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>
                  Queue/Flow:
                </Text>
                <Tag color="green" style={{ 
                  margin: 0, 
                  fontSize: '16px', 
                  padding: '4px 12px',
                  fontWeight: 'bold'
                }}>
                  {data.destination}
                </Tag>
              </div>

              {/* Priority */}
              {data.priority && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text type="secondary" style={{ fontSize: '14px', fontWeight: 500 }}>
                    Priority:
                  </Text>
                  <Tag 
                    icon={priorityConfig.icon} 
                    color={priorityConfig.color}
                    style={{ margin: 0, fontSize: '14px', padding: '4px 8px' }}
                  >
                    {data.priority.toUpperCase()}
                  </Tag>
                </div>
              )}

              {/* Reason */}
              {data.reason && (
                <div style={{ 
                  borderTop: '1px solid #f0f0f0', 
                  paddingTop: '12px',
                  marginTop: '8px'
                }}>
                  <Space size="middle">
                    <InfoCircleOutlined style={{ color: '#52c41a', fontSize: '16px' }} />
                    <Text type="secondary" style={{ fontSize: '14px', lineHeight: '1.5' }}>
                      {data.reason}
                    </Text>
                  </Space>
                </div>
              )}
            </Space>
          </div>
        </Space>
      </Card>
      
      {/* END Indicator */}
      <div style={{
        position: 'absolute',
        bottom: -40,
        left: '50%',
        transform: 'translateX(-50%)',
        background: '#52c41a',
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
        <CheckCircleOutlined /> END
      </div>
    </div>
  );
};

export default EventNode;