#!/usr/bin/env node

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const commands = {
  async products() {
    const products = await prisma.product.findMany();
    console.table(products.map((p) => ({
      SKU: p.sku,
      Name: p.name,
      'Base Price': `$${p.basePrice}`,
      Status: p.status,
    })));
  },

  async campaigns() {
    const campaigns = await prisma.campaign.findMany();
    console.table(campaigns.map((c) => ({
      Name: c.name,
      Status: c.status,
      Start: c.startDate?.toISOString().split('T')[0] || 'N/A',
      End: c.endDate?.toISOString().split('T')[0] || 'N/A',
    })));
  },

  async segments() {
    const segments = await prisma.customerSegment.findMany({
      include: {
        _count: {
          select: {
            memberships: true,
          },
        },
      },
    });
    console.table(segments.map((s) => ({
      Name: s.name,
      Priority: s.priority,
      Active: s.active ? 'Yes' : 'No',
      Members: s._count.memberships,
    })));
  },

  async 'activate-campaign'(name: string) {
    const campaign = await prisma.campaign.findFirst({
      where: { name },
    });

    if (!campaign) {
      console.error(`Campaign "${name}" not found`);
      process.exit(1);
    }

    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { status: 'active' },
    });

    console.log(`✓ Campaign "${name}" activated`);
  },

  async 'create-product'(sku: string, name: string, price: string) {
    const product = await prisma.product.create({
      data: {
        sku,
        name,
        basePrice: parseFloat(price),
      },
    });

    console.log(`✓ Product created: ${product.sku} - ${product.name} ($${product.basePrice})`);
  },

  async stats() {
    const [productCount, campaignCount, segmentCount, ruleCount] = await Promise.all([
      prisma.product.count(),
      prisma.campaign.count(),
      prisma.customerSegment.count(),
      prisma.priceRule.count(),
    ]);

    console.log('\n📊 System Statistics');
    console.log('─'.repeat(50));
    console.log(`Products:         ${productCount}`);
    console.log(`Campaigns:        ${campaignCount}`);
    console.log(`Customer Segments: ${segmentCount}`);
    console.log(`Price Rules:      ${ruleCount}`);
    console.log('─'.repeat(50) + '\n');
  },

  help() {
    console.log(`
Pricing Engine CLI

Usage: pricing-cli <command> [args]

Commands:
  products                    List all products
  campaigns                   List all campaigns
  segments                    List all customer segments
  stats                       Show system statistics

  activate-campaign <name>    Activate a campaign
  create-product <sku> <name> <price>  Create a product

  help                        Show this help message

Examples:
  pricing-cli products
  pricing-cli activate-campaign "Black Friday"
  pricing-cli create-product SKU-123 "New Product" 99.99
`);
  },
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'help';

  if (!(command in commands)) {
    console.error(`Unknown command: ${command}\n`);
    commands.help();
    process.exit(1);
  }

  try {
    await (commands as any)[command](...args.slice(1));
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
