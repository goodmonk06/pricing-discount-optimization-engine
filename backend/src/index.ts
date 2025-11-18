import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { evaluateRoutes } from './routes/evaluate';
import { productRoutes } from './routes/products';
import { priceRuleRoutes } from './routes/price-rules';
import { analyticsRoutes } from './routes/analytics';
import { campaignRoutes } from './routes/campaigns';
import { segmentRoutes } from './routes/segments';
import { errorHandler } from './lib/errors';
import { logger } from './lib/logger';
import { eventBus } from './lib/events';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

const prisma = new PrismaClient();
const fastify = Fastify({
  logger,
  disableRequestLogging: false,
});

async function start() {
  try {
    // Register error handler
    fastify.setErrorHandler(errorHandler);

    // Register CORS
    await fastify.register(cors, {
      origin: process.env.CORS_ORIGIN || true,
    });

    // Health check
    fastify.get('/health', async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    });

    // Metrics endpoint (for monitoring)
    fastify.get('/metrics', async () => {
      const { metrics } = await import('./lib/metrics');
      return metrics.getSummary();
    });

    // Register routes
    await evaluateRoutes(fastify, prisma);
    await productRoutes(fastify, prisma);
    await priceRuleRoutes(fastify, prisma);
    await analyticsRoutes(fastify, prisma);
    await campaignRoutes(fastify, prisma);
    await segmentRoutes(fastify, prisma);

    // Events endpoint (for debugging)
    fastify.get('/events/recent', async () => {
      return eventBus.getRecentEvents(50);
    });

    // Start server
    await fastify.listen({ port: PORT, host: HOST });
    logger.info(`Server running at http://${HOST}:${PORT}`);
  } catch (error) {
    logger.error(error, 'Failed to start server');
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  await fastify.close();
  await prisma.$disconnect();
  process.exit(0);
});

start();
