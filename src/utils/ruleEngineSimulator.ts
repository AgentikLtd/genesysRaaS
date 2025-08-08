export interface ConditionResult {
  fact: string;
  operator: string;
  expected: any;
  actual: any;
  passed: boolean;
}

export interface RuleEvaluationResult {
  ruleName: string;
  passed: boolean;
  conditions: ConditionResult[];
}

export interface TestResult {
  destination: string;
  matchedRules: string[];
  executionTime: number;
  evaluationSteps: RuleEvaluationResult[];
}

/**
 * Client-side simulation of the json-rules-engine
 * Mimics the behaviour of the Lambda function for testing purposes
 */
export class RuleEngineSimulator {
  private rules: any[];
  private dynamicFacts: Map<string, (params: any, input: any) => any>;

  constructor(rulesConfig: any) {
    this.rules = rulesConfig.rules || [];
    this.dynamicFacts = new Map();
    
    // Register built-in dynamic facts
    this.registerDynamicFacts();
  }

  /**
   * Register dynamic facts that can be used in rules
   */
  private registerDynamicFacts(): void {
    // Business hours fact
    this.dynamicFacts.set('isBusinessHours', () => {
      const now = new Date();
      const day = now.getDay();
      const hour = now.getHours();
      return day >= 1 && day <= 5 && hour >= 9 && hour < 17;
    });

    // Check if key exists
    this.dynamicFacts.set('hasKey', (params: any, input: any) => {
      return input.hasOwnProperty(params.key);
    });

    // Count of keys in input
    this.dynamicFacts.set('keyCount', (_params: any, input: any) => {
      return Object.keys(input).length;
    });

    // Get current timestamp
    this.dynamicFacts.set('currentTimestamp', () => {
      return Date.now();
    });

    // Get current hour
    this.dynamicFacts.set('currentHour', () => {
      return new Date().getHours();
    });
  }

  /**
   * Evaluate all rules against the input
   */
  async evaluate(input: any): Promise<{
    destination: string;
    matchedRules: string[];
    evaluationSteps: RuleEvaluationResult[];
  }> {
    const evaluationSteps: RuleEvaluationResult[] = [];
    const matchedRules: string[] = [];
    
    // Sort rules by priority (highest first)
    const sortedRules = [...this.rules].sort((a, b) => {
      const priorityA = typeof a.priority === 'number' ? a.priority : 0;
      const priorityB = typeof b.priority === 'number' ? b.priority : 0;
      return priorityB - priorityA;
    });

    // Evaluate each rule
    for (const rule of sortedRules) {
      const evaluation = await this.evaluateRule(rule, input);
      evaluationSteps.push(evaluation);
      
      if (evaluation.passed) {
        matchedRules.push(rule.name);
        // Return first matching rule's destination, fallback to rule's default destination
        return {
          destination: rule.event?.params?.destination || rule.defaultDestination || 'Unknown',
          matchedRules,
          evaluationSteps
        };
      }
    }

    // No rules matched, use the lowest priority rule's default destination
    // (rules are sorted by priority highest to lowest, so last rule is lowest priority)
    const lowestPriorityRule = sortedRules[sortedRules.length - 1];
    const fallbackDestination = lowestPriorityRule?.defaultDestination || 'Unknown';
    
    return {
      destination: fallbackDestination,
      matchedRules: [],
      evaluationSteps
    };
  }

  /**
   * Evaluate a single rule
   */
  private async evaluateRule(rule: any, input: any): Promise<RuleEvaluationResult> {
    const conditions: ConditionResult[] = [];
    let passed = false;

    try {
      if (rule.conditions) {
        passed = await this.evaluateConditions(rule.conditions, input, conditions);
      }
    } catch (error) {
      console.error(`Error evaluating rule ${rule.name}:`, error);
      passed = false;
    }

    return {
      ruleName: rule.name,
      passed,
      conditions
    };
  }

