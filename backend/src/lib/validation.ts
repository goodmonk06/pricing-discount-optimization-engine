import { FastifyRequest, FastifyReply } from 'fastify';
import { z, ZodSchema } from 'zod';

/**
 * Helper to validate request body with a Zod schema
 */
export function validateBody<T extends ZodSchema>(schema: T) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      throw result.error;
    }
    // Attach validated data to request for type safety
    (request as any).validatedBody = result.data;
  };
}

/**
 * Helper to validate query params with a Zod schema
 */
export function validateQuery<T extends ZodSchema>(schema: T) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(request.query);
    if (!result.success) {
      throw result.error;
    }
    (request as any).validatedQuery = result.data;
  };
}

/**
 * Helper to validate URL params with a Zod schema
 */
export function validateParams<T extends ZodSchema>(schema: T) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const result = schema.safeParse(request.params);
    if (!result.success) {
      throw result.error;
    }
    (request as any).validatedParams = result.data;
  };
}

// Extend FastifyRequest type to include validated data
declare module 'fastify' {
  interface FastifyRequest {
    validatedBody?: any;
    validatedQuery?: any;
    validatedParams?: any;
  }
}
