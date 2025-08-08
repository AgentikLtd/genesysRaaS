/**
 * Rule Flow Component
 * React Flow canvas for visual rule editing
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import ReactFlow, {
  Node,
  Edge,
  Controls,
  MiniMap,
  Background,
  useNodesState,
  useEdgesState,
  Connection,
  BackgroundVariant,
  NodeTypes,
  MarkerType,
  Panel,
  ReactFlowProvider,
  addEdge,
  useReactFlow
} from 'reactflow';
import { Card, Button, Space, message, Modal, Badge, Tooltip as AntTooltip } from 'antd';
import { 
  SaveOutlined, 
  RedoOutlined, 
  UndoOutlined,
  ZoomInOutlined,
  ZoomOutOutlined,
  FullscreenOutlined,
  EyeOutlined,
  EyeInvisibleOutlined
} from '@ant-design/icons';
import 'reactflow/dist/style.css';

import { Rule } from './types';
import { ruleToFlow, autoLayoutNodes } from './utils/ruleToFlow';
import { flowToRule, validateFlowStructure } from './utils/flowToRule';
import { validateFlow, getValidationSummary } from './utils/validation';
import LogicalOperatorNode from './nodes/LogicalOperatorNode';
import FactConditionNode from './nodes/FactConditionNode';
import EventNode from './nodes/EventNode';
import RuleHeaderNode from './nodes/RuleHeaderNode';
import PropertiesPanel from './panels/PropertiesPanel';
import ValidationPanel from './panels/ValidationPanel';
import NodePalette from './panels/NodePalette';
import useHistory from './hooks/useHistory';

// Define custom node types
const nodeTypes: NodeTypes = {
  logicalOperator: LogicalOperatorNode,
  factCondition: FactConditionNode,
  eventNode: EventNode,
  ruleHeader: RuleHeaderNode
};

interface RuleFlowProps {
  rule: Rule;
  isEditing: boolean;
  onChange: (rule: Rule) => void;
  onUnsavedChanges?: (hasChanges: boolean) => void;
}

/**
 * Visual rule editor using React Flow
 */