  /**
   * Recursively evaluate conditions
   */
  private async evaluateConditions(
    conditions: any, 
    input: any, 
    conditionResults: ConditionResult[]
  ): Promise<boolean> {
    // Handle 'all' conditions (AND)
    if (conditions.all && Array.isArray(conditions.all)) {
      const results = await Promise.all(
        conditions.all.map((cond: any) => this.evaluateCondition(cond, input, conditionResults))
      );
      return results.every(r => r === true);
    }
    
    // Handle 'any' conditions (OR)
    if (conditions.any && Array.isArray(conditions.any)) {
      const results = await Promise.all(
        conditions.any.map((cond: any) => this.evaluateCondition(cond, input, conditionResults))
      );
      return results.some(r => r === true);
    }
    
    // Handle 'not' conditions
    if (conditions.not) {
      const result = await this.evaluateConditions(conditions.not, input, conditionResults);
      return !result;
    }
    
    // Single condition
    return this.evaluateCondition(conditions, input, conditionResults);
  }

  /**
   * Evaluate a single condition
   */
  private async evaluateCondition(
    condition: any, 
    input: any, 
    conditionResults: ConditionResult[]
  ): Promise<boolean> {
    // Handle nested conditions
    if (condition.all || condition.any || condition.not) {
      return this.evaluateConditions(condition, input, conditionResults);
    }

    // Handle reference conditions
    if (condition.condition) {
      // This would reference a shared condition - not implemented in simulator
      console.warn(`Reference conditions not supported in simulator: ${condition.condition}`);
      return false;
    }

    // Handle fact-based conditions
    if (condition.fact) {
      return this.evaluateFactCondition(condition, input, conditionResults);
    }
    
    return false;
  }

  /**
   * Evaluate a fact-based condition
   */
  private async evaluateFactCondition(
    condition: any, 
    input: any, 
    conditionResults: ConditionResult[]
  ): Promise<boolean> {
    let actual: any;
    let factName = condition.fact;

    // Handle inputValue fact
    if (condition.fact === 'inputValue' && condition.params?.key) {
      actual = input[condition.params.key];
      factName = `inputValue.${condition.params.key}`;
    }
    // Handle dynamic facts
    else if (this.dynamicFacts.has(condition.fact)) {
      const factFunction = this.dynamicFacts.get(condition.fact)!;
      actual = factFunction(condition.params || {}, input);
    }
    // Direct fact value
    else {
      actual = input[condition.fact];
    }

    const expected = condition.value;
    const passed = this.evaluateOperator(actual, condition.operator, expected);
    
    conditionResults.push({
      fact: factName,
      operator: condition.operator,
      expected,
      actual: actual !== undefined ? actual : 'undefined',
      passed
    });
    
    return passed;
  }

  /**
   * Evaluate operators
   */
  private evaluateOperator(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case 'equal':
        return actual === expected;
        
      case 'notEqual':
        return actual !== expected;
        
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
        
      case 'notIn':
        return Array.isArray(expected) && !expected.includes(actual);
        
      case 'contains':
        return typeof actual === 'string' && typeof expected === 'string' && 
               actual.toLowerCase().includes(expected.toLowerCase());
        
      case 'doesNotContain':
        return typeof actual === 'string' && typeof expected === 'string' && 
               !actual.toLowerCase().includes(expected.toLowerCase());
               
      case 'lessThan':
      case 'lt':
        return Number(actual) < Number(expected);
        
      case 'lessThanOrEqual':
      case 'lte':
        return Number(actual) <= Number(expected);
        
      case 'greaterThan':
      case 'gt':
        return Number(actual) > Number(expected);
        
      case 'greaterThanOrEqual':
      case 'gte':
        return Number(actual) >= Number(expected);
        
      case 'startsWith':
        return typeof actual === 'string' && typeof expected === 'string' && 
               actual.startsWith(expected);
        
      case 'endsWith':
        return typeof actual === 'string' && typeof expected === 'string' && 
               actual.endsWith(expected);
               
      case 'matchesPattern':
        try {
          if (typeof actual !== 'string' || typeof expected !== 'string') return false;
          
          // Basic security validations - allow normal regex patterns
          if (expected.length > 1000) return false; // Prevent extremely long patterns
          
          // Block only the most dangerous ReDoS patterns
          // Nested quantifiers like (a+)+, (a*)+, (a+)*
          if (/\([^)]*[+*]\)[+*]/.test(expected)) return false;
          // Alternation with overlapping quantifiers like (a|a)*
          if (/\([^)]*\|[^)]*\)[+*]/.test(expected) && /(.)\1/.test(expected)) return false;
          
          return new RegExp(expected).test(actual);
        } catch {
          return false;
        }
        
      case 'containsAny':
        if (!Array.isArray(expected)) return false;
        return expected.some(value => 
          typeof actual === 'string' && 
          actual.toLowerCase().includes(String(value).toLowerCase())
        );
        
      case 'containsAll':
        if (!Array.isArray(expected)) return false;
        return expected.every(value => 
          typeof actual === 'string' && 
          actual.toLowerCase().includes(String(value).toLowerCase())
        );
        
      case 'exists':
        return actual !== undefined && actual !== null;
        
      case 'doesNotExist':
        return actual === undefined || actual === null;
        
      default:
        console.warn(`Unknown operator: ${operator}`);
        return false;
    }
  }
}

