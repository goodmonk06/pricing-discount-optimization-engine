import { PriceCondition, UserContext } from '../types';

/**
 * Evaluates if a rule's conditions match the given context
 */
export function matchesCondition(
  condition: PriceCondition,
  context: UserContext
): boolean {
  // Empty condition matches everything
  if (!condition || Object.keys(condition).length === 0) {
    return true;
  }

  // Check each condition field
  for (const [key, value] of Object.entries(condition)) {
    const contextValue = context[key];

    // Handle special cases
    if (key === 'minOrderValue' && typeof context.orderValue === 'number') {
      if (context.orderValue < value) {
        return false;
      }
      continue;
    }

    if (key === 'maxOrderValue' && typeof context.orderValue === 'number') {
      if (context.orderValue > value) {
        return false;
      }
      continue;
    }

    // Standard equality check
    if (contextValue !== value) {
      return false;
    }
  }

  return true;
}

/**
 * Filters and sorts rules that match the given context
 * Rules are sorted by priority (lower number = higher priority)
 */
export function getMatchingRules<T extends { conditionJson: any; priority: number; active: boolean }>(
  rules: T[],
  context: UserContext
): T[] {
  return rules
    .filter(rule => rule.active)
    .filter(rule => {
      try {
        const condition = typeof rule.conditionJson === 'string'
          ? JSON.parse(rule.conditionJson)
          : rule.conditionJson;
        return matchesCondition(condition, context);
      } catch (error) {
        console.error('Error parsing rule condition:', error);
        return false;
      }
    })
    .sort((a, b) => a.priority - b.priority);
}
