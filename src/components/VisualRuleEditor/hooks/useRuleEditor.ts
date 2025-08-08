
/**
 * Custom hooks for the Visual Rule Editor
 * Provides reusable logic for rule editing operations
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { Node, Edge, useReactFlow } from 'reactflow';
import { Rule, RulesConfig, ValidationResult } from '../types';
import { ruleToFlow, autoLayoutNodes } from '../utils/ruleToFlow';
import { flowToRule } from '../utils/flowToRule';
import { validateFlow, validateRule } from '../utils/validation';
import { message } from 'antd';

/**
 * Hook for managing rule editor state and operations
 */
export const useRuleEditor = (
  initialRule: Rule | null,
  onSave: (rule: Rule) => void
) => {
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const originalRuleRef = useRef<Rule | null>(null);

  const reactFlowInstance = useReactFlow();

  /**
   * Initialize or update the flow from a rule
   */
  const loadRule = useCallback((rule: Rule | null) => {
    if (!rule) {
      setNodes([]);
      setEdges([]);
      setHasChanges(false);
      setValidationResult(null);
      originalRuleRef.current = null;
      return;
    }

    const { nodes: flowNodes, edges: flowEdges } = ruleToFlow(rule);
    const layoutNodes = autoLayoutNodes(flowNodes, flowEdges);
    
    setNodes(layoutNodes);
    setEdges(flowEdges);
    setHasChanges(false);
    originalRuleRef.current = rule;
    
    // Validate initial state
    const validation = validateFlow(layoutNodes, flowEdges);
    setValidationResult(validation);
    
    // Fit view after loading
    setTimeout(() => {
      reactFlowInstance.fitView({ padding: 0.1 });
    }, 50);
  }, [reactFlowInstance]);

  /**
   * Convert current flow back to rule
   */
  const flowToRuleData = useCallback((): Rule | null => {
    if (!originalRuleRef.current) return null;
    
    try {
      return flowToRule(nodes, edges, originalRuleRef.current);
    } catch (error) {
      console.error('Failed to convert flow to rule:', error);
      return null;
    }
  }, [nodes, edges]);

  /**
   * Save current changes
   */
  const saveChanges = useCallback(() => {
    const rule = flowToRuleData();
    if (!rule) {
      message.error('Failed to save: Invalid rule structure');
      return false;
    }

    const ruleValidation = validateRule(rule);
    if (!ruleValidation.isValid) {
      message.error(`Validation failed: ${ruleValidation.errors[0]}`);
      return false;
    }

    onSave(rule);
    setHasChanges(false);
    // Success message will be shown by parent component
    return true;
  }, [flowToRuleData, onSave]);

  /**
   * Reset to original rule
   */
  const resetChanges = useCallback(() => {
    if (originalRuleRef.current) {
      loadRule(originalRuleRef.current);
      message.info('Changes discarded');
    }
  }, [loadRule]);

  /**
   * Update node data
   */
  const updateNodeData = useCallback((nodeId: string, data: any) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return { ...node, data };
        }
        return node;
      })
    );
    setHasChanges(true);
  }, []);

  /**
   * Validate on changes
   */
  useEffect(() => {
    if (nodes.length > 0) {
      const validation = validateFlow(nodes, edges);
      setValidationResult(validation);
    }
  }, [nodes, edges]);

  /**
   * Auto-save functionality
   */
  const enableAutoSave = useCallback((interval: number = 30000) => {
    const autoSaveInterval = setInterval(() => {
      if (hasChanges && validationResult?.isValid) {
        saveChanges();
      }
    }, interval);

    return () => clearInterval(autoSaveInterval);
  }, [hasChanges, validationResult, saveChanges]);

  return {
    nodes,
    edges,
    hasChanges,
    validationResult,
    selectedNode,
    setSelectedNode,
    loadRule,
    saveChanges,
    resetChanges,
    updateNodeData,
    flowToRuleData,
    enableAutoSave
  };
};

/**
 * Hook for managing undo/redo functionality
 */
export const useUndoRedo = <T,>(initialState: T) => {
  const [state, setState] = useState<T>(initialState);
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  /**
   * Add new state to history
   */
  const pushState = useCallback((newState: T) => {
    // Remove any states after current index
    const newHistory = history.slice(0, currentIndex + 1);
    newHistory.push(newState);
    
    // Limit history size
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setCurrentIndex(currentIndex + 1);
    }
    
    setHistory(newHistory);
    setState(newState);
  }, [history, currentIndex]);

  /**
   * Undo to previous state
   */
  const undo = useCallback(() => {
    if (currentIndex > 0) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setState(history[newIndex]);
      return true;
    }
    return false;
  }, [currentIndex, history]);

  /**
   * Redo to next state
   */
  const redo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setState(history[newIndex]);
      return true;
    }
    return false;
  }, [currentIndex, history]);

  /**
   * Clear history
   */
  const clearHistory = useCallback(() => {
    setHistory([state]);
    setCurrentIndex(0);
  }, [state]);

  return {
    state,
    pushState,
    undo,
    redo,
    canUndo: currentIndex > 0,
    canRedo: currentIndex < history.length - 1,
    clearHistory
  };
};