/**
 * Validate rule configuration structure
 */
export function validateRuleStructure(rulesConfig: any): {
  isValid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  try {
    if (!rulesConfig.rules || !Array.isArray(rulesConfig.rules)) {
      errors.push('Missing or invalid field: rules (must be an array)');
      return { isValid: false, errors };
    }
    
    if (rulesConfig.rules.length === 0) {
      errors.push('Rules array cannot be empty - at least one rule is required');
      return { isValid: false, errors };
    }
    
    // Validate each rule
    rulesConfig.rules.forEach((rule: any, index: number) => {
      const rulePrefix = `Rule ${index + 1}${rule.name ? ` (${rule.name})` : ''}`;
      
      // Required fields
      if (!rule.name) {
        errors.push(`${rulePrefix}: Missing required field 'name'`);
      }
      
      if (typeof rule.priority !== 'number') {
        errors.push(`${rulePrefix}: Priority must be a number`);
      }
      
      if (!rule.defaultDestination) {
        errors.push(`${rulePrefix}: Missing required field 'defaultDestination'`);
      }
      
      if (!rule.conditions) {
        errors.push(`${rulePrefix}: Missing required field 'conditions'`);
      } else {
        // Validate condition structure
        const conditionErrors = validateConditionStructure(rule.conditions, `${rulePrefix} conditions`);
        errors.push(...conditionErrors);
      }
      
      if (!rule.event) {
        errors.push(`${rulePrefix}: Missing required field 'event'`);
      } else {
        if (!rule.event.type) {
          errors.push(`${rulePrefix}: Missing event.type`);
        }
        if (!rule.event.params?.destination) {
          errors.push(`${rulePrefix}: Missing event.params.destination`);
        }
      }
    });
    
  } catch (error: any) {
    errors.push(`Invalid structure: ${error.message}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Recursively validate condition structure
 */
function validateConditionStructure(condition: any, path: string): string[] {
  const errors: string[] = [];
  
  if (!condition || typeof condition !== 'object') {
    errors.push(`${path}: Invalid condition structure`);
    return errors;
  }
  
  // Check for logical operators
  if (condition.all) {
    if (!Array.isArray(condition.all)) {
      errors.push(`${path}.all: Must be an array`);
    } else {
      condition.all.forEach((cond: any, idx: number) => {
        errors.push(...validateConditionStructure(cond, `${path}.all[${idx}]`));
      });
    }
  } else if (condition.any) {
    if (!Array.isArray(condition.any)) {
      errors.push(`${path}.any: Must be an array`);
    } else {
      condition.any.forEach((cond: any, idx: number) => {
        errors.push(...validateConditionStructure(cond, `${path}.any[${idx}]`));
      });
    }
  } else if (condition.not) {
    errors.push(...validateConditionStructure(condition.not, `${path}.not`));
  } else if (condition.fact) {
    // Validate fact condition
    if (!condition.operator) {
      errors.push(`${path}: Missing operator for fact condition`);
    }
    if (!condition.hasOwnProperty('value')) {
      errors.push(`${path}: Missing value for fact condition`);
    }
  } else if (!condition.condition) {
    // Not a reference condition either
    errors.push(`${path}: Invalid condition - must have 'all', 'any', 'not', 'fact', or 'condition'`);
  }
  
  return errors;
}