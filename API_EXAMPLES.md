# API Examples

Complete examples for testing all API endpoints.

## Base URL
```
http://localhost:3001
```

---

## 1. Price Evaluation

### Evaluate Price for VIP Customer on Web
```bash
curl -X POST http://localhost:3001/evaluate-price \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "LAPTOP-PRO-15",
    "userContext": {
      "segment": "vip",
      "channel": "web",
      "userId": "user-123"
    }
  }'
```

**Response:**
```json
{
  "sku": "LAPTOP-PRO-15",
  "productName": "Professional Laptop 15\"",
  "basePrice": 1299.99,
  "finalPrice": 1049.74,
  "currency": "USD",
  "breakdown": {
    "basePrice": 1299.99,
    "appliedRules": [
      {
        "ruleId": "...",
        "ruleName": "VIP Customer Discount",
        "adjustment": { "type": "percent_off", "value": 15 },
        "priceAfter": 1104.99
      },
      {
        "ruleId": "...",
        "ruleName": "Web Channel Promotion",
        "adjustment": { "type": "percent_off", "value": 5 },
        "priceAfter": 1049.74
      }
    ],
    "finalPrice": 1049.74
  }
}
```

### Evaluate Price for New Customer
```bash
curl -X POST http://localhost:3001/evaluate-price \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "HEADPHONE-NC-1",
    "userContext": {
      "segment": "new",
      "channel": "mobile"
    }
  }'
```

### Evaluate Price with No Matching Rules
```bash
curl -X POST http://localhost:3001/evaluate-price \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "MOUSE-WIRELESS-2",
    "userContext": {
      "segment": "regular",
      "channel": "api"
    }
  }'
```

---

## 2. Products

### List All Products
```bash
curl http://localhost:3001/products
```

### Get Single Product
```bash
curl http://localhost:3001/products/{PRODUCT_ID}
```

### Create Product
```bash
curl -X POST http://localhost:3001/products \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "MONITOR-4K-27",
    "name": "4K Monitor 27 inch",
    "basePrice": 599.99,
    "currency": "USD",
    "metaJson": {
      "category": "Electronics",
      "brand": "ViewMax",
      "specs": {
        "resolution": "3840x2160",
        "refreshRate": "144Hz",
        "panelType": "IPS"
      }
    }
  }'
```

### Update Product
```bash
curl -X PUT http://localhost:3001/products/{PRODUCT_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "basePrice": 549.99,
    "metaJson": {
      "category": "Electronics",
      "brand": "ViewMax",
      "onSale": true
    }
  }'
```

### Delete Product
```bash
curl -X DELETE http://localhost:3001/products/{PRODUCT_ID}
```

---

## 3. Price Rules

### List All Price Rules
```bash
curl http://localhost:3001/price-rules
```

### List Rules for Specific Product
```bash
curl http://localhost:3001/price-rules?productId={PRODUCT_ID}
```

### Get Single Price Rule
```bash
curl http://localhost:3001/price-rules/{RULE_ID}
```

### Create Percentage Discount Rule
```bash
curl -X POST http://localhost:3001/price-rules \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "{PRODUCT_ID}",
    "name": "Premium Customer Discount",
    "conditionJson": {
      "segment": "premium"
    },
    "adjustmentJson": {
      "type": "percent_off",
      "value": 20
    },
    "priority": 10,
    "active": true
  }'
```

### Create Fixed Amount Off Rule
```bash
curl -X POST http://localhost:3001/price-rules \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "{PRODUCT_ID}",
    "name": "Early Bird Special",
    "conditionJson": {
      "channel": "web"
    },
    "adjustmentJson": {
      "type": "fixed_off",
      "value": 50
    },
    "priority": 5,
    "active": true
  }'
```

### Create Fixed Price Rule
```bash
curl -X POST http://localhost:3001/price-rules \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "{PRODUCT_ID}",
    "name": "Clearance Sale",
    "conditionJson": {},
    "adjustmentJson": {
      "type": "fixed_price",
      "value": 99.99
    },
    "priority": 1,
    "active": true
  }'
```

### Create Multi-Condition Rule
```bash
curl -X POST http://localhost:3001/price-rules \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "{PRODUCT_ID}",
    "name": "VIP Mobile App Exclusive",
    "conditionJson": {
      "segment": "vip",
      "channel": "mobile"
    },
    "adjustmentJson": {
      "type": "percent_off",
      "value": 25
    },
    "priority": 5,
    "active": true
  }'
```

### Update Price Rule
```bash
curl -X PUT http://localhost:3001/price-rules/{RULE_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "active": false,
    "priority": 20
  }'
```

