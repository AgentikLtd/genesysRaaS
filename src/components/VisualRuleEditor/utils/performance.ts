
/**
 * Performance optimization utilities for Visual Rule Editor
 * Handles large rule sets and complex visualizations
 */

import { Node, Edge } from 'reactflow';
import { Rule, RuleCondition } from '../types';
import { debounce, throttle } from 'lodash';

/**
 * Performance configuration
 */
export interface PerformanceConfig {
  maxVisibleNodes: number;
  maxVisibleEdges: number;
  enableVirtualization: boolean;
  enableLazyLoading: boolean;
  animationThreshold: number;
  debounceDelay: number;
  throttleDelay: number;
}

export const DEFAULT_PERFORMANCE_CONFIG: PerformanceConfig = {
  maxVisibleNodes: 100,
  maxVisibleEdges: 150,
  enableVirtualization: true,
  enableLazyLoading: true,
  animationThreshold: 50, // Disable animations above this node count
  debounceDelay: 300,
  throttleDelay: 100
};

/**
 * Measure rule complexity
 */
export const measureRuleComplexity = (rule: Rule): {
  nodeCount: number;
  edgeCount: number;
  maxDepth: number;
  complexity: 'simple' | 'moderate' | 'complex' | 'very-complex';
} => {
  let nodeCount = 2; // Header + Event
  let edgeCount = 1; // Header to Event minimum
  let maxDepth = 0;

  const countConditions = (condition: RuleCondition, depth: number = 0): void => {
    maxDepth = Math.max(maxDepth, depth);
    nodeCount++;

    if (condition.all) {
      edgeCount += condition.all.length;
      condition.all.forEach(c => countConditions(c, depth + 1));
    } else if (condition.any) {
      edgeCount += condition.any.length;
      condition.any.forEach(c => countConditions(c, depth + 1));
    } else if (condition.not) {
      edgeCount++;
      countConditions(condition.not, depth + 1);
    }
  };

  if (rule.conditions) {
    countConditions(rule.conditions);
  }

  // Determine complexity level
  let complexity: 'simple' | 'moderate' | 'complex' | 'very-complex';
  if (nodeCount <= 10 && maxDepth <= 2) {
    complexity = 'simple';
  } else if (nodeCount <= 25 && maxDepth <= 4) {
    complexity = 'moderate';
  } else if (nodeCount <= 50 && maxDepth <= 6) {
    complexity = 'complex';
  } else {
    complexity = 'very-complex';
  }

  return { nodeCount, edgeCount, maxDepth, complexity };
};

/**
 * Optimize nodes for rendering performance
 */
export const optimizeNodesForRendering = (
  nodes: Node[],
  viewport: { x: number; y: number; zoom: number },
  viewportBounds: { width: number; height: number }
): Node[] => {
  // Calculate visible bounds with padding
  const padding = 100;
  const visibleBounds = {
    left: -viewport.x / viewport.zoom - padding,
    right: (-viewport.x + viewportBounds.width) / viewport.zoom + padding,
    top: -viewport.y / viewport.zoom - padding,
    bottom: (-viewport.y + viewportBounds.height) / viewport.zoom + padding
  };

  // Filter nodes in viewport
  return nodes.map(node => {
    const isVisible = 
      node.position.x >= visibleBounds.left &&
      node.position.x <= visibleBounds.right &&
      node.position.y >= visibleBounds.top &&
      node.position.y <= visibleBounds.bottom;

    return {
      ...node,
      hidden: !isVisible
    };
  });
};

/**
 * Create debounced update function
 */
export const createDebouncedUpdate = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number = DEFAULT_PERFORMANCE_CONFIG.debounceDelay
): T => {
  return debounce(fn, delay) as T;
};

/**
 * Create throttled update function
 */
export const createThrottledUpdate = <T extends (...args: any[]) => any>(
  fn: T,
  delay: number = DEFAULT_PERFORMANCE_CONFIG.throttleDelay
): T => {
  return throttle(fn, delay) as T;
};

/**
 * Virtualize large node sets
 */
export const virtualizeNodes = (
  nodes: Node[],
  maxVisible: number = DEFAULT_PERFORMANCE_CONFIG.maxVisibleNodes
): {
  visibleNodes: Node[];
  placeholderNodes: Node[];
  totalCount: number;
} => {
  if (nodes.length <= maxVisible) {
    return {
      visibleNodes: nodes,
      placeholderNodes: [],
      totalCount: nodes.length
    };
  }

  // Sort nodes by importance (header, event, then by y position)
  const sortedNodes = [...nodes].sort((a, b) => {
    if (a.type === 'ruleHeader') return -1;
    if (b.type === 'ruleHeader') return 1;
    if (a.type === 'eventNode') return -1;
    if (b.type === 'eventNode') return 1;
    return a.position.y - b.position.y;
  });

  const visibleNodes = sortedNodes.slice(0, maxVisible);
  
  // Create placeholder nodes for hidden nodes
  const placeholderNodes: Node[] = [{
    id: 'placeholder-more',
    type: 'placeholder',
    position: { x: 400, y: sortedNodes[maxVisible]?.position.y || 1000 },
    data: { 
      label: `+${nodes.length - maxVisible} more nodes...`,
      count: nodes.length - maxVisible
    }
  }];

  return {
    visibleNodes,
    placeholderNodes,
    totalCount: nodes.length
  };
};

