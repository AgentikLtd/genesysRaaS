/**
 * Node Palette Component
 * Provides draggable nodes for adding to the flow editor
 */

import React from 'react';
import { Card, Space, Typography, Tooltip } from 'antd';
import {
  BranchesOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  PartitionOutlined,
  ApiOutlined,
  MinusCircleOutlined
} from '@ant-design/icons';

const { Text } = Typography;

interface PaletteNode {
  type: string;
  label: string;
  icon: React.ReactNode;
  data: any;
  category: 'logical' | 'condition' | 'action';
  description: string;
}

const paletteNodes: PaletteNode[] = [
  {
    type: 'logicalOperator',
    label: 'ALL Conditions',
    icon: <BranchesOutlined />,
    data: { type: 'all' },
    category: 'logical',
    description: 'All child conditions must be true'
  },
  {
    type: 'logicalOperator',
    label: 'ANY Conditions',
    icon: <PartitionOutlined />,
    data: { type: 'any' },
    category: 'logical',
    description: 'At least one child condition must be true'
  },
  {
    type: 'logicalOperator',
    label: 'NOT Condition',
    icon: <MinusCircleOutlined />,
    data: { type: 'not' },
    category: 'logical',
    description: 'Negates the child condition'
  },
  {
    type: 'factCondition',
    label: 'Fact Condition',
    icon: <CheckCircleOutlined />,
    data: {
      fact: '',
      operator: 'equal',
      value: ''
    },
    category: 'condition',
    description: 'Check a fact against a value'
  },
  {
    type: 'factCondition',
    label: 'Custom Fact',
    icon: <ApiOutlined />,
    data: {
      fact: '',
      operator: 'equal',
      value: '',
      params: {}
    },
    category: 'condition',
    description: 'Check a custom fact with parameters'
  }
];

interface NodePaletteProps {
  onNodeDragStart?: (event: React.DragEvent, nodeType: string, nodeData: any) => void;
}

/**
 * Node Palette for drag and drop functionality
 */
const NodePalette: React.FC<NodePaletteProps> = ({ onNodeDragStart }) => {
  /**
   * Handle drag start event
   */
  const handleDragStart = (event: React.DragEvent, node: PaletteNode) => {
    event.dataTransfer.effectAllowed = 'move';
    
    // Store node data in dataTransfer
    const nodeData = {
      type: node.type,
      data: node.data,
      label: node.label
    };
    event.dataTransfer.setData('application/reactflow', JSON.stringify(nodeData));
    
    if (onNodeDragStart) {
      onNodeDragStart(event, node.type, node.data);
    }
  };

  /**
   * Group nodes by category
   */
  const logicalNodes = paletteNodes.filter(n => n.category === 'logical');
  const conditionNodes = paletteNodes.filter(n => n.category === 'condition');

  return (
    <Card
      title="Node Palette"
      size="small"
      style={{
        position: 'absolute',
        left: 10,
        top: 10,
        width: 200,
        zIndex: 1000,
        maxHeight: '400px',
        overflowY: 'auto'
      }}
      bodyStyle={{ padding: '8px' }}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        {/* Logical Operators */}
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Logical Operators</Text>
          <Space direction="vertical" style={{ width: '100%', marginTop: 4 }}>
            {logicalNodes.map((node) => (
              <Tooltip key={node.label} title={node.description} placement="right">
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, node)}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    backgroundColor: '#fafafa',
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  {node.icon}
                  <Text style={{ fontSize: 12 }}>{node.label}</Text>
                </div>
              </Tooltip>
            ))}
          </Space>
        </div>

        {/* Conditions */}
        <div>
          <Text type="secondary" style={{ fontSize: 12 }}>Conditions</Text>
          <Space direction="vertical" style={{ width: '100%', marginTop: 4 }}>
            {conditionNodes.map((node) => (
              <Tooltip key={node.label} title={node.description} placement="right">
                <div
                  draggable
                  onDragStart={(e) => handleDragStart(e, node)}
                  style={{
                    padding: '6px 8px',
                    border: '1px solid #d9d9d9',
                    borderRadius: 4,
                    backgroundColor: '#fafafa',
                    cursor: 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  {node.icon}
                  <Text style={{ fontSize: 12 }}>{node.label}</Text>
                </div>
              </Tooltip>
            ))}
          </Space>
        </div>

        {/* Instructions */}
        <div style={{ marginTop: 8, padding: 8, backgroundColor: '#f0f2f5', borderRadius: 4 }}>
          <Text style={{ fontSize: 11, color: '#666' }}>
            Drag nodes to the canvas to add them to your rule
          </Text>
        </div>
      </Space>
    </Card>
  );
};

export default NodePalette;