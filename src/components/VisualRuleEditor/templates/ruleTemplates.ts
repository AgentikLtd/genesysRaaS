
/**
 * Rule Templates
 * Pre-built rule patterns for common routing scenarios
 */

import { Rule } from '../types';

export interface RuleTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  rule: Partial<Rule>;
  variables?: TemplateVariable[];
}

export interface TemplateVariable {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'select';
  defaultValue?: any;
  options?: { label: string; value: any }[];
  required?: boolean;
}

/**
 * Built-in rule templates
 */
export const RULE_TEMPLATES: RuleTemplate[] = [
  // Basic Templates
  {
    id: 'simple-equal',
    name: 'Simple Equality Check',
    description: 'Route based on a single field matching a value',
    category: 'Basic',
    rule: {
      name: 'simpleRule',
      description: 'Routes when {{fieldName}} equals {{value}}',
      priority: 50,
      defaultDestination: '{{defaultDestination}}',
      conditions: {
        all: [
          {
            fact: 'inputValue',
            params: { key: '{{fieldName}}' },
            operator: 'equal',
            value: '{{value}}'
          }
        ]
      },
      event: {
        type: 'route_determined',
        params: {
          destination: '{{destination}}',
          reason: '{{fieldName}} matched expected value'
        }
      }
    },
    variables: [
      {
        key: 'fieldName',
        label: 'Field Name',
        type: 'string',
        defaultValue: 'intent',
        required: true
      },
      {
        key: 'value',
        label: 'Expected Value',
        type: 'string',
        defaultValue: 'support',
        required: true
      },
      {
        key: 'destination',
        label: 'Destination Queue',
        type: 'string',
        defaultValue: 'Support_Queue',
        required: true
      },
      {
        key: 'defaultDestination',
        label: 'Default Destination (if no match)',
        type: 'string',
        defaultValue: 'Default_Queue',
        required: true
      }
    ]
  },

  // Customer Type Templates
  {
    id: 'vip-routing',
    name: 'VIP Customer Routing',
    description: 'Priority routing for VIP customers',
    category: 'Customer Type',
    rule: {
      name: 'vipRouting',
      description: 'VIP customers get priority service',
      priority: 95,
      defaultDestination: '{{defaultDestination}}',
      conditions: {
        all: [
          {
            fact: 'inputValue',
            params: { key: 'customerType' },
            operator: 'equal',
            value: 'vip'
          },
          {
            fact: 'inputValue',
            params: { key: '{{additionalField}}' },
            operator: 'equal',
            value: '{{additionalValue}}'
          }
        ]
      },
      event: {
        type: 'route_determined',
        params: {
          destination: '{{vipQueue}}',
          priority: 'high',
          reason: 'VIP customer identified'
        }
      }
    },
    variables: [
      {
        key: 'additionalField',
        label: 'Additional Check Field',
        type: 'select',
        defaultValue: 'intent',
        options: [
          { label: 'Intent', value: 'intent' },
          { label: 'Brand', value: 'brand' },
          { label: 'Language', value: 'language' }
        ]
      },
      {
        key: 'additionalValue',
        label: 'Additional Check Value',
        type: 'string',
        defaultValue: 'support'
      },
      {
        key: 'vipQueue',
        label: 'VIP Queue Name',
        type: 'string',
        defaultValue: 'VIP_Support_Queue',
        required: true
      },
      {
        key: 'defaultDestination',
        label: 'Default Destination (if no match)',
        type: 'string',
        defaultValue: 'Standard_Queue',
        required: true
      }
    ]
  },

  // Intent-Based Templates
  {
    id: 'multi-intent',
    name: 'Multiple Intent Routing',
    description: 'Route based on multiple possible intents',
    category: 'Intent',
    rule: {
      name: 'multiIntentRouting',
      description: 'Routes multiple intents to same queue',
      priority: 70,
      defaultDestination: '{{defaultDestination}}',
      conditions: {
        any: [
          {
            fact: 'inputValue',
            params: { key: 'intent' },
            operator: 'equal',
            value: '{{intent1}}'
          },
          {
            fact: 'inputValue',
            params: { key: 'intent' },
            operator: 'equal',
            value: '{{intent2}}'
          },
          {
            fact: 'inputValue',
            params: { key: 'intent' },
            operator: 'equal',
            value: '{{intent3}}'
          }
        ]
      },
      event: {
        type: 'route_determined',
        params: {
          destination: '{{destination}}',
          priority: '{{priority}}',
          reason: 'Matched one of the specified intents'
        }
      }
    },
    variables: [
      {
        key: 'intent1',
        label: 'Intent 1',
        type: 'string',
        defaultValue: 'billing',
        required: true
      },
      {
        key: 'intent2',
        label: 'Intent 2',
        type: 'string',
        defaultValue: 'payment',
        required: true
      },
      {
        key: 'intent3',
        label: 'Intent 3',
        type: 'string',
        defaultValue: 'invoice'
      },
      {
        key: 'destination',
        label: 'Destination',
        type: 'string',
        defaultValue: 'Billing_Queue',
        required: true
      },
      {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        defaultValue: 'medium',
        options: [
          { label: 'High', value: 'high' },
          { label: 'Medium', value: 'medium' },
          { label: 'Low', value: 'low' }
        ]
      },
      {
        key: 'defaultDestination',
        label: 'Default Destination (if no match)',
        type: 'string',
        defaultValue: 'General_Queue',
        required: true
      }
    ]
  },

  // Time-Based Templates
  {
    id: 'business-hours',
    name: 'Business Hours Routing',
    description: 'Different routing during/outside business hours',
    category: 'Time-Based',
    rule: {
      name: 'businessHoursRouting',
      description: 'Routes based on business hours',
      priority: 60,
      defaultDestination: '{{defaultDestination}}',
      conditions: {
        all: [
          {
            fact: 'isBusinessHours',
            operator: 'equal',
            value: true
          },
          {
            fact: 'inputValue',
            params: { key: '{{checkField}}' },
            operator: 'equal',
            value: '{{checkValue}}'
          }
        ]
      },
      event: {
        type: 'route_determined',
        params: {
          destination: '{{businessHoursQueue}}',
          reason: 'Business hours routing'
        }
      }
    },
    variables: [
      {
        key: 'checkField',
        label: 'Additional Check Field',
        type: 'string',
        defaultValue: 'intent'
      },
      {
        key: 'checkValue',
        label: 'Additional Check Value',
        type: 'string',
        defaultValue: 'support'
      },
      {
        key: 'businessHoursQueue',
        label: 'Business Hours Queue',
        type: 'string',
        defaultValue: 'Standard_Queue',
        required: true
      },
      {
        key: 'defaultDestination',
        label: 'Default Destination (if no match)',
        type: 'string',
        defaultValue: 'After_Hours_Queue',
        required: true
      }
    ]
  },

  // Complex Templates
  {
    id: 'tiered-support',
    name: 'Tiered Support Routing',
    description: 'Route based on customer tier and issue complexity',
    category: 'Complex',
    rule: {
      name: 'tieredSupport',
      description: 'Tiered support routing based on customer and issue',
      priority: 85,
      defaultDestination: '{{defaultDestination}}',
      conditions: {
        all: [
          {
            any: [
              {
                fact: 'inputValue',
                params: { key: 'customerTier' },
                operator: 'equal',
                value: 'platinum'
              },
              {
                all: [
                  {
                    fact: 'inputValue',
                    params: { key: 'customerTier' },
                    operator: 'equal',
                    value: 'gold'
                  },
                  {
                    fact: 'inputValue',
                    params: { key: 'issueComplexity' },
                    operator: 'greaterThan',
                    value: 3
                  }
                ]
              }
            ]
          },
          {
            fact: 'inputValue',
            params: { key: 'intent' },
            operator: 'equal',
            value: '{{intent}}'
          }
        ]
      },
      event: {
        type: 'route_determined',
        params: {
          destination: '{{premiumQueue}}',
          priority: 'high',
          reason: 'Premium tier customer or complex issue'
        }
      }
    },
    variables: [
      {
        key: 'intent',
        label: 'Intent',
        type: 'string',
        defaultValue: 'support',
        required: true
      },
      {
        key: 'premiumQueue',
        label: 'Premium Support Queue',
        type: 'string',
        defaultValue: 'Premium_Support_Queue',
        required: true
      },
      {
        key: 'defaultDestination',
        label: 'Default Destination (if no match)',
        type: 'string',
        defaultValue: 'Standard_Support_Queue',
        required: true
      }
    ]
  },

  // Language Templates
  {
    id: 'language-routing',
    name: 'Language-Based Routing',
    description: 'Route to language-specific queues',
    category: 'Language',
    rule: {
      name: 'languageRouting',
      description: 'Routes based on customer language preference',
      priority: 75,
      defaultDestination: '{{defaultDestination}}',
      conditions: {
        all: [
          {
            fact: 'inputValue',
            params: { key: 'language' },
            operator: 'in',
            value: ['{{lang1}}', '{{lang2}}', '{{lang3}}']
          }
        ]
      },
      event: {
        type: 'route_determined',
        params: {
          destination: '{{languageQueue}}',
          reason: 'Language-specific routing'
        }
      }
    },
    variables: [
      {
        key: 'lang1',
        label: 'Language 1',
        type: 'string',
        defaultValue: 'spanish',
        required: true
      },
      {
        key: 'lang2',
        label: 'Language 2',
        type: 'string',
        defaultValue: 'french'
      },
      {
        key: 'lang3',
        label: 'Language 3',
        type: 'string',
        defaultValue: 'german'
      },
      {
        key: 'languageQueue',
        label: 'Language Queue',
        type: 'string',
        defaultValue: 'Multilingual_Support',
        required: true
      },
      {
        key: 'defaultDestination',
        label: 'Default Destination (if no match)',
        type: 'string',
        defaultValue: 'English_Support',
        required: true
      }
    ]
  }
];

