# Quick Start Guide

Get the Pricing Engine running in 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL installed OR Docker installed

## Option 1: Quick Start with Docker (Recommended)

### Step 1: Start PostgreSQL
```bash
docker-compose up -d
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Setup Database
```bash
# Run migrations
npm run db:migrate

# Seed with sample data
npm run db:seed
```

### Step 4: Start Development Servers
```bash
npm run dev
```

**Done!** Open:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001

## Option 2: With Local PostgreSQL

### Step 1: Create Database
```bash
createdb pricing_engine
```

### Step 2: Install Dependencies
```bash
npm install
```

### Step 3: Configure Environment
Edit `backend/.env` if your PostgreSQL credentials differ:
```env
DATABASE_URL="postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/pricing_engine?schema=public"
```

### Step 4: Setup Database
```bash
npm run db:migrate
npm run db:seed
```

### Step 5: Start Development
```bash
npm run dev
```

## Test the System

### 1. View the Admin Dashboard
Open http://localhost:3000 and explore:
- Products page - see 4 seeded products
- Price Rules page - see 7 pricing rules
- Logs page - see evaluation history
- Optimization page - see AI suggestions

### 2. Test the API

Try evaluating a price:

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

Expected response:
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

### 3. Try Different Scenarios

**New customer on mobile:**
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
Expected: 20% off (new customer discount)

**VIP customer buying mouse:**
```bash
curl -X POST http://localhost:3001/evaluate-price \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "MOUSE-WIRELESS-2",
    "userContext": {
      "segment": "vip",
      "channel": "web"
    }
  }'
```
Expected: $10 off (fixed discount)

## Understanding Seeded Data

### Products
1. **Laptop** (LAPTOP-PRO-15) - $1,299.99
2. **Headphones** (HEADPHONE-NC-1) - $299.99
3. **Mouse** (MOUSE-WIRELESS-2) - $49.99
4. **Keyboard** (KEYBOARD-MECH-1) - $149.99

### Price Rules
- Laptop: VIP 15% off + Web 5% off
- Headphones: New 20% off OR Mobile 10% off
- Mouse: VIP $10 off
- Keyboard: Regular 10% off

### Performance Data
- 30 days of simulated data
- Keyboard has low conversion (2%) → optimization suggests increasing discount
- Mouse has high conversion (15%) → optimization suggests decreasing discount
- Laptop has good conversion (8%) → maintain current pricing

## Next Steps

1. **Create Your Own Product**
   - Go to http://localhost:3000/products
   - Click "Add Product"
   - Fill in details

2. **Add Custom Pricing Rules**
   - Go to http://localhost:3000/price-rules
   - Click "Add Rule"
   - Set conditions (segment, channel)
   - Choose adjustment type

3. **Monitor Performance**
   - Check http://localhost:3000/logs for evaluations
   - View http://localhost:3000/optimization for suggestions

4. **Integrate with Your App**
   - Use POST /evaluate-price in your checkout flow
   - Pass user context (segment, channel, etc.)
   - Display the returned finalPrice

## Troubleshooting

### Port Already in Use
If port 3001 or 3000 is in use:
```bash
# Backend
PORT=3002 npm run dev:backend

# Frontend (update .env.local)
NEXT_PUBLIC_API_URL=http://localhost:3002
npm run dev:frontend
```

### Database Connection Failed
Check PostgreSQL is running:
```bash
# Docker
docker ps

# Local
pg_isready
```

Verify DATABASE_URL in `backend/.env`

### "Cannot find module" Errors
Reinstall dependencies:
```bash
rm -rf node_modules backend/node_modules frontend/node_modules
npm install
```

### Migration Errors
Reset database:
```bash
# Drop and recreate
dropdb pricing_engine
createdb pricing_engine
npm run db:migrate
npm run db:seed
```

## Development Tips

### View Database with Prisma Studio
```bash
npm run db:studio
```
Opens a GUI at http://localhost:5555

### Run Only Backend
```bash
npm run dev:backend
```

### Run Only Frontend
```bash
npm run dev:frontend
```

### Check Logs
Backend logs appear in terminal with detailed request/response info

## Production Deployment

See [README.md](README.md) for production deployment instructions.

## Learn More

- [README.md](README.md) - Full documentation
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and design decisions
- Backend code: `backend/src/`
- Frontend code: `frontend/app/`
