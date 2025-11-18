# Pricing & Discount Optimization Engine

A powerful pricing engine that enables dynamic pricing based on user context, with built-in optimization recommendations powered by performance analytics.

## Features

- **Dynamic Price Evaluation**: Calculate prices based on user segments, channels, and custom conditions
- **Flexible Rule System**: Stack multiple pricing rules with priority-based ordering
- **Comprehensive Logging**: Track all price evaluations with detailed breakdowns
- **AI-Powered Optimization**: Get data-driven suggestions to improve pricing strategy
- **Admin Dashboard**: Full-featured Next.js UI for managing products, rules, and analytics
- **Production-Ready API**: Built with Fastify, TypeScript, Prisma, and PostgreSQL

## Architecture

```
pricing-discount-optimization-engine/
├── backend/              # Fastify API server
│   ├── src/
│   │   ├── engine/      # Core pricing logic
│   │   ├── routes/      # API endpoints
│   │   └── types.ts     # TypeScript types
│   └── prisma/
│       ├── schema.prisma
│       └── seed.ts
├── frontend/            # Next.js admin dashboard
│   ├── app/            # App router pages
│   └── lib/            # API client
└── package.json        # Workspace configuration
```

## Quick Start

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd pricing-discount-optimization-engine
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the database**

   Create a PostgreSQL database:
   ```bash
   createdb pricing_engine
   ```

