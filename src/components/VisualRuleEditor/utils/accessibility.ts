
/**
 * Accessibility utilities for Visual Rule Editor
 * Ensures the editor is usable by everyone
 */

import { Node, Edge } from 'reactflow';
import { Rule, RuleCondition } from '../types';

/**
 * ARIA labels for different node types
 */
export const NODE_ARIA_LABELS = {
  ruleHeader: 'Rule header',
  logicalOperator: 'Logical operator',
  factCondition: 'Condition',
  eventNode: 'Routing destination',
  placeholder: 'Hidden nodes placeholder'
};

/**
 * Generate ARIA label for a node
 */
export const getNodeAriaLabel = (node: Node): string => {
  const typeLabel = NODE_ARIA_LABELS[node.type as keyof typeof NODE_ARIA_LABELS] || 'Node';
  
  switch (node.type) {
    case 'ruleHeader':
      return `${typeLabel}: ${node.data.name}, Priority ${node.data.priority}`;
    
    case 'logicalOperator':
      return `${node.data.type.toUpperCase()} ${typeLabel}`;
    
    case 'factCondition':
      return `${typeLabel}: ${node.data.fact} ${node.data.operator} ${node.data.value}`;
    
    case 'eventNode':
      return `${typeLabel}: Route to ${node.data.destination}`;
    
    default:
      return typeLabel;
  }
};

/**
 * Generate description of rule structure for screen readers
 */
export const generateRuleDescription = (rule: Rule): string => {
  const parts: string[] = [];
  
  parts.push(`Rule "${rule.name}" with priority ${rule.priority}.`);
  
  if (rule.description) {
    parts.push(rule.description);
  }
  
  // Describe conditions
  const conditionDescription = describeConditions(rule.conditions);
  parts.push(`Conditions: ${conditionDescription}`);
  
  // Describe event
  parts.push(`When matched, routes to ${rule.event.params.destination}`);
  
  if (rule.event.params.priority) {
    parts.push(`with ${rule.event.params.priority} priority`);
  }
  
  if (rule.event.params.reason) {
    parts.push(`Reason: ${rule.event.params.reason}`);
  }
  
  return parts.join(' ');
};

/**
 * Describe conditions in natural language
 */
const describeConditions = (condition: RuleCondition, depth: number = 0): string => {
  if (condition.all) {
    const descriptions = condition.all.map(c => describeConditions(c, depth + 1));
    return depth === 0 
      ? `All of the following must be true: ${descriptions.join(', ')}`
      : `(${descriptions.join(' AND ')})`;
  }
  
  if (condition.any) {
    const descriptions = condition.any.map(c => describeConditions(c, depth + 1));
    return depth === 0
      ? `Any of the following must be true: ${descriptions.join(', ')}`
      : `(${descriptions.join(' OR ')})`;
  }
  
  if (condition.not) {
    return `NOT ${describeConditions(condition.not, depth + 1)}`;
  }
  
  if (condition.fact) {
    const key = condition.params?.key ? `${condition.params.key}` : condition.fact;
    return `${key} ${condition.operator} ${JSON.stringify(condition.value)}`;
  }
  
  return 'unknown condition';
};

/**
 * Keyboard navigation helper
 */
export class KeyboardNavigationHelper {
  private nodes: Node[];
  private currentIndex: number = -1;
  private onNodeFocus: (node: Node) => void;

  constructor(nodes: Node[], onNodeFocus: (node: Node) => void) {
    this.nodes = nodes;
    this.onNodeFocus = onNodeFocus;
  }

  updateNodes(nodes: Node[]): void {
    this.nodes = nodes;
    if (this.currentIndex >= nodes.length) {
      this.currentIndex = nodes.length - 1;
    }
  }

  focusNext(): void {
    if (this.nodes.length === 0) return;
    
    this.currentIndex = (this.currentIndex + 1) % this.nodes.length;
    this.focusCurrentNode();
  }

  focusPrevious(): void {
    if (this.nodes.length === 0) return;
    
    this.currentIndex = this.currentIndex <= 0 
      ? this.nodes.length - 1 
      : this.currentIndex - 1;
    this.focusCurrentNode();
  }

  focusFirst(): void {
    if (this.nodes.length === 0) return;
    
    this.currentIndex = 0;
    this.focusCurrentNode();
  }

  focusLast(): void {
    if (this.nodes.length === 0) return;
    
    this.currentIndex = this.nodes.length - 1;
    this.focusCurrentNode();
  }

  focusNodeById(nodeId: string): void {
    const index = this.nodes.findIndex(n => n.id === nodeId);
    if (index !== -1) {
      this.currentIndex = index;
      this.focusCurrentNode();
    }
  }

  getCurrentNode(): Node | null {
    return this.nodes[this.currentIndex] || null;
  }

  private focusCurrentNode(): void {
    const node = this.nodes[this.currentIndex];
    if (node) {
      this.onNodeFocus(node);
      this.announceNode(node);
    }
  }

  private announceNode(node: Node): void {
    const announcement = getNodeAriaLabel(node);
    this.announce(announcement);
  }

  private announce(message: string): void {
    // Create a live region for announcements
    const liveRegion = document.getElementById('visual-editor-announcer') || 
      this.createLiveRegion();
    
    liveRegion.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }

  private createLiveRegion(): HTMLElement {
    const liveRegion = document.createElement('div');
    liveRegion.id = 'visual-editor-announcer';
    liveRegion.setAttribute('role', 'status');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.style.position = 'absolute';
    liveRegion.style.left = '-10000px';
    liveRegion.style.width = '1px';
    liveRegion.style.height = '1px';
    liveRegion.style.overflow = 'hidden';
    
    document.body.appendChild(liveRegion);
    return liveRegion;
  }
}

/**
 * High contrast mode detection
 */
export const isHighContrastMode = (): boolean => {
  if (window.matchMedia) {
    return window.matchMedia('(prefers-contrast: high)').matches;
  }
  return false;
};

/**
 * Reduced motion preference detection
 */
export const prefersReducedMotion = (): boolean => {
  if (window.matchMedia) {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }
  return false;
};

/**
 * Generate keyboard shortcuts help
 */
export const getKeyboardShortcuts = (): Array<{
  key: string;
  description: string;
  category: string;
}> => {
  const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const ctrl = isMac ? '⌘' : 'Ctrl';
  
  return [
    // Navigation
    { key: 'Tab', description: 'Move to next node', category: 'Navigation' },
    { key: 'Shift + Tab', description: 'Move to previous node', category: 'Navigation' },
    { key: 'Arrow Keys', description: 'Navigate between connected nodes', category: 'Navigation' },
    { key: 'Home', description: 'Go to first node', category: 'Navigation' },
    { key: 'End', description: 'Go to last node', category: 'Navigation' },
    
    // Editing
    { key: 'Enter', description: 'Edit selected node', category: 'Editing' },
    { key: 'Escape', description: 'Cancel editing', category: 'Editing' },
    { key: 'Delete', description: 'Delete selected node', category: 'Editing' },
    { key: `${ctrl} + S`, description: 'Save changes', category: 'Editing' },
    { key: `${ctrl} + Z`, description: 'Undo', category: 'Editing' },
    { key: `${ctrl} + Shift + Z`, description: 'Redo', category: 'Editing' },
    
    // View
    { key: `${ctrl} + 0`, description: 'Fit view', category: 'View' },
    { key: `${ctrl} + Plus`, description: 'Zoom in', category: 'View' },
    { key: `${ctrl} + Minus`, description: 'Zoom out', category: 'View' },
    { key: 'F', description: 'Focus/fit selected node', category: 'View' },
    
    // Selection
    { key: `${ctrl} + A`, description: 'Select all nodes', category: 'Selection' },
    { key: `${ctrl} + Click`, description: 'Multi-select nodes', category: 'Selection' },
    { key: 'Shift + Click', description: 'Add to selection', category: 'Selection' }
  ];
};

/**
 * Focus trap for modal dialogs
 */
export class FocusTrap {
  private container: HTMLElement;
  private focusableElements: HTMLElement[];
  private firstFocusable: HTMLElement | null = null;
  private lastFocusable: HTMLElement | null = null;
  private previouslyFocused: HTMLElement | null = null;

  constructor(container: HTMLElement) {
    this.container = container;
    this.focusableElements = this.getFocusableElements();
    
    if (this.focusableElements.length > 0) {
      this.firstFocusable = this.focusableElements[0];
      this.lastFocusable = this.focusableElements[this.focusableElements.length - 1];
    }
    
    this.previouslyFocused = document.activeElement as HTMLElement;
  }

  private getFocusableElements(): HTMLElement[] {
    const selector = [
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      'a[href]',
      '[tabindex]:not([tabindex="-1"])'
    ].join(',');
    
    return Array.from(this.container.querySelectorAll(selector));
  }

  activate(): void {
    this.container.addEventListener('keydown', this.handleKeyDown);
    
    // Focus first element
    if (this.firstFocusable) {
      this.firstFocusable.focus();
    }
  }

  deactivate(): void {
    this.container.removeEventListener('keydown', this.handleKeyDown);
    
    // Restore previous focus
    if (this.previouslyFocused) {
      this.previouslyFocused.focus();
    }
  }

  private handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== 'Tab') return;
    
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === this.firstFocusable) {
        event.preventDefault();
        this.lastFocusable?.focus();
      }
    } else {
      // Tab
      if (document.activeElement === this.lastFocusable) {
        event.preventDefault();
        this.firstFocusable?.focus();
      }
    }
  };
}

/**
 * Color contrast utilities
 */
export const getContrastRatio = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 1;
  
  const l1 = getRelativeLuminance(rgb1);
  const l2 = getRelativeLuminance(rgb2);
  
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  
  return (lighter + 0.05) / (darker + 0.05);
};

const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
};

const getRelativeLuminance = (rgb: { r: number; g: number; b: number }): number => {
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;
  
  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/**
 * Check if color contrast meets WCAG standards
 */
export const meetsWCAGContrast = (
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  fontSize: 'normal' | 'large' = 'normal'
): boolean => {
  const ratio = getContrastRatio(foreground, background);
  
  if (level === 'AA') {
    return fontSize === 'large' ? ratio >= 3 : ratio >= 4.5;
  } else {
    return fontSize === 'large' ? ratio >= 4.5 : ratio >= 7;
  }
};