const RuleFlow: React.FC<RuleFlowProps> = ({ 
  rule, 
  isEditing, 
  onChange,
  onUnsavedChanges 
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [showValidation, setShowValidation] = useState(false);
  const [showNodePalette, setShowNodePalette] = useState(true);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const [nextNodeId, setNextNodeId] = useState(1000);
  
  // Undo/Redo history
  const { canUndo, canRedo, undo, redo, pushState, clearHistory } = useHistory();
  const [isHistoryUpdate, setIsHistoryUpdate] = useState(false);

  /**
   * Initialize flow from rule
   */
  useEffect(() => {
    const { nodes: flowNodes, edges: flowEdges } = ruleToFlow(rule);
    
    // Only apply auto-layout if no saved positions exist
    const hasSavedLayout = rule.layout?.nodes && Object.keys(rule.layout.nodes).length > 0;
    const layoutNodes = hasSavedLayout ? flowNodes : autoLayoutNodes(flowNodes, flowEdges);
    
    setNodes(layoutNodes);
    setEdges(flowEdges);
    setHasChanges(false);
    setSelectedNode(null);
    
    // Clear history when rule changes
    clearHistory();
    
    // Validate initial state
    const validation = validateFlow(layoutNodes, flowEdges);
    setValidationResult(validation);
  }, [rule, setNodes, setEdges, clearHistory]);

  /**
   * Track state changes for undo/redo
   */
  useEffect(() => {
    if (!isHistoryUpdate && isEditing && nodes.length > 0 && edges.length >= 0) {
      const debounceTimer = setTimeout(() => {
        pushState(nodes, edges);
      }, 500); // Debounce to avoid too many history entries
      
      return () => clearTimeout(debounceTimer);
    }
  }, [nodes, edges, isEditing, pushState, isHistoryUpdate]);


  /**
   * Track changes
   */
  useEffect(() => {
    if (onUnsavedChanges) {
      onUnsavedChanges(hasChanges);
    }
  }, [hasChanges, onUnsavedChanges]);

  /**
   * Handle node selection
   */
  const onNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
    if (isEditing) {
      setSelectedNode(node);
    }
  }, [isEditing]);

  /**
   * Handle connection creation
   */
  const onConnect = useCallback(
    (params: Edge | Connection) => {
      if (!isEditing) return;
      
      setEdges((eds) => addEdge({ ...params, type: 'smoothstep', animated: false }, eds));
      setHasChanges(true);
      
      // Re-validate after connection
      setTimeout(() => {
        const validation = validateFlow(nodes, edges);
        setValidationResult(validation);
      }, 100);
    },
    [isEditing, nodes, edges, setEdges]
  );

  /**
   * Handle node deletion
   */
  const onNodesDelete = useCallback(
    (deleted: Node[]) => {
      if (!isEditing) return;
      
      // Don't allow deletion of header or event nodes
      const protectedNodes = deleted.filter(
        (node) => node.type === 'ruleHeader' || node.type === 'eventNode'
      );
      
      if (protectedNodes.length > 0) {
        message.warning('Cannot delete header or event nodes');
        return;
      }
      
      setHasChanges(true);
      
      // Re-validate after deletion
      setTimeout(() => {
        const validation = validateFlow(nodes, edges);
        setValidationResult(validation);
      }, 100);
    },
    [isEditing, nodes, edges]
  );

  /**
   * Handle undo action
   */
  const handleUndo = useCallback(() => {
    if (canUndo) {
      setIsHistoryUpdate(true);
      undo();
      message.info('Undo');
      setTimeout(() => setIsHistoryUpdate(false), 100);
    }
  }, [canUndo, undo]);

  /**
   * Handle redo action
   */
  const handleRedo = useCallback(() => {
    if (canRedo) {
      setIsHistoryUpdate(true);
      redo();
      message.info('Redo');
      setTimeout(() => setIsHistoryUpdate(false), 100);
    }
  }, [canRedo, redo]);

  /**
   * Handle node updates from properties panel
   */
  const handleNodeUpdate = useCallback((nodeId: string, newData: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data: newData };
        }
        return node;
      })
    );
    setHasChanges(true);
    
    // Re-validate after changes
    setTimeout(() => {
      const validation = validateFlow(nodes, edges);
      setValidationResult(validation);
    }, 100);
  }, [nodes, edges, setNodes]);

  /**
   * Handle saving changes
   */
  const handleSave = useCallback(() => {
    try {
      // Validate flow structure
      const structureErrors = validateFlowStructure(nodes, edges);
      if (structureErrors.length > 0) {
        message.error(`Cannot save: ${structureErrors[0]}`);
        return;
      }

      // Validate flow logic
      const validation = validateFlow(nodes, edges);
      if (!validation.isValid) {
        Modal.confirm({
          title: 'Validation Errors',
          content: `There are validation errors:\n${validation.errors.join('\n')}\n\nDo you want to save anyway?`,
          onOk: () => {
            saveRule();
          }
        });
        return;
      }

      saveRule();
    } catch (error: any) {
      message.error(`Failed to save rule: ${error.message}`);
    }
  }, [nodes, edges, rule, onChange]);

  /**
   * Save the rule
   */
  const saveRule = useCallback(() => {
    try {
      const updatedRule = flowToRule(nodes, edges, rule);
      onChange(updatedRule);
      setHasChanges(false);
      // Success message will be shown by parent component after validation
    } catch (error: any) {
      message.error(`Failed to save rule: ${error.message}`);
    }
  }, [nodes, edges, rule, onChange]);

  /**
   * Reset to original rule
   */
  const handleReset = useCallback(() => {
    Modal.confirm({
      title: 'Reset Changes',
      content: 'Are you sure you want to discard all changes?',
      onOk: () => {
        const { nodes: flowNodes, edges: flowEdges } = ruleToFlow(rule);
        
        // Only apply auto-layout if no saved positions exist
        const hasSavedLayout = rule.layout?.nodes && Object.keys(rule.layout.nodes).length > 0;
        const layoutNodes = hasSavedLayout ? flowNodes : autoLayoutNodes(flowNodes, flowEdges);
        
        setNodes(layoutNodes);
        setEdges(flowEdges);
        setHasChanges(false);
        setSelectedNode(null);
        message.info('Reset to original rule');
      }
    });
  }, [rule, setNodes, setEdges]);

  /**
   * Auto-layout nodes
   */
  const handleAutoLayout = useCallback(() => {
    const layoutNodes = autoLayoutNodes(nodes, edges);
    setNodes(layoutNodes);
    setHasChanges(true);
    message.success('Auto layout applied');
    
    // Fit view after layout to ensure all nodes are visible
    setTimeout(() => {
      if (reactFlowInstance) {
        reactFlowInstance.fitView({ 
          padding: 0.1,
          includeHiddenNodes: false,
          maxZoom: 1.2,
          minZoom: 0.5
        });
      }
    }, 100);
  }, [nodes, edges, setNodes, reactFlowInstance]);

  /**
   * Handle edge deletion in edit mode
   */
  const onEdgesDelete = useCallback((deletedEdges: Edge[]) => {
    if (isEditing) {
      setHasChanges(true);
      
      // Re-validate after edge deletion
      setTimeout(() => {
        const validation = validateFlow(nodes, edges);
        setValidationResult(validation);
      }, 100);
    }
  }, [isEditing, nodes, edges]);

  /**
   * Handle drop event for new nodes
   */
  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      if (!isEditing || !reactFlowInstance) return;

      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!reactFlowBounds) return;

      const type = event.dataTransfer.getData('application/reactflow');
      
      // Check if the dropped element is valid
      if (typeof type === 'undefined' || !type) {
        return;
      }

      const nodeData = JSON.parse(type);
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const newNode: Node = {
        id: `node-${nextNodeId}`,
        type: nodeData.type,
        position,
        data: { ...nodeData.data }
      };

      setNodes((nds) => nds.concat(newNode));
      setNextNodeId(nextNodeId + 1);
      setHasChanges(true);
      
      // Re-validate after adding node
      setTimeout(() => {
        const validation = validateFlow(nodes, edges);
        setValidationResult(validation);
      }, 100);
    },
    [isEditing, reactFlowInstance, nextNodeId, nodes, edges, setNodes]
  );

  /**
   * Handle drag over event
   */
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  /**
   * Handle keyboard shortcuts
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isEditing) return;
      
      // Undo: Ctrl+Z or Cmd+Z
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      }
      
      // Redo: Ctrl+Y or Cmd+Y or Ctrl+Shift+Z or Cmd+Shift+Z
      if (((event.ctrlKey || event.metaKey) && event.key === 'y') ||
          ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')) {
        event.preventDefault();
        handleRedo();
      }
      
      // Save: Ctrl+S or Cmd+S
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault();
        if (hasChanges) {
          handleSave();
        }
      }
      
      // Toggle palette: Ctrl+P or Cmd+P
      if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
        event.preventDefault();
        setShowNodePalette(prev => !prev);
      }
      
      // Auto layout: Ctrl+L or Cmd+L
      if ((event.ctrlKey || event.metaKey) && event.key === 'l') {
        event.preventDefault();
        handleAutoLayout();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditing, handleUndo, handleRedo, handleSave, hasChanges, handleAutoLayout]);

  /**
   * Enhanced edge styling for better flow visualization
   */
  const defaultEdgeOptions = {
    style: { 
      strokeWidth: 3,
      stroke: '#722ed1'
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#722ed1'
    },
    animated: false, // Disable default animation to avoid conflicts
    type: 'smoothstep'
  };

  return (
    <ReactFlowProvider>
      <Card
      title={
        <Space>
          <span>Visual Editor: {rule.name}</span>
          <Badge 
            count={hasChanges ? 'Modified' : null} 
            style={{ backgroundColor: '#ff4d4f' }}
          />
        </Space>
      }
      extra={
        isEditing && (
          <Space>
            <AntTooltip title={showNodePalette ? 'Hide Palette' : 'Show Palette'}>
              <Button
                icon={showNodePalette ? <EyeInvisibleOutlined /> : <EyeOutlined />}
                onClick={() => setShowNodePalette(!showNodePalette)}
              />
            </AntTooltip>
            <Button
              onClick={() => setShowValidation(!showValidation)}
              type={validationResult && !validationResult.isValid ? 'danger' : 'default'}
            >
              Validation {validationResult && `(${getValidationSummary(validationResult)})`}
            </Button>
            <AntTooltip title="Undo (Ctrl+Z)">
              <Button
                icon={<UndoOutlined />}
                onClick={handleUndo}
                disabled={!canUndo}
              />
            </AntTooltip>
            <AntTooltip title="Redo (Ctrl+Y)">
              <Button
                icon={<RedoOutlined />}
                onClick={handleRedo}
                disabled={!canRedo}
              />
            </AntTooltip>
            <Button
              icon={<FullscreenOutlined />}
              onClick={handleAutoLayout}
              title="Auto Layout"
            />
            <Button
              icon={<RedoOutlined />}
              onClick={handleReset}
              disabled={!hasChanges}
            >
              Reset
            </Button>
            <Button
              type="primary"
              icon={<SaveOutlined />}
              onClick={handleSave}
              disabled={!hasChanges}
            >
              Save Changes
            </Button>
          </Space>
        )
      }
      bodyStyle={{ padding: 0 }}
    >
      <div 
        ref={reactFlowWrapper}
        style={{ height: '700px', width: '100%', position: 'relative' }}
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={isEditing ? onNodesChange : undefined}
          onEdgesChange={isEditing ? onEdgesChange : undefined}
          onEdgesDelete={onEdgesDelete}
          onNodeClick={onNodeClick}
          onNodesDelete={onNodesDelete}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          nodeTypes={nodeTypes}
          defaultEdgeOptions={defaultEdgeOptions}
          fitView
          fitViewOptions={{ 
            padding: 0.1,
            includeHiddenNodes: false,
            maxZoom: 1.2,
            minZoom: 0.5
          }}
          attributionPosition="bottom-right"
          nodesDraggable={isEditing}
          nodesConnectable={isEditing}
          elementsSelectable={isEditing}
          deleteKeyCode={isEditing ? 'Delete' : null}
          connectionMode="loose"
          snapToGrid={true}
          snapGrid={[15, 15]}
        >
          <Controls 
            showInteractive={false}
            position="top-left"
          />
          <MiniMap 
            nodeStrokeColor={(node) => {
              if (node.type === 'ruleHeader') return '#722ed1';
              if (node.type === 'eventNode') return '#52c41a';
              if (node.type === 'logicalOperator') return '#1890ff';
              return '#666';
            }}
            nodeColor={(node) => {
              if (node.type === 'ruleHeader') return '#f9f0ff';
              if (node.type === 'eventNode') return '#f6ffed';
              if (node.type === 'logicalOperator') return '#e6f7ff';
              return '#fafafa';
            }}
            pannable
            zoomable
          />
          <Background 
            variant={BackgroundVariant.Dots} 
            gap={20} 
            size={2}
            color="#e0e0e0"
          />
          
          {/* Custom panels */}
          <Panel position="top-right">
            <div style={{ 
              background: 'white', 
              padding: '8px 12px', 
              borderRadius: '4px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '8px'
            }}>
              <Space size="small">
                <span>Mode:</span>
                <strong>{isEditing ? 'Edit' : 'View'}</strong>
              </Space>
            </div>
          </Panel>
          
        </ReactFlow>
        
        {/* Node Palette for drag and drop */}
        {isEditing && showNodePalette && (
          <NodePalette />
        )}
        
        {/* Properties panel for selected node */}
        {isEditing && selectedNode && (
          <PropertiesPanel
            node={selectedNode}
            onUpdate={handleNodeUpdate}
            onClose={() => setSelectedNode(null)}
          />
        )}
        
        {/* Validation panel */}
        {showValidation && validationResult && (
          <ValidationPanel
            result={validationResult}
            onClose={() => setShowValidation(false)}
          />
        )}
      </div>
    </Card>
    </ReactFlowProvider>
  );
};

export default RuleFlow;