### Toggle Rule Active Status
```bash
curl -X PUT http://localhost:3001/price-rules/{RULE_ID} \
  -H "Content-Type: application/json" \
  -d '{
    "active": true
  }'
```

### Delete Price Rule
```bash
curl -X DELETE http://localhost:3001/price-rules/{RULE_ID}
```

---

## 4. Analytics & Logs

### Get Evaluation Logs
```bash
curl http://localhost:3001/logs
```

### Get Logs with Pagination
```bash
curl http://localhost:3001/logs?limit=50&offset=0
```

### Get Logs for Specific Product
```bash
curl http://localhost:3001/logs?productId={PRODUCT_ID}
```

---

## 5. Optimization

### Get Optimization Suggestions
```bash
curl http://localhost:3001/optimization-suggestions
```

**Response:**
```json
{
  "period": "30 days",
  "generatedAt": "2024-01-15T10:30:00Z",
  "suggestions": [
    {
      "productId": "...",
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

### Create Performance Snapshot
```bash
curl -X POST http://localhost:3001/performance-snapshots \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "{PRODUCT_ID}",
    "date": "2024-01-15",
    "views": 1500,
    "purchases": 120,
    "revenue": 14400
  }'
```

---

## 6. Health Check

### Check API Health
```bash
curl http://localhost:3001/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Testing Scenarios

### Scenario 1: Stacking Discounts
Test multiple rules applying to the same product.

**Setup:**
1. Create product with $1000 base price
2. Add Rule 1: VIP 20% off (priority 10)
3. Add Rule 2: Web 10% off (priority 20)

**Test:**
```bash
curl -X POST http://localhost:3001/evaluate-price \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "YOUR_SKU",
    "userContext": {
      "segment": "vip",
      "channel": "web"
    }
  }'
```

**Expected Result:**
- Base: $1000
- After Rule 1 (20% off): $800
- After Rule 2 (10% off): $720
- Final: $720

### Scenario 2: Priority Matters
Test that rule order affects final price.

**Setup:**
1. Create product with $100 base price
2. Add Rule A: 50% off (priority 20)
3. Add Rule B: $10 off (priority 10)

**Expected with priority 10 → 20:**
- Base: $100
- After Rule B ($10 off): $90
- After Rule A (50% off): $45
- Final: $45

**If swapped (priority 20 → 10):**
- Base: $100
- After Rule A (50% off): $50
- After Rule B ($10 off): $40
- Final: $40

### Scenario 3: No Matching Rules
```bash
curl -X POST http://localhost:3001/evaluate-price \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "LAPTOP-PRO-15",
    "userContext": {
      "segment": "enterprise",
      "channel": "b2b"
    }
  }'
```

**Expected:** Base price with no discounts applied.

### Scenario 4: Error Handling

**Non-existent SKU:**
```bash
curl -X POST http://localhost:3001/evaluate-price \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "DOES-NOT-EXIST",
    "userContext": {}
  }'
```

**Expected:** 404 error with message.

**Missing required fields:**
```bash
curl -X POST http://localhost:3001/evaluate-price \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "LAPTOP-PRO-15"
  }'
```

**Expected:** 400 error for missing userContext.

---

## Using with JavaScript/TypeScript

### Fetch API Example
```typescript
async function evaluatePrice(sku: string, userContext: any) {
  const response = await fetch('http://localhost:3001/evaluate-price', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      sku,
      userContext,
    }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return await response.json();
}

// Usage
const result = await evaluatePrice('LAPTOP-PRO-15', {
  segment: 'vip',
  channel: 'web',
  userId: 'user-123',
});

console.log(`Final price: $${result.finalPrice}`);
```

### Axios Example
```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3001',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Evaluate price
const { data } = await api.post('/evaluate-price', {
  sku: 'LAPTOP-PRO-15',
  userContext: {
    segment: 'vip',
    channel: 'web',
  },
});

console.log(data.finalPrice);
```

---

## Response Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Successful evaluation, GET requests |
| 201 | Created | Product/rule created successfully |
| 204 | No Content | Successful deletion |
| 400 | Bad Request | Missing required fields |
| 404 | Not Found | Product or rule not found |
| 409 | Conflict | Duplicate SKU, unique constraint violation |
| 500 | Server Error | Database error, unexpected failure |

---

## Tips

1. **Use UUIDs from responses**: After creating products/rules, save the returned `id` for future requests

2. **Test rule priority**: Create rules with different priorities and verify the order matters

3. **Monitor logs**: Check `/logs` endpoint to see how your rules are being applied

4. **Performance data**: Add snapshots regularly to get accurate optimization suggestions

5. **Condition matching**: Empty `conditionJson: {}` matches all contexts

6. **Rule stacking**: Rules apply sequentially, each building on the previous price
