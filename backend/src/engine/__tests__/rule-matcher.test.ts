import { describe, it, expect } from 'vitest';
import { matchesCondition, getMatchingRules } from '../rule-matcher';

describe('matchesCondition', () => {
  it('should match when condition is empty', () => {
    const result = matchesCondition({}, { segment: 'vip' });
    expect(result).toBe(true);
  });

  it('should match when all conditions are met', () => {
    const condition = { segment: 'vip', channel: 'web' };
    const context = { segment: 'vip', channel: 'web' };
    const result = matchesCondition(condition, context);
    expect(result).toBe(true);
  });

  it('should not match when segment differs', () => {
    const condition = { segment: 'vip' };
    const context = { segment: 'regular' };
    const result = matchesCondition(condition, context);
    expect(result).toBe(false);
  });

  it('should not match when channel differs', () => {
    const condition = { channel: 'web' };
    const context = { channel: 'mobile' };
    const result = matchesCondition(condition, context);
    expect(result).toBe(false);
  });

  it('should handle minOrderValue correctly', () => {
    const condition = { minOrderValue: 100 };
    expect(matchesCondition(condition, { orderValue: 150 })).toBe(true);
    expect(matchesCondition(condition, { orderValue: 50 })).toBe(false);
  });

  it('should handle maxOrderValue correctly', () => {
    const condition = { maxOrderValue: 100 };
    expect(matchesCondition(condition, { orderValue: 50 })).toBe(true);
    expect(matchesCondition(condition, { orderValue: 150 })).toBe(false);
  });

  it('should handle combined min and max order values', () => {
    const condition = { minOrderValue: 50, maxOrderValue: 100 };
    expect(matchesCondition(condition, { orderValue: 75 })).toBe(true);
    expect(matchesCondition(condition, { orderValue: 25 })).toBe(false);
    expect(matchesCondition(condition, { orderValue: 125 })).toBe(false);
  });
});

describe('getMatchingRules', () => {
  const mockRules = [
    {
      id: '1',
      conditionJson: { segment: 'vip' },
      priority: 10,
      active: true,
    },
    {
      id: '2',
      conditionJson: { channel: 'web' },
      priority: 20,
      active: true,
    },
    {
      id: '3',
      conditionJson: { segment: 'regular' },
      priority: 5,
      active: true,
    },
    {
      id: '4',
      conditionJson: { segment: 'vip' },
      priority: 15,
      active: false, // Inactive rule
    },
  ];

  it('should return empty array when no rules match', () => {
    const result = getMatchingRules(mockRules, { segment: 'new' });
    expect(result).toHaveLength(0);
  });

  it('should return only matching active rules', () => {
    const result = getMatchingRules(mockRules, { segment: 'vip' });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should return rules sorted by priority (ascending)', () => {
    const result = getMatchingRules(mockRules, { segment: 'vip', channel: 'web' });
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('1'); // priority 10
    expect(result[1].id).toBe('2'); // priority 20
  });

  it('should filter out inactive rules', () => {
    const result = getMatchingRules(mockRules, { segment: 'vip' });
    const hasInactive = result.some((r) => r.id === '4');
    expect(hasInactive).toBe(false);
  });

  it('should handle rules with JSON string conditions', () => {
    const rulesWithStringJson = [
      {
        id: '1',
        conditionJson: JSON.stringify({ segment: 'vip' }),
        priority: 10,
        active: true,
      },
    ];
    const result = getMatchingRules(rulesWithStringJson as any, { segment: 'vip' });
    expect(result).toHaveLength(1);
  });
});
