# Pricing Engine Architecture

## Overview

The Pricing & Discount Optimization Engine is a production-ready system designed to handle dynamic pricing with a clean separation between the pricing engine, API layer, and admin interface.

## System Components

### 1. Backend API (Fastify + TypeScript)

#### Pricing Engine Core (`backend/src/engine/`)

**Rule Matcher** (`rule-matcher.ts`)
- Evaluates if a rule's conditions match the given user context
- Supports exact equality matching for all condition fields
- Extensible for custom condition types
- Priority-based rule sorting

**Price Calculator** (`price-calculator.ts`)
- Applies pricing adjustments sequentially
- Supports multiple adjustment types:
  - `percent_off`: Percentage discount
  - `fixed_off`: Fixed amount discount
  - `fixed_price`: Absolute price override
  - `percent_increase`: Percentage markup
- Generates detailed breakdown for transparency
- Rounds to 2 decimal places for currency precision

**Optimizer** (`optimizer.ts`)
- Analyzes performance metrics (views, purchases, revenue)
- Calculates conversion rates
- Generates actionable suggestions based on thresholds:
  - Low conversion (< 5%) → Increase discount
  - Medium conversion (5-10%) → Maintain
  - High conversion (> 10%) → Decrease discount
- Requires minimum 100 views for reliable suggestions

#### API Routes (`backend/src/routes/`)

**Evaluate Route** (`evaluate.ts`)
- Core pricing evaluation endpoint
- Orchestrates: product lookup → rule matching → price calculation → logging
- Returns comprehensive breakdown with applied rules
- Handles errors gracefully (404 for missing products, 400 for validation)

**Products Route** (`products.ts`)
- Standard CRUD operations for products
- Includes related price rules in GET requests
- Validates required fields (sku, name, basePrice)
- Enforces unique SKU constraint

**Price Rules Route** (`price-rules.ts`)
- CRUD operations for pricing rules
- Supports filtering by productId
- Allows toggling active/inactive status
- Validates foreign key relationships

**Analytics Route** (`analytics.ts`)
- Retrieves evaluation logs with pagination
- Aggregates performance snapshots by product
- Generates optimization suggestions on-demand
- Supports creating performance snapshots

#### Data Layer (Prisma)

**Models:**
- `Product`: Core product catalog
- `PriceRule`: Pricing rules with conditions and adjustments
- `PriceEvaluationLog`: Audit trail of all pricing evaluations
- `PerformanceSnapshot`: Daily performance metrics

**Relationships:**
- Product → PriceRule (one-to-many)
- Product → PriceEvaluationLog (one-to-many)
- Product → PerformanceSnapshot (one-to-many)
- All relationships use cascade delete for data integrity

**Indexes:**
- Product: `sku` (unique)
- PriceRule: `productId + active`, `priority`
- PriceEvaluationLog: `productId`, `createdAt`
- PerformanceSnapshot: `productId + date` (unique), `productId`, `date`

### 2. Admin Dashboard (Next.js)

#### Architecture
- **App Router**: Modern Next.js 14 routing
- **Client-Side**: All pages use client-side rendering for interactivity
- **API Integration**: Centralized API client in `lib/api.ts`
- **Styling**: Tailwind CSS with custom component classes

#### Pages

**Home** (`/`)
- Dashboard overview
- Quick start guide
- API example

**Products** (`/products`)
- List view with table
- Create form with validation
- Delete operations
- Real-time updates

**Price Rules** (`/price-rules`)
- Advanced rule creation form
- Condition builder (segment, channel)
- Adjustment type selector
- Priority management
- Active/inactive toggle
- Visual rule display

**Logs** (`/logs`)
- Paginated log table
- Detailed breakdown modal
- Shows applied rules step-by-step
- Displays final price calculation

**Optimization** (`/optimization`)
- Card-based suggestion display
- Performance metrics visualization
- Color-coded recommendations
- Action-specific icons and messaging

## Data Flow

### Price Evaluation Flow

```
1. Client Request
   ↓
2. API Endpoint (/evaluate-price)
   ↓
3. Fetch Product + Active Rules (Prisma)
   ↓
4. Rule Matcher (filter matching rules)
   ↓
5. Price Calculator (apply rules sequentially)
   ↓
6. Log Evaluation (PriceEvaluationLog)
   ↓
7. Return Response (price + breakdown)
```

### Optimization Flow

```
1. Client Request (/optimization-suggestions)
   ↓
2. Fetch Performance Snapshots (last 30 days)
   ↓
3. Aggregate by Product
   ↓
4. Calculate Conversion Rates
   ↓
5. Apply Optimization Rules
   ↓
6. Generate Suggestions
   ↓
7. Return Recommendations
```

## Design Decisions

### 1. Rule Priority System
- **Decision**: Lower number = higher priority
- **Rationale**: Industry standard (nginx, iptables, etc.)
- **Implementation**: Simple ascending sort

### 2. Sequential Rule Application
- **Decision**: Apply rules one after another to cumulative price
- **Rationale**: More flexible than parallel application, easier to understand breakdown
- **Trade-off**: Order matters (vs. commutative operations)

