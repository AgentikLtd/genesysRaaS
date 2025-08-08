
/**
 * Utility to convert a rule object into React Flow nodes and edges
 * Handles nested conditions and creates appropriate visual representation
 */

import { Node, Edge, Position, MarkerType } from 'reactflow';
import { Rule, RuleCondition, CustomNode } from '../types';

let nodeIdCounter = 0;

/**
 * Generate deterministic node ID for consistent layout persistence
 */
const generateNodeId = (prefix: string = 'node'): string => {
  return `${prefix}-${nodeIdCounter++}`;
};

/**
 * Calculate node positions for optimized flow layout
 * Creates a clear top-to-bottom flow: Rule → Conditions → Destination
 */
const calculatePosition = (
  level: number, 
  index: number, 
  total: number, 
  nodeType: 'header' | 'condition' | 'event' = 'condition'
): { x: number; y: number } => {
  const centerX = 400; // Center point of the flow
  const nodeWidth = 280; // Approximate node width
  const nodeHeight = 120; // Approximate node height
  const minHorizontalSpacing = nodeWidth + 50; // Minimum horizontal space between nodes
  const verticalSpacing = nodeHeight + 80; // Vertical space between levels
  
  // Different positioning strategies for different node types
  switch (nodeType) {
    case 'header':
      return { x: centerX - 140, y: 50 }; // Top center for rule header
      
    case 'event':
      return { x: centerX - 140, y: 200 + (level * verticalSpacing) }; // Bottom center for destination
      
    case 'condition':
    default:
      // Conditions flow in a logical cascade down the middle
      const conditionY = 200 + (level * verticalSpacing); // Vertical progression for conditions
      
      if (total === 1) {
        return { x: centerX - 140, y: conditionY };
      }
      
      // For multiple conditions at the same level, ensure proper spacing with no overlaps
      const totalWidth = (total - 1) * minHorizontalSpacing;
      const startX = centerX - 140 - (totalWidth / 2);
      return { x: startX + (index * minHorizontalSpacing), y: conditionY };
  }
};

/**
 * Convert a rule object to React Flow nodes and edges
 */
