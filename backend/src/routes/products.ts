import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { CreateProductSchema, UpdateProductSchema } from '../validation/schemas';
import { validateBody, validateParams } from '../lib/validation';
import { NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { metrics } from '../lib/metrics';

const IdParamSchema = z.object({
  id: z.string().min(1),
});

export async function productRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient
) {
  // GET /products - List all products
  fastify.get('/products', async (request, reply) => {
    logger.debug('Fetching all products');
    const products = await prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    metrics.recordCounter('products.list', 1);
    return reply.code(200).send(products);
  });

  // GET /products/:id - Get single product
  fastify.get(
    '/products/:id',
    {
      preHandler: validateParams(IdParamSchema),
    },
    async (request, reply) => {
      const { id } = request.validatedParams;

      const product = await prisma.product.findUnique({
        where: { id },
        include: {
          priceRules: true,
        },
      });

      if (!product) {
        throw new NotFoundError('Product', id);
      }

      return reply.code(200).send(product);
    }
  );

  // POST /products - Create product
  fastify.post(
    '/products',
    {
      preHandler: validateBody(CreateProductSchema),
    },
    async (request, reply) => {
      const data = request.validatedBody;

      logger.info({ sku: data.sku }, 'Creating product');

      const product = await prisma.product.create({
        data,
      });

      metrics.recordCounter('products.created', 1);
      return reply.code(201).send(product);
    }
  );

  // PUT /products/:id - Update product
  fastify.put(
    '/products/:id',
    {
      preHandler: [
        validateParams(IdParamSchema),
        validateBody(UpdateProductSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.validatedParams;
      const data = request.validatedBody;

      logger.info({ id }, 'Updating product');

      const product = await prisma.product.update({
        where: { id },
        data,
      });

      metrics.recordCounter('products.updated', 1);
      return reply.code(200).send(product);
    }
  );

  // DELETE /products/:id - Delete product
  fastify.delete(
    '/products/:id',
    {
      preHandler: validateParams(IdParamSchema),
    },
    async (request, reply) => {
      const { id } = request.validatedParams;

      logger.info({ id }, 'Deleting product');

      await prisma.product.delete({
        where: { id },
      });

      metrics.recordCounter('products.deleted', 1);
      return reply.code(204).send();
    }
  );
}
