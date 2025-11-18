import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import { validateBody, validateParams } from '../lib/validation';
import { NotFoundError } from '../lib/errors';
import { logger } from '../lib/logger';
import { metrics } from '../lib/metrics';
import { events } from '../lib/events';

const CreateSegmentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  criteriaJson: z.record(z.any()),
  priority: z.number().int().default(0),
  active: z.boolean().default(true),
  metaJson: z.record(z.any()).optional(),
});

const UpdateSegmentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  criteriaJson: z.record(z.any()).optional(),
  priority: z.number().int().optional(),
  active: z.boolean().optional(),
  metaJson: z.record(z.any()).optional(),
});

const AddMemberSchema = z.object({
  customerId: z.string().min(1),
  expiresAt: z.string().datetime().optional(),
  metaJson: z.record(z.any()).optional(),
});

const IdParamSchema = z.object({
  id: z.string().min(1),
});

export async function segmentRoutes(
  fastify: FastifyInstance,
  prisma: PrismaClient
) {
  // GET /segments - List all segments
  fastify.get('/segments', async (request, reply) => {
    const segments = await prisma.customerSegment.findMany({
      include: {
        _count: {
          select: {
            memberships: true,
          },
        },
      },
      orderBy: [{ priority: 'asc' }, { createdAt: 'desc' }],
    });

    metrics.recordCounter('segments.list', 1);
    return reply.code(200).send(segments);
  });

  // GET /segments/:id - Get single segment
  fastify.get(
    '/segments/:id',
    {
      preHandler: validateParams(IdParamSchema),
    },
    async (request, reply) => {
      const { id } = request.validatedParams;

      const segment = await prisma.customerSegment.findUnique({
        where: { id },
        include: {
          memberships: {
            orderBy: { assignedAt: 'desc' },
            take: 100,
          },
        },
      });

      if (!segment) {
        throw new NotFoundError('Customer segment', id);
      }

      return reply.code(200).send(segment);
    }
  );

  // POST /segments - Create segment
  fastify.post(
    '/segments',
    {
      preHandler: validateBody(CreateSegmentSchema),
    },
    async (request, reply) => {
      const data = request.validatedBody;

      logger.info({ name: data.name }, 'Creating customer segment');

      const segment = await prisma.customerSegment.create({
        data,
      });

      metrics.recordCounter('segments.created', 1);
      return reply.code(201).send(segment);
    }
  );

  // PUT /segments/:id - Update segment
  fastify.put(
    '/segments/:id',
    {
      preHandler: [
        validateParams(IdParamSchema),
        validateBody(UpdateSegmentSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.validatedParams;
      const data = request.validatedBody;

      logger.info({ id }, 'Updating customer segment');

      const segment = await prisma.customerSegment.update({
        where: { id },
        data,
      });

      metrics.recordCounter('segments.updated', 1);
      return reply.code(200).send(segment);
    }
  );

  // DELETE /segments/:id - Delete segment
  fastify.delete(
    '/segments/:id',
    {
      preHandler: validateParams(IdParamSchema),
    },
    async (request, reply) => {
      const { id } = request.validatedParams;

      logger.info({ id }, 'Deleting customer segment');

      await prisma.customerSegment.delete({
        where: { id },
      });

      metrics.recordCounter('segments.deleted', 1);
      return reply.code(204).send();
    }
  );

  // GET /segments/:id/members - Get segment members
  fastify.get(
    '/segments/:id/members',
    {
      preHandler: validateParams(IdParamSchema),
    },
    async (request, reply) => {
      const { id } = request.validatedParams;

      const memberships = await prisma.segmentMembership.findMany({
        where: { segmentId: id },
        orderBy: { assignedAt: 'desc' },
      });

      return reply.code(200).send(memberships);
    }
  );

  // POST /segments/:id/members - Add member to segment
  fastify.post(
    '/segments/:id/members',
    {
      preHandler: [
        validateParams(IdParamSchema),
        validateBody(AddMemberSchema),
      ],
    },
    async (request, reply) => {
      const { id } = request.validatedParams;
      const data = request.validatedBody;

      logger.info({ segmentId: id, customerId: data.customerId }, 'Adding segment member');

      const membership = await prisma.segmentMembership.create({
        data: {
          segmentId: id,
          customerId: data.customerId,
          expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
          metaJson: data.metaJson,
        },
      });

      await events.segmentMemberAdded({ segmentId: id, customerId: data.customerId });
      metrics.recordCounter('segments.members.added', 1);

      return reply.code(201).send(membership);
    }
  );

  // DELETE /segments/:id/members/:customerId - Remove member from segment
  fastify.delete(
    '/segments/:id/members/:customerId',
    async (request, reply) => {
      const { id, customerId } = request.params as { id: string; customerId: string };

      logger.info({ segmentId: id, customerId }, 'Removing segment member');

      await prisma.segmentMembership.delete({
        where: {
          segmentId_customerId: {
            segmentId: id,
            customerId,
          },
        },
      });

      await events.segmentMemberRemoved({ segmentId: id, customerId });
      metrics.recordCounter('segments.members.removed', 1);

      return reply.code(204).send();
    }
  );

  // POST /segments/evaluate-customer/:customerId - Evaluate which segments a customer belongs to
  fastify.post(
    '/segments/evaluate-customer/:customerId',
    async (request, reply) => {
      const { customerId } = request.params as { customerId: string };

      logger.info({ customerId }, 'Evaluating customer segments');

      const segments = await prisma.customerSegment.findMany({
        where: { active: true },
        orderBy: { priority: 'asc' },
      });

      // Get customer data (in real implementation, this would call external service)
      const customerData = {
        id: customerId,
        // In reality, fetch from profile adapter
      };

      const matchingSegments = segments.filter((segment) => {
        // Simple criteria matching (extend as needed)
        const criteria = segment.criteriaJson as any;
        return criteria !== null; // Placeholder logic
      });

      return reply.code(200).send({
        customerId,
        matchingSegments: matchingSegments.map((s) => ({
          id: s.id,
          name: s.name,
          priority: s.priority,
        })),
      });
    }
  );
}
