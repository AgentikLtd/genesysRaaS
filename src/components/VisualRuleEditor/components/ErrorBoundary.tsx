
/**
 * Error Boundary Component
 * Catches and handles errors in the Visual Rule Editor
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Result, Button, Collapse, Typography } from 'antd';
import { BugOutlined, ReloadOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { Text, Paragraph } = Typography;

interface Props {
  children: ReactNode;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorCount: number;
}

/**
 * Error boundary to catch and display errors gracefully
 */
export class VisualEditorErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      errorCount: 0
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Visual Editor Error:', error, errorInfo);
    
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // Log to external service if available
    if (window.console && window.console.error) {
      console.error('Visual Rule Editor crashed:', {
        error: error.toString(),
        stack: error.stack,
        componentStack: errorInfo.componentStack
      });
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    });
    
    // Call parent reset handler if provided
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      const { error, errorInfo, errorCount } = this.state;
      
      return (
        <Result
          status="error"
          icon={<BugOutlined />}
          title="Visual Editor Error"
          subTitle="Something went wrong while rendering the visual rule editor."
          extra={[
            <Button 
              key="reset" 
              type="primary" 
              icon={<ReloadOutlined />}
              onClick={this.handleReset}
            >
              Reset Editor
            </Button>,
            <Button 
              key="json" 
              onClick={() => {
                // Switch to JSON editor tab if possible
                const tabElement = document.querySelector('[data-tab-key="json"]');
                if (tabElement instanceof HTMLElement) {
                  tabElement.click();
                }
              }}
            >
              Use JSON Editor
            </Button>
          ]}
        >
          <Collapse ghost>
            <Panel header="Error Details" key="1">
              <Paragraph>
                <Text strong>Error Message:</Text><br />
                <Text code>{error?.message || 'Unknown error'}</Text>
              </Paragraph>
              
              {errorCount > 1 && (
                <Paragraph>
                  <Text type="warning">
                    This error has occurred {errorCount} times.
                  </Text>
                </Paragraph>
              )}
              
              <Paragraph>
                <Text strong>Stack Trace:</Text>
                <pre style={{ 
                  fontSize: '12px', 
                  background: '#f5f5f5', 
                  padding: '12px',
                  overflow: 'auto',
                  maxHeight: '200px'
                }}>
                  {error?.stack || 'No stack trace available'}
                </pre>
              </Paragraph>
              
              {errorInfo && (
                <Paragraph>
                  <Text strong>Component Stack:</Text>
                  <pre style={{ 
                    fontSize: '12px', 
                    background: '#f5f5f5', 
                    padding: '12px',
                    overflow: 'auto',
                    maxHeight: '200px'
                  }}>
                    {errorInfo.componentStack}
                  </pre>
                </Paragraph>
              )}
            </Panel>
            
            <Panel header="Troubleshooting Steps" key="2">
              <ol>
                <li>Click "Reset Editor" to try again</li>
                <li>If the error persists, switch to the JSON Editor tab</li>
                <li>Check if your rule structure is valid</li>
                <li>Clear your browser cache and reload the page</li>
                <li>Contact support if the issue continues</li>
              </ol>
            </Panel>
          </Collapse>
        </Result>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook to use error boundary functionality
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  const handleError = React.useCallback((error: Error) => {
    console.error('Handled error:', error);
    setError(error);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { handleError, clearError };
};

/**
 * Wrapper component with error boundary
 */
export const withErrorBoundary = <P extends object>(
  Component: React.ComponentType<P>
) => {
  return (props: P) => (
    <VisualEditorErrorBoundary onReset={() => window.location.reload()}>
      <Component {...props} />
    </VisualEditorErrorBoundary>
  );
};

/**
 * Common error messages and recovery suggestions
 */
export const ERROR_MESSAGES = {
  INVALID_RULE_STRUCTURE: {
    title: 'Invalid Rule Structure',
    message: 'The rule structure is invalid and cannot be displayed.',
    recovery: 'Please check the rule JSON structure and try again.'
  },
  CIRCULAR_DEPENDENCY: {
    title: 'Circular Dependency Detected',
    message: 'The rule contains circular dependencies that cannot be rendered.',
    recovery: 'Review your rule conditions to remove circular references.'
  },
  MISSING_REQUIRED_FIELDS: {
    title: 'Missing Required Fields',
    message: 'The rule is missing required fields.',
    recovery: 'Ensure all rules have name, priority, conditions, and event fields.'
  },
  RENDER_TIMEOUT: {
    title: 'Render Timeout',
    message: 'The rule is too complex to render in a reasonable time.',
    recovery: 'Consider simplifying the rule or using the JSON editor.'
  },
  BROWSER_COMPATIBILITY: {
    title: 'Browser Compatibility Issue',
    message: 'Your browser may not fully support the visual editor.',
    recovery: 'Try using a modern browser like Chrome, Firefox, or Edge.'
  }
};