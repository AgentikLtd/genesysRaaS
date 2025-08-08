/**
 * Rule Selector Component
 * Dropdown for selecting individual rules to edit with advanced search functionality
 */

import React, { useState, useMemo } from 'react';
import { Select, Tag, Space, Typography, Input, Button, Tooltip } from 'antd';
import { SearchOutlined, CloseOutlined, PlusOutlined } from '@ant-design/icons';
import { Rule } from './types';

const { Text } = Typography;
const { Option } = Select;

interface RuleSelectorProps {
  rules: Rule[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
}

/**
 * Advanced Rule Selector with multi-term search functionality
 * Shows rule name, priority, and description with filtering capabilities
 */
const RuleSelector: React.FC<RuleSelectorProps> = ({
  rules,
  selectedIndex,
  onSelect
}) => {
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState('');

  /**
   * Get priority color based on value
   */
  const getPriorityColor = (priority: number): string => {
    if (priority >= 90) return 'red';
    if (priority >= 70) return 'orange';
    if (priority >= 50) return 'blue';
    return 'default';
  };

  /**
   * Format rule option label
   */
  const formatRuleLabel = (rule: Rule, index: number): string => {
    return `${index + 1}. ${rule.name}`;
  };

  /**
   * Add a new search term
   */
  const addSearchTerm = (term: string) => {
    const trimmedTerm = term.trim().toLowerCase();
    if (trimmedTerm && !searchTerms.includes(trimmedTerm)) {
      setSearchTerms([...searchTerms, trimmedTerm]);
      setInputValue('');
    }
  };

  /**
   * Remove a search term
   */
  const removeSearchTerm = (termToRemove: string) => {
    setSearchTerms(searchTerms.filter(term => term !== termToRemove));
  };

  /**
   * Clear all search terms
   */
  const clearAllTerms = () => {
    setSearchTerms([]);
    setInputValue('');
  };

  /**
   * Filter rules based on search terms
   * All terms must be found in either rule name, description, or rule JSON content
   */
  const filteredRules = useMemo(() => {
    if (searchTerms.length === 0) {
      return rules.map((rule, index) => ({ rule, originalIndex: index }));
    }

    return rules
      .map((rule, index) => ({ rule, originalIndex: index }))
      .filter(({ rule }) => {
        const searchableContent = [
          rule.name.toLowerCase(),
          rule.description?.toLowerCase() || '',
          JSON.stringify(rule).toLowerCase()
        ].join(' ');

        return searchTerms.every(term => searchableContent.includes(term));
      });
  }, [rules, searchTerms]);

  /**
   * Handle input key press
   */
  const handleInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addSearchTerm(inputValue);
    }
  };

  /**
   * Handle adding term via button
   */
  const handleAddTerm = () => {
    addSearchTerm(inputValue);
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Search Controls */}
      <div style={{ marginBottom: 12 }}>
        <Space.Compact style={{ display: 'flex', width: '100%' }}>
          <Input
            placeholder="Add search term (e.g., 'armiral', 'breakdown')"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleInputKeyPress}
            prefix={<SearchOutlined />}
            style={{ flex: 1 }}
          />
          <Tooltip title="Add search term">
            <Button 
              icon={<PlusOutlined />} 
              onClick={handleAddTerm}
              disabled={!inputValue.trim()}
              type="primary"
            >
              Add
            </Button>
          </Tooltip>
          {searchTerms.length > 0 && (
            <Tooltip title="Clear all search terms">
              <Button 
                icon={<CloseOutlined />} 
                onClick={clearAllTerms}
                danger
              >
                Clear All
              </Button>
            </Tooltip>
          )}
        </Space.Compact>

        {/* Active Search Terms */}
        {searchTerms.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <Space wrap>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Active filters:
              </Text>
              {searchTerms.map((term) => (
                <Tag
                  key={term}
                  closable
                  onClose={() => removeSearchTerm(term)}
                  color="blue"
                  style={{ marginBottom: 4 }}
                >
                  {term}
                </Tag>
              ))}
            </Space>
          </div>
        )}

        {/* Results Summary */}
        <div style={{ marginTop: 8 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {filteredRules.length === rules.length 
              ? `Showing all ${rules.length} rules`
              : `Showing ${filteredRules.length} of ${rules.length} rules`
            }
          </Text>
        </div>
      </div>

      {/* Rule Selector */}
      <Select
        style={{ width: '100%' }}
        placeholder={`Select from ${filteredRules.length} filtered rule${filteredRules.length === 1 ? '' : 's'}`}
        value={selectedIndex}
        onChange={onSelect}
        showSearch={false} // Disabled since we have custom search above
        allowClear={false}
        optionLabelProp="label"
        notFoundContent={filteredRules.length === 0 ? "No rules match your search terms" : undefined}
      >
        {filteredRules.map(({ rule, originalIndex }) => (
          <Option 
            key={originalIndex} 
            value={originalIndex}
            label={`${originalIndex + 1}. ${rule.name}`}
          >
            <div style={{ padding: '4px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
                <Text strong style={{ flex: 1 }}>
                  {formatRuleLabel(rule, originalIndex)}
                </Text>
                <Tag 
                  color={getPriorityColor(rule.priority)} 
                  style={{ marginLeft: '8px', fontSize: '11px' }}
                >
                  Priority: {rule.priority}
                </Tag>
              </div>
              {rule.description && (
                <Text 
                  type="secondary" 
                  style={{ 
                    fontSize: '12px', 
                    display: 'block',
                    whiteSpace: 'normal',
                    lineHeight: '1.4'
                  }}
                >
                  {rule.description}
                </Text>
              )}
              {/* Highlight matching terms in rule content */}
              {searchTerms.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <Text 
                    type="secondary" 
                    style={{ fontSize: 11, color: '#1890ff' }}
                  >
                    Matches: {searchTerms.filter(term => 
                      JSON.stringify(rule).toLowerCase().includes(term)
                    ).join(', ')}
                  </Text>
                </div>
              )}
            </div>
          </Option>
        ))}
      </Select>
    </div>
  );
};

export default RuleSelector;