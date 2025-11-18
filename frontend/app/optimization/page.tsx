'use client';

import { useState, useEffect } from 'react';
import { fetchOptimizationSuggestions } from '@/lib/api';

export default function OptimizationPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSuggestions();
  }, []);

  async function loadSuggestions() {
    try {
      const result = await fetchOptimizationSuggestions();
      setData(result);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      alert('Failed to load optimization suggestions');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const actionColors = {
    increase_discount: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    decrease_discount: 'bg-green-100 text-green-800 border-green-300',
    maintain: 'bg-blue-100 text-blue-800 border-blue-300',
  };

  const actionIcons = {
    increase_discount: '📉',
    decrease_discount: '📈',
    maintain: '✓',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Pricing Optimization Suggestions
        </h1>
        <p className="text-gray-600 mt-1">
          AI-powered recommendations based on {data?.period || '30 days'} of
          performance data
        </p>
        {data?.generatedAt && (
          <p className="text-sm text-gray-500 mt-1">
            Generated: {new Date(data.generatedAt).toLocaleString()}
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {!data?.suggestions || data.suggestions.length === 0 ? (
          <div className="card">
            <p className="text-gray-500 text-center py-8">
              No optimization suggestions available. Add performance snapshots to
              get recommendations.
            </p>
          </div>
        ) : (
          data.suggestions.map((suggestion: any) => (
            <div
              key={suggestion.productId}
              className={`card border-2 ${
                actionColors[suggestion.suggestion.action]
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">
                      {actionIcons[suggestion.suggestion.action]}
                    </span>
                    <div>
                      <h3 className="text-lg font-semibold">
                        {suggestion.productName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        SKU: {suggestion.sku}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 my-4 p-4 bg-white bg-opacity-50 rounded">
                    <div>
                      <div className="text-xs text-gray-600 uppercase">
                        Views
                      </div>
                      <div className="text-xl font-semibold">
                        {suggestion.currentPerformance.views.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 uppercase">
                        Purchases
                      </div>
                      <div className="text-xl font-semibold">
                        {suggestion.currentPerformance.purchases.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 uppercase">
                        Revenue
                      </div>
                      <div className="text-xl font-semibold">
                        $
                        {suggestion.currentPerformance.revenue.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-600 uppercase">
                        Conversion
                      </div>
                      <div className="text-xl font-semibold">
                        {suggestion.currentPerformance.conversionRate}%
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">Recommendation:</span>
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-white">
                        {suggestion.suggestion.action
                          .replace('_', ' ')
                          .toUpperCase()}
                      </span>
                    </div>

                    <p className="text-gray-700">
                      {suggestion.suggestion.reason}
                    </p>

                    {suggestion.suggestion.recommendedAdjustment && (
                      <div className="mt-2 p-3 bg-white rounded border border-gray-200">
                        <span className="font-medium">
                          Suggested adjustment:{' '}
                        </span>
                        <span className="font-mono text-lg">
                          {suggestion.suggestion.recommendedAdjustment > 0
                            ? '+'
                            : ''}
                          {suggestion.suggestion.recommendedAdjustment}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="card bg-gray-50">
        <h2 className="text-lg font-semibold mb-2">How It Works</h2>
        <ul className="space-y-1 text-sm text-gray-700">
          <li>
            • <strong>High views + Low conversion (&lt;5%)</strong> → Increase
            discount to improve sales
          </li>
          <li>
            • <strong>Good conversion (5-10%)</strong> → Current pricing is
            optimal
          </li>
          <li>
            • <strong>Very high conversion (&gt;10%)</strong> → Consider
            decreasing discount to improve margins
          </li>
          <li>
            • <strong>Insufficient data (&lt;100 views)</strong> → Collect more
            data before optimizing
          </li>
        </ul>
      </div>
    </div>
  );
}
