
/**
 * Export/Import utilities for Visual Rule Editor
 * Handles various export formats and import validation
 */

import { Rule, RulesConfig } from '../types';
import { validateRule } from './validation';
import { toPng, toJpeg, toSvg } from 'html-to-image';

/**
 * Export formats supported
 */
export enum ExportFormat {
  JSON = 'json',
  YAML = 'yaml',
  CSV = 'csv',
  PNG = 'png',
  SVG = 'svg',
  PDF = 'pdf'
}

/**
 * Export a single rule to JSON
 */
export const exportRuleAsJSON = (rule: Rule): string => {
  return JSON.stringify(rule, null, 2);
};

/**
 * Export rules configuration to JSON
 */
export const exportRulesConfigAsJSON = (config: RulesConfig): string => {
  return JSON.stringify(config, null, 2);
};

/**
 * Export rule to YAML format
 */
export const exportRuleAsYAML = (rule: Rule): string => {
  // Simple YAML converter (for production, use a proper YAML library)
  const indent = (str: string, spaces: number): string => {
    return str.split('\n').map(line => ' '.repeat(spaces) + line).join('\n');
  };

  const toYAML = (obj: any, level: number = 0): string => {
    const lines: string[] = [];
    
    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        lines.push(`${key}: null`);
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        lines.push(`${key}:`);
        lines.push(indent(toYAML(value, level + 1), 2));
      } else if (Array.isArray(value)) {
        lines.push(`${key}:`);
        value.forEach(item => {
          if (typeof item === 'object') {
            lines.push(`  -`);
            lines.push(indent(toYAML(item, level + 2), 4));
          } else {
            lines.push(`  - ${item}`);
          }
        });
      } else if (typeof value === 'string') {
        lines.push(`${key}: "${value}"`);
      } else {
        lines.push(`${key}: ${value}`);
      }
    }
    
    return lines.join('\n');
  };

  return toYAML(rule);
};

/**
 * Export rules to CSV format
 */
export const exportRulesAsCSV = (rules: Rule[]): string => {
  const headers = [
    'Name',
    'Description',
    'Priority',
    'Default Destination',
    'Conditions',
    'Destination',
    'Routing Priority',
    'Reason'
  ];

  const rows = rules.map(rule => [
    rule.name,
    rule.description || '',
    rule.priority.toString(),
    rule.defaultDestination,
    JSON.stringify(rule.conditions),
    rule.event.params.destination,
    rule.event.params.priority || '',
    rule.event.params.reason || ''
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  return csvContent;
};

/**
 * Export visual editor as image
 */
export const exportAsImage = async (
  element: HTMLElement,
  format: 'png' | 'jpeg' | 'svg',
  options?: {
    backgroundColor?: string;
    quality?: number;
    width?: number;
    height?: number;
  }
): Promise<string> => {
  const config = {
    backgroundColor: options?.backgroundColor || '#ffffff',
    quality: options?.quality || 0.95,
    width: options?.width,
    height: options?.height,
    style: {
      transform: 'scale(1)',
      transformOrigin: 'top left'
    }
  };

  switch (format) {
    case 'png':
      return toPng(element, config);
    case 'jpeg':
      return toJpeg(element, config);
    case 'svg':
      return toSvg(element, config);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
};

/**
 * Import rule from JSON string
 */
export const importRuleFromJSON = (jsonString: string): Rule => {
  try {
    const rule = JSON.parse(jsonString);
    
    // Validate the imported rule
    const validation = validateRule(rule);
    if (!validation.isValid) {
      throw new Error(`Invalid rule: ${validation.errors.join(', ')}`);
    }
    
    return rule;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
};

/**
 * Import rules configuration from JSON
 */
export const importRulesConfigFromJSON = (jsonString: string): RulesConfig => {
  try {
    const config = JSON.parse(jsonString);
    
    // Validate structure
    if (!config.rules || !Array.isArray(config.rules)) {
      throw new Error('Invalid configuration: missing rules array');
    }
    
    if (config.rules.length === 0) {
      throw new Error('Invalid configuration: rules array cannot be empty');
    }
    
    // Validate each rule
    config.rules.forEach((rule: Rule, index: number) => {
      const validation = validateRule(rule);
      if (!validation.isValid) {
        throw new Error(`Invalid rule at index ${index}: ${validation.errors.join(', ')}`);
      }
    });
    
    return config;
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('Invalid JSON format');
    }
    throw error;
  }
};

/**
 * Import rules from CSV
 */
export const importRulesFromCSV = (csvContent: string): Rule[] => {
  const lines = csvContent.split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  
  const rules: Rule[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Simple CSV parser (for production, use a proper CSV library)
    const values = line.match(/(".*?"|[^,]+)(?=\s*,|\s*$)/g) || [];
    const cleanedValues = values.map(v => v.replace(/^"|"$/g, '').replace(/""/g, '"'));
    
    if (cleanedValues.length >= 8) {
      try {
        const rule: Rule = {
          name: cleanedValues[0],
          description: cleanedValues[1] || undefined,
          priority: parseInt(cleanedValues[2], 10),
          defaultDestination: cleanedValues[3],
          conditions: JSON.parse(cleanedValues[4]),
          event: {
            type: 'route_determined',
            params: {
              destination: cleanedValues[5],
              priority: cleanedValues[6] as any || undefined,
              reason: cleanedValues[7] || undefined
            }
          }
        };
        
        const validation = validateRule(rule);
        if (validation.isValid) {
          rules.push(rule);
        }
      } catch (error) {
        console.error(`Failed to parse rule at line ${i + 1}:`, error);
      }
    }
  }
  
  return rules;
};

/**
 * Download file utility
 */
export const downloadFile = (
  content: string,
  filename: string,
  mimeType: string = 'application/json'
): void => {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export rule with metadata
 */
export interface ExportMetadata {
  exportDate: string;
  exportedBy?: string;
  version: string;
  environment?: string;
}

export const exportWithMetadata = (
  rule: Rule,
  metadata: Partial<ExportMetadata>
): string => {
  const fullMetadata: ExportMetadata = {
    exportDate: new Date().toISOString(),
    version: '1.0.0',
    ...metadata
  };

  return JSON.stringify({
    metadata: fullMetadata,
    rule
  }, null, 2);
};

/**
 * Import with metadata validation
 */
export const importWithMetadata = (jsonString: string): {
  metadata: ExportMetadata;
  rule: Rule;
} => {
  const data = JSON.parse(jsonString);
  
  if (!data.metadata || !data.rule) {
    throw new Error('Invalid export format: missing metadata or rule');
  }
  
  const validation = validateRule(data.rule);
  if (!validation.isValid) {
    throw new Error(`Invalid rule: ${validation.errors.join(', ')}`);
  }
  
  return {
    metadata: data.metadata,
    rule: data.rule
  };
};

/**
 * Create shareable link for rule
 */
export const createShareableLink = (rule: Rule): string => {
  const compressed = btoa(JSON.stringify(rule));
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?rule=${encodeURIComponent(compressed)}`;
};

/**
 * Parse rule from shareable link
 */
export const parseShareableLink = (url: string): Rule | null => {
  try {
    const urlParams = new URLSearchParams(new URL(url).search);
    const compressed = urlParams.get('rule');
    
    if (!compressed) return null;
    
    const decompressed = atob(decodeURIComponent(compressed));
    return importRuleFromJSON(decompressed);
  } catch (error) {
    console.error('Failed to parse shareable link:', error);
    return null;
  }
};