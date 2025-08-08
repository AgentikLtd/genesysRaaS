/**
 * Utility to convert React Flow nodes and edges back to rule format
 * Reconstructs the nested condition structure from the visual representation
 */

import { Node, Edge } from 'reactflow';
import { Rule, RuleCondition } from '../types';

/**
 * Build adjacency map from edges
 */
const buildAdjacencyMap = (edges: Edge[]): Map<string, string[]> => {
  const adjacencyMap = new Map<string, string[]>();
  
  edges.forEach(edge => {
    if (!adjacencyMap.has(edge.source)) {
      adjacencyMap.set(edge.source, []);
    }
    adjacencyMap.get(edge.source)!.push(edge.target);
  });
  
  return adjacencyMap;
};

/**
 * Convert React Flow nodes and edges back to rule format
 */
export const flowToRule = (
  nodes: Node[],
  edges: Edge[],
  originalRule: Rule
): Rule => {
  // Find essential nodes
  const headerNode = nodes.find(n => n.type === 'ruleHeader');
  const eventNode = nodes.find(n => n.type === 'eventNode');
  
  if (!headerNode || !eventNode) {
    throw new Error('Invalid flow structure: missing required nodes');
  }

  // Build adjacency map
  const adjacencyMap = buildAdjacencyMap(edges);

  /**
   * Recursively build condition object from node ID
   */
  const buildCondition = (nodeId: string): RuleCondition | null => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return null;

    // Skip event node in condition building
    if (node.type === 'eventNode') return null;

    if (node.type === 'factCondition') {
      const { fact, operator, value, params } = node.data as any;
      
      // Handle condition references
      if (fact === 'condition' && operator === 'reference') {
        return { condition: value };
      }
      
      // Build fact condition
      const condition: RuleCondition = {
        fact,
        operator,
        value
      };
      
      if (params && Object.keys(params).length > 0) {
        condition.params = params;
      }
      
      return condition;
    } else if (node.type === 'logicalOperator') {
      const { type } = node.data as any;
      const childIds = adjacencyMap.get(nodeId) || [];
      
      // Filter out event node and build child conditions
      const childConditions = childIds
        .filter(id => {
          const childNode = nodes.find(n => n.id === id);
          return childNode && childNode.type !== 'eventNode';
        })
        .map(id => buildCondition(id))
        .filter((condition): condition is RuleCondition => condition !== null);

      if (childConditions.length === 0) {
        return null;
      }

      // Build logical condition
      if (type === 'all') {
        return { all: childConditions };
      } else if (type === 'any') {
        return { any: childConditions };
      } else if (type === 'not' && childConditions.length > 0) {
        return { not: childConditions[0] };
      }
    }

    return null;
  };

  // Find the root condition node (connected to rule-header)
  const rootConditionIds = adjacencyMap.get('rule-header') || [];
  const rootConditionId = rootConditionIds.find(id => {
    const node = nodes.find(n => n.id === id);
    return node && node.type !== 'eventNode';
  });

  if (!rootConditionId) {
    throw new Error('No root condition found');
  }

  // Build the conditions
  const conditions = buildCondition(rootConditionId);
  if (!conditions) {
    throw new Error('Failed to build conditions from flow');
  }

  // Extract rule metadata from header node
  const headerData = headerNode.data as any;

  // Extract event data
  const eventData = eventNode.data as any;

  // Save node positions for layout persistence
  const layout = {
    nodes: {} as { [nodeId: string]: { x: number; y: number } }
  };
  
  nodes.forEach(node => {
    layout.nodes[node.id] = { x: node.position.x, y: node.position.y };
  });

  // Construct the complete rule
  const rule: Rule = {
    name: headerData.name || originalRule.name,
    description: headerData.description,
    priority: headerData.priority || originalRule.priority,
    defaultDestination: headerData.defaultDestination || originalRule.defaultDestination,
    conditions,
    event: {
      type: originalRule.event.type || 'route_determined',
      params: {
        destination: eventData.destination,
        ...(eventData.priority && { priority: eventData.priority }),
        ...(eventData.reason && { reason: eventData.reason })
      }
    },
    layout
  };

  return rule;
};

/**
 * Validate that the flow can be converted to a valid rule
 */
export const validateFlowStructure = (nodes: Node[], edges: Edge[]): string[] => {
  const errors: string[] = [];

  // Check for required nodes
  const hasHeader = nodes.some(n => n.type === 'ruleHeader');
  const hasEvent = nodes.some(n => n.type === 'eventNode');
  const hasConditions = nodes.some(n => 
    n.type === 'logicalOperator' || n.type === 'factCondition'
  );

  if (!hasHeader) {
    errors.push('Missing rule header node');
  }
  if (!hasEvent) {
    errors.push('Missing event node');
  }
  if (!hasConditions) {
    errors.push('Rule must have at least one condition');
  }

  // Check connectivity
  const adjacencyMap = buildAdjacencyMap(edges);
  const visited = new Set<string>();
  
  const dfs = (nodeId: string) => {
    visited.add(nodeId);
    const children = adjacencyMap.get(nodeId) || [];
    children.forEach(childId => {
      if (!visited.has(childId)) {
        dfs(childId);
      }
    });
  };

  // Start DFS from header
  if (hasHeader) {
    dfs('rule-header');
  }

  // Check if all nodes are connected
  nodes.forEach(node => {
    if (!visited.has(node.id) && node.type !== 'ruleHeader') {
      errors.push(`Node "${node.id}" is not connected to the rule flow`);
    }
  });

  // Validate fact conditions have required fields
  nodes
    .filter(n => n.type === 'factCondition')
    .forEach(node => {
      const data = node.data as any;
      if (!data.fact) {
        errors.push(`Fact condition node "${node.id}" is missing fact field`);
      }
      if (!data.operator) {
        errors.push(`Fact condition node "${node.id}" is missing operator`);
      }
    });

  return errors;
};