/**
 * Optimize edges based on visible nodes
 */
export const optimizeEdges = (
  edges: Edge[],
  visibleNodeIds: Set<string>
): Edge[] => {
  return edges.filter(edge => 
    visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target)
  );
};

/**
 * Batch node updates for performance
 */
export class NodeUpdateBatcher {
  private updates: Map<string, any> = new Map();
  private updateTimer: NodeJS.Timeout | null = null;
  private onBatchUpdate: (updates: Map<string, any>) => void;
  private delay: number;

  constructor(
    onBatchUpdate: (updates: Map<string, any>) => void,
    delay: number = 50
  ) {
    this.onBatchUpdate = onBatchUpdate;
    this.delay = delay;
  }

  addUpdate(nodeId: string, data: any): void {
    this.updates.set(nodeId, data);
    this.scheduleBatch();
  }

  private scheduleBatch(): void {
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
    }

    this.updateTimer = setTimeout(() => {
      this.flush();
    }, this.delay);
  }

  flush(): void {
    if (this.updates.size > 0) {
      this.onBatchUpdate(new Map(this.updates));
      this.updates.clear();
    }
    
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
  }

  clear(): void {
    this.updates.clear();
    if (this.updateTimer) {
      clearTimeout(this.updateTimer);
      this.updateTimer = null;
    }
  }
}

/**
 * Memory usage monitor
 */
export class MemoryMonitor {
  private measurements: number[] = [];
  private maxMeasurements: number = 100;

  measure(): number | null {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      const usage = memory.usedJSHeapSize / memory.totalJSHeapSize;
      
      this.measurements.push(usage);
      if (this.measurements.length > this.maxMeasurements) {
        this.measurements.shift();
      }
      
      return usage;
    }
    return null;
  }

  getAverageUsage(): number {
    if (this.measurements.length === 0) return 0;
    const sum = this.measurements.reduce((a, b) => a + b, 0);
    return sum / this.measurements.length;
  }

  isMemoryPressure(): boolean {
    return this.getAverageUsage() > 0.8;
  }

  reset(): void {
    this.measurements = [];
  }
}

/**
 * Performance recommendations based on complexity
 */
export const getPerformanceRecommendations = (
  complexity: ReturnType<typeof measureRuleComplexity>
): string[] => {
  const recommendations: string[] = [];

  if (complexity.nodeCount > 50) {
    recommendations.push('Consider breaking this rule into multiple simpler rules');
  }

  if (complexity.maxDepth > 5) {
    recommendations.push('Deep nesting may impact readability - consider flattening conditions');
  }

  if (complexity.complexity === 'very-complex') {
    recommendations.push('Enable virtualization for better performance');
    recommendations.push('Disable animations for smoother interaction');
    recommendations.push('Use the JSON editor for very complex modifications');
  }

  if (complexity.edgeCount > 100) {
    recommendations.push('High number of connections may slow down rendering');
  }

  return recommendations;
};

/**
 * Create optimized rule subset for preview
 */
export const createRulePreview = (
  rule: Rule,
  maxConditions: number = 5
): Rule => {
  const previewRule = { ...rule };
  
  const truncateConditions = (condition: RuleCondition): RuleCondition => {
    if (condition.all && condition.all.length > maxConditions) {
      return {
        all: [
          ...condition.all.slice(0, maxConditions),
          {
            fact: 'placeholder',
            operator: 'equal',
            value: `... and ${condition.all.length - maxConditions} more conditions`
          }
        ]
      };
    }
    
    if (condition.any && condition.any.length > maxConditions) {
      return {
        any: [
          ...condition.any.slice(0, maxConditions),
          {
            fact: 'placeholder',
            operator: 'equal',
            value: `... or ${condition.any.length - maxConditions} more conditions`
          }
        ]
      };
    }
    
    return condition;
  };
  
  previewRule.conditions = truncateConditions(previewRule.conditions);
  return previewRule;
};

/**
 * Request idle callback wrapper
 */
export const requestIdleCallback = (
  callback: () => void,
  options?: { timeout?: number }
): number => {
  if ('requestIdleCallback' in window) {
    return (window as any).requestIdleCallback(callback, options);
  }
  
  // Fallback for browsers without requestIdleCallback
  return window.setTimeout(callback, options?.timeout || 50) as any;
};

/**
 * Cancel idle callback
 */
export const cancelIdleCallback = (id: number): void => {
  if ('cancelIdleCallback' in window) {
    (window as any).cancelIdleCallback(id);
  } else {
    window.clearTimeout(id);
  }
};