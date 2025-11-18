import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { logger } from './logger';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(400, message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, identifier?: string) {
    const message = identifier
      ? `${resource} with identifier '${identifier}' not found`
      : `${resource} not found`;
    super(404, message, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(409, message, 'CONFLICT', details);
    this.name = 'ConflictError';
  }
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    timestamp: string;
    path?: string;
  };
}

export function handleZodError(error: ZodError): ErrorResponse {
  const details = error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Validation failed',
      details,
      timestamp: new Date().toISOString(),
    },
  };
}

export function handlePrismaError(error: any): ErrorResponse {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const target = error.meta?.target as string[] | undefined;
        return {
          error: {
            code: 'CONFLICT',
            message: `A record with this ${target?.join(', ') || 'field'} already exists`,
            details: { fields: target },
            timestamp: new Date().toISOString(),
          },
        };
      }
      case 'P2025':
        return {
          error: {
            code: 'NOT_FOUND',
            message: 'Record not found',
            timestamp: new Date().toISOString(),
          },
        };
      case 'P2003':
        return {
          error: {
            code: 'INVALID_REFERENCE',
            message: 'Foreign key constraint failed',
            details: { field: error.meta?.field_name },
            timestamp: new Date().toISOString(),
          },
        };
      default:
        return {
          error: {
            code: 'DATABASE_ERROR',
            message: 'Database operation failed',
            details: { code: error.code },
            timestamp: new Date().toISOString(),
          },
        };
    }
  }

  return {
    error: {
      code: 'DATABASE_ERROR',
      message: 'An unexpected database error occurred',
      timestamp: new Date().toISOString(),
    },
  };
}

export async function errorHandler(
  error: FastifyError | Error,
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  // Log the error
  logger.error({
    err: error,
    url: request.url,
    method: request.method,
  }, 'Request error');

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const response = handleZodError(error);
    reply.status(400).send({ ...response.error, path: request.url });
    return;
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({
      code: error.code || 'ERROR',
      message: error.message,
      details: error.details,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
    return;
  }

  // Handle Prisma errors
  if (
    error.name === 'PrismaClientKnownRequestError' ||
    error.name === 'PrismaClientValidationError'
  ) {
    const response = handlePrismaError(error);
    const statusCode = response.error.code === 'NOT_FOUND' ? 404 :
                       response.error.code === 'CONFLICT' ? 409 : 400;
    reply.status(statusCode).send({ ...response.error, path: request.url });
    return;
  }

  // Handle Fastify validation errors
  if ('validation' in error && error.validation) {
    reply.status(400).send({
      code: 'VALIDATION_ERROR',
      message: error.message,
      details: error.validation,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
    return;
  }

  // Default error response
  const statusCode = 'statusCode' in error ? (error as any).statusCode : 500;
  reply.status(statusCode).send({
    code: 'INTERNAL_ERROR',
    message: statusCode === 500 ? 'An internal server error occurred' : error.message,
    timestamp: new Date().toISOString(),
    path: request.url,
  });
}
