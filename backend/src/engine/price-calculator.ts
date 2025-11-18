import { PriceAdjustment, AppliedRule, PriceBreakdown } from '../types';

/**
 * Applies a single price adjustment to a price
 */
export function applyAdjustment(
  currentPrice: number,
  adjustment: PriceAdjustment
): number {
  switch (adjustment.type) {
    case 'percent_off':
      return currentPrice * (1 - adjustment.value / 100);

    case 'percent_increase':
      return currentPrice * (1 + adjustment.value / 100);

    case 'fixed_off':
      return Math.max(0, currentPrice - adjustment.value);

    case 'fixed_price':
      return adjustment.value;

    default:
      console.warn(`Unknown adjustment type: ${adjustment.type}`);
      return currentPrice;
  }
}

/**
 * Applies multiple rules sequentially to calculate final price
 * Each rule is applied to the result of the previous rule
 */
export function calculatePrice<T extends { id: string; name: string; adjustmentJson: any }>(
  basePrice: number,
  matchedRules: T[]
): PriceBreakdown {
  let currentPrice = basePrice;
  const appliedRules: AppliedRule[] = [];

  for (const rule of matchedRules) {
    try {
      const adjustment = typeof rule.adjustmentJson === 'string'
        ? JSON.parse(rule.adjustmentJson)
        : rule.adjustmentJson;

      const newPrice = applyAdjustment(currentPrice, adjustment);

      appliedRules.push({
        ruleId: rule.id,
        ruleName: rule.name,
        adjustment,
        priceAfter: newPrice,
      });

      currentPrice = newPrice;
    } catch (error) {
      console.error(`Error applying rule ${rule.id}:`, error);
    }
  }

  // Round to 2 decimal places
  const finalPrice = Math.round(currentPrice * 100) / 100;

  return {
    basePrice,
    appliedRules,
    finalPrice,
  };
}
