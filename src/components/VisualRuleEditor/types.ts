
/**
 * Type definitions for the Visual Rule Editor
 * Defines all interfaces and types used throughout the visual editing components
 */

import { Node, Edge, NodeProps } from 'reactflow';

/**
 * Rule condition structure matching the rules engine format
 */
export interface RuleCondition {
  fact?: string;
  operator?: string;
  value?: any;
  params?: any;
  all?: RuleCondition[];
  any?: RuleCondition[];
  not?: RuleCondition;
  condition?: string; // For condition references
}

/**
 * Node position information for visual layout persistence
 */
export interface NodePosition {
  x: number;
  y: number;
}

/**
 * Visual layout configuration for rule editor
 */
export interface RuleLayout {
  nodes?: {
    [nodeId: string]: NodePosition;
  };
}

/**
 * Individual rule structure
 */
export interface Rule {
  name: string;
  description?: string;
  priority: number;
  conditions: RuleCondition;
  defaultDestination: string; // Rule-specific default destination when no conditions match
  event: {
    type: string;
    params: {
      destination: string;
      priority?: 'high' | 'medium' | 'low';
      reason?: string;
    };
  };
  layout?: RuleLayout; // Optional layout information for visual editor
}

/**
 * Complete rules configuration structure
 */
export interface RulesConfig {
  engineOptions?: {
    allowUndefinedFacts?: boolean;
    allowUndefinedConditions?: boolean;
    replaceFactsInEventParams?: boolean;
  };
  logging?: {
    enabled?: boolean;
    logMatchedRules?: boolean;
    logUnmatchedRules?: boolean;
    logPerformanceMetrics?: boolean;
  };
  rules: Rule[];
  dynamicFacts?: any[];
  customOperators?: any[];
}

/**
 * Custom node data types for React Flow
 */
export type LogicalOperatorNodeData = {
  type: 'all' | 'any' | 'not';
  parentId?: string;
};

export type FactConditionNodeData = {
  fact: string;
  operator: string;
  value: any;
  params?: {
    key?: string;
    [key: string]: any;
  };
  parentId?: string;
};

export type EventNodeData = {
  destination: string;
  priority?: 'high' | 'medium' | 'low';
  reason?: string;
};

export type RuleHeaderNodeData = {
  name: string;
  priority: number;
  description?: string;
  defaultDestination: string;
};

/**
 * Union type for all custom node data
 */
export type CustomNodeData = 
  | LogicalOperatorNodeData 
  | FactConditionNodeData 
  | EventNodeData 
  | RuleHeaderNodeData;

/**
 * Custom node type with proper typing
 */
export type CustomNode = Node<CustomNodeData>;

/**
 * Available operators in the rules engine
 */
export const AVAILABLE_OPERATORS = [
  'equal',
  'notEqual',
  'in',
  'notIn',
  'contains',
  'doesNotContain',
  'greaterThan',
  'greaterThanInclusive',
  'lessThan',
  'lessThanInclusive',
  'containsAny',
  'matchesPattern',
  'startsWith',
  'endsWith'
] as const;

export type OperatorType = typeof AVAILABLE_OPERATORS[number];

/**
 * Validation result structure
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Node palette item structure
 */
export interface PaletteItem {
  type: string;
  label: string;
  category: 'logical' | 'condition' | 'action';
  icon?: React.ReactNode;
}
