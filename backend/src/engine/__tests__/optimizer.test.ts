import { describe, it, expect } from 'vitest';
import { generateOptimizationSuggestions } from '../optimizer';

describe('generateOptimizationSuggestions', () => {
  it('should suggest increase discount for very low conversion rate', () => {
    const data = [
      {
        productId: '1',
        productName: 'Product A',
        sku: 'SKU-A',
        views: 1000,
        purchases: 10, // 1% conversion
        revenue: 1000,
      },
    ];

    const suggestions = generateOptimizationSuggestions(data);
    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].suggestion.action).toBe('increase_discount');
    expect(suggestions[0].suggestion.recommendedAdjustment).toBe(10);
  });

  it('should suggest increase discount for low conversion rate (2-5%)', () => {
    const data = [
      {
        productId: '1',
        productName: 'Product A',
        sku: 'SKU-A',
        views: 1000,
        purchases: 40, // 4% conversion
        revenue: 4000,
      },
    ];

    const suggestions = generateOptimizationSuggestions(data);
    expect(suggestions[0].suggestion.action).toBe('increase_discount');
    expect(suggestions[0].suggestion.recommendedAdjustment).toBe(5);
  });

  it('should suggest maintain for medium conversion rate', () => {
    const data = [
      {
        productId: '1',
        productName: 'Product A',
        sku: 'SKU-A',
        views: 1000,
        purchases: 75, // 7.5% conversion
        revenue: 7500,
      },
    ];

    const suggestions = generateOptimizationSuggestions(data);
    expect(suggestions[0].suggestion.action).toBe('maintain');
    expect(suggestions[0].suggestion.recommendedAdjustment).toBeUndefined();
  });

  it('should suggest decrease discount for good conversion rate (10-15%)', () => {
    const data = [
      {
        productId: '1',
        productName: 'Product A',
        sku: 'SKU-A',
        views: 1000,
        purchases: 120, // 12% conversion
        revenue: 12000,
      },
    ];

    const suggestions = generateOptimizationSuggestions(data);
    expect(suggestions[0].suggestion.action).toBe('decrease_discount');
    expect(suggestions[0].suggestion.recommendedAdjustment).toBe(-3);
  });

  it('should suggest decrease discount for very high conversion rate', () => {
    const data = [
      {
        productId: '1',
        productName: 'Product A',
        sku: 'SKU-A',
        views: 1000,
        purchases: 200, // 20% conversion
        revenue: 20000,
      },
    ];

    const suggestions = generateOptimizationSuggestions(data);
    expect(suggestions[0].suggestion.action).toBe('decrease_discount');
    expect(suggestions[0].suggestion.recommendedAdjustment).toBe(-5);
  });

  it('should suggest maintain for insufficient data', () => {
    const data = [
      {
        productId: '1',
        productName: 'Product A',
        sku: 'SKU-A',
        views: 50, // Less than 100 views
        purchases: 5,
        revenue: 500,
      },
    ];

    const suggestions = generateOptimizationSuggestions(data);
    expect(suggestions[0].suggestion.action).toBe('maintain');
    expect(suggestions[0].suggestion.reason).toContain('Insufficient data');
  });

  it('should handle zero views', () => {
    const data = [
      {
        productId: '1',
        productName: 'Product A',
        sku: 'SKU-A',
        views: 0,
        purchases: 0,
        revenue: 0,
      },
    ];

    const suggestions = generateOptimizationSuggestions(data);
    expect(suggestions[0].suggestion.action).toBe('maintain');
    expect(suggestions[0].currentPerformance.conversionRate).toBe(0);
  });

  it('should calculate conversion rate correctly', () => {
    const data = [
      {
        productId: '1',
        productName: 'Product A',
        sku: 'SKU-A',
        views: 1000,
        purchases: 123,
        revenue: 12300,
      },
    ];

    const suggestions = generateOptimizationSuggestions(data);
    expect(suggestions[0].currentPerformance.conversionRate).toBe(12.3);
  });

  it('should handle multiple products', () => {
    const data = [
      {
        productId: '1',
        productName: 'Product A',
        sku: 'SKU-A',
        views: 1000,
        purchases: 10,
        revenue: 1000,
      },
      {
        productId: '2',
        productName: 'Product B',
        sku: 'SKU-B',
        views: 1000,
        purchases: 150,
        revenue: 15000,
      },
    ];

    const suggestions = generateOptimizationSuggestions(data);
    expect(suggestions).toHaveLength(2);
    expect(suggestions[0].suggestion.action).toBe('increase_discount');
    expect(suggestions[1].suggestion.action).toBe('decrease_discount');
  });
});
