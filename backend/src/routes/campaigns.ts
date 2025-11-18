import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateBody, validateParams, validateQuery } from '../lib/validation';
import { NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { metrics } from '../lib/metrics';
import { events } from '../lib/events';

const CreateCampaignSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'ended']).default('draft'),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  targetJson: z.record(z.any()).optional(),
  metaJson: z.record(z.any()).optional(),
});

const UpdateCampaignSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'ended']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  budget: z.number().positive().optional(),
  targetJson: z.record(z.any()).optional(),
  metaJson: z.record(z.any()).optional(),
});

const IdParamSchema = z.object({
  id: z.string().min(1),
});

const StatusQuerySchema = z.object({
  status: z.enum(['draft', 'scheduled', 'active', 'paused', 'ended']).optional(),
});

export async function campaignRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient
) {
  // GET /campaigns - List all campaigns
  fastify.get(
    '/campaigns',
    {
      preHandler: validateQuery(StatusQuerySchema),
    },
    async (request, reply) => {
      const { status } = request.validatedQuery || {};

      const campaigns = await prisma.campaign.findMany({
        where: status ? { status } : undefined,
        include: {
          priceRules: {
            select: {
              id: true,
              name: true,
              active: true,
            },
          },
          _count: {
            select: {
              priceRules: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      metrics.recordCounter('campaigns.list', 1);
      return reply.code(200).send(campaigns);
    }
  );

  // GET /campaigns/:id - Get single campaign
  fastify.get(
    '/campaigns/:id',
    {
      preHandler: validateParams(IdParamSchema),
    },
    async (request, reply) => {
      const { id } = request.validatedParams;

      const campaign = await prisma.campaign.findUnique({
        where: { id },
        include: {
          priceRules: true,
          campaignPerformances: {
            orderBy: { date: 'desc' },
            take: 30,
          },
        },
      });

      if (!campaign) {
        throw new NotFoundError('Campaign', id);
      }

      return reply.code(200).send(campaign);
    }
  );

  // POST /campaigns - Create campaign
  fastify.post(
    '/campaigns',
    {
      preHandler: validateBody(CreateCampaignSchema),
    },
    async (request, reply) => {
      const data = request.validatedBody;

      logger.info({ name: data.name }, 'Creating campaign');

      const campaign = await prisma.campaign.create({
        data: {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : null,
          endDate: data.endDate ? new Date(data.endDate) : null,
        },
      });

      metrics.recordCounter('campaigns.created', 1);
      await events.campaignStarted(campaign);

      return reply.code(201).send(campaign);
    }
  );

  // PUT /campaigns/:id - Update campaign
  fastify.put(
    '/campaigns/:id',
    {
      preHandler: [
        validateParams(IdParamSchema),
        validateBody(UpdateCampaignSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.validatedParams;
      const data = request.validatedBody;

      logger.info({ id }, 'Updating campaign');

      const oldCampaign = await prisma.campaign.findUnique({ where: { id } });

      const campaign = await prisma.campaign.update({
        where: { id },
        data: {
          ...data,
          startDate: data.startDate ? new Date(data.startDate) : undefined,
          endDate: data.endDate ? new Date(data.endDate) : undefined,
        },
      });

      metrics.recordCounter('campaigns.updated', 1);

      // Emit status change events
      if (oldCampaign && oldCampaign.status !== campaign.status) {
        if (campaign.status === 'active') {
          await events.campaignStarted(campaign);
        } else if (campaign.status === 'paused') {
          await events.campaignPaused(campaign);
        } else if (campaign.status === 'ended') {
          await events.campaignEnded(campaign);
        }
      }

      return reply.code(200).send(campaign);
    }
  );

  // DELETE /campaigns/:id - Delete campaign
  fastify.delete(
    '/campaigns/:id',
    {
      preHandler: validateParams(IdParamSchema),
    },
    async (request, reply) => {
      const { id } = request.validatedParams;

      logger.info({ id }, 'Deleting campaign');

      await prisma.campaign.delete({
        where: { id },
      });

      metrics.recordCounter('campaigns.deleted', 1);
      return reply.code(204).send();
    }
  );

  // GET /campaigns/:id/performance - Get campaign performance
  fastify.get(
    '/campaigns/:id/performance',
    {
      preHandler: validateParams(IdParamSchema),
    },
    async (request, reply) => {
      const { id } = request.validatedParams;

      const performances = await prisma.campaignPerformance.findMany({
        where: { campaignId: id },
        orderBy: { date: 'desc' },
      });

      // Calculate aggregate metrics
      const aggregate = performances.reduce(
        (acc, p) => ({
          totalViews: acc.totalViews + p.views,
          totalClicks: acc.totalClicks + p.clicks,
          totalPurchases: acc.totalPurchases + p.purchases,
          totalRevenue: acc.totalRevenue + p.revenue,
          totalCost: acc.totalCost + p.cost,
        }),
        { totalViews: 0, totalClicks: 0, totalPurchases: 0, totalRevenue: 0, totalCost: 0 }
      );

      const roi =
        aggregate.totalCost > 0
          ? ((aggregate.totalRevenue - aggregate.totalCost) / aggregate.totalCost) * 100
          : 0;

      return reply.code(200).send({
        daily: performances,
        aggregate: {
          ...aggregate,
          roi,
          conversionRate:
            aggregate.totalViews > 0
              ? (aggregate.totalPurchases / aggregate.totalViews) * 100
              : 0,
        },
      });
    }
  );

  // POST /campaigns/:id/activate - Activate campaign
  fastify.post(
    '/campaigns/:id/activate',
    {
      preHandler: validateParams(IdParamSchema),
    },
    async (request, reply) => {
      const { id } = request.validatedParams;

      const campaign = await prisma.campaign.update({
        where: { id },
        data: { status: 'active' },
      });

      logger.info({ id, name: campaign.name }, 'Campaign activated');
      await events.campaignStarted(campaign);

      return reply.code(200).send(campaign);
    }
  );

  // POST /campaigns/:id/pause - Pause campaign
  fastify.post(
    '/campaigns/:id/pause',
    {
      preHandler: validateParams(IdParamSchema),
    },
    async (request, reply) => {
      const { id } = request.validatedParams;

      const campaign = await prisma.campaign.update({
        where: { id },
        data: { status: 'paused' },
      });

      logger.info({ id, name: campaign.name }, 'Campaign paused');
      await events.campaignPaused(campaign);

      return reply.code(200).send(campaign);
    }
  );

  // POST /campaigns/:id/end - End campaign
  fastify.post(
    '/campaigns/:id/end',
    {
      preHandler: validateParams(IdParamSchema),
    },
    async (request, reply) => {
      const { id } = request.validatedParams;

      const campaign = await prisma.campaign.update({
        where: { id },
        data: { status: 'ended' },
      });

      logger.info({ id, name: campaign.name }, 'Campaign ended');
      await events.campaignEnded(campaign);

      return reply.code(200).send(campaign);
    }
  );
}
