export default function Home() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Pricing & Discount Optimization Engine
        </h1>
        <p className="mt-2 text-gray-600">
          Manage products, configure dynamic pricing rules, and optimize discounts based on performance data.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-2">Products</h2>
          <p className="text-gray-600 mb-4">
            Manage your product catalog with base prices and metadata.
          </p>
          <a href="/products" className="btn btn-primary">
            Manage Products →
          </a>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-2">Price Rules</h2>
          <p className="text-gray-600 mb-4">
            Configure dynamic pricing rules based on user segments and channels.
          </p>
          <a href="/price-rules" className="btn btn-primary">
            Manage Rules →
          </a>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-2">Evaluation Logs</h2>
          <p className="text-gray-600 mb-4">
            View pricing evaluation history and breakdown details.
          </p>
          <a href="/logs" className="btn btn-primary">
            View Logs →
          </a>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-2">Optimization</h2>
          <p className="text-gray-600 mb-4">
            Get AI-powered suggestions to optimize your pricing strategy.
          </p>
          <a href="/optimization" className="btn btn-primary">
            View Suggestions →
          </a>
        </div>
      </div>

      <div className="card bg-blue-50 border border-blue-200">
        <h2 className="text-xl font-semibold mb-2 text-blue-900">
          Quick Start
        </h2>
        <ul className="space-y-2 text-blue-800">
          <li>✓ Create products with base prices</li>
          <li>✓ Define price rules with conditions (segment, channel) and adjustments (percent_off, fixed_off)</li>
          <li>✓ Test pricing with the /evaluate-price API endpoint</li>
          <li>✓ Monitor performance and get optimization suggestions</li>
        </ul>
      </div>

      <div className="card">
        <h3 className="text-lg font-semibold mb-3">Example API Request</h3>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`POST http://localhost:3001/evaluate-price

{
  "sku": "LAPTOP-PRO-15",
  "userContext": {
    "segment": "vip",
    "channel": "web"
  }
}`}
        </pre>
      </div>
    </div>
  );
}
