'use client';

import { useState, useEffect } from 'react';
import {
  fetchPriceRules,
  fetchProducts,
  createPriceRule,
  updatePriceRule,
  deletePriceRule,
} from '@/lib/api';

export default function PriceRulesPage() {
  const [rules, setRules] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    productId: '',
    name: '',
    priority: '0',
    active: true,
    conditionSegment: '',
    conditionChannel: '',
    adjustmentType: 'percent_off',
    adjustmentValue: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [rulesData, productsData] = await Promise.all([
        fetchPriceRules(),
        fetchProducts(),
      ]);
      setRules(rulesData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const conditionJson: any = {};
    if (formData.conditionSegment)
      conditionJson.segment = formData.conditionSegment;
    if (formData.conditionChannel)
      conditionJson.channel = formData.conditionChannel;

    const adjustmentJson = {
      type: formData.adjustmentType,
      value: parseFloat(formData.adjustmentValue),
    };

    try {
      await createPriceRule({
        productId: formData.productId,
        name: formData.name,
        priority: parseInt(formData.priority),
        active: formData.active,
        conditionJson,
        adjustmentJson,
      });

      setFormData({
        productId: '',
        name: '',
        priority: '0',
        active: true,
        conditionSegment: '',
        conditionChannel: '',
        adjustmentType: 'percent_off',
        adjustmentValue: '',
      });
      setShowForm(false);
      loadData();
    } catch (error: any) {
      console.error('Error creating price rule:', error);
      alert(error.message || 'Failed to create price rule');
    }
  }

  async function handleToggleActive(id: string, currentActive: boolean) {
    try {
      await updatePriceRule(id, { active: !currentActive });
      loadData();
    } catch (error) {
      console.error('Error updating price rule:', error);
      alert('Failed to update price rule');
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      await deletePriceRule(id);
      loadData();
    } catch (error) {
      console.error('Error deleting price rule:', error);
      alert('Failed to delete price rule');
    }
  }

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Price Rules</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn btn-primary"
        >
          {showForm ? 'Cancel' : '+ Add Rule'}
        </button>
      </div>

      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Create New Price Rule</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Product</label>
                <select
                  className="input"
                  value={formData.productId}
                  onChange={(e) =>
                    setFormData({ ...formData, productId: e.target.value })
                  }
                  required
                >
                  <option value="">Select a product</option>
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Rule Name</label>
                <input
                  type="text"
                  className="input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Conditions (leave empty to match all)</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Segment</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., vip, regular, new"
                    value={formData.conditionSegment}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conditionSegment: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <label className="label">Channel</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g., web, mobile, api"
                    value={formData.conditionChannel}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        conditionChannel: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-medium mb-2">Adjustment</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Type</label>
                  <select
                    className="input"
                    value={formData.adjustmentType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        adjustmentType: e.target.value,
                      })
                    }
                  >
                    <option value="percent_off">Percent Off</option>
                    <option value="fixed_off">Fixed Amount Off</option>
                    <option value="fixed_price">Fixed Price</option>
                    <option value="percent_increase">Percent Increase</option>
                  </select>
                </div>
                <div>
                  <label className="label">Value</label>
                  <input
                    type="number"
                    step="0.01"
                    className="input"
                    value={formData.adjustmentValue}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        adjustmentValue: e.target.value,
                      })
                    }
                    required
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Priority (lower = higher priority)</label>
                <input
                  type="number"
                  className="input"
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={formData.active}
                    onChange={(e) =>
                      setFormData({ ...formData, active: e.target.checked })
                    }
                  />
                  <span className="text-sm font-medium">Active</span>
                </label>
              </div>
            </div>

            <button type="submit" className="btn btn-primary">
              Create Price Rule
            </button>
          </form>
        </div>
      )}

      <div className="card">
        {rules.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No price rules yet. Create your first rule to get started.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Rule Name</th>
                  <th>Conditions</th>
                  <th>Adjustment</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="font-medium">{rule.product.name}</td>
                    <td>{rule.name}</td>
                    <td className="text-sm">
                      {Object.keys(rule.conditionJson).length === 0 ? (
                        <span className="text-gray-400">All</span>
                      ) : (
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {JSON.stringify(rule.conditionJson)}
                        </code>
                      )}
                    </td>
                    <td className="text-sm">
                      <code className="bg-blue-100 px-2 py-1 rounded text-xs">
                        {rule.adjustmentJson.type}: {rule.adjustmentJson.value}
                      </code>
                    </td>
                    <td>{rule.priority}</td>
                    <td>
                      <button
                        onClick={() => handleToggleActive(rule.id, rule.active)}
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          rule.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {rule.active ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td>
                      <button
                        onClick={() => handleDelete(rule.id, rule.name)}
                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
