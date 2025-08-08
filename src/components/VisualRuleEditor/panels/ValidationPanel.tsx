
/**
 * Validation Panel Component
 * Displays validation results for the rule flow
 */

import React from 'react';
import { Alert, List, Space, Tag, Typography } from 'antd';
import { 
  CloseOutlined, 
  WarningOutlined, 
  CheckCircleOutlined,
  CloseCircleOutlined 
} from '@ant-design/icons';
import { ValidationResult } from '../types';

const { Text } = Typography;

interface ValidationPanelProps {
  result: ValidationResult;
  onClose: () => void;
}

/**
 * Panel showing validation results
 */
const ValidationPanel: React.FC<ValidationPanelProps> = ({ result, onClose }) => {
  const getStatusIcon = () => {
    if (!result.isValid) {
      return <CloseCircleOutlined style={{ color: '#ff4d4f', fontSize: 20 }} />;
    }
    if (result.warnings.length > 0) {
      return <WarningOutlined style={{ color: '#faad14', fontSize: 20 }} />;
    }
    return <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />;
  };

  const getStatusText = () => {
    if (!result.isValid) {
      return 'Validation Failed';
    }
    if (result.warnings.length > 0) {
      return 'Validation Passed with Warnings';
    }
    return 'Validation Passed';
  };

  const getStatusColor = () => {
    if (!result.isValid) return 'error';
    if (result.warnings.length > 0) return 'warning';
    return 'success';
  };

  return (
    <div
      style={{
        position: 'absolute',
        top: 60,
        right: 20,
        width: 350,
        background: 'white',
        borderRadius: 8,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        zIndex: 1000
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <Space>
          {getStatusIcon()}
          <Text strong>{getStatusText()}</Text>
        </Space>
        <CloseOutlined 
          onClick={onClose}
          style={{ cursor: 'pointer', color: '#666' }}
        />
      </div>

      <div style={{ padding: 16, maxHeight: 400, overflow: 'auto' }}>
        {result.errors.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <Text type="danger" strong>
              Errors ({result.errors.length})
            </Text>
            <List
              size="small"
              dataSource={result.errors}
              renderItem={(error) => (
                <List.Item style={{ padding: '8px 0' }}>
                  <Space>
                    <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
                    <Text>{error}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        )}

        {result.warnings.length > 0 && (
          <div>
            <Text type="warning" strong>
              Warnings ({result.warnings.length})
            </Text>
            <List
              size="small"
              dataSource={result.warnings}
              renderItem={(warning) => (
                <List.Item style={{ padding: '8px 0' }}>
                  <Space>
                    <WarningOutlined style={{ color: '#faad14' }} />
                    <Text>{warning}</Text>
                  </Space>
                </List.Item>
              )}
            />
          </div>
        )}

        {result.isValid && result.warnings.length === 0 && (
          <Alert
            message="All checks passed"
            description="Your rule configuration is valid and ready to save."
            type="success"
            showIcon
          />
        )}
      </div>
    </div>
  );
};

export default ValidationPanel;