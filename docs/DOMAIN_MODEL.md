# Domain Model

## Overview

The Pricing & Discount Optimization Engine uses a rich domain model to support complex pricing scenarios across e-commerce, SaaS, and marketplace platforms.

## Core Entities

### Product
Represents items in the catalog that can be priced.

**Fields:**
- `id`: Unique identifier
- `sku`: Stock keeping unit (unique)
- `name`: Product name
- `description`: Product description
- `basePrice`: Starting price before discounts
- `currency`: Currency code (USD, EUR, etc.)
- `categoryId`: Link to ProductCategory
- `regionId`: Link to GeographicRegion
- `status`: active | inactive | archived
- `tags`: Array of tags for flexible categorization
- `metaJson`: Additional metadata

**Relationships:**
- Belongs to one ProductCategory (optional)
- Belongs to one GeographicRegion (optional)
- Has many PriceRules
- Has many PriceEvaluationLogs
- Has many PerformanceSnapshots
- Has many PriceHistories
- Part of many BundleRules

### PriceRule
Defines conditional pricing adjustments.

**Fields:**
- `productId`: Link to Product (optional - can apply to category)
- `categoryId`: Link to ProductCategory (optional)
- `campaignId`: Link to Campaign (optional)
- `abTestVariantId`: Link to ABTestVariant (optional)
- `name`: Rule name
- `description`: Rule description
- `conditionJson`: Conditions for rule application
- `adjustmentJson`: Price adjustment to apply
- `priority`: Execution order (lower = higher priority)
- `active`: Enabler/disable flag
- `validFrom`: Start date (optional)
- `validUntil`: End date (optional)

**Condition Examples:**
```json
{
  "segment": "vip",
  "channel": "web",
  "minOrderValue": 100
}
```

**Adjustment Examples:**
```json
{ "type": "percent_off", "value": 15 }
{ "type": "fixed_off", "value": 10 }
{ "type": "fixed_price", "value": 99.99 }
```

### ProductCategory
Hierarchical organization of products.

**Fields:**
- `name`: Category name
- `slug`: URL-friendly identifier
- `description`: Category description
- `parentId`: Link to parent category (for hierarchy)
- `metaJson`: Additional metadata

**Features:**
- Supports unlimited nesting levels
- Category-level price rules
- Bulk operations by category

### Campaign
Promotional campaigns with time bounds.

**Fields:**
- `name`: Campaign name
- `description`: Campaign description
- `status`: draft | scheduled | active | paused | ended
- `startDate`: Campaign start
- `endDate`: Campaign end
- `budget`: Campaign budget (optional)
- `targetJson`: Target metrics and audience
- `metaJson`: Additional metadata

**Relationships:**
- Has many PriceRules
- Has many CampaignPerformances

**Lifecycle:**
Draft → Scheduled → Active → Paused/Ended

### CustomerSegment
First-class customer segmentation.

**Fields:**
- `name`: Segment name (unique)
- `description`: Segment description
- `criteriaJson`: Auto-assignment criteria
- `priority`: For overlapping segments
- `active`: Enable/disable flag
- `metaJson`: Additional metadata

**Relationships:**
- Has many SegmentMemberships

**Example Criteria:**
```json
{
  "lifetimeValue": { "min": 1000 },
  "purchaseCount": { "min": 5 },
  "tags": ["vip", "loyal"]
}
```

### ABTest
A/B testing for pricing strategies.

**Fields:**
- `name`: Test name
- `description`: Test description
- `hypothesis`: What you're testing
- `status`: draft | running | paused | completed
- `startDate`: Test start
- `endDate`: Test end
- `trafficSplit`: Percentage split (e.g., 50/50)
- `metricGoal`: conversion_rate | revenue | avg_order_value

**Relationships:**
- Has many ABTestVariants (typically 2-3)
- Each variant has PriceRules and ABTestResults

**Workflow:**
1. Create test with hypothesis
2. Define variants (Control, Variant A, B, etc.)
3. Assign price rules to each variant
4. Launch test with traffic split
5. Monitor results
6. Declare winner and implement

### GeographicRegion
Location-based pricing and tax management.

**Fields:**
- `name`: Region name
- `code`: Region code (e.g., "US-CA")
- `countryCode`: Country code (ISO)
- `currency`: Default currency
- `taxRate`: Tax percentage
- `priceMultiplier`: Regional pricing adjustment
- `active`: Enable/disable flag

