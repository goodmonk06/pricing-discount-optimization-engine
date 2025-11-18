import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { generateOptimizationSuggestions } from '../engine/optimizer';

export async function analyticsRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient
) {
  // GET /logs - Get price evaluation logs
  fastify.get<{
    Querystring: {
      productId?: string;
      limit?: string;
      offset?: string;
    };
  }>('/logs', async (request, reply) => {
    try {
      const { productId, limit = '100', offset = '0' } = request.query;

      const logs = await prisma.priceEvaluationLog.findMany({
        where: productId ? { productId } : undefined,
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset),
      });

      return reply.code(200).send(logs);
    } catch (error) {
      console.error('Error fetching logs:', error);
      return reply.code(500).send({ error: 'Failed to fetch logs' });
    }
  });

  // GET /optimization-suggestions - Get pricing optimization suggestions
  fastify.get('/optimization-suggestions', async (request, reply) => {
    try {
      // Get recent performance snapshots (last 30 days aggregated)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const snapshots = await prisma.performanceSnapshot.findMany({
        where: {
          date: {
            gte: thirtyDaysAgo,
          },
        },
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
            },
          },
        },
      });

      // Aggregate by product
      const productPerformanceMap = new Map<string, {
        productId: string;
        productName: string;
        sku: string;
        views: number;
        purchases: number;
        revenue: number;
      }>();

      for (const snapshot of snapshots) {
        const existing = productPerformanceMap.get(snapshot.productId);
        if (existing) {
          existing.views += snapshot.views;
          existing.purchases += snapshot.purchases;
          existing.revenue += snapshot.revenue;
        } else {
          productPerformanceMap.set(snapshot.productId, {
            productId: snapshot.productId,
            productName: snapshot.product.name,
            sku: snapshot.product.sku,
            views: snapshot.views,
            purchases: snapshot.purchases,
            revenue: snapshot.revenue,
          });
        }
      }

      const performanceData = Array.from(productPerformanceMap.values());

      // Generate suggestions
      const suggestions = generateOptimizationSuggestions(performanceData);

      return reply.code(200).send({
        period: '30 days',
        generatedAt: new Date().toISOString(),
        suggestions,
      });
    } catch (error) {
      console.error('Error generating optimization suggestions:', error);
      return reply.code(500).send({ error: 'Failed to generate optimization suggestions' });
    }
  });

  // POST /performance-snapshots - Create a performance snapshot (for testing/seeding)
  fastify.post<{
    Body: {
      productId: string;
      date: string;
      views: number;
      purchases: number;
      revenue: number;
    };
  }>('/performance-snapshots', async (request, reply) => {
    const { productId, date, views, purchases, revenue } = request.body;

    if (!productId || !date) {
      return reply.code(400).send({
        error: 'Missing required fields: productId and date are required',
      });
    }

    try {
      const snapshot = await prisma.performanceSnapshot.create({
        data: {
          productId,
          date: new Date(date),
          views: views || 0,
          purchases: purchases || 0,
          revenue: revenue || 0,
        },
      });

      return reply.code(201).send(snapshot);
    } catch (error: any) {
      console.error('Error creating performance snapshot:', error);
      if (error.code === 'P2002') {
        return reply.code(409).send({ error: 'Snapshot for this product and date already exists' });
      }
      if (error.code === 'P2003') {
        return reply.code(404).send({ error: 'Product not found' });
      }
      return reply.code(500).send({ error: 'Failed to create performance snapshot' });
    }
  });
}
