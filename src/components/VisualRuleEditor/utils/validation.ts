
/**
 * Validation utilities for the Visual Rule Editor
 * Provides comprehensive validation for rules and flow structures
 */

import { Node, Edge } from 'reactflow';
import { Rule, ValidationResult, AVAILABLE_OPERATORS } from '../types';

/**
 * Validate a complete rule structure
 */
export const validateRule = (rule: Rule): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate basic rule properties
  if (!rule.name || rule.name.trim() === '') {
    errors.push('Rule name is required');
  }

  if (typeof rule.priority !== 'number' || rule.priority < 1 || rule.priority > 999) {
    errors.push('Rule priority must be a number between 1 and 999');
  }

  // Validate default destination
  if (!rule.defaultDestination) {
    errors.push('Rule default destination is required (field is missing or null)');
  } else if (typeof rule.defaultDestination !== 'string') {
    errors.push('Rule default destination must be a string');
  } else if (rule.defaultDestination.trim() === '') {
    errors.push('Rule default destination cannot be empty or whitespace only');
  }

  // Validate conditions
  if (!rule.conditions || Object.keys(rule.conditions).length === 0) {
    errors.push('Rule must have at least one condition');
  }

  // Validate event
  if (!rule.event) {
    errors.push('Rule must have an event');
  } else {
    if (!rule.event.type) {
      errors.push('Event type is required');
    }
    if (!rule.event.params?.destination) {
      errors.push('Event destination is required');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate flow structure for conversion
 */
export const validateFlow = (nodes: Node[], edges: Edge[]): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required nodes
  const headerNode = nodes.find(n => n.type === 'ruleHeader');
  const eventNode = nodes.find(n => n.type === 'eventNode');
  const conditionNodes = nodes.filter(n => 
    n.type === 'logicalOperator' || n.type === 'factCondition'
  );

  if (!headerNode) {
    errors.push('Missing rule header node');
  }
  if (!eventNode) {
    errors.push('Missing event node');
  }
  if (conditionNodes.length === 0) {
    errors.push('Rule must have at least one condition');
  }

  // Build connectivity map
  const connections = new Map<string, { incoming: string[]; outgoing: string[] }>();
  
  nodes.forEach(node => {
    connections.set(node.id, { incoming: [], outgoing: [] });
  });

  edges.forEach(edge => {
    const sourceConn = connections.get(edge.source);
    const targetConn = connections.get(edge.target);
    
    if (sourceConn) {
      sourceConn.outgoing.push(edge.target);
    }
    if (targetConn) {
      targetConn.incoming.push(edge.source);
    }
  });

  // Validate connectivity
  nodes.forEach(node => {
    const conn = connections.get(node.id)!;
    
    // Check for disconnected nodes
    if (node.type !== 'ruleHeader' && conn.incoming.length === 0) {
      warnings.push(`Node "${node.id}" has no incoming connections`);
    }
    
    // Validate specific node types
    if (node.type === 'logicalOperator') {
      if (conn.outgoing.length === 0) {
        errors.push(`Logical operator node must have at least one child`);
      }
      
      const data = node.data as any;
      if (data.type === 'not' && conn.outgoing.length > 1) {
        errors.push(`NOT operator can only have one child condition`);
      }
    }
    
    if (node.type === 'factCondition') {
      const data = node.data as any;
      
      if (!data.fact) {
        errors.push(`Fact condition is missing fact field`);
      }
      
      if (!data.operator) {
        errors.push(`Fact condition is missing operator`);
      } else if (!AVAILABLE_OPERATORS.includes(data.operator as any)) {
        warnings.push(`Unknown operator "${data.operator}"`);
      }
      
      if (data.value === undefined || data.value === '') {
        warnings.push(`Fact condition is missing value`);
      }
      
      if (data.fact === 'inputValue' && !data.params?.key) {
        errors.push(`inputValue fact requires a key parameter`);
      }
    }
    
    if (node.type === 'eventNode') {
      const data = node.data as any;
      
      if (!data.destination) {
        errors.push(`Event node is missing destination`);
      }
      
      if (conn.incoming.length === 0) {
        errors.push(`Event node must be connected to conditions`);
      }
    }
  });

  // Check for cycles
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  
  const hasCycle = (nodeId: string): boolean => {
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const conn = connections.get(nodeId);
    if (conn) {
      for (const childId of conn.outgoing) {
        if (!visited.has(childId)) {
          if (hasCycle(childId)) {
            return true;
          }
        } else if (recursionStack.has(childId)) {
          return true;
        }
      }
    }
    
    recursionStack.delete(nodeId);
    return false;
  };
  
  if (headerNode && hasCycle(headerNode.id)) {
    errors.push('Rule contains circular dependencies');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Validate node data before update
 */
export const validateNodeData = (nodeType: string, data: any): ValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  switch (nodeType) {
    case 'ruleHeader':
      if (!data.name || data.name.trim() === '') {
        errors.push('Rule name is required');
      }
      if (typeof data.priority !== 'number' || data.priority < 1) {
        errors.push('Priority must be a positive number');
      }
      if (!data.defaultDestination || data.defaultDestination.trim() === '') {
        errors.push('Default destination is required');
      }
      break;
      
    case 'factCondition':
      if (!data.fact) {
        errors.push('Fact is required');
      }
      if (!data.operator) {
        errors.push('Operator is required');
      }
      if (data.value === undefined || data.value === '') {
        warnings.push('Value is empty');
      }
      break;
      
    case 'eventNode':
      if (!data.destination) {
        errors.push('Destination is required');
      }
      break;
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

/**
 * Get validation summary message
 */
export const getValidationSummary = (result: ValidationResult): string => {
  if (result.isValid && result.warnings.length === 0) {
    return 'Validation passed';
  }
  
  const parts: string[] = [];
  
  if (result.errors.length > 0) {
    parts.push(`${result.errors.length} error(s)`);
  }
  
  if (result.warnings.length > 0) {
    parts.push(`${result.warnings.length} warning(s)`);
  }
  
  return parts.join(', ');
};