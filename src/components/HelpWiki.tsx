import React from 'react';
import { Modal, Tabs, Typography, Space, Tag, Alert, Collapse, Divider, Card, Steps } from 'antd';
import { 
  InfoCircleOutlined, 
  CodeOutlined, 
  BugOutlined, 
  QuestionCircleOutlined,
  PartitionOutlined,
  PlayCircleOutlined,
  FileTextOutlined,
  DeploymentUnitOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  CrownOutlined,
  CheckCircleOutlined,
  MergeCellsOutlined,
  BranchesOutlined,
  StopOutlined,
  SendOutlined,
  EditOutlined,
  PlusOutlined,
  SaveOutlined,
  EyeOutlined
} from '@ant-design/icons';

const { Title, Paragraph, Text } = Typography;
const { TabPane } = Tabs;
const { Panel } = Collapse;
const { Step } = Steps;

interface HelpWikiProps {
  visible: boolean;
  onClose: () => void;
}

export const HelpWiki: React.FC<HelpWikiProps> = ({ visible, onClose }) => {
  return (
    <Modal
      title={
        <Space>
          <QuestionCircleOutlined />
          <span>Genesys Rules Engine - Complete User Guide</span>
        </Space>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={1000}
      style={{ top: 20 }}
    >
      <Tabs defaultActiveKey="1" size="small">
        <TabPane tab="Getting Started" key="1" icon={<InfoCircleOutlined />}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Title level={4}>Welcome to Genesys Rules Engine Manager</Title>
              <Paragraph>
                This application enables you to dynamically manage call routing rules for your Genesys contact center 
                without redeploying Lambda functions. Rules determine how incoming calls are routed to different queues 
                based on customer data, intent, priority, and business logic.
              </Paragraph>
            </div>
            
            <Card title="Key Features" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><EditOutlined style={{ color: '#1890ff' }} /> <strong>Dual Editor Modes:</strong> JSON editor and Visual flow designer</div>
                <div><PartitionOutlined style={{ color: '#52c41a' }} /> <strong>Visual Rule Builder:</strong> Drag-and-drop interface for complex logic</div>
                <div><CodeOutlined style={{ color: '#722ed1' }} /> <strong>Syntax Highlighting:</strong> Real-time validation and error detection</div>
                <div><PlayCircleOutlined style={{ color: '#fa8c16' }} /> <strong>Rule Testing:</strong> Simulate routing with sample data</div>
                <div><FileTextOutlined style={{ color: '#13c2c2' }} /> <strong>Template System:</strong> Pre-built patterns for common scenarios</div>
                <div><DeploymentUnitOutlined style={{ color: '#f5222d' }} /> <strong>Version Control:</strong> Track changes and rollback capability</div>
              </Space>
            </Card>

            <Card title="Quick Start Guide" size="small">
              <Steps direction="vertical" size="small">
                <Step
                  icon={<PlusOutlined />}
                  title="Create Your First Rule"
                  description="Use 'Add Rule' → 'New from Template' to start with a proven pattern"
                />
                <Step
                  icon={<EditOutlined />}
                  title="Configure Rule Properties"
                  description="Set name, priority (1-999), description, and default destination"
                />
                <Step
                  icon={<PartitionOutlined />}
                  title="Add Conditions"
                  description="Define when the rule should trigger using facts, operators, and values"
                />
                <Step
                  icon={<PlayCircleOutlined />}
                  title="Test Your Rule"
                  description="Use the Test button to verify routing with sample input data"
                />
                <Step
                  icon={<DeploymentUnitOutlined />}
                  title="Deploy Changes"
                  description="Deploy to production after testing - changes take effect immediately"
                />
              </Steps>
            </Card>
            
            <Alert
              message="Production Impact Warning"
              description="Rules deployed here immediately affect live call routing in your contact center. Always test thoroughly before deployment."
              type="warning"
              showIcon
            />
          </Space>
        </TabPane>

        <TabPane tab="Visual Editor" key="2" icon={<PartitionOutlined />}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Title level={4}>Visual Rule Editor Guide</Title>
              <Paragraph>
                The Visual Editor provides a flowchart-style interface for building complex routing logic. 
                Each rule is represented as a connected flow of nodes.
              </Paragraph>
            </div>

            <Card title="Node Types" size="small">
              <Collapse>
                <Panel 
                  header={
                    <Space>
                      <CrownOutlined style={{ color: '#722ed1' }} />
                      <strong>Rule Header Node</strong>
                      <Tag color="purple">START</Tag>
                    </Space>
                  } 
                  key="header"
                >
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <Text><strong>Purpose:</strong> Defines rule metadata and entry point</Text>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <Text><strong>Properties:</strong></Text>
                      <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                        <li style={{ marginBottom: '4px' }}><strong>Name:</strong> Unique identifier for the rule</li>
                        <li style={{ marginBottom: '4px' }}><strong>Priority:</strong> 1-999 (higher numbers = higher priority)</li>
                        <li style={{ marginBottom: '4px' }}><strong>Description:</strong> Optional rule explanation</li>
                        <li style={{ marginBottom: '4px' }}><strong>Default Destination:</strong> Fallback queue if conditions fail</li>
                      </ul>
                    </div>
                    <div>
                      <Text><strong>Priority Levels:</strong></Text>
                      <div style={{ marginTop: '8px' }}>
                        <Space wrap>
                          <Tag color="red">90+ Critical</Tag>
                          <Tag color="orange">70-89 High</Tag>
                          <Tag color="blue">50-69 Medium</Tag>
                          <Tag color="cyan">30-49 Low</Tag>
                          <Tag color="default">1-29 Minimal</Tag>
                        </Space>
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel 
                  header={
                    <Space>
                      <QuestionCircleOutlined style={{ color: '#722ed1' }} />
                      <strong>Fact Condition Node</strong>
                      <Tag color="blue">CHECK</Tag>
                    </Space>
                  } 
                  key="condition"
                >
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <Text><strong>Purpose:</strong> Evaluates input data against criteria</Text>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <Text><strong>Components:</strong></Text>
                      <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                        <li style={{ marginBottom: '4px' }}><strong>Fact:</strong> Data source (usually 'inputValue' for call data)</li>
                        <li style={{ marginBottom: '4px' }}><strong>Key:</strong> Specific field to check (e.g., 'brand', 'intent')</li>
                        <li style={{ marginBottom: '4px' }}><strong>Operator:</strong> Comparison method (equal, contains, etc.)</li>
                        <li style={{ marginBottom: '4px' }}><strong>Value:</strong> Expected value to match against</li>
                      </ul>
                    </div>
                    <div>
                      <Text><strong>Common Patterns:</strong></Text>
                      <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontFamily: 'monospace', fontSize: 12, marginTop: '8px' }}>
                        Brand Check: inputValue.brand = "Admiral"<br/>
                        Intent Match: inputValue.intent = "support"<br/>
                        Priority Level: inputValue.priority {'>'} 3
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel 
                  header={
                    <Space>
                      <MergeCellsOutlined style={{ color: '#1890ff' }} />
                      <strong>Logical Operator Node</strong>
                      <Tag color="cyan">LOGIC</Tag>
                    </Space>
                  } 
                  key="logic"
                >
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <Text><strong>Purpose:</strong> Combines multiple conditions with boolean logic</Text>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <Text><strong>Operator Types:</strong></Text>
                      <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                        <li style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <MergeCellsOutlined style={{ color: '#52c41a' }} />
                          <span><strong>AND (all):</strong> All connected conditions must be true</span>
                        </li>
                        <li style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <BranchesOutlined style={{ color: '#1890ff' }} />
                          <span><strong>OR (any):</strong> At least one condition must be true</span>
                        </li>
                        <li style={{ marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <StopOutlined style={{ color: '#ff4d4f' }} />
                          <span><strong>NOT:</strong> Inverts the result (true becomes false)</span>
                        </li>
                      </ul>
                    </div>
                    <div>
                      <Text><strong>Use Cases:</strong></Text>
                      <div style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 12, marginTop: '8px' }}>
                        AND: VIP customer AND urgent intent<br/>
                        OR: English OR Spanish language<br/>
                        NOT: NOT business hours
                      </div>
                    </div>
                  </div>
                </Panel>

                <Panel 
                  header={
                    <Space>
                      <SendOutlined style={{ color: '#52c41a' }} />
                      <strong>Event Node</strong>
                      <Tag color="green">END</Tag>
                    </Space>
                  } 
                  key="event"
                >
                  <div style={{ padding: '8px 0' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <Text><strong>Purpose:</strong> Defines the routing action when conditions are met</Text>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <Text><strong>Properties:</strong></Text>
                      <ul style={{ marginTop: '8px', paddingLeft: '20px' }}>
                        <li style={{ marginBottom: '4px' }}><strong>Destination:</strong> Target queue or flow name</li>
                        <li style={{ marginBottom: '4px' }}><strong>Priority:</strong> Call priority level (high/medium/low)</li>
                        <li style={{ marginBottom: '4px' }}><strong>Reason:</strong> Optional explanation for routing decision</li>
                      </ul>
                    </div>
                    <div>
                      <Text><strong>Queue Naming:</strong> Use your Genesys queue names exactly (case-sensitive)</Text>
                    </div>
                  </div>
                </Panel>
              </Collapse>
            </Card>

            <Card title="Visual Editor Controls" size="small">
              <div style={{ padding: '8px 0' }}>
                <ul style={{ paddingLeft: '20px' }}>
                  <li style={{ marginBottom: '8px' }}><strong>Navigation:</strong> Pan by dragging background, zoom with mouse wheel</li>
                  <li style={{ marginBottom: '8px' }}><strong>Selection:</strong> Click nodes to select and view properties</li>
                  <li style={{ marginBottom: '8px' }}><strong>Connections:</strong> Automatically created based on rule flow logic</li>
                  <li style={{ marginBottom: '8px' }}><strong>Properties Panel:</strong> Edit selected node properties on the right</li>
                  <li style={{ marginBottom: '8px' }}><strong>Node Palette:</strong> Add new nodes from the left panel</li>
                </ul>
              </div>
            </Card>
          </Space>
        </TabPane>
        
        <TabPane tab="Rule Syntax" key="3" icon={<CodeOutlined />}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Title level={4}>JSON Rule Structure</Title>
              <Paragraph>
                Rules are defined in JSON format following the json-rules-engine specification. 
                Each rule contains metadata, conditions, and actions.
              </Paragraph>
            </div>
            
            <Collapse defaultActiveKey={['structure']}>
              <Panel header="Complete Rule Structure" key="structure">
                <pre style={{ 
                  background: '#1e1e1e', 
                  color: '#d4d4d4', 
                  padding: 16, 
                  borderRadius: 4,
                  fontSize: 12,
                  overflow: 'auto'
                }}>{`{
  "engineOptions": {
    "allowUndefinedFacts": true
  },
  "logging": {
    "enabled": true,
    "logMatchedRules": true,
    "logUnmatchedRules": false,
    "logPerformanceMetrics": true
  },
  "rules": [
    {
      "name": "vipCustomerRouting",
      "description": "Route VIP customers to priority queue",
      "priority": 90,
      "defaultDestination": "Standard_Queue",
      "conditions": {
        "all": [
          {
            "fact": "inputValue",
            "params": { "key": "customerType" },
            "operator": "equal",
            "value": "vip"
          },
          {
            "fact": "inputValue",
            "params": { "key": "intent" },
            "operator": "in",
            "value": ["support", "billing", "complaint"]
          }
        ]
      },
      "event": {
        "type": "route_determined",
        "params": {
          "destination": "VIP_Priority_Queue",
          "priority": "high",
          "reason": "VIP customer with service request"
        }
      }
    }
  ],
  "dynamicFacts": [
    {
      "name": "isBusinessHours",
      "calculator": "const hour = new Date().getHours(); return hour >= 9 && hour < 17;",
      "options": { "cache": true }
    }
  ],
  "customOperators": []
}`}</pre>
              </Panel>
              
              <Panel header="Required Fields" key="required">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div><Tag color="red">name</Tag> Unique identifier for the rule</div>
                  <div><Tag color="red">priority</Tag> Number 1-999 (higher = more important)</div>
                  <div><Tag color="red">defaultDestination</Tag> Fallback queue name</div>
                  <div><Tag color="red">conditions</Tag> Logic that determines when rule applies</div>
                  <div><Tag color="red">event</Tag> Action to take when conditions are met</div>
                  <div><Tag color="orange">description</Tag> Recommended: explains rule purpose</div>
                </Space>
              </Panel>

              <Panel header="Available Operators" key="operators">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div><strong>Equality:</strong></div>
                  <Space wrap>
                    <Tag color="blue">equal</Tag>
                    <Tag color="blue">notEqual</Tag>
                  </Space>
                  
                  <div><strong>Numeric Comparison:</strong></div>
                  <Space wrap>
                    <Tag color="green">greaterThan</Tag>
                    <Tag color="green">lessThan</Tag>
                    <Tag color="green">greaterThanInclusive</Tag>
                    <Tag color="green">lessThanInclusive</Tag>
                  </Space>
                  
                  <div><strong>Array/List Operations:</strong></div>
                  <Space wrap>
                    <Tag color="purple">in</Tag>
                    <Tag color="purple">notIn</Tag>
                    <Tag color="purple">contains</Tag>
                    <Tag color="purple">doesNotContain</Tag>
                  </Space>
                  
                  <div><strong>String Operations:</strong></div>
                  <Space wrap>
                    <Tag color="orange">startsWith</Tag>
                    <Tag color="orange">endsWith</Tag>
                    <Tag color="orange">matchesPattern</Tag>
                  </Space>
                </Space>
              </Panel>
              
              <Panel header="Condition Logic" key="conditions">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>all (AND):</Text> All nested conditions must be true
                    <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, margin: '8px 0', fontSize: 12 }}>{`"conditions": {
  "all": [
    { "fact": "inputValue", "params": { "key": "brand" }, "operator": "equal", "value": "Admiral" },
    { "fact": "inputValue", "params": { "key": "intent" }, "operator": "equal", "value": "support" }
  ]
}`}</pre>
                  </div>
                  
                  <div>
                    <Text strong>any (OR):</Text> At least one nested condition must be true
                    <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, margin: '8px 0', fontSize: 12 }}>{`"conditions": {
  "any": [
    { "fact": "inputValue", "params": { "key": "language" }, "operator": "equal", "value": "spanish" },
    { "fact": "inputValue", "params": { "key": "language" }, "operator": "equal", "value": "french" }
  ]
}`}</pre>
                  </div>
                  
                  <div>
                    <Text strong>not:</Text> Inverts the nested condition result
                    <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, margin: '8px 0', fontSize: 12 }}>{`"conditions": {
  "not": {
    "fact": "isBusinessHours",
    "operator": "equal",
    "value": true
  }
}`}</pre>
                  </div>
                </Space>
              </Panel>

              <Panel header="Common Patterns" key="patterns">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <div>
                    <Text strong>Brand-Based Routing:</Text>
                    <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, margin: '4px 0', fontSize: 11 }}>{`{
  "fact": "inputValue",
  "params": { "key": "brand" },
  "operator": "equal",
  "value": "Admiral"
}`}</pre>
                  </div>

                  <div>
                    <Text strong>Multi-Intent Matching:</Text>
                    <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, margin: '4px 0', fontSize: 11 }}>{`{
  "fact": "inputValue",
  "params": { "key": "intent" },
  "operator": "in",
  "value": ["billing", "payment", "invoice"]
}`}</pre>
                  </div>

                  <div>
                    <Text strong>Priority Threshold:</Text>
                    <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, margin: '4px 0', fontSize: 11 }}>{`{
  "fact": "inputValue",
  "params": { "key": "priorityScore" },
  "operator": "greaterThanInclusive",
  "value": 8
}`}</pre>
                  </div>

                  <div>
                    <Text strong>Complex Nested Logic:</Text>
                    <pre style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, margin: '4px 0', fontSize: 11 }}>{`"conditions": {
  "all": [
    {
      "any": [
        { "fact": "inputValue", "params": { "key": "customerTier" }, "operator": "equal", "value": "platinum" },
        { "fact": "inputValue", "params": { "key": "customerTier" }, "operator": "equal", "value": "gold" }
      ]
    },
    {
      "fact": "inputValue",
      "params": { "key": "issueComplexity" },
      "operator": "greaterThan",
      "value": 5
    }
  ]
}`}</pre>
                  </div>
                </Space>
              </Panel>
            </Collapse>
          </Space>
        </TabPane>

        <TabPane tab="Rule Templates" key="4" icon={<FileTextOutlined />}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Title level={4}>Pre-Built Rule Templates</Title>
              <Paragraph>
                Templates provide proven patterns for common routing scenarios. Use "Add Rule" → "New from Template" 
                to start with a working example that you can customize.
              </Paragraph>
            </div>

            <Card title="Available Template Categories" size="small">
              <Collapse>
                <Panel header="Basic Templates" key="basic">
                  <ul>
                    <li><strong>Simple Equality Check:</strong> Route based on single field matching</li>
                    <li><strong>Default Catch-All:</strong> Fallback rule for unmatched calls</li>
                  </ul>
                </Panel>

                <Panel header="Customer Type Templates" key="customer">
                  <ul>
                    <li><strong>VIP Customer Routing:</strong> Priority service for VIP customers</li>
                    <li><strong>New Customer Welcome:</strong> Special handling for first-time callers</li>
                    <li><strong>Account Status Routing:</strong> Route based on account standing</li>
                  </ul>
                </Panel>

                <Panel header="Intent-Based Templates" key="intent">
                  <ul>
                    <li><strong>Multiple Intent Routing:</strong> Group similar intents to same queue</li>
                    <li><strong>Escalation Intent:</strong> Direct escalation requests to senior agents</li>
                    <li><strong>Self-Service Redirect:</strong> Route simple requests to automated systems</li>
                  </ul>
                </Panel>

                <Panel header="Time-Based Templates" key="time">
                  <ul>
                    <li><strong>Business Hours Routing:</strong> Different queues for business vs. after hours</li>
                    <li><strong>Holiday Routing:</strong> Special handling for holidays</li>
                    <li><strong>Weekend Routing:</strong> Reduced staff weekend queues</li>
                  </ul>
                </Panel>

                <Panel header="Complex Templates" key="complex">
                  <ul>
                    <li><strong>Tiered Support Routing:</strong> Multi-level support based on customer and issue</li>
                    <li><strong>Geographic Routing:</strong> Route by customer location/timezone</li>
                    <li><strong>Skill-Based Routing:</strong> Match customer needs with agent skills</li>
                  </ul>
                </Panel>

                <Panel header="Language Templates" key="language">
                  <ul>
                    <li><strong>Multi-Language Support:</strong> Route to language-specific agents</li>
                    <li><strong>Translator Queue:</strong> Route non-English speakers to translators</li>
                  </ul>
                </Panel>
              </Collapse>
            </Card>

            <Card title="Using Templates" size="small">
              <Steps direction="vertical" size="small">
                <Step
                  icon={<PlusOutlined />}
                  title="Access Template Selector"
                  description="Click 'Add Rule' → 'New from Template' in the Rules Editor"
                />
                <Step
                  icon={<EyeOutlined />}
                  title="Browse Categories"
                  description="Explore templates by category or search by keywords"
                />
                <Step
                  icon={<SettingOutlined />}
                  title="Customize Variables"
                  description="Fill in template variables with your specific values (queue names, conditions)"
                />
                <Step
                  icon={<CheckCircleOutlined />}
                  title="Generate Rule"
                  description="Template creates a complete rule that you can further customize"
                />
              </Steps>
            </Card>

            <Alert
              message="Template Best Practices"
              description="Templates are starting points - always customize field names, queue names, and values to match your Genesys configuration. Test thoroughly after customization."
              type="info"
              showIcon
            />
          </Space>
        </TabPane>

        <TabPane tab="Testing & Deployment" key="5" icon={<PlayCircleOutlined />}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Title level={4}>Testing Your Rules</Title>
              <Paragraph>
                Always test rules before deploying to production. The test simulator shows exactly 
                how your rules will behave with real call data.
              </Paragraph>
            </div>

            <Card title="Test Process" size="small">
              <Steps direction="vertical" size="small">
                <Step
                  icon={<PlayCircleOutlined />}
                  title="Open Test Modal"
                  description="Click the 'Test' button in the Rules Editor (requires valid JSON syntax)"
                />
                <Step
                  icon={<CodeOutlined />}
                  title="Enter Test Data"
                  description="Provide sample input JSON that mimics real call data structure"
                />
                <Step
                  icon={<ThunderboltOutlined />}
                  title="Run Simulation"
                  description="Click 'Run Test' to execute rules engine simulation"
                />
                <Step
                  icon={<FileTextOutlined />}
                  title="Review Results"
                  description="Analyze destination, matched rules, and execution details"
                />
              </Steps>
            </Card>

            <Card title="Test Data Examples" size="small">
              <Collapse>
                <Panel header="Basic Customer Data" key="basic-test">
                  <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 12 }}>{`{
  "brand": "Admiral",
  "intent": "support",
  "customerType": "standard",
  "language": "english",
  "priority": 5
}`}</pre>
                </Panel>

                <Panel header="VIP Customer Scenario" key="vip-test">
                  <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 12 }}>{`{
  "brand": "Admiral",
  "intent": "complaint",
  "customerType": "vip",
  "language": "english",
  "priority": 9,
  "accountStatus": "active",
  "previousIssues": ["billing", "service"]
}`}</pre>
                </Panel>

                <Panel header="Complex Routing Data" key="complex-test">
                  <pre style={{ background: '#f5f5f5', padding: 12, borderRadius: 4, fontSize: 12 }}>{`{
  "brand": "Admiral",
  "intent": "technical_support",
  "customerType": "business",
  "language": "spanish",
  "priority": 7,
  "productType": "enterprise",
  "issueCategory": "critical",
  "agentSkillsRequired": ["technical", "spanish"]
}`}</pre>
                </Panel>
              </Collapse>
            </Card>

            <Card title="Understanding Test Results" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><strong>Destination:</strong> The queue where the call would be routed</div>
                <div><strong>Matched Rules:</strong> Which rules fired (in order of priority)</div>
                <div><strong>Execution Time:</strong> How long rule evaluation took</div>
                <div><strong>Evaluation Steps:</strong> Detailed breakdown of condition checking</div>
                <div><strong>Condition Results:</strong> Shows which conditions passed/failed and why</div>
              </Space>
            </Card>

            <Divider />

            <div>
              <Title level={4}>Deployment Process</Title>
              <Paragraph>
                Deployment makes your rules live in production. Changes take effect immediately 
                for all incoming calls.
              </Paragraph>
            </div>

            <Card title="Deployment Steps" size="small">
              <Steps direction="vertical" size="small">
                <Step
                  icon={<SaveOutlined />}
                  title="Validate Rules"
                  description="Click 'Validate Rules' to check syntax and structure"
                />
                <Step
                  icon={<PlayCircleOutlined />}
                  title="Test Thoroughly"
                  description="Test with multiple scenarios including edge cases"
                />
                <Step
                  icon={<DeploymentUnitOutlined />}
                  title="Deploy Changes"
                  description="Click 'Deploy Changes' and provide description"
                />
                <Step
                  icon={<FileTextOutlined />}
                  title="Monitor Results"
                  description="Check execution logs and version history for confirmation"
                />
              </Steps>
            </Card>

            <Alert
              message="Deployment Safety Checklist"
              description={
                <ul style={{ marginBottom: 0, marginTop: 8 }}>
                  <li>All rules have been tested with realistic data</li>
                  <li>Queue names match exactly with your Genesys configuration</li>
                  <li>Default destinations are specified for all rules</li>
                  <li>Rule priorities are set appropriately (most specific rules = higher priority)</li>
                  <li>Business stakeholders have approved the routing changes</li>
                </ul>
              }
              type="warning"
              showIcon
            />
          </Space>
        </TabPane>
        
        <TabPane tab="Troubleshooting" key="6" icon={<BugOutlined />}>
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div>
              <Title level={4}>Common Issues & Solutions</Title>
              <Paragraph>
                Quick solutions for the most frequent problems encountered when working with rules.
              </Paragraph>
            </div>
            
            <Collapse defaultActiveKey={['syntax']}>
              <Panel header="JSON Syntax Errors" key="syntax">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>Common Issues:</Text>
                  <ul>
                    <li><strong>Missing commas:</strong> Every object/array element except the last needs a comma</li>
                    <li><strong>Unquoted strings:</strong> All strings must be in double quotes "like this"</li>
                    <li><strong>Mismatched brackets:</strong> Every {'{'} must have a matching {'}'}, every [ must have a ]</li>
                    <li><strong>Trailing commas:</strong> Remove commas after the last element in objects/arrays</li>
                  </ul>
                  
                  <Text strong>Quick Fixes:</Text>
                  <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, fontSize: 12 }}>
                    ❌ Bad: "value": "test",{'}'} // trailing comma<br/>
                    ✅ Good: "value": "test"{'}'}<br/><br/>
                    ❌ Bad: operator: equal  // unquoted<br/>
                    ✅ Good: "operator": "equal"<br/><br/>
                    ❌ Bad: ["one" "two"]  // missing comma<br/>
                    ✅ Good: ["one", "two"]
                  </div>
                </Space>
              </Panel>

              <Panel header="Rules Not Matching" key="matching">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>Debugging Steps:</Text>
                  <ol>
                    <li><strong>Check key names:</strong> Field names are case-sensitive ('Intent' ≠ 'intent')</li>
                    <li><strong>Verify data types:</strong> Numbers should not be in quotes unless they're string values</li>
                    <li><strong>Test with exact data:</strong> Use the actual field names and values from your system</li>
                    <li><strong>Check rule priority:</strong> Higher priority rules (larger numbers) run first</li>
                    <li><strong>Review operator choice:</strong> 'equal' vs 'in' vs 'contains' have different behaviors</li>
                  </ol>

                  <Text strong>Common Mismatches:</Text>
                  <div style={{ background: '#f5f5f5', padding: 8, borderRadius: 4, fontSize: 12 }}>
                    ❌ "key": "Brand" when data has "brand"<br/>
                    ❌ "value": "5" when data has number 5<br/>
                    ❌ "operator": "equal" when checking multiple values<br/>
                    ✅ Use "operator": "in" for multiple values<br/>
                    ✅ Match exact case and data types
                  </div>
                </Space>
              </Panel>

              <Panel header="Visual Editor Issues" key="visual">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>Can't Switch to Visual Mode:</Text>
                  <ul>
                    <li>Fix JSON syntax errors first</li>
                    <li>Ensure rules array is not empty</li>
                    <li>Check that all required fields are present</li>
                  </ul>

                  <Text strong>Nodes Not Connecting:</Text>
                  <ul>
                    <li>Logical flow must be complete from start to end</li>
                    <li>Every condition needs to connect to the next step</li>
                    <li>AND/OR nodes need multiple input conditions</li>
                  </ul>

                  <Text strong>Properties Panel Empty:</Text>
                  <ul>
                    <li>Click directly on a node to select it</li>
                    <li>Only one node can be selected at a time</li>
                    <li>Some properties may be inherited from parent nodes</li>
                  </ul>
                </Space>
              </Panel>

              <Panel header="Performance Issues" key="performance">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>Rule Evaluation Slow:</Text>
                  <ul>
                    <li><strong>Limit total rules:</strong> Recommended maximum 50-100 rules</li>
                    <li><strong>Optimize rule order:</strong> Most common rules first (higher priority)</li>
                    <li><strong>Use specific conditions:</strong> Avoid overly broad matching conditions</li>
                    <li><strong>Cache dynamic facts:</strong> Set cache: true for expensive calculations</li>
                  </ul>

                  <Text strong>Editor Running Slow:</Text>
                  <ul>
                    <li>Large JSON files can slow the editor - consider splitting complex rules</li>
                    <li>Visual editor works best with 10-20 rules maximum</li>
                    <li>Use JSON editor for bulk operations</li>
                  </ul>
                </Space>
              </Panel>

              <Panel header="Deployment Failures" key="deployment">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>Validation Errors:</Text>
                  <ul>
                    <li>All rules must have unique names</li>
                    <li>Priority must be 1-999</li>
                    <li>defaultDestination cannot be empty</li>
                    <li>event.params.destination is required</li>
                  </ul>

                  <Text strong>Authentication Issues:</Text>
                  <ul>
                    <li>Check token status indicator in header</li>
                    <li>Refresh page if token is expired</li>
                    <li>Contact administrator for permission issues</li>
                  </ul>

                  <Text strong>Queue Name Errors:</Text>
                  <ul>
                    <li>Verify queue names exist in your Genesys system</li>
                    <li>Queue names are case-sensitive</li>
                    <li>Use exact names including underscores/spaces</li>
                  </ul>
                </Space>
              </Panel>

              <Panel header="Test Failures" key="testing">
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Text strong>Test Input Errors:</Text>
                  <ul>
                    <li>Input must be valid JSON object</li>
                    <li>Maximum 10 key-value pairs allowed</li>
                    <li>Cannot include __proto__, constructor, or prototype keys</li>
                    <li>Maximum input size is 10KB</li>
                  </ul>

                  <Text strong>No Rules Matching:</Text>
                  <ul>
                    <li>Check that test data includes required fields</li>
                    <li>Verify field names match rule conditions exactly</li>
                    <li>Make sure at least one rule should trigger with test data</li>
                    <li>Review rule priorities - wrong order can cause issues</li>
                  </ul>
                </Space>
              </Panel>
            </Collapse>

            <Card title="Getting Help" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div><strong>Error Messages:</strong> Pay attention to specific error messages - they often contain the exact issue and location</div>
                <div><strong>Browser Console:</strong> Press F12 to open developer tools and check for JavaScript errors</div>
                <div><strong>Validation Panel:</strong> Use the validation errors panel for detailed syntax checking</div>
                <div><strong>Test Results:</strong> Use test evaluation steps to understand why rules aren't matching</div>
              </Space>
            </Card>
          </Space>
        </TabPane>
      </Tabs>
    </Modal>
  );
};

// Also export as default for compatibility
export default HelpWiki;