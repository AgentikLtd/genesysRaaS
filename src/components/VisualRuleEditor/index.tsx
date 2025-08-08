/**
 * Visual Rule Editor Component
 * Main component that provides visual editing capabilities for individual rules
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, Space, Button, message, Alert, Tooltip, Dropdown } from 'antd';
import { EyeOutlined, EditOutlined, InfoCircleOutlined, PlusOutlined, FileAddOutlined, CopyOutlined, DeleteOutlined, WarningOutlined } from '@ant-design/icons';
import RuleSelector from './RuleSelector';
import RuleFlow from './RuleFlow';
import { Rule, RulesConfig } from './types';
import { produce } from 'immer';
import { validateRule } from './utils/validation';
import TemplateSelector from './panels/TemplateSelector';

interface VisualRuleEditorProps {
  rulesConfig: RulesConfig;
  onRuleUpdate: (updatedConfig: RulesConfig) => void;
  readOnly?: boolean;
}

/**
 * Visual Rule Editor main component
 * Provides rule selection and isolated editing functionality
 */
export const VisualRuleEditor: React.FC<VisualRuleEditorProps> = ({
  rulesConfig,
  onRuleUpdate,
  readOnly = false
}) => {
  const [selectedRuleIndex, setSelectedRuleIndex] = useState<number | null>(null);
  const [selectedRule, setSelectedRule] = useState<Rule | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);
  const [warningCollapsed, setWarningCollapsed] = useState(false);

  /**
   * Update selected rule when index changes
   */
  useEffect(() => {
    if (selectedRuleIndex !== null && rulesConfig.rules[selectedRuleIndex]) {
      setSelectedRule(rulesConfig.rules[selectedRuleIndex]);
    } else {
      setSelectedRule(null);
    }
  }, [selectedRuleIndex, rulesConfig]);

  /**
   * Handle rule selection from dropdown
   */
  const handleRuleSelect = useCallback((index: number) => {
    // Warn about unsaved changes
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Do you want to discard them?')) {
        return;
      }
    }
    
    setSelectedRuleIndex(index);
    setIsEditing(false);
    setHasUnsavedChanges(false);
  }, [hasUnsavedChanges]);

  /**
   * Handle rule changes from visual editor
   */
  const handleRuleChange = useCallback((updatedRule: Rule) => {
    if (selectedRuleIndex === null) return;

    // Validate the updated rule
    const validation = validateRule(updatedRule);
    if (!validation.isValid) {
      message.error(`Rule validation failed: ${validation.errors.join(', ')}`);
      return;
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      validation.warnings.forEach(warning => {
        message.warning(warning);
      });
    }

    // Use immer to ensure immutable update
    const updatedConfig = produce(rulesConfig, draft => {
      draft.rules[selectedRuleIndex] = updatedRule;
    });

    // Update parent component
    onRuleUpdate(updatedConfig);
    setHasUnsavedChanges(false);
    message.success(`Rule "${updatedRule.name}" updated successfully`);
  }, [selectedRuleIndex, rulesConfig, onRuleUpdate]);

  /**
   * Handle unsaved changes notification
   */
  const handleUnsavedChanges = useCallback((hasChanges: boolean) => {
    setHasUnsavedChanges(hasChanges);
    if (hasChanges) {
      setWarningCollapsed(false);
    }
  }, []);

  /**
   * Auto-collapse warning after 5 seconds
   */
  useEffect(() => {
    if (hasUnsavedChanges && !warningCollapsed) {
      const timer = setTimeout(() => {
        setWarningCollapsed(true);
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [hasUnsavedChanges, warningCollapsed]);

  /**
   * Toggle warning collapsed state
   */
  const toggleWarningCollapsed = useCallback(() => {
    setWarningCollapsed(!warningCollapsed);
  }, [warningCollapsed]);

  /**
   * Toggle edit mode
   */
  const toggleEditMode = useCallback(() => {
    if (isEditing && hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Do you want to discard them?')) {
        return;
      }
    }
    setIsEditing(!isEditing);
    if (isEditing) {
      setHasUnsavedChanges(false);
    }
  }, [isEditing, hasUnsavedChanges]);

  /**
   * Handle creating a new rule from template
   */
  const handleCreateRuleFromTemplate = useCallback((newRule: Rule) => {
    const updatedConfig = produce(rulesConfig, draft => {
      draft.rules.push(newRule);
    });
    
    onRuleUpdate(updatedConfig);
    
    // Select the new rule
    const newIndex = updatedConfig.rules.length - 1;
    setSelectedRuleIndex(newIndex);
    setIsEditing(true);
    
    message.success(`Rule "${newRule.name}" created and selected`);
  }, [rulesConfig, onRuleUpdate]);

  /**
   * Handle duplicating the selected rule
   */
  const handleDuplicateRule = useCallback(() => {
    if (!selectedRule || selectedRuleIndex === null) return;
    
    // Create a copy with a new name
    const duplicatedRule = produce(selectedRule, draft => {
      draft.name = `${draft.name}_copy`;
      draft.description = `Copy of ${draft.description || draft.name}`;
    });
    
    const updatedConfig = produce(rulesConfig, draft => {
      draft.rules.splice(selectedRuleIndex + 1, 0, duplicatedRule);
    });
    
    onRuleUpdate(updatedConfig);
    
    // Select the duplicated rule
    setSelectedRuleIndex(selectedRuleIndex + 1);
    setIsEditing(true);
    
    message.success(`Rule duplicated as "${duplicatedRule.name}"`);
  }, [selectedRule, selectedRuleIndex, rulesConfig, onRuleUpdate]);

  /**
   * Handle deleting the selected rule
   */
  const handleDeleteRule = useCallback(() => {
    if (!selectedRule || selectedRuleIndex === null) return;
    
    if (!window.confirm(`Are you sure you want to delete rule "${selectedRule.name}"?`)) {
      return;
    }
    
    const updatedConfig = produce(rulesConfig, draft => {
      draft.rules.splice(selectedRuleIndex, 1);
    });
    
    onRuleUpdate(updatedConfig);
    
    // Clear selection
    setSelectedRuleIndex(null);
    setSelectedRule(null);
    setIsEditing(false);
    setHasUnsavedChanges(false);
    
    message.success(`Rule "${selectedRule.name}" deleted`);
  }, [selectedRule, selectedRuleIndex, rulesConfig, onRuleUpdate]);

  /**
   * Get existing rule names for validation
   */
  const getExistingRuleNames = useCallback(() => {
    return rulesConfig.rules.map(r => r.name);
  }, [rulesConfig]);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {/* Header with rule selector and mode toggle */}
      <Card>
        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'end', gap: '12px', width: '100%' }}>
            <div style={{ flex: '1' }}>
              <RuleSelector
                rules={rulesConfig.rules}
                selectedIndex={selectedRuleIndex}
                onSelect={handleRuleSelect}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '0px' }}>
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'template',
                      icon: <FileAddOutlined />,
                      label: 'New from Template',
                      onClick: () => setTemplateModalVisible(true)
                    },
                    {
                      key: 'blank',
                      icon: <PlusOutlined />,
                      label: 'New Blank Rule',
                      onClick: () => {
                        const blankRule: Rule = {
                          name: `rule_${Date.now()}`,
                          description: 'New rule',
                          priority: 50,
                          defaultDestination: 'Default_Queue',
                          conditions: { all: [] },
                          event: {
                            type: 'route_determined',
                            params: { destination: 'Default_Queue' }
                          }
                        };
                        handleCreateRuleFromTemplate(blankRule);
                      }
                    },
                    {
                      type: 'divider'
                    },
                    {
                      key: 'duplicate',
                      icon: <CopyOutlined />,
                      label: 'Duplicate Selected',
                      disabled: !selectedRule,
                      onClick: handleDuplicateRule
                    },
                    {
                      key: 'delete',
                      icon: <DeleteOutlined />,
                      label: 'Delete Selected',
                      disabled: !selectedRule || rulesConfig.rules.length <= 1,
                      danger: true,
                      onClick: handleDeleteRule
                    }
                  ]
                }}
                placement="bottomLeft"
                disabled={readOnly}
              >
                <Button icon={<PlusOutlined />} disabled={readOnly}>
                  Rule Actions
                </Button>
              </Dropdown>
              
              {selectedRule && !readOnly && (
                <Button
                  icon={isEditing ? <EyeOutlined /> : <EditOutlined />}
                  onClick={toggleEditMode}
                  type={isEditing ? 'default' : 'primary'}
                >
                  {isEditing ? 'View Mode' : 'Edit Mode'}
                </Button>
              )}
              
              <Tooltip title="Select a rule from the dropdown to view or edit it">
                <InfoCircleOutlined style={{ color: '#1890ff' }} />
              </Tooltip>
            </div>
          </div>
        </Space>
      </Card>

      {/* Info alert for new users */}
      {!selectedRule && (
        <Alert
          message="Getting Started"
          description="Select a rule from the dropdown above to view its visual representation. You can then switch to Edit Mode to make changes."
          type="info"
          showIcon
          closable
        />
      )}

      {/* Visual rule editor */}
      {selectedRule && (
        <RuleFlow
          rule={selectedRule}
          isEditing={isEditing && !readOnly}
          onChange={handleRuleChange}
          onUnsavedChanges={handleUnsavedChanges}
        />
      )}

      {/* Unsaved changes warning */}
      {hasUnsavedChanges && (
        <div
          onClick={toggleWarningCollapsed}
          style={{
            position: 'fixed',
            bottom: 20,
            right: 20,
            zIndex: 1000,
            cursor: 'pointer',
            transition: 'all 0.3s ease-in-out',
            maxWidth: warningCollapsed ? '60px' : '350px',
            overflow: 'hidden'
          }}
        >
          {warningCollapsed ? (
            <div
              style={{
                background: '#faad14',
                border: '1px solid #ffc53d',
                borderRadius: '6px',
                padding: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)'
              }}
            >
              <WarningOutlined style={{ color: '#ffffff', fontSize: '18px' }} />
            </div>
          ) : (
            <Alert
              message="Unsaved Changes"
              description="You have unsaved changes. Click 'Save Changes' in the editor to apply them."
              type="warning"
              showIcon
              style={{ 
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                borderRadius: '6px'
              }}
            />
          )}
        </div>
      )}

      {/* Template Selector Modal */}
      <TemplateSelector
        visible={templateModalVisible}
        onClose={() => setTemplateModalVisible(false)}
        onCreateRule={handleCreateRuleFromTemplate}
        existingRuleNames={getExistingRuleNames()}
      />
    </Space>
  );
};

export default VisualRuleEditor;