/**
 * Apply template variables to create a rule
 */
export const applyTemplate = (
  template: RuleTemplate,
  variables: Record<string, any>
): Rule => {
  // Deep clone the template rule
  let ruleString = JSON.stringify(template.rule);
  
  // Replace all variables
  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`;
    ruleString = ruleString.replace(
      new RegExp(placeholder, 'g'),
      typeof value === 'string' ? value : JSON.stringify(value)
    );
  });
  
  // Parse the result
  const rule = JSON.parse(ruleString) as Rule;
  
  // Ensure all required fields are present
  if (!rule.name) rule.name = 'newRule';
  if (!rule.priority) rule.priority = 50;
  if (!rule.defaultDestination) rule.defaultDestination = 'Default_Queue';
  if (!rule.conditions) rule.conditions = { all: [] };
  if (!rule.event) {
    rule.event = {
      type: 'route_determined',
      params: { destination: 'Default_Queue' }
    };
  }
  
  return rule;
};

/**
 * Get templates by category
 */
export const getTemplatesByCategory = (category: string): RuleTemplate[] => {
  return RULE_TEMPLATES.filter(t => t.category === category);
};

/**
 * Get all categories
 */
export const getTemplateCategories = (): string[] => {
  const categories = new Set(RULE_TEMPLATES.map(t => t.category));
  return Array.from(categories).sort();
};

/**
 * Search templates
 */
export const searchTemplates = (query: string): RuleTemplate[] => {
  const lowerQuery = query.toLowerCase();
  return RULE_TEMPLATES.filter(t => 
    t.name.toLowerCase().includes(lowerQuery) ||
    t.description.toLowerCase().includes(lowerQuery) ||
    t.category.toLowerCase().includes(lowerQuery)
  );
};

/**
 * Create custom template from existing rule
 */
export const createTemplateFromRule = (
  rule: Rule,
  templateInfo: {
    id: string;
    name: string;
    description: string;
    category: string;
  }
): RuleTemplate => {
  // Analyze rule to find potential variables
  const ruleString = JSON.stringify(rule);
  const potentialVars: TemplateVariable[] = [];
  
  // Find string values that could be variables
  const stringMatches = ruleString.match(/"([^"]+)"/g) || [];
  const uniqueStrings = Array.from(new Set(
    stringMatches
      .map(s => s.slice(1, -1))
      .filter(s => s.length > 2 && !s.includes(' '))
  ));
  
  uniqueStrings.forEach((str, index) => {
    if (['equal', 'notEqual', 'route_determined'].includes(str)) return;
    
    potentialVars.push({
      key: `var${index + 1}`,
      label: `Variable ${index + 1}`,
      type: 'string',
      defaultValue: str
    });
  });
  
  return {
    ...templateInfo,
    rule,
    variables: potentialVars
  };
};