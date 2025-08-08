import React, { useState, useEffect, useCallback } from 'react';
import { Card, Row, Col, Button, Space, Typography, message, Spin, Statistic, Modal, Alert, Tag, Input, Tooltip, Radio, Dropdown, Menu } from 'antd';
import { SaveOutlined, PlayCircleOutlined, UndoOutlined, DeploymentUnitOutlined, ExclamationCircleOutlined, CodeOutlined, PartitionOutlined, PlusOutlined, FileAddOutlined, CopyOutlined, TagOutlined, FileTextOutlined, ClockCircleOutlined, CheckCircleOutlined, EditOutlined } from '@ant-design/icons';
import MonacoEditor from '@monaco-editor/react';
import { useNavigate } from 'react-router-dom';
import { genesysService } from '../services/genesysService';
import { RuleEngineSimulator } from '../utils/ruleEngineSimulator';
import VisualRuleEditor from '../components/VisualRuleEditor';
import TemplateSelector from '../components/VisualRuleEditor/panels/TemplateSelector';

const { Title } = Typography;
const { TextArea } = Input;

interface TestResult {
  destination: string;
  matchedRules: string[];
  executionTime: number;
  evaluationSteps?: Array<{
    ruleName: string;
    passed: boolean;
    conditions: Array<{
      fact: string;
      operator: string;
      expected: any;
      actual: any;
      passed: boolean;
    }>;
  }>;
}

