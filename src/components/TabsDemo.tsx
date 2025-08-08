import React from 'react';
import { Card, Space, Typography, Tag, Button, Divider } from 'antd';
import { 
  SettingOutlined, 
  HistoryOutlined, 
  FileTextOutlined, 
  UserOutlined,
  DashboardOutlined,
  BarChartOutlined,
  CodeOutlined 
} from '@ant-design/icons';
import AnimatedTabs from './AnimatedTabs';
import type { TabsProps } from 'antd';

const { Title, Paragraph, Text } = Typography;

const TabsDemo: React.FC = () => {
  // Demo content for different tab panels
  const DashboardContent = () => (
    <div style={{ padding: '20px 0' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>Dashboard Overview</Title>
          <Paragraph>
            Monitor your rules engine performance and system metrics in real-time.
          </Paragraph>
        </div>
        <Space wrap>
          <Tag color="processing">Active Rules: 15</Tag>
          <Tag color="success">System Status: Healthy</Tag>
          <Tag color="warning">Pending Updates: 3</Tag>
        </Space>
        <Button type="primary" icon={<DashboardOutlined />}>
          View Full Dashboard
        </Button>
      </Space>
    </div>
  );

  const AnalyticsContent = () => (
    <div style={{ padding: '20px 0' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>Analytics & Reports</Title>
          <Paragraph>
            Analyze rule performance, execution patterns, and system insights.
          </Paragraph>
        </div>
        <Space wrap>
          <Tag color="blue">Total Executions: 1,247</Tag>
          <Tag color="green">Success Rate: 99.2%</Tag>
          <Tag color="orange">Avg Response Time: 45ms</Tag>
        </Space>
        <Button type="primary" icon={<BarChartOutlined />}>
          Generate Report
        </Button>
      </Space>
    </div>
  );

  const ConfigContent = () => (
    <div style={{ padding: '20px 0' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>Configuration</Title>
          <Paragraph>
            Manage system settings, user preferences, and advanced configuration options.
          </Paragraph>
        </div>
        <Space wrap>
          <Tag color="purple">Environment: Production</Tag>
          <Tag color="cyan">Version: v10.2.1</Tag>
          <Tag color="gold">Last Modified: 2 hours ago</Tag>
        </Space>
        <Button type="primary" icon={<SettingOutlined />}>
          Open Settings
        </Button>
      </Space>
    </div>
  );

  const CodeEditorContent = () => (
    <div style={{ padding: '20px 0' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Title level={4}>Code Editor</Title>
          <Paragraph>
            Edit and manage your rule configurations with advanced syntax highlighting.
          </Paragraph>
        </div>
        <div style={{ 
          background: '#f5f5f5', 
          padding: '12px', 
          borderRadius: '6px', 
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#666'
        }}>
          <Text code>
            {`{
  "rules": [
    {
      "name": "highPriorityRouting",
      "priority": 100,
      "conditions": { ... }
    }
  ]
}`}
          </Text>
        </div>
        <Button type="primary" icon={<CodeOutlined />}>
          Open Editor
        </Button>
      </Space>
    </div>
  );

  // Tab items configuration
  const defaultTabItems: TabsProps['items'] = [
    {
      key: '1',
      label: (
        <Space>
          <DashboardOutlined />
          Dashboard
        </Space>
      ),
      children: <DashboardContent />,
    },
    {
      key: '2',
      label: (
        <Space>
          <BarChartOutlined />
          Analytics
        </Space>
      ),
      children: <AnalyticsContent />,
    },
    {
      key: '3',
      label: (
        <Space>
          <SettingOutlined />
          Configuration
        </Space>
      ),
      children: <ConfigContent />,
    },
    {
      key: '4',
      label: (
        <Space>
          <CodeOutlined />
          Editor
        </Space>
      ),
      children: <CodeEditorContent />,
    },
  ];

  const cardTabItems: TabsProps['items'] = [
    {
      key: '1',
      label: (
        <Space>
          <FileTextOutlined />
          Rules
        </Space>
      ),
      children: (
        <div style={{ padding: '20px 0' }}>
          <Title level={4}>Rules Management</Title>
          <Paragraph>Create, edit, and manage your routing rules.</Paragraph>
        </div>
      ),
    },
    {
      key: '2',
      label: (
        <Space>
          <HistoryOutlined />
          History
        </Space>
      ),
      children: (
        <div style={{ padding: '20px 0' }}>
          <Title level={4}>Version History</Title>
          <Paragraph>Track changes and version history of your rules.</Paragraph>
        </div>
      ),
    },
    {
      key: '3',
      label: (
        <Space>
          <UserOutlined />
          Users
        </Space>
      ),
      children: (
        <div style={{ padding: '20px 0' }}>
          <Title level={4}>User Management</Title>
          <Paragraph>Manage user access and permissions.</Paragraph>
        </div>
      ),
    },
  ];

  return (
    <div style={{ padding: '24px' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        
        {/* Default Animated Tabs */}
        <Card title="Default Animated Tabs" style={{ marginBottom: '24px' }}>
          <AnimatedTabs
            defaultActiveKey="1"
            items={defaultTabItems}
            size="middle"
            animated={true}
          />
        </Card>

        {/* Card Style Tabs */}
        <Card title="Card Style Animated Tabs" style={{ marginBottom: '24px' }}>
          <AnimatedTabs
            defaultActiveKey="1"
            items={cardTabItems}
            variant="card"
            size="middle"
            animated={true}
          />
        </Card>

        {/* Large Size Tabs */}
        <Card title="Large Animated Tabs" style={{ marginBottom: '24px' }}>
          <AnimatedTabs
            defaultActiveKey="1"
            items={[
              {
                key: '1',
                label: (
                  <Space>
                    <DashboardOutlined />
                    <span style={{ fontWeight: 'bold' }}>System Overview</span>
                  </Space>
                ),
                children: (
                  <div style={{ padding: '30px 0' }}>
                    <Title level={3}>System Overview</Title>
                    <Paragraph style={{ fontSize: '16px' }}>
                      Comprehensive view of your rules engine system with real-time metrics and performance data.
                    </Paragraph>
                    <Divider />
                    <Space size="large">
                      <Button type="primary" size="large" icon={<DashboardOutlined />}>
                        View Dashboard
                      </Button>
                      <Button size="large" icon={<BarChartOutlined />}>
                        Analytics
                      </Button>
                    </Space>
                  </div>
                ),
              },
              {
                key: '2',
                label: (
                  <Space>
                    <SettingOutlined />
                    <span style={{ fontWeight: 'bold' }}>Advanced Settings</span>
                  </Space>
                ),
                children: (
                  <div style={{ padding: '30px 0' }}>
                    <Title level={3}>Advanced Settings</Title>
                    <Paragraph style={{ fontSize: '16px' }}>
                      Configure advanced system parameters and customize your rules engine behavior.
                    </Paragraph>
                  </div>
                ),
              },
            ]}
            size="large"
            animated={true}
          />
        </Card>

        {/* Usage Examples */}
        <Card title="Usage Examples">
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            <div>
              <Title level={5}>Basic Usage</Title>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '6px', 
                fontFamily: 'monospace',
                fontSize: '12px'
              }}>
                <Text code>{`<AnimatedTabs items={items} animated={true} />`}</Text>
              </div>
            </div>
            
            <div>
              <Title level={5}>With Card Style</Title>
              <div style={{ 
                background: '#f5f5f5', 
                padding: '12px', 
                borderRadius: '6px', 
                fontFamily: 'monospace',
                fontSize: '12px'
              }}>
                <Text code>{`<AnimatedTabs items={items} variant="card" size="large" />`}</Text>
              </div>
            </div>

            <div>
              <Title level={5}>Props Available</Title>
              <ul>
                <li><Text code>animated</Text>: Enable/disable animations (default: true)</li>
                <li><Text code>variant</Text>: 'default' | 'card' | 'editable-card'</li>
                <li><Text code>size</Text>: 'small' | 'middle' | 'large'</li>
                <li>All standard Ant Design Tabs props are supported</li>
              </ul>
            </div>
          </Space>
        </Card>

      </Space>
    </div>
  );
};

export default TabsDemo;