### 3. JSON Storage for Conditions/Adjustments
- **Decision**: Store rules as JSON instead of separate tables
- **Rationale**: Maximum flexibility for custom fields without schema changes
- **Trade-off**: Less query optimization, but simpler architecture

### 4. Separate Evaluation Logs
- **Decision**: Create new log entry per evaluation (no updates)
- **Rationale**: Complete audit trail, time-series analysis, compliance
- **Trade-off**: Higher storage usage, but acceptable for business value

### 5. Client-Side Dashboard
- **Decision**: Use Next.js with client-side rendering
- **Rationale**: Interactive forms, real-time updates, simpler API integration
- **Trade-off**: Initial load time vs. interactivity

### 6. Monorepo Structure
- **Decision**: Backend and frontend in same repository
- **Rationale**: Shared types, coordinated changes, easier development
- **Trade-off**: More complex CI/CD, but manageable with workspaces

## Scalability Considerations

### Current Architecture
- Single backend server
- Direct Prisma → PostgreSQL connection
- Client-side rendered frontend

### Scaling Strategies

**Horizontal Scaling:**
- Add load balancer (nginx, HAProxy)
- Run multiple backend instances
- Use connection pooling (PgBouncer)
- Add Redis for caching evaluation results

**Database Optimization:**
- Add indexes on frequently queried fields
- Partition logs by date for better query performance
- Archive old performance snapshots
- Consider read replicas for analytics

**Performance Optimization:**
- Cache product + rules in memory (with TTL)
- Batch log writes (acceptable slight delay)
- Use CDN for frontend assets
- Implement API rate limiting

**Monitoring:**
- Add structured logging (Winston, Pino)
- Implement request tracing (OpenTelemetry)
- Track key metrics (evaluation latency, rule application time)
- Set up alerts for errors and performance degradation

## Security Considerations

### Current Implementation
- CORS enabled for development
- Environment variables for sensitive data
- Prisma parameterized queries (SQL injection protection)

### Production Recommendations
- Add authentication/authorization (JWT, OAuth)
- Implement rate limiting (express-rate-limit)
- Enable HTTPS only
- Sanitize user inputs
- Add request validation (Zod, Joi)
- Implement audit logging for changes
- Use secrets management (AWS Secrets Manager, Vault)

## Extensibility

### Adding New Condition Types

1. Update `UserContext` type in `types.ts`
2. Add condition handling in `rule-matcher.ts` (if not simple equality)
3. Document in README

Example: Add time-based conditions
```typescript
// types.ts
export interface UserContext {
  // ... existing fields
  currentTime?: string;
}

// rule-matcher.ts
if (key === 'timeRange') {
  const [start, end] = value;
  const current = new Date(context.currentTime);
  if (current < new Date(start) || current > new Date(end)) {
    return false;
  }
  continue;
}
```

### Adding New Adjustment Types

1. Add type to `AdjustmentType` union in `types.ts`
2. Implement calculation in `price-calculator.ts`
3. Update frontend adjustment selector

Example: Add BOGO (Buy One Get One)
```typescript
// types.ts
export type AdjustmentType =
  | "percent_off"
  | "fixed_off"
  | "fixed_price"
  | "percent_increase"
  | "bogo";

// price-calculator.ts
case 'bogo':
  return currentPrice * 0.5; // 50% off for BOGO
```

### Adding New Optimization Strategies

1. Update `optimizer.ts` with new algorithm
2. Add configuration for thresholds
3. Update frontend to display new metrics

Example: Revenue-based optimization
```typescript
const revenuePerView = data.revenue / data.views;
if (revenuePerView < targetRPV) {
  action = 'decrease_discount';
  reason = 'Revenue per view below target. Consider decreasing discount.';
}
```

## Testing Strategy

### Unit Tests (Recommended)
- Engine logic: `rule-matcher.ts`, `price-calculator.ts`, `optimizer.ts`
- Use Jest or Vitest
- Mock Prisma for route tests

### Integration Tests (Recommended)
- API endpoints with test database
- End-to-end price evaluation flows
- Rule priority edge cases

### E2E Tests (Optional)
- Playwright for frontend flows
- Test critical user journeys
- Automated regression testing

## Future Enhancements

1. **Advanced Analytics**
   - A/B testing framework
   - Cohort analysis
   - Revenue forecasting

2. **ML-Based Optimization**
   - Replace rule-based optimizer with ML model
   - Predict optimal pricing
   - Personalized pricing

3. **Real-time Features**
   - WebSocket updates for dashboard
   - Real-time rule testing
   - Live optimization monitoring

4. **Multi-tenancy**
   - Support multiple organizations
   - Isolated data per tenant
   - Role-based access control

5. **Advanced Rules**
   - Time-based rules (scheduled promotions)
   - Quantity-based discounts (volume pricing)
   - Bundling logic
   - Customer lifetime value integration

6. **Integration Capabilities**
   - Webhooks for price changes
   - REST API for external systems
   - Export to BI tools
   - Import from e-commerce platforms