4. **Configure environment variables**

   Backend (`backend/.env`):
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pricing_engine?schema=public"
   PORT=3001
   HOST=0.0.0.0
   ```

5. **Run database migrations**
   ```bash
   npm run db:migrate
   ```

6. **Seed the database with sample data**
   ```bash
   npm run db:seed
   ```

7. **Start the development servers**
   ```bash
   npm run dev
   ```

   This starts:
   - Backend API: http://localhost:3001
   - Frontend Dashboard: http://localhost:3000

## API Documentation

### Base URL
```
http://localhost:3001
```

### Endpoints

#### 1. Evaluate Price (Core Feature)

**POST** `/evaluate-price`

Calculate the final price for a product based on user context and active pricing rules.

**Request Body:**
```json
{
  "sku": "LAPTOP-PRO-15",
  "userContext": {
    "segment": "vip",
    "channel": "web",
    "userId": "user-123"
  },
  "channel": "web",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

**Response:**
```json
{
  "sku": "LAPTOP-PRO-15",
  "productName": "Professional Laptop 15\"",
  "basePrice": 1299.99,
  "finalPrice": 1109.49,
  "currency": "USD",
  "breakdown": {
    "basePrice": 1299.99,
    "appliedRules": [
      {
        "ruleId": "rule-123",
        "ruleName": "VIP Customer Discount",
        "adjustment": { "type": "percent_off", "value": 15 },
        "priceAfter": 1104.99
      },
      {
        "ruleId": "rule-456",
        "ruleName": "Web Channel Promotion",
        "adjustment": { "type": "percent_off", "value": 5 },
        "priceAfter": 1049.74
      }
    ],
    "finalPrice": 1049.74
  }
}
```

#### 2. Products

**GET** `/products` - List all products
**GET** `/products/:id` - Get single product
**POST** `/products` - Create product
**PUT** `/products/:id` - Update product
**DELETE** `/products/:id` - Delete product

**Create Product Example:**
```json
{
  "sku": "PRODUCT-SKU-1",
  "name": "Product Name",
  "basePrice": 99.99,
  "currency": "USD",
  "metaJson": {
    "category": "Electronics",
    "brand": "BrandName"
  }
}
```

#### 3. Price Rules

**GET** `/price-rules?productId=xxx` - List price rules (optionally filter by product)
**GET** `/price-rules/:id` - Get single price rule
**POST** `/price-rules` - Create price rule
**PUT** `/price-rules/:id` - Update price rule
**DELETE** `/price-rules/:id` - Delete price rule

**Create Price Rule Example:**
```json
{
  "productId": "product-123",
  "name": "VIP Customer Discount",
  "conditionJson": {
    "segment": "vip",
    "channel": "web"
  },
  "adjustmentJson": {
    "type": "percent_off",
    "value": 15
  },
  "priority": 10,
  "active": true
}
```

#### 4. Analytics & Optimization

**GET** `/logs?productId=xxx&limit=100&offset=0` - Get price evaluation logs
**GET** `/optimization-suggestions` - Get pricing optimization suggestions
**POST** `/performance-snapshots` - Create performance snapshot

**Optimization Response Example:**
```json
{
  "period": "30 days",
  "generatedAt": "2024-01-15T10:30:00Z",
  "suggestions": [
    {
      "productId": "product-123",
      "productName": "Mechanical Gaming Keyboard",
      "sku": "KEYBOARD-MECH-1",
      "currentPerformance": {
        "views": 9000,
        "purchases": 180,
        "revenue": 24300,
        "conversionRate": 2.0
      },
      "suggestion": {
        "action": "increase_discount",
        "reason": "Very low conversion rate (2.00%). Consider increasing discount by 5-10% to boost purchases.",
        "recommendedAdjustment": 10
      }
    }
  ]
}
```

## Domain Model

### Product
- `id`: Unique identifier
- `sku`: Stock keeping unit (unique)
- `name`: Product name
- `basePrice`: Base price before any discounts
- `currency`: Currency code (default: USD)
- `metaJson`: Additional metadata (flexible JSON)

### PriceRule
- `id`: Unique identifier
- `productId`: Associated product
- `name`: Rule name
- `conditionJson`: Matching conditions (e.g., `{ "segment": "vip", "channel": "web" }`)
- `adjustmentJson`: Price adjustment (e.g., `{ "type": "percent_off", "value": 10 }`)
- `priority`: Execution order (lower = higher priority)
- `active`: Enable/disable rule

### PriceEvaluationLog
- `id`: Unique identifier
- `productId`: Associated product
- `inputContextJson`: Input data used for evaluation
- `finalPrice`: Calculated final price
- `breakdownJson`: Detailed breakdown of applied rules
- `createdAt`: Timestamp

### PerformanceSnapshot
- `id`: Unique identifier
- `productId`: Associated product
- `date`: Snapshot date
- `views`: Number of product views
- `purchases`: Number of purchases
- `revenue`: Total revenue
- `createdAt`: Timestamp

## Condition & Adjustment Types

### Condition Fields
Conditions are matched using exact equality. Empty conditions match all requests.

- `segment`: User segment (e.g., "vip", "regular", "new")
- `channel`: Sales channel (e.g., "web", "mobile", "api")
- `region`: Geographic region
- `minOrderValue`: Minimum order value
- `maxOrderValue`: Maximum order value
- Custom fields: Add any additional fields as needed

**Example:**
```json
{
  "segment": "vip",
  "channel": "web"
}
```

### Adjustment Types

1. **percent_off**: Percentage discount
   ```json
   { "type": "percent_off", "value": 15 }
   ```
   Effect: 15% off the current price

2. **fixed_off**: Fixed amount discount
   ```json
   { "type": "fixed_off", "value": 50 }
   ```
   Effect: $50 off the current price

3. **fixed_price**: Set absolute price
   ```json
   { "type": "fixed_price", "value": 999.99 }
   ```
   Effect: Set price to exactly $999.99

4. **percent_increase**: Percentage increase
   ```json
   { "type": "percent_increase", "value": 20 }
   ```
   Effect: 20% increase on current price

## How Pricing Rules Work

1. **Rule Matching**: All active rules for a product are evaluated against the user context
2. **Priority Ordering**: Matching rules are sorted by priority (lower number = higher priority)
3. **Sequential Application**: Rules are applied one after another to the price
4. **Breakdown Generation**: Each step is logged for transparency

**Example Flow:**

```
Base Price: $1299.99

Rule 1 (Priority 10): VIP Discount -15%
  → $1299.99 × 0.85 = $1104.99

Rule 2 (Priority 20): Web Channel -5%
  → $1104.99 × 0.95 = $1049.74

Final Price: $1049.74
```

## Optimization Algorithm

The system analyzes performance data and suggests pricing changes based on conversion rates:

| Conversion Rate | Action | Reasoning |
|----------------|--------|-----------|
| < 2% | Increase discount 10% | Very low conversion - price may be too high |
| 2-5% | Increase discount 5% | Low conversion - modest discount increase |
| 5-10% | Maintain | Healthy conversion - optimal pricing |
| 10-15% | Decrease discount 3% | Good conversion - opportunity to improve margins |
| > 15% | Decrease discount 5% | Very high conversion - likely underpriced |

Minimum data threshold: 100 views for reliable suggestions

## Admin Dashboard

The Next.js dashboard provides a complete management interface:

### Products Page (`/products`)
- View all products
- Create new products
- Delete products
- See product details

### Price Rules Page (`/price-rules`)
- View all pricing rules
- Create complex rules with conditions and adjustments
- Toggle rules active/inactive
- Set rule priorities
- Delete rules

### Logs Page (`/logs`)
- View all price evaluations
- See detailed breakdowns
- Filter by product
- Track rule application history

### Optimization Page (`/optimization`)
- View AI-powered suggestions
- See performance metrics (views, purchases, revenue, conversion)
- Get specific recommended adjustments
- Understand reasoning behind suggestions

## Development

### Available Scripts

```bash
# Install all dependencies
npm install

# Start both backend and frontend in dev mode
npm run dev

# Start backend only
npm run dev:backend

# Start frontend only
npm run dev:frontend

# Build for production
npm run build

# Database operations
npm run db:migrate    # Run Prisma migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio (DB GUI)
```

### Adding Custom Condition Types

1. Add the field to your `UserContext` in `backend/src/types.ts`
2. Update the condition matching logic in `backend/src/engine/rule-matcher.ts` if needed
3. Custom fields work automatically with equality matching

### Adding Custom Adjustment Types

1. Add the type to `AdjustmentType` in `backend/src/types.ts`
2. Implement the calculation logic in `backend/src/engine/price-calculator.ts`

## Testing the System

### 1. Using the API

Test price evaluation with curl:

```bash
curl -X POST http://localhost:3001/evaluate-price \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "LAPTOP-PRO-15",
    "userContext": {
      "segment": "vip",
      "channel": "web"
    }
  }'
```

### 2. Using the Dashboard

1. Navigate to http://localhost:3000
2. Go to Products and verify seeded data
3. Go to Price Rules and see active rules
4. Go to Logs to see evaluation history
5. Go to Optimization to see suggestions

### 3. Sample Test Scenarios

The seeded data includes:

- **Laptop** (LAPTOP-PRO-15): VIP (15% off) + Web (5% off)
- **Headphones** (HEADPHONE-NC-1): New customer (20% off) OR Mobile (10% off)
- **Mouse** (MOUSE-WIRELESS-2): VIP ($10 off)
- **Keyboard** (KEYBOARD-MECH-1): Regular customer (10% off)

Try different combinations:
```json
// VIP customer on web → both discounts stack
{ "segment": "vip", "channel": "web" }

// New customer on mobile → new customer discount only
{ "segment": "new", "channel": "mobile" }

// Regular customer → limited discounts
{ "segment": "regular", "channel": "web" }
```

## Production Deployment

### Backend

1. Set `DATABASE_URL` to production PostgreSQL
2. Run migrations: `npm run db:migrate`
3. Build: `npm run build --workspace=backend`
4. Start: `npm run start --workspace=backend`

### Frontend

1. Set `NEXT_PUBLIC_API_URL` to production API URL
2. Build: `npm run build --workspace=frontend`
3. Start: `npm run start --workspace=frontend`

### Environment Variables

**Backend (.env):**
```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
PORT=3001
HOST=0.0.0.0
NODE_ENV=production
```

**Frontend (.env.production):**
```env
NEXT_PUBLIC_API_URL=https://api.yourcompany.com
```

## Extensibility

The engine is designed to be easily extended:

### Adding New Rule Types
- Extend `conditionJson` schema for new matching criteria
- Extend `adjustmentJson` for new pricing strategies

### Adding Performance Metrics
- Add fields to `PerformanceSnapshot` model
- Update optimization algorithm in `backend/src/engine/optimizer.ts`

### Integrating with External Systems
- Use webhooks on price evaluations
- Connect to analytics platforms via logs
- Sync products from e-commerce platforms

## License

MIT

## Support

For issues and questions:
- Check the API documentation above
- Review sample seed data in `backend/prisma/seed.ts`
- Examine test scenarios in the seeded database
