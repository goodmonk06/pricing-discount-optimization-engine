import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PriceEvaluationResponse } from '../types';
import { getMatchingRules } from '../engine/rule-matcher';
import { calculatePrice } from '../engine/price-calculator';
import { PriceEvaluationRequestSchema } from '../validation/schemas';
import { validateBody } from '../lib/validation';
import { NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { metrics, trackTiming } from '../lib/metrics';

export async function evaluateRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient
) {
  // POST /evaluate-price - Main pricing evaluation endpoint
  fastify.post(
    '/evaluate-price',
    {
      preHandler: validateBody(PriceEvaluationRequestSchema),
    },
    async (request, reply) => {
      const { sku, userContext, channel, timestamp } = request.validatedBody;

      logger.info({ sku, segment: userContext.segment, channel }, 'Evaluating price');

      const result = await trackTiming('price_evaluation', async () => {
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
          throw new NotFoundError('Product', sku);
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

        // Record metrics
        metrics.recordCounter('price_evaluations.total', 1, {
          product: sku,
          rules_applied: matchingRules.length,
        });
        metrics.recordHistogram('price_evaluations.discount_amount', product.basePrice - breakdown.finalPrice);

        // Prepare response
        const response: PriceEvaluationResponse = {
          sku: product.sku,
          productName: product.name,
          basePrice: product.basePrice,
          finalPrice: breakdown.finalPrice,
          currency: product.currency,
          breakdown,
        };

        return response;
      }, { sku });

      return reply.code(200).send(result);
    }
  );
}