export const RulesEditor: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeRules, setActiveRules] = useState<any>(null);
  const [editedRules, setEditedRules] = useState('{}');
  const [hasChanges, setHasChanges] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [testModalVisible, setTestModalVisible] = useState(false);
  const [deployModalVisible, setDeployModalVisible] = useState(false);
  const [deployDescription, setDeployDescription] = useState('');
  const [testInput, setTestInput] = useState('{\n  "brand": "Admiral",\n  "botIntent": "cancelGeneral"\n}');
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isValidSyntax, setIsValidSyntax] = useState(true);
  const [syntaxError, setSyntaxError] = useState<string>('');
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [editorMode, setEditorMode] = useState<'json' | 'visual'>('json');
  const [parsedRules, setParsedRules] = useState<any>(null);
  const [templateModalVisible, setTemplateModalVisible] = useState(false);

  /**
   * Load active rules on component mount
   */
  useEffect(() => {
    loadActiveRules();
  }, []);

  /**
   * Parse rules when edited rules change
   */
  useEffect(() => {
    try {
      const parsed = JSON.parse(editedRules);
      setParsedRules(parsed);
    } catch (error) {
      setParsedRules(null);
    }
  }, [editedRules]);

  /**
   * Load active rules from service
   */
  const loadActiveRules = async () => {
    try {
      setLoading(true);
      const rules = await genesysService.getActiveRules();
      
      if (rules) {
        setActiveRules(rules);
        setEditedRules(JSON.stringify(rules.rules, null, 2));
      } else {
        // No active rules, start with default template
        const defaultRules = {
          engineOptions: {
            allowUndefinedFacts: true
          },
          logging: {
            enabled: true,
            logMatchedRules: true,
            logUnmatchedRules: false,
            logPerformanceMetrics: true
          },
          rules: [{
            name: 'defaultRule',
            description: 'Default routing rule',
            priority: 1,
            defaultDestination: 'Voice_Default_Queue',
            conditions: {
              all: [{
                fact: 'alwaysTrue',
                operator: 'equal',
                value: true
              }]
            },
            event: {
              type: 'route_determined',
              params: {
                destination: 'Voice_Default_Queue'
              }
            }
          }],
          dynamicFacts: [{
            name: 'alwaysTrue',
            calculator: 'return true;',
            options: { cache: true }
          }],
          customOperators: []
        };
        setEditedRules(JSON.stringify(defaultRules, null, 2));
      }
    } catch (error: any) {
      message.error(`Failed to load rules: ${error.message}`);
      console.error('Load error:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Enhanced validation that checks syntax and structure
   */
  const validateSyntax = useCallback((value: string): boolean => {
    try {
      // First check if it's valid JSON
      const parsed = JSON.parse(value);
      
      // Check required top-level fields
      if (!parsed.rules || !Array.isArray(parsed.rules)) {
        setSyntaxError('Missing or invalid field: rules (must be an array)');
        return false;
      }
      
      if (parsed.rules.length === 0) {
        setSyntaxError('Rules array cannot be empty - at least one rule is required');
        return false;
      }
      
      // Validate each rule structure
      for (let i = 0; i < parsed.rules.length; i++) {
        const rule = parsed.rules[i];
        
        if (!rule.name) {
          setSyntaxError(`Rule ${i + 1}: Missing required field 'name'`);
          return false;
        }
        
        if (typeof rule.priority !== 'number') {
          setSyntaxError(`Rule ${i + 1} (${rule.name}): Priority must be a number`);
          return false;
        }
        
        if (!rule.defaultDestination) {
          setSyntaxError(`Rule ${i + 1} (${rule.name}): Missing required field 'defaultDestination'`);
          return false;
        }
        
        if (!rule.conditions) {
          setSyntaxError(`Rule ${i + 1} (${rule.name}): Missing required field 'conditions'`);
          return false;
        }
        
        if (!rule.event || !rule.event.params?.destination) {
          setSyntaxError(`Rule ${i + 1} (${rule.name}): Missing event.params.destination`);
          return false;
        }
        
        // Validate conditions structure
        if (!validateConditionStructure(rule.conditions)) {
          setSyntaxError(`Rule ${i + 1} (${rule.name}): Invalid condition structure`);
          return false;
        }
      }
      
      setSyntaxError('');
      return true;
      
    } catch (error: any) {
      setSyntaxError(`JSON Syntax Error: ${error.message}`);
      return false;
    }
  }, []);

  /**
   * Validate condition structure recursively
   */
  const validateConditionStructure = (condition: any): boolean => {
    if (!condition || typeof condition !== 'object') return false;
    
    // Check for logical operators
    if (condition.all || condition.any) {
      const conditions = condition.all || condition.any;
      if (!Array.isArray(conditions)) return false;
      return conditions.every(c => validateConditionStructure(c));
    }
    
    if (condition.not) {
      return validateConditionStructure(condition.not);
    }
    
    // Check for fact condition
    if (condition.fact) {
      return !!(condition.operator && condition.hasOwnProperty('value'));
    }
    
    return false;
  };

  /**
   * Handle rules editor changes with real-time validation
   */
  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setEditedRules(value);
      setHasChanges(true);
      
      // Validate syntax in real-time
      const isValid = validateSyntax(value);
      setIsValidSyntax(isValid);
      
      // Clear old validation errors when user types (they'll run full validation manually)
      if (validationErrors.length > 0) {
        setValidationErrors([]);
      }
    }
  };

  /**
   * Handle visual editor rule updates
   */
  const handleVisualRuleUpdate = useCallback((updatedConfig: any) => {
    const updatedJson = JSON.stringify(updatedConfig, null, 2);
    setEditedRules(updatedJson);
    setHasChanges(true);
    setParsedRules(updatedConfig);
    
    // Validate the updated configuration
    const isValid = validateSyntax(updatedJson);
    setIsValidSyntax(isValid);
  }, [validateSyntax]);

  /**
   * Handle creating a new rule from template
   */
  const handleCreateRuleFromTemplate = useCallback((newRule: any) => {
    try {
      const currentRules = JSON.parse(editedRules);
      
      // Add the new rule to the existing rules
      if (!currentRules.rules) {
        currentRules.rules = [];
      }
      currentRules.rules.push(newRule);
      
      // Update the editor
      const updatedJson = JSON.stringify(currentRules, null, 2);
      setEditedRules(updatedJson);
      setHasChanges(true);
      setParsedRules(currentRules);
      
      // Switch to visual mode to show the new rule
      setEditorMode('visual');
      
      message.success(`Rule "${newRule.name}" created successfully`);
    } catch (error: any) {
      message.error(`Failed to create rule: ${error.message}`);
    }
  }, [editedRules]);

  /**
   * Get existing rule names for validation
   */
  const getExistingRuleNames = useCallback(() => {
    try {
      const rules = JSON.parse(editedRules);
      return rules.rules?.map((r: any) => r.name) || [];
    } catch {
      return [];
    }
  }, [editedRules]);

  /**
   * Full validation for deployment - validates both syntax and rule logic
   */
  const validateRules = (): boolean => {
    const errors: string[] = [];
    
    if (!validateSyntax(editedRules)) {
      errors.push(syntaxError);
      setValidationErrors(errors);
      return false;
    }
    
    // Parse and validate each rule individually
    try {
      const parsed = JSON.parse(editedRules);
      
      if (parsed.rules && Array.isArray(parsed.rules)) {
        parsed.rules.forEach((rule: any, index: number) => {
          // Validate required fields
          if (!rule.name) {
            errors.push(`Rule ${index + 1}: Missing required field 'name'`);
          }
          
          if (typeof rule.priority !== 'number' || rule.priority < 1 || rule.priority > 999) {
            errors.push(`Rule ${index + 1} (${rule.name || 'unnamed'}): Priority must be a number between 1 and 999`);
          }
          
          if (!rule.defaultDestination || rule.defaultDestination.trim() === '') {
            errors.push(`Rule ${index + 1} (${rule.name || 'unnamed'}): Missing or empty defaultDestination field`);
          }
          
          if (!rule.conditions) {
            errors.push(`Rule ${index + 1} (${rule.name || 'unnamed'}): Missing conditions field`);
          }
          
          if (!rule.event || !rule.event.params || !rule.event.params.destination) {
            errors.push(`Rule ${index + 1} (${rule.name || 'unnamed'}): Missing event destination`);
          }
        });
        
        // Check for duplicate rule names
        const ruleNames = parsed.rules.map((r: any) => r.name).filter(Boolean);
        const duplicates = ruleNames.filter((name: string, index: number) => ruleNames.indexOf(name) !== index);
        if (duplicates.length > 0) {
          errors.push(`Duplicate rule names found: ${[...new Set(duplicates)].join(', ')}`);
        }
      }
    } catch (error) {
      errors.push('Failed to parse rules for validation');
    }
    
    setValidationErrors(errors);
    return errors.length === 0;
  };

  /**
   * Save rules to draft
   */
  const handleSave = async () => {
    if (!validateRules()) return;
    
    try {
      setSaving(true);
      // Since there's no separate save draft, we just validate and show success
      message.success('Rules validated successfully! Use Deploy to save changes.');
      setHasChanges(false);
    } catch (error: any) {
      message.error(`Validation failed: ${error.message}`);
      console.error('Validation error:', error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Deploy rules
   */
  const handleDeploy = () => {
    if (!validateRules()) return;
    setDeployModalVisible(true);
  };

  const confirmDeploy = async () => {
    if (!deployDescription.trim()) {
      message.error('Please provide a description of changes');
      return;
    }
    
    try {
      setSaving(true);
      const rules = JSON.parse(editedRules);
      await genesysService.deployRules(rules, deployDescription);
      message.success('Rules deployed successfully! Changes are now live.');
      setHasChanges(false);
      setDeployDescription('');
      setDeployModalVisible(false);
      
      await loadActiveRules();
    } catch (error: any) {
      message.error(`Deployment failed: ${error.message}`);
      console.error('Deploy error:', error);
    } finally {
      setSaving(false);
    }
  };

  /**
   * Test rules with sample input
   */
  const handleTest = () => {
    if (!isValidSyntax) {
      message.warning('Please fix syntax errors before testing');
      return;
    }
    setTestModalVisible(true);
    setTestResult(null);
  };

  /**
   * Run actual rule engine simulation
   */
  const runTest = async () => {
    try {
      setIsTestRunning(true);
      const startTime = Date.now();
      
      // Parse input and rules with validation
      let input: any;
      let rulesConfig: any;
      
      try {
        // Validate JSON size limits
        if (testInput.length > 10000) {
          message.error('Input JSON is too large (max 10KB)');
          return;
        }
        
        if (editedRules.length > 100000) {
          message.error('Rules JSON is too large (max 100KB)');
          return;
        }
        
        input = JSON.parse(testInput);
        rulesConfig = JSON.parse(editedRules);
        
        // Validate input structure
        if (typeof input !== 'object' || input === null || Array.isArray(input)) {
          message.error('Input must be a valid JSON object');
          return;
        }
        
        if (typeof rulesConfig !== 'object' || rulesConfig === null) {
          message.error('Rules must be a valid JSON object');
          return;
        }
        
        // Validate input has no more than 10 keys
        if (Object.keys(input).length > 10) {
          message.error('Input cannot have more than 10 key-value pairs');
          return;
        }
        
        // Prevent prototype pollution - check for exact dangerous property names
        if (input.hasOwnProperty('__proto__') || input.hasOwnProperty('constructor') || input.hasOwnProperty('prototype')) {
          message.error('Input contains restricted properties');
          return;
        }
        
      } catch (error) {
        message.error('Invalid JSON format');
        return;
      }
      
      // Simulate rule evaluation
      const engine = new RuleEngineSimulator(rulesConfig);
      const result = await engine.evaluate(input);
      
      const executionTime = Date.now() - startTime;
      
      setTestResult({
        destination: result.destination,
        matchedRules: result.matchedRules,
        executionTime,
        evaluationSteps: result.evaluationSteps
      });
      
      message.success('Test completed successfully');
    } catch (error: any) {
      message.error(`Test failed: ${error.message}`);
    } finally {
      setIsTestRunning(false);
    }
  };

  /**
   * Reset editor to current active rules
   */
  const handleReset = () => {
    if (activeRules) {
      setEditedRules(JSON.stringify(activeRules.rules, null, 2));
      setHasChanges(false);
      setValidationErrors([]);
      setIsValidSyntax(true);
      setSyntaxError('');
      message.info('Reset to current active rules');
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" tip="Loading rules..." />
      </div>
    );
  }

  return (
    <>
      {/* Header with stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <div className="info-card info-card-orange">
            <div className="info-card-icon">
              <TagOutlined />
            </div>
            <div className="info-card-content">
              <div className="info-card-label">Active Version</div>
              <div className="info-card-value">v{activeRules?.version || 'N/A'}</div>
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="info-card info-card-blue">
            <div className="info-card-icon">
              <FileTextOutlined />
            </div>
            <div className="info-card-content">
              <div className="info-card-label">Total Rules</div>
              <div className="info-card-value">
                {(() => {
                  try {
                    return JSON.parse(editedRules).rules?.length || 0;
                  } catch {
                    return 0;
                  }
                })()}
              </div>
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className="info-card info-card-green">
            <div className="info-card-icon">
              <ClockCircleOutlined />
            </div>
            <div className="info-card-content">
              <div className="info-card-label">Last Updated</div>
              <div className="info-card-value">
                {activeRules?.createdAt ? new Date(activeRules.createdAt).toLocaleDateString() : 'Never'}
              </div>
            </div>
          </div>
        </Col>
        <Col span={6}>
          <div className={`info-card ${hasChanges ? 'info-card-red' : 'info-card-success'}`}>
            <div className="info-card-icon">
              {hasChanges ? <EditOutlined /> : <CheckCircleOutlined />}
            </div>
            <div className="info-card-content">
              <div className="info-card-label">Status</div>
              <div className="info-card-value">{hasChanges ? 'Modified' : 'Saved'}</div>
            </div>
          </div>
        </Col>
      </Row>

      {/* Action buttons */}
      <Card 
        title={
          <Space>
            <Title level={4} style={{ margin: 0 }}>Rules Configuration</Title>
            <Radio.Group 
              value={editorMode} 
              onChange={(e) => setEditorMode(e.target.value)}
              buttonStyle="solid"
            >
              <Radio.Button value="json">
                <CodeOutlined /> JSON Editor
              </Radio.Button>
              <Radio.Button value="visual" disabled={!isValidSyntax || !parsedRules}>
                <PartitionOutlined /> Visual Editor
              </Radio.Button>
            </Radio.Group>
            {editorMode === 'visual' && !isValidSyntax && (
              <Tooltip title="Fix JSON syntax errors to use Visual Editor">
                <ExclamationCircleOutlined style={{ color: '#ff4d4f', marginLeft: 8 }} />
              </Tooltip>
            )}
          </Space>
        }
        extra={
          <Space>
            <Button
              icon={<UndoOutlined />}
              onClick={handleReset}
              disabled={!hasChanges}
            >
              Reset
            </Button>
            <Tooltip 
              title={!isValidSyntax ? syntaxError : 'Test your rules before deployment'}
              color={!isValidSyntax ? 'red' : undefined}
            >
              <Button
                type="primary"
                icon={<PlayCircleOutlined />}
                onClick={handleTest}
                disabled={!isValidSyntax}
                style={{
                  backgroundColor: !isValidSyntax ? '#ff4d4f' : undefined,
                  borderColor: !isValidSyntax ? '#ff4d4f' : undefined
                }}
              >
                Test
              </Button>
            </Tooltip>
            <Tooltip 
              title={
                validationErrors.length > 0 
                  ? `Cannot deploy: ${validationErrors.length} validation error(s)` 
                  : !isValidSyntax 
                    ? 'Fix syntax errors before deploying'
                    : !hasChanges
                      ? 'No changes to deploy'
                      : 'Deploy changes to production'
              }
              color={validationErrors.length > 0 || !isValidSyntax ? 'red' : undefined}
            >
              <Button
                type="primary"
                icon={<DeploymentUnitOutlined />}
                onClick={handleDeploy}
                loading={saving}
                disabled={!hasChanges || !isValidSyntax || validationErrors.length > 0}
                danger
              >
                Deploy Changes
              </Button>
            </Tooltip>
          </Space>
        }
      >
        {/* Validation errors */}
        {(validationErrors.length > 0 || !isValidSyntax) && (
          <Alert
            message="Validation Errors"
            description={
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {!isValidSyntax && syntaxError && (
                  <li style={{ color: '#ff4d4f' }}>{syntaxError}</li>
                )}
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            }
            type="error"
            showIcon
            style={{ marginBottom: 16 }}
          />
        )}

        {/* Editor Content - JSON or Visual */}
        {editorMode === 'json' ? (
          <MonacoEditor
            height="500px"
            language="json"
            theme="vs-dark"
            value={editedRules}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              wordWrap: 'on',
              automaticLayout: true,
              formatOnPaste: true,
              formatOnType: true
            }}
          />
        ) : (
          <div style={{ minHeight: '500px' }}>
            {parsedRules && isValidSyntax ? (
              <VisualRuleEditor
                rulesConfig={parsedRules}
                onRuleUpdate={handleVisualRuleUpdate}
                readOnly={false}
              />
            ) : (
              <Alert
                message="Invalid JSON Structure"
                description="Please fix the JSON syntax errors in JSON Editor mode before using the Visual Editor."
                type="error"
                showIcon
              />
            )}
          </div>
        )}
      </Card>

      {/* Deploy Modal */}
      <Modal
        title="Deploy Rules Configuration"
        open={deployModalVisible}
        onOk={confirmDeploy}
        onCancel={() => {
          setDeployModalVisible(false);
          setDeployDescription('');
        }}
        confirmLoading={saving}
        okText="Deploy"
        okButtonProps={{ danger: true }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Alert
            message="Warning: This will immediately affect live call routing!"
            description="Make sure the rules have been tested and validated."
            type="warning"
            showIcon
          />
          
          <div>
            <label><strong>Description of Changes: *</strong></label>
            <TextArea
              rows={4}
              value={deployDescription}
              onChange={(e) => setDeployDescription(e.target.value)}
              placeholder="Describe what changes you're making and why..."
              required
            />
            <div style={{ marginTop: 8, color: '#666' }}>
              <small>This description will be saved with the version history</small>
            </div>
          </div>
        </Space>
      </Modal>

      {/* Enhanced Test Modal */}
      <Modal
        title="Test Rules Configuration"
        open={testModalVisible}
        onOk={runTest}
        onCancel={() => {
          setTestModalVisible(false);
          setTestResult(null);
        }}
        width={1000}
        confirmLoading={isTestRunning}
        okText="Run Test"
        okButtonProps={{
          icon: <PlayCircleOutlined />
        }}
      >
        <Row gutter={16}>
          <Col span={10}>
            <Card title="Test Input Data" size="small">
              <MonacoEditor
                height="300px"
                language="json"
                theme="vs-dark"
                value={testInput}
                onChange={(value) => setTestInput(value || '{}')}
                options={{
                  minimap: { enabled: false },
                  fontSize: 12,
                  lineNumbers: 'off',
                  scrollBeyondLastLine: false
                }}
              />
              <Alert
                message="Enter test input JSON (max 10 key-value pairs)"
                type="info"
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col span={14}>
            <Card title="Test Results" size="small">
              {testResult ? (
                <div>
                  <div style={{ marginBottom: 16 }}>
                    <strong>Routing Destination:</strong>{' '}
                    <Tag color="blue" style={{ fontSize: 14 }}>
                      {testResult.destination}
                    </Tag>
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <strong>Matched Rules:</strong>{' '}
                    {testResult.matchedRules.length > 0 ? (
                      <Space wrap>
                        {testResult.matchedRules.map((rule: string, index: number) => (
                          <Tag key={index} color="green">{rule}</Tag>
                        ))}
                      </Space>
                    ) : (
                      <Tag color="default">No rules matched - using default</Tag>
                    )}
                  </div>
                  
                  <div style={{ marginBottom: 16 }}>
                    <strong>Execution Time:</strong> {testResult.executionTime}ms
                  </div>
                  
                  {testResult.evaluationSteps && (
                    <div>
                      <strong>Rule Evaluation Details:</strong>
                      <div style={{ maxHeight: 200, overflowY: 'auto', marginTop: 8 }}>
                        {testResult.evaluationSteps.map((step, idx) => (
                          <div key={idx} style={{ 
                            marginBottom: 8, 
                            padding: 8, 
                            background: step.passed ? '#f6ffed' : '#fff1f0',
                            border: `1px solid ${step.passed ? '#b7eb8f' : '#ffccc7'}`,
                            borderRadius: 4
                          }}>
                            <div>
                              <Tag color={step.passed ? 'success' : 'default'}>
                                {step.ruleName}
                              </Tag>
                              <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>
                                {step.passed ? 'MATCHED' : 'NOT MATCHED'}
                              </span>
                            </div>
                            {step.conditions.length > 0 && (
                              <div style={{ marginTop: 4, fontSize: 12 }}>
                                {step.conditions.map((cond: any, cidx: number) => (
                                  <div key={cidx} style={{ marginLeft: 16, color: '#666' }}>
                                    {cond.fact}: {cond.actual} {cond.operator} {cond.expected} 
                                    {cond.passed ? 
                                      <span style={{ color: '#52c41a' }}> ✓</span> : 
                                      <span style={{ color: '#ff4d4f' }}> ✗</span>
                                    }
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
                  {isTestRunning ? (
                    <Spin tip="Running test..." />
                  ) : (
                    <>
                      <ExclamationCircleOutlined style={{ fontSize: 48, marginBottom: 16 }} />
                      <p>Click "Run Test" to see results</p>
                    </>
                  )}
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </Modal>

      {/* Template Selector Modal */}
      <TemplateSelector
        visible={templateModalVisible}
        onClose={() => setTemplateModalVisible(false)}
        onCreateRule={handleCreateRuleFromTemplate}
        existingRuleNames={getExistingRuleNames()}
      />
    </>
  );
};

export default RulesEditor;