**Use Cases:**
- International pricing
- State/province-specific taxes
- Regional promotions
- Currency management

### BundleRule
Product bundling and quantity discounts.

**Fields:**
- `name`: Bundle name
- `description`: Bundle description
- `bundleType`: fixed_bundle | bogo | quantity_discount
- `discountType`: percent_off | fixed_off | fixed_price
- `discountValue`: Discount amount
- `minQuantity`: Minimum quantity required
- `active`: Enable/disable flag
- `validFrom`: Start date (optional)
- `validUntil`: End date (optional)

**Bundle Types:**
- **fixed_bundle**: Buy specific products together
- **bogo**: Buy one get one (or variants)
- **quantity_discount**: Volume pricing

### PriceHistory
Audit trail of price changes.

**Fields:**
- `productId`: Link to Product
- `oldPrice`: Previous price
- `newPrice`: New price
- `reason`: manual | rule_change | campaign | optimization
- `changedBy`: User ID or system identifier
- `ruleId`: Related rule (if applicable)
- `metaJson`: Additional context

**Use Cases:**
- Compliance and auditing
- Price trend analysis
- Rollback support
- Regulatory reporting

## Supporting Entities

### PerformanceSnapshot
Daily performance metrics per product.

**Fields:**
- `productId`: Link to Product
- `date`: Snapshot date
- `views`: Page views
- `purchases`: Purchase count
- `revenue`: Total revenue

### PriceEvaluationLog
Log of pricing evaluations.

**Fields:**
- `productId`: Link to Product
- `inputContextJson`: Input data
- `finalPrice`: Calculated price
- `breakdownJson`: Rule application details
- `createdAt`: Timestamp

### CampaignPerformance
Daily metrics per campaign.

**Fields:**
- `campaignId`: Link to Campaign
- `date`: Snapshot date
- `views`, `clicks`, `purchases`: Engagement metrics
- `revenue`, `cost`: Financial metrics

### ABTestResult
Daily results per test variant.

**Fields:**
- `variantId`: Link to ABTestVariant
- `date`: Result date
- `views`, `conversions`: Test metrics
- `revenue`: Revenue generated

### SegmentMembership
Customer-to-segment assignments.

**Fields:**
- `segmentId`: Link to CustomerSegment
- `customerId`: Customer identifier
- `assignedAt`: Assignment timestamp
- `expiresAt`: Expiration (optional)
- `metaJson`: Additional data

### BundleProduct
Products included in a bundle.

**Fields:**
- `bundleId`: Link to BundleRule
- `productId`: Link to Product
- `quantity`: Required quantity
- `required`: Must be included flag

## Entity Relationship Diagram

```
Product
  ├─→ ProductCategory (parent)
  ├─→ GeographicRegion
  ├─→ PriceRule (many)
  ├─→ PriceHistory (many)
  ├─→ PriceEvaluationLog (many)
  ├─→ PerformanceSnapshot (many)
  └─→ BundleProduct (many)

Campaign
  ├─→ PriceRule (many)
  └─→ CampaignPerformance (many)

CustomerSegment
  └─→ SegmentMembership (many)

ABTest
  └─→ ABTestVariant (many)
        ├─→ PriceRule (many)
        └─→ ABTestResult (many)

BundleRule
  └─→ BundleProduct (many)
        └─→ Product
```

## Business Rules

### Price Evaluation Order
1. Find product and base price
2. Apply region multiplier (if applicable)
3. Find matching price rules
4. Sort rules by priority (ascending)
5. Apply rules sequentially
6. Round to 2 decimal places
7. Log evaluation

### Rule Matching Priority
When multiple rules could apply:
1. Campaign rules (if campaign active)
2. A/B test variant rules (if test running)
3. Product-specific rules
4. Category rules
5. Global rules

### Segment Assignment
1. Fetch customer data
2. Evaluate all active segments
3. Apply segment criteria
4. Select highest priority matching segment
5. Create membership record
6. Trigger segment events

### Campaign Lifecycle
- **Draft**: Editable, not active
- **Scheduled**: Waiting for start date
- **Active**: Currently running
- **Paused**: Temporarily stopped
- **Ended**: Completed or terminated

### A/B Test Validity
- Must have at least 2 variants
- Traffic split must sum to 100%
- Only one control variant allowed
- Minimum run duration recommended: 7 days
- Minimum sample size: 100 conversions per variant
