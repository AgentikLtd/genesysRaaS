import React, { useCallback, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Spin, Alert } from 'antd';

interface SafeMonacoEditorProps {
  value: string;
  onChange: (value: string | undefined) => void;
  height?: string;
  language?: string;
  theme?: string;
  options?: any;
}

const SafeMonacoEditor: React.FC<SafeMonacoEditorProps> = ({
  value,
  onChange,
  height = "500px",
  language = "json",
  theme = "vs-dark",
  options = {}
}) => {
  const [editorError, setEditorError] = useState<string | null>(null);

  // Ensure value is always a string
  const safeValue = value || '{}';

  const handleEditorChange = useCallback((newValue: string | undefined) => {
    try {
      onChange(newValue);
      setEditorError(null);
    } catch (error) {
      console.error('Editor change error:', error);
      setEditorError('Failed to update editor content');
    }
  }, [onChange]);

  const handleEditorMount = useCallback(() => {
    setEditorError(null);
    console.log('Monaco editor mounted successfully');
  }, []);

  const defaultOptions = {
    minimap: { enabled: false },
    scrollBeyondLastLine: false,
    fontSize: 14,
    tabSize: 2,
    formatOnPaste: true,
    formatOnType: true,
    automaticLayout: true,
    wordWrap: 'on',
    wrappingIndent: 'indent',
    lineNumbers: 'on',
    glyphMargin: false,
    folding: true,
    lineDecorationsWidth: 0,
    lineNumbersMinChars: 3,
    renderLineHighlight: 'all',
    scrollbar: {
      vertical: 'visible',
      horizontal: 'visible',
      useShadows: false,
      verticalHasArrows: false,
      horizontalHasArrows: false
    }
  };

  const mergedOptions = { ...defaultOptions, ...options };

  if (editorError) {
    return (
      <Alert
        message="Editor Error"
        description={editorError}
        type="error"
        showIcon
        closable
        onClose={() => setEditorError(null)}
      />
    );
  }

  return (
    <div style={{ border: '1px solid #d9d9d9', borderRadius: '6px', overflow: 'hidden' }}>
      <Editor
        height={height}
        language={language}
        value={safeValue}
        onChange={handleEditorChange}
        theme={theme}
        options={mergedOptions}
        loading={<Spin tip="Loading editor..." />}
        onMount={handleEditorMount}
        beforeMount={(monaco) => {
          // Configure JSON validation
          monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
            validate: true,
            schemas: [],
            allowComments: false,
            trailingCommas: false
          });
        }}
      />
    </div>
  );
};

export default SafeMonacoEditor;