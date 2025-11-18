import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.performanceSnapshot.deleteMany();
  await prisma.priceEvaluationLog.deleteMany();
  await prisma.priceRule.deleteMany();
  await prisma.product.deleteMany();

  console.log('Cleared existing data');

  // Create products
  const laptop = await prisma.product.create({
    data: {
      sku: 'LAPTOP-PRO-15',
      name: 'Professional Laptop 15"',
      basePrice: 1299.99,
      currency: 'USD',
      metaJson: {
        category: 'Electronics',
        brand: 'TechCorp',
        specs: {
          ram: '16GB',
          storage: '512GB SSD',
          processor: 'Intel i7',
        },
      },
    },
  });

  const headphones = await prisma.product.create({
    data: {
      sku: 'HEADPHONE-NC-1',
      name: 'Noise Cancelling Headphones',
      basePrice: 299.99,
      currency: 'USD',
      metaJson: {
        category: 'Electronics',
        brand: 'AudioMax',
        specs: {
          wireless: true,
          noiseCancelling: true,
          batteryLife: '30 hours',
        },
      },
    },
  });

  const mouse = await prisma.product.create({
    data: {
      sku: 'MOUSE-WIRELESS-2',
      name: 'Ergonomic Wireless Mouse',
      basePrice: 49.99,
      currency: 'USD',
      metaJson: {
        category: 'Accessories',
        brand: 'TechCorp',
        specs: {
          wireless: true,
          dpi: '4000',
          ergonomic: true,
        },
      },
    },
  });

  const keyboard = await prisma.product.create({
    data: {
      sku: 'KEYBOARD-MECH-1',
      name: 'Mechanical Gaming Keyboard',
      basePrice: 149.99,
      currency: 'USD',
      metaJson: {
        category: 'Accessories',
        brand: 'GameGear',
        specs: {
          mechanical: true,
          rgb: true,
          switches: 'Cherry MX Red',
        },
      },
    },
  });

  console.log('Created 4 products');

  // Create price rules

  // VIP customer discount on laptop
  await prisma.priceRule.create({
    data: {
      productId: laptop.id,
      name: 'VIP Customer Discount',
      conditionJson: { segment: 'vip' },
      adjustmentJson: { type: 'percent_off', value: 15 },
      priority: 10,
      active: true,
    },
  });

  // Web channel discount on laptop
  await prisma.priceRule.create({
    data: {
      productId: laptop.id,
      name: 'Web Channel Promotion',
      conditionJson: { channel: 'web' },
      adjustmentJson: { type: 'percent_off', value: 5 },
      priority: 20,
      active: true,
    },
  });

  // New customer discount on headphones
  await prisma.priceRule.create({
    data: {
      productId: headphones.id,
      name: 'New Customer Welcome',
      conditionJson: { segment: 'new' },
      adjustmentJson: { type: 'percent_off', value: 20 },
      priority: 10,
      active: true,
    },
  });

  // Mobile app exclusive discount on headphones
  await prisma.priceRule.create({
    data: {
      productId: headphones.id,
      name: 'Mobile App Exclusive',
      conditionJson: { channel: 'mobile' },
      adjustmentJson: { type: 'percent_off', value: 10 },
      priority: 15,
      active: true,
    },
  });

  // Bundle discount for mouse
  await prisma.priceRule.create({
    data: {
      productId: mouse.id,
      name: 'Bundle Discount',
      conditionJson: { segment: 'vip' },
      adjustmentJson: { type: 'fixed_off', value: 10 },
      priority: 10,
      active: true,
    },
  });

  // Flash sale on keyboard (inactive example)
  await prisma.priceRule.create({
    data: {
      productId: keyboard.id,
      name: 'Flash Sale (Ended)',
      conditionJson: { channel: 'web' },
      adjustmentJson: { type: 'percent_off', value: 25 },
      priority: 5,
      active: false,
    },
  });

  // Active keyboard discount for regular customers
  await prisma.priceRule.create({
    data: {
      productId: keyboard.id,
      name: 'Regular Customer Discount',
      conditionJson: { segment: 'regular' },
      adjustmentJson: { type: 'percent_off', value: 10 },
      priority: 10,
      active: true,
    },
  });

  console.log('Created 7 price rules');

  // Create performance snapshots for the last 30 days
  const today = new Date();
  const daysToGenerate = 30;

  for (let i = 0; i < daysToGenerate; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    date.setHours(0, 0, 0, 0);

    // Laptop: Good performance (8% conversion)
    await prisma.performanceSnapshot.create({
      data: {
        productId: laptop.id,
        date,
        views: 150 + Math.floor(Math.random() * 50),
        purchases: 12 + Math.floor(Math.random() * 4),
        revenue: (12 + Math.floor(Math.random() * 4)) * 1100, // Average after discounts
      },
    });

    // Headphones: High conversion but low views
    await prisma.performanceSnapshot.create({
      data: {
        productId: headphones.id,
        date,
        views: 80 + Math.floor(Math.random() * 20),
        purchases: 10 + Math.floor(Math.random() * 3),
        revenue: (10 + Math.floor(Math.random() * 3)) * 240,
      },
    });

    // Mouse: Very high conversion (15%)
    await prisma.performanceSnapshot.create({
      data: {
        productId: mouse.id,
        date,
        views: 200 + Math.floor(Math.random() * 100),
        purchases: 35 + Math.floor(Math.random() * 10),
        revenue: (35 + Math.floor(Math.random() * 10)) * 45,
      },
    });

    // Keyboard: Low conversion (2%) - needs discount increase
    await prisma.performanceSnapshot.create({
      data: {
        productId: keyboard.id,
        date,
        views: 300 + Math.floor(Math.random() * 100),
        purchases: 6 + Math.floor(Math.random() * 3),
        revenue: (6 + Math.floor(Math.random() * 3)) * 135,
      },
    });
  }

  console.log(`Created ${daysToGenerate * 4} performance snapshots`);

  // Create some sample evaluation logs
  const contexts = [
    { segment: 'vip', channel: 'web' },
    { segment: 'new', channel: 'mobile' },
    { segment: 'regular', channel: 'web' },
    { segment: 'vip', channel: 'api' },
  ];

  for (const product of [laptop, headphones, mouse, keyboard]) {
    for (const context of contexts) {
      // This would normally be done through the API, but we'll create directly for seeding
      const rules = await prisma.priceRule.findMany({
        where: {
          productId: product.id,
          active: true,
        },
        orderBy: { priority: 'asc' },
      });

      // Simple price calculation for seed data
      let finalPrice = product.basePrice;
      const appliedRules = [];

      for (const rule of rules) {
        const condition = rule.conditionJson as any;
        const adjustment = rule.adjustmentJson as any;

        // Simple matching
        let matches = true;
        if (condition.segment && condition.segment !== context.segment) matches = false;
        if (condition.channel && condition.channel !== context.channel) matches = false;

        if (matches) {
          if (adjustment.type === 'percent_off') {
            finalPrice = finalPrice * (1 - adjustment.value / 100);
          } else if (adjustment.type === 'fixed_off') {
            finalPrice = Math.max(0, finalPrice - adjustment.value);
          }

          appliedRules.push({
            ruleId: rule.id,
            ruleName: rule.name,
            adjustment,
            priceAfter: finalPrice,
          });
        }
      }

      await prisma.priceEvaluationLog.create({
        data: {
          productId: product.id,
          inputContextJson: {
            sku: product.sku,
            userContext: context,
            timestamp: new Date().toISOString(),
          },
          finalPrice: Math.round(finalPrice * 100) / 100,
          breakdownJson: {
            basePrice: product.basePrice,
            appliedRules,
            finalPrice: Math.round(finalPrice * 100) / 100,
          },
        },
      });
    }
  }

  console.log('Created sample evaluation logs');
  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
