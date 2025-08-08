/**
 * Template Selector Component
 * Allows users to create new rules using custom template builders
 */

import React, { useState, useMemo } from 'react';
import {
  Modal,
  Card,
  Space,
  Typography,
  Input,
  Button,
  Tag
} from 'antd';
import {
  FileAddOutlined,
  SearchOutlined,
  SettingOutlined,
  BuildOutlined
} from '@ant-design/icons';
import { SimpleTemplate, ConditionTemplate } from '../templates/CustomTemplates';
import { Rule } from '../types';

const { Title, Text } = Typography;
const { Search } = Input;

interface TemplateSelectorProps {
  visible: boolean;
  onClose: () => void;
  onCreateRule: (rule: Rule) => void;
  existingRuleNames?: string[];
}

type TemplateMode = 'selection' | 'simple' | 'condition';

interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: React.ReactNode;
  mode: 'simple' | 'condition';
}

const CUSTOM_TEMPLATES: CustomTemplate[] = [
  {
    id: 'basic-routing',
    name: 'Basic Routing Rule',
    description: 'Create simple routing rules with multiple conditions that all need to match. Perfect for straightforward call routing based on customer data.',
    category: 'Basic',
    icon: <SettingOutlined />,
    mode: 'simple'
  },
  {
    id: 'advanced-routing',
    name: 'Smart Routing Rule',
    description: 'Build complex routing logic with both required conditions (AND) and flexible alternatives (OR). Ideal for sophisticated routing scenarios.',
    category: 'Advanced',
    icon: <BuildOutlined />,
    mode: 'condition'
  }
];

/**
 * Template Selector Modal for creating new rules
 */
const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  visible,
  onClose,
  onCreateRule,
  existingRuleNames = []
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [templateMode, setTemplateMode] = useState<TemplateMode>('selection');

  /**
   * Filter custom templates based on search
   */
  const filteredTemplates = useMemo(() => {
    if (!searchQuery.trim()) {
      return CUSTOM_TEMPLATES;
    }

    const lowerQuery = searchQuery.toLowerCase();
    return CUSTOM_TEMPLATES.filter(template => 
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.category.toLowerCase().includes(lowerQuery)
    );
  }, [searchQuery]);

  /**
   * Handle modal close
   */
  const handleClose = () => {
    setSearchQuery('');
    setTemplateMode('selection');
    onClose();
  };

  /**
   * Handle custom template creation
   */
  const handleCustomTemplateCreate = (rule: Rule) => {
    onCreateRule(rule);
    handleClose();
  };

  /**
   * Handle back to selection
   */
  const handleBackToSelection = () => {
    setTemplateMode('selection');
  };

  const getModalFooter = () => {
    if (templateMode === 'simple' || templateMode === 'condition') {
      return null; // Custom templates handle their own footer
    }
    
    return [
      <Button key="cancel" onClick={handleClose}>
        Cancel
      </Button>
    ];
  };

  const getModalTitle = () => {
    switch (templateMode) {
      case 'simple':
        return (
          <Space>
            <SettingOutlined />
            <span>Basic Routing Rule</span>
          </Space>
        );
      case 'condition':
        return (
          <Space>
            <BuildOutlined />
            <span>Smart Routing Rule</span>
          </Space>
        );
      default:
        return (
          <Space>
            <FileAddOutlined />
            <span>Choose a Template</span>
          </Space>
        );
    }
  };

  return (
    <Modal
      title={getModalTitle()}
      open={visible}
      onCancel={handleClose}
      width={900}
      footer={getModalFooter()}
    >
      {templateMode === 'simple' ? (
        <SimpleTemplate
          onCreateRule={handleCustomTemplateCreate}
          onCancel={handleBackToSelection}
          existingRuleNames={existingRuleNames}
        />
      ) : templateMode === 'condition' ? (
        <ConditionTemplate
          onCreateRule={handleCustomTemplateCreate}
          onCancel={handleBackToSelection}
          existingRuleNames={existingRuleNames}
        />
      ) : (
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* Search */}
          <div>
            <Search
              placeholder="Search templates..."
              allowClear
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{ width: '100%', marginBottom: 16 }}
              prefix={<SearchOutlined />}
            />
          </div>

          {/* Templates */}
          <div>
            <Title level={5}>Templates</Title>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {filteredTemplates.map(template => (
                <Card
                  key={template.id}
                  hoverable
                  onClick={() => setTemplateMode(template.mode)}
                  style={{ cursor: 'pointer', width: 280, minHeight: 160 }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size="small">
                    <Space>
                      {template.icon}
                      <Text strong style={{ fontSize: 16 }}>{template.name}</Text>
                    </Space>
                    <Text type="secondary" style={{ fontSize: 13, lineHeight: '1.4' }}>
                      {template.description}
                    </Text>
                    <Tag color={template.mode === 'simple' ? 'green' : 'blue'} style={{ marginTop: 8 }}>
                      {template.category}
                    </Tag>
                  </Space>
                </Card>
              ))}
            </div>
            
            {filteredTemplates.length === 0 && (
              <div style={{ textAlign: 'center', padding: 40 }}>
                <Text type="secondary">No templates found matching your search</Text>
              </div>
            )}
          </div>
        </Space>
      )}
    </Modal>
  );
};

export default TemplateSelector;