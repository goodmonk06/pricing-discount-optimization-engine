import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PriceEvaluationRequest, PriceEvaluationResponse } from '../types';
import { getMatchingRules } from '../engine/rule-matcher';
import { calculatePrice } from '../engine/price-calculator';

export async function evaluateRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient
) {
  // POST /evaluate-price - Main pricing evaluation endpoint
  fastify.post<{ Body: PriceEvaluationRequest }>('/evaluate-price', async (request, reply) => {
    const { sku, userContext, channel, timestamp } = request.body;

    // Validate request
    if (!sku || !userContext) {
      return reply.code(400).send({
        error: 'Missing required fields: sku and userContext are required',
      });
    }

    try {
      // Find product
      const product = await prisma.product.findUnique({
        where: { sku },
        include: {
          priceRules: {
            where: { active: true },
            orderBy: { priority: 'asc' },
          },
        },
      });

      if (!product) {
        return reply.code(404).send({
          error: `Product with SKU '${sku}' not found`,
        });
      }

      // Merge channel into userContext
      const fullContext = {
        ...userContext,
        channel: channel || userContext.channel,
      };

      // Get matching rules
      const matchingRules = getMatchingRules(product.priceRules, fullContext);

      // Calculate price with breakdown
      const breakdown = calculatePrice(product.basePrice, matchingRules);

      // Log the evaluation
      await prisma.priceEvaluationLog.create({
        data: {
          productId: product.id,
          inputContextJson: {
            sku,
            userContext: fullContext,
            timestamp: timestamp || new Date().toISOString(),
          },
          finalPrice: breakdown.finalPrice,
          breakdownJson: breakdown,
        },
      });

      // Prepare response
      const response: PriceEvaluationResponse = {
        sku: product.sku,
        productName: product.name,
        basePrice: product.basePrice,
        finalPrice: breakdown.finalPrice,
        currency: product.currency,
        breakdown,
      };

      return reply.code(200).send(response);
    } catch (error) {
      console.error('Error evaluating price:', error);
      return reply.code(500).send({
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
}