export const ruleToFlow = (rule: Rule): { nodes: Node[]; edges: Edge[] } => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  nodeIdCounter = 0;

  // Create rule header node at the top
  const headerNodeId = 'rule-header';
  const savedHeaderPosition = rule.layout?.nodes?.[headerNodeId];
  const headerNode: Node = {
    id: headerNodeId,
    type: 'ruleHeader',
    position: savedHeaderPosition || calculatePosition(0, 0, 1, 'header'),
    data: {
      name: rule.name,
      priority: rule.priority,
      description: rule.description,
      defaultDestination: rule.defaultDestination
    },
    draggable: false
  };
  nodes.push(headerNode);

  /**
   * Recursively process conditions and create nodes
   */
  const processCondition = (
    condition: RuleCondition,
    parentId: string | null = null,
    level: number = 1,
    index: number = 0,
    total: number = 1
  ): string => {
    const nodeId = generateNodeId();
    const savedPosition = rule.layout?.nodes?.[nodeId];
    const position = savedPosition || calculatePosition(level, index, total, 'condition');

    if (condition.all || condition.any || condition.not) {
      // Create logical operator node
      const type = condition.all ? 'all' : condition.any ? 'any' : 'not';
      const logicalNode: Node = {
        id: nodeId,
        type: 'logicalOperator',
        position,
        data: { 
          type,
          parentId 
        }
      };
      nodes.push(logicalNode);

      // Connect to parent if exists
      if (parentId) {
        edges.push({
          id: `${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: 'smoothstep',
          animated: false,
          style: { strokeWidth: 2 }
        });
      }

      // Process child conditions
      let childConditions: RuleCondition[] = [];
      if (condition.all) {
        childConditions = condition.all;
      } else if (condition.any) {
        childConditions = condition.any;
      } else if (condition.not) {
        childConditions = [condition.not];
      }

      // Process each child condition
      childConditions.forEach((childCondition, childIndex) => {
        processCondition(
          childCondition, 
          nodeId, 
          level + 1, 
          childIndex, 
          childConditions.length
        );
      });
    } else if (condition.fact || condition.condition) {
      // Create fact condition node
      const factNode: Node = {
        id: nodeId,
        type: 'factCondition',
        position,
        data: {
          fact: condition.fact || 'condition',
          operator: condition.operator || 'reference',
          value: condition.value || condition.condition,
          params: condition.params,
          parentId
        }
      };
      nodes.push(factNode);

      // Connect to parent if exists
      if (parentId) {
        edges.push({
          id: `${parentId}-${nodeId}`,
          source: parentId,
          target: nodeId,
          type: 'smoothstep',
          animated: false,
          style: { strokeWidth: 2 }
        });
      }
    }

    return nodeId;
  };

  // Process the main condition
  let mainConditionId: string | null = null;
  if (rule.conditions) {
    mainConditionId = processCondition(rule.conditions, headerNodeId);
  }

  // Create event node (destination) - now draggable for user positioning
  const eventNodeId = 'event-node';
  const savedEventPosition = rule.layout?.nodes?.[eventNodeId];
  const eventNode: Node = {
    id: eventNodeId,
    type: 'eventNode',
    position: savedEventPosition || calculatePosition(0, 0, 1, 'event'),
    data: {
      destination: rule.event.params.destination,
      priority: rule.event.params.priority,
      reason: rule.event.params.reason
    },
    draggable: true // Now draggable for better UX
  };
  nodes.push(eventNode);

  // Create enhanced connection from conditions to event with clear flow indication
  const lastConditionNode = mainConditionId || headerNodeId;
  edges.push({
    id: `${lastConditionNode}-${eventNodeId}`,
    source: lastConditionNode,
    target: eventNodeId,
    type: 'smoothstep',
    animated: true,
    style: { 
      strokeWidth: 4,
      stroke: '#52c41a'
    },
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 20,
      height: 20,
      color: '#52c41a'
    },
    label: 'ROUTE TO',
    labelStyle: { 
      fill: '#52c41a', 
      fontWeight: 'bold',
      fontSize: '12px'
    },
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: '#f6ffed', fillOpacity: 0.9 }
  });

  return { nodes, edges };
};

/**
 * Auto-layout nodes for optimized flow visualization
 * Creates clear top-to-bottom logical progression with proper spacing
 */
export const autoLayoutNodes = (nodes: Node[], edges: Edge[]): Node[] => {
  // Create a deep copy of nodes to avoid mutating the original array
  const layoutNodes = nodes.map(node => ({ ...node, position: { ...node.position } }));
  
  // Build adjacency lists
  const children = new Map<string, string[]>();
  const parents = new Map<string, string[]>();
  
  edges.forEach(edge => {
    if (!children.has(edge.source)) {
      children.set(edge.source, []);
    }
    children.get(edge.source)!.push(edge.target);
    
    if (!parents.has(edge.target)) {
      parents.set(edge.target, []);
    }
    parents.get(edge.target)!.push(edge.source);
  });

  // Find root node (rule header)
  const headerNode = layoutNodes.find(n => n.type === 'ruleHeader');
  const eventNode = layoutNodes.find(n => n.type === 'eventNode');
  
  if (!headerNode) {
    return layoutNodes; // Can't layout without header
  }

  // Build hierarchy levels
  const levels = new Map<number, string[]>();
  const nodeToLevel = new Map<string, number>();
  
  // BFS to assign levels
  const queue: Array<{ nodeId: string; level: number }> = [{ nodeId: headerNode.id, level: 0 }];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const { nodeId, level } = queue.shift()!;
    
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    // Skip event node in normal hierarchy - it gets special treatment
    if (layoutNodes.find(n => n.id === nodeId)?.type === 'eventNode') {
      continue;
    }
    
    nodeToLevel.set(nodeId, level);
    
    if (!levels.has(level)) {
      levels.set(level, []);
    }
    levels.get(level)!.push(nodeId);
    
    // Add children to queue
    const nodeChildren = children.get(nodeId) || [];
    nodeChildren.forEach(childId => {
      if (!visited.has(childId)) {
        queue.push({ nodeId: childId, level: level + 1 });
      }
    });
  }
  
  // Position nodes level by level
  levels.forEach((nodeIds, level) => {
    nodeIds.forEach((nodeId, index) => {
      const node = layoutNodes.find(n => n.id === nodeId);
      if (!node) return;
      
      let nodeType: 'header' | 'condition' | 'event' = 'condition';
      if (node.type === 'ruleHeader') {
        nodeType = 'header';
      }
      
      const position = calculatePosition(level, index, nodeIds.length, nodeType);
      node.position = position;
    });
  });
  
  // Special positioning for event node - place it at the bottom center
  if (eventNode) {
    const maxLevel = Math.max(...Array.from(levels.keys()));
    const eventPosition = calculatePosition(maxLevel + 1, 0, 1, 'event');
    eventNode.position = eventPosition;
  }
  
  // Handle any disconnected nodes
  layoutNodes.forEach(node => {
    if (!visited.has(node.id) && node.type !== 'eventNode') {
      // Position disconnected nodes to the right
      const position = calculatePosition(0, 0, 1, 'condition');
      node.position = { x: position.x + 500, y: position.y };
    }
  });

  return layoutNodes;
};