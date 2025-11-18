import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

export async function priceRuleRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient
) {
  // GET /price-rules - List all price rules (optionally filter by productId)
  fastify.get<{
    Querystring: { productId?: string };
  }>('/price-rules', async (request, reply) => {
    try {
      const { productId } = request.query;

      const rules = await prisma.priceRule.findMany({
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
        orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
      });

      return reply.code(200).send(rules);
    } catch (error) {
      console.error('Error fetching price rules:', error);
      return reply.code(500).send({ error: 'Failed to fetch price rules' });
    }
  });

  // GET /price-rules/:id - Get single price rule
  fastify.get<{ Params: { id: string } }>('/price-rules/:id', async (request, reply) => {
    try {
      const rule = await prisma.priceRule.findUnique({
        where: { id: request.params.id },
        include: {
          product: true,
        },
      });

      if (!rule) {
        return reply.code(404).send({ error: 'Price rule not found' });
      }

      return reply.code(200).send(rule);
    } catch (error) {
      console.error('Error fetching price rule:', error);
      return reply.code(500).send({ error: 'Failed to fetch price rule' });
    }
  });

  // POST /price-rules - Create price rule
  fastify.post<{
    Body: {
      productId: string;
      name: string;
      conditionJson: any;
      adjustmentJson: any;
      priority?: number;
      active?: boolean;
    };
  }>('/price-rules', async (request, reply) => {
    const { productId, name, conditionJson, adjustmentJson, priority, active } = request.body;

    if (!productId || !name || !conditionJson || !adjustmentJson) {
      return reply.code(400).send({
        error: 'Missing required fields: productId, name, conditionJson, and adjustmentJson are required',
      });
    }

    try {
      const rule = await prisma.priceRule.create({
        data: {
          productId,
          name,
          conditionJson,
          adjustmentJson,
          priority: priority ?? 0,
          active: active ?? true,
        },
        include: {
          product: true,
        },
      });

      return reply.code(201).send(rule);
    } catch (error: any) {
      console.error('Error creating price rule:', error);
      if (error.code === 'P2003') {
        return reply.code(404).send({ error: 'Product not found' });
      }
      return reply.code(500).send({ error: 'Failed to create price rule' });
    }
  });

  // PUT /price-rules/:id - Update price rule
  fastify.put<{
    Params: { id: string };
    Body: {
      name?: string;
      conditionJson?: any;
      adjustmentJson?: any;
      priority?: number;
      active?: boolean;
    };
  }>('/price-rules/:id', async (request, reply) => {
    try {
      const rule = await prisma.priceRule.update({
        where: { id: request.params.id },
        data: request.body,
        include: {
          product: true,
        },
      });

      return reply.code(200).send(rule);
    } catch (error: any) {
      console.error('Error updating price rule:', error);
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Price rule not found' });
      }
      return reply.code(500).send({ error: 'Failed to update price rule' });
    }
  });

  // DELETE /price-rules/:id - Delete price rule
  fastify.delete<{ Params: { id: string } }>('/price-rules/:id', async (request, reply) => {
    try {
      await prisma.priceRule.delete({
        where: { id: request.params.id },
      });

      return reply.code(204).send();
    } catch (error: any) {
      console.error('Error deleting price rule:', error);
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Price rule not found' });
      }
      return reply.code(500).send({ error: 'Failed to delete price rule' });
    }
  });
}
