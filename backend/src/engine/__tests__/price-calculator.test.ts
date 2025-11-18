import { describe, it, expect } from 'vitest';
import { applyAdjustment, calculatePrice } from '../price-calculator';

describe('applyAdjustment', () => {
  it('should apply percent_off correctly', () => {
    const result = applyAdjustment(100, { type: 'percent_off', value: 20 });
    expect(result).toBe(80);
  });

  it('should apply fixed_off correctly', () => {
    const result = applyAdjustment(100, { type: 'fixed_off', value: 25 });
    expect(result).toBe(75);
  });

  it('should not go below zero for fixed_off', () => {
    const result = applyAdjustment(100, { type: 'fixed_off', value: 150 });
    expect(result).toBe(0);
  });

  it('should apply fixed_price correctly', () => {
    const result = applyAdjustment(100, { type: 'fixed_price', value: 50 });
    expect(result).toBe(50);
  });

  it('should apply percent_increase correctly', () => {
    const result = applyAdjustment(100, { type: 'percent_increase', value: 10 });
    expect(result).toBe(110);
  });

  it('should return original price for unknown adjustment type', () => {
    const result = applyAdjustment(100, { type: 'unknown' as any, value: 10 });
    expect(result).toBe(100);
  });
});

describe('calculatePrice', () => {
  const mockRules = [
    {
      id: '1',
      name: 'VIP Discount',
      adjustmentJson: { type: 'percent_off', value: 20 },
    },
    {
      id: '2',
      name: 'Web Channel Discount',
      adjustmentJson: { type: 'percent_off', value: 10 },
    },
  ];

  it('should return base price when no rules', () => {
    const result = calculatePrice(100, []);
    expect(result.basePrice).toBe(100);
    expect(result.finalPrice).toBe(100);
    expect(result.appliedRules).toHaveLength(0);
  });

  it('should apply single rule correctly', () => {
    const result = calculatePrice(100, [mockRules[0]] as any);
    expect(result.basePrice).toBe(100);
    expect(result.finalPrice).toBe(80);
    expect(result.appliedRules).toHaveLength(1);
    expect(result.appliedRules[0].priceAfter).toBe(80);
  });

  it('should apply multiple rules sequentially', () => {
    const result = calculatePrice(100, mockRules as any);
    expect(result.basePrice).toBe(100);
    // First rule: 100 * 0.8 = 80
    // Second rule: 80 * 0.9 = 72
    expect(result.finalPrice).toBe(72);
    expect(result.appliedRules).toHaveLength(2);
  });

  it('should round final price to 2 decimal places', () => {
    const rules = [
      {
        id: '1',
        name: 'Odd Discount',
        adjustmentJson: { type: 'percent_off', value: 33.33 },
      },
    ];
    const result = calculatePrice(100, rules as any);
    // 100 * (1 - 0.3333) = 66.67
    expect(result.finalPrice).toBe(66.67);
  });

  it('should handle fixed_off followed by percent_off', () => {
    const rules = [
      {
        id: '1',
        name: 'Fixed Discount',
        adjustmentJson: { type: 'fixed_off', value: 20 },
      },
      {
        id: '2',
        name: 'Percent Discount',
        adjustmentJson: { type: 'percent_off', value: 10 },
      },
    ];
    const result = calculatePrice(100, rules as any);
    // First: 100 - 20 = 80
    // Second: 80 * 0.9 = 72
    expect(result.finalPrice).toBe(72);
  });

  it('should track price after each rule', () => {
    const result = calculatePrice(100, mockRules as any);
    expect(result.appliedRules[0].priceAfter).toBe(80);
    expect(result.appliedRules[1].priceAfter).toBe(72);
  });

  it('should handle JSON string adjustments', () => {
    const rules = [
      {
        id: '1',
        name: 'Test',
        adjustmentJson: JSON.stringify({ type: 'percent_off', value: 20 }),
      },
    ];
    const result = calculatePrice(100, rules as any);
    expect(result.finalPrice).toBe(80);
  });
});
