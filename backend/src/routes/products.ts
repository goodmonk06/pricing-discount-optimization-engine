import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';

export async function productRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient
) {
  // GET /products - List all products
  fastify.get('/products', async (request, reply) => {
    try {
      const products = await prisma.product.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return reply.code(200).send(products);
    } catch (error) {
      console.error('Error fetching products:', error);
      return reply.code(500).send({ error: 'Failed to fetch products' });
    }
  });

  // GET /products/:id - Get single product
  fastify.get<{ Params: { id: string } }>('/products/:id', async (request, reply) => {
    try {
      const product = await prisma.product.findUnique({
        where: { id: request.params.id },
        include: {
          priceRules: true,
        },
      });

      if (!product) {
        return reply.code(404).send({ error: 'Product not found' });
      }

      return reply.code(200).send(product);
    } catch (error) {
      console.error('Error fetching product:', error);
      return reply.code(500).send({ error: 'Failed to fetch product' });
    }
  });

  // POST /products - Create product
  fastify.post<{
    Body: {
      sku: string;
      name: string;
      basePrice: number;
      currency?: string;
      metaJson?: any;
    };
  }>('/products', async (request, reply) => {
    const { sku, name, basePrice, currency, metaJson } = request.body;

    if (!sku || !name || basePrice === undefined) {
      return reply.code(400).send({
        error: 'Missing required fields: sku, name, and basePrice are required',
      });
    }

    try {
      const product = await prisma.product.create({
        data: {
          sku,
          name,
          basePrice,
          currency: currency || 'USD',
          metaJson,
        },
      });

      return reply.code(201).send(product);
    } catch (error: any) {
      console.error('Error creating product:', error);
      if (error.code === 'P2002') {
        return reply.code(409).send({ error: 'Product with this SKU already exists' });
      }
      return reply.code(500).send({ error: 'Failed to create product' });
    }
  });

  // PUT /products/:id - Update product
  fastify.put<{
    Params: { id: string };
    Body: {
      sku?: string;
      name?: string;
      basePrice?: number;
      currency?: string;
      metaJson?: any;
    };
  }>('/products/:id', async (request, reply) => {
    try {
      const product = await prisma.product.update({
        where: { id: request.params.id },
        data: request.body,
      });

      return reply.code(200).send(product);
    } catch (error: any) {
      console.error('Error updating product:', error);
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Product not found' });
      }
      return reply.code(500).send({ error: 'Failed to update product' });
    }
  });

  // DELETE /products/:id - Delete product
  fastify.delete<{ Params: { id: string } }>('/products/:id', async (request, reply) => {
    try {
      await prisma.product.delete({
        where: { id: request.params.id },
      });

      return reply.code(204).send();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      if (error.code === 'P2025') {
        return reply.code(404).send({ error: 'Product not found' });
      }
      return reply.code(500).send({ error: 'Failed to delete product' });
    }
  });
}