/**
 * Hook for keyboard shortcuts in the visual editor
 */
export const useKeyboardShortcuts = (callbacks: {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onSelectAll?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitView?: () => void;
}) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check if user is typing in an input
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const ctrlKey = isMac ? event.metaKey : event.ctrlKey;

      // Save: Ctrl/Cmd + S
      if (ctrlKey && event.key === 's') {
        event.preventDefault();
        callbacks.onSave?.();
      }

      // Undo: Ctrl/Cmd + Z
      if (ctrlKey && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        callbacks.onUndo?.();
      }

      // Redo: Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y
      if ((ctrlKey && event.shiftKey && event.key === 'z') || 
          (ctrlKey && event.key === 'y')) {
        event.preventDefault();
        callbacks.onRedo?.();
      }

      // Delete: Delete key
      if (event.key === 'Delete') {
        event.preventDefault();
        callbacks.onDelete?.();
      }

      // Select All: Ctrl/Cmd + A
      if (ctrlKey && event.key === 'a') {
        event.preventDefault();
        callbacks.onSelectAll?.();
      }

      // Copy: Ctrl/Cmd + C
      if (ctrlKey && event.key === 'c') {
        event.preventDefault();
        callbacks.onCopy?.();
      }

      // Paste: Ctrl/Cmd + V
      if (ctrlKey && event.key === 'v') {
        event.preventDefault();
        callbacks.onPaste?.();
      }

      // Zoom In: Ctrl/Cmd + Plus
      if (ctrlKey && (event.key === '+' || event.key === '=')) {
        event.preventDefault();
        callbacks.onZoomIn?.();
      }

      // Zoom Out: Ctrl/Cmd + Minus
      if (ctrlKey && event.key === '-') {
        event.preventDefault();
        callbacks.onZoomOut?.();
      }

      // Fit View: Ctrl/Cmd + 0
      if (ctrlKey && event.key === '0') {
        event.preventDefault();
        callbacks.onFitView?.();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [callbacks]);
};

/**
 * Hook for managing clipboard operations
 */
export const useClipboard = () => {
  const [copiedNodes, setCopiedNodes] = useState<Node[]>([]);
  const [copiedEdges, setCopiedEdges] = useState<Edge[]>([]);

  const copy = useCallback((nodes: Node[], edges: Edge[]) => {
    setCopiedNodes(nodes);
    setCopiedEdges(edges);
    message.success(`Copied ${nodes.length} node(s)`);
  }, []);

  const paste = useCallback((position?: { x: number; y: number }) => {
    if (copiedNodes.length === 0) {
      message.info('Nothing to paste');
      return { nodes: [], edges: [] };
    }

    // Generate new IDs for pasted nodes
    const idMap = new Map<string, string>();
    const pastedNodes: Node[] = [];
    
    // Calculate offset for pasting
    const offset = position || { x: 50, y: 50 };
    
    copiedNodes.forEach((node) => {
      const newId = `${node.id}-${Date.now()}-${Math.random()}`;
      idMap.set(node.id, newId);
      
      pastedNodes.push({
        ...node,
        id: newId,
        position: {
          x: node.position.x + offset.x,
          y: node.position.y + offset.y
        },
        selected: true
      });
    });

    // Update edges with new node IDs
    const pastedEdges: Edge[] = copiedEdges
      .filter(edge => idMap.has(edge.source) && idMap.has(edge.target))
      .map(edge => ({
        ...edge,
        id: `${edge.id}-${Date.now()}`,
        source: idMap.get(edge.source)!,
        target: idMap.get(edge.target)!
      }));

    message.success(`Pasted ${pastedNodes.length} node(s)`);
    return { nodes: pastedNodes, edges: pastedEdges };
  }, [copiedNodes, copiedEdges]);

  const canPaste = copiedNodes.length > 0;

  return { copy, paste, canPaste };
};

/**
 * Hook for performance monitoring
 */
export const usePerformanceMonitor = (enabled: boolean = false) => {
  const renderCount = useRef(0);
  const lastRenderTime = useRef(Date.now());
  const frameRates = useRef<number[]>([]);

  useEffect(() => {
    if (!enabled) return;

    renderCount.current++;
    const now = Date.now();
    const timeSinceLastRender = now - lastRenderTime.current;
    
    if (timeSinceLastRender > 0) {
      const fps = 1000 / timeSinceLastRender;
      frameRates.current.push(fps);
      
      // Keep only last 60 frames
      if (frameRates.current.length > 60) {
        frameRates.current.shift();
      }
    }
    
    lastRenderTime.current = now;
  });

  const getAverageFPS = useCallback(() => {
    if (frameRates.current.length === 0) return 0;
    const sum = frameRates.current.reduce((a, b) => a + b, 0);
    return Math.round(sum / frameRates.current.length);
  }, []);

  const getMetrics = useCallback(() => ({
    renderCount: renderCount.current,
    averageFPS: getAverageFPS(),
    currentFPS: frameRates.current[frameRates.current.length - 1] || 0
  }), [getAverageFPS]);

  return { getMetrics };
};