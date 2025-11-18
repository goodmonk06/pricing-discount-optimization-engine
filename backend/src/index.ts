import Fastify from 'fastify';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { evaluateRoutes } from './routes/evaluate';
import { productRoutes } from './routes/products';
import { priceRuleRoutes } from './routes/price-rules';
import { analyticsRoutes } from './routes/analytics';

const PORT = parseInt(process.env.PORT || '3001');
const HOST = process.env.HOST || '0.0.0.0';

const prisma = new PrismaClient();
const fastify = Fastify({
  logger: true,
});

async function start() {
  try {
    // Register CORS
    await fastify.register(cors, {
      origin: true, // Allow all origins in development
    });

    // Health check
    fastify.get('/health', async () => {
      return { status: 'ok', timestamp: new Date().toISOString() };
    });

    // Register routes
    await evaluateRoutes(fastify, prisma);
    await productRoutes(fastify, prisma);
    await priceRuleRoutes(fastify, prisma);
    await analyticsRoutes(fastify, prisma);

    // Start server
    await fastify.listen({ port: PORT, host: HOST });
    console.log(`Server running at http://${HOST}:${PORT}`);
  } catch (error) {
    fastify.log.error(error);
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
