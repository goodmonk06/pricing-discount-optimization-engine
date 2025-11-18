import { OptimizationSuggestion } from '../types';

interface ProductPerformance {
  productId: string;
  productName: string;
  sku: string;
  views: number;
  purchases: number;
  revenue: number;
}

/**
 * Simple optimization logic based on performance metrics
 *
 * Rules:
 * - High views + Low conversion (< 5%) → Increase discount
 * - Low views + High conversion (> 10%) → Decrease discount (could charge more)
 * - Medium conversion (5-10%) → Maintain current pricing
 */
export function generateOptimizationSuggestions(
  performanceData: ProductPerformance[]
): OptimizationSuggestion[] {
  return performanceData.map(data => {
    const conversionRate = data.views > 0
      ? (data.purchases / data.views) * 100
      : 0;

    let action: OptimizationSuggestion['suggestion']['action'] = 'maintain';
    let reason = '';
    let recommendedAdjustment: number | undefined;

    if (data.views >= 100) {
      // Enough data to make suggestions
      if (conversionRate < 2) {
        action = 'increase_discount';
        reason = `Very low conversion rate (${conversionRate.toFixed(2)}%). Consider increasing discount by 5-10% to boost purchases.`;
        recommendedAdjustment = 10;
      } else if (conversionRate < 5) {
        action = 'increase_discount';
        reason = `Low conversion rate (${conversionRate.toFixed(2)}%). Consider increasing discount by 3-5% to improve sales.`;
        recommendedAdjustment = 5;
      } else if (conversionRate > 15) {
        action = 'decrease_discount';
        reason = `Very high conversion rate (${conversionRate.toFixed(2)}%). You may be able to decrease discount by 5% while maintaining sales.`;
        recommendedAdjustment = -5;
      } else if (conversionRate > 10) {
        action = 'decrease_discount';
        reason = `Good conversion rate (${conversionRate.toFixed(2)}%). Consider decreasing discount by 3% to increase margins.`;
        recommendedAdjustment = -3;
      } else {
        action = 'maintain';
        reason = `Healthy conversion rate (${conversionRate.toFixed(2)}%). Current pricing appears optimal.`;
      }
    } else if (data.views > 0) {
      action = 'maintain';
      reason = `Insufficient data (${data.views} views). Collect more data before optimizing.`;
    } else {
      action = 'maintain';
      reason = 'No traffic data available. Focus on marketing and visibility first.';
    }

    return {
      productId: data.productId,
      productName: data.productName,
      sku: data.sku,
      currentPerformance: {
        views: data.views,
        purchases: data.purchases,
        revenue: data.revenue,
        conversionRate: Math.round(conversionRate * 100) / 100,
      },
      suggestion: {
        action,
        reason,
        recommendedAdjustment,
      },
    };
  });
}
