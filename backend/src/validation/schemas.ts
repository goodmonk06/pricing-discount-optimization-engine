import { z } from 'zod';

// User Context Schema
export const UserContextSchema = z.object({
  userId: z.string().optional(),
  segment: z.string().optional(),
  channel: z.string().optional(),
  region: z.string().optional(),
  orderValue: z.number().optional(),
}).passthrough(); // Allow additional fields

// Price Evaluation Request Schema
export const PriceEvaluationRequestSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  userContext: UserContextSchema,
  channel: z.string().optional(),
  timestamp: z.string().datetime().optional(),
});

// Product Schemas
export const CreateProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Name is required'),
  basePrice: z.number().positive('Base price must be positive'),
  currency: z.string().default('USD'),
  metaJson: z.record(z.any()).optional(),
});

export const UpdateProductSchema = z.object({
  sku: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  basePrice: z.number().positive().optional(),
  currency: z.string().optional(),
  metaJson: z.record(z.any()).optional(),
});

// Price Rule Schemas
export const PriceConditionSchema = z.record(z.any());

export const PriceAdjustmentSchema = z.object({
  type: z.enum(['percent_off', 'fixed_off', 'fixed_price', 'percent_increase']),
  value: z.number(),
});

export const CreatePriceRuleSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  name: z.string().min(1, 'Name is required'),
  conditionJson: PriceConditionSchema,
  adjustmentJson: PriceAdjustmentSchema,
  priority: z.number().int().default(0),
  active: z.boolean().default(true),
});

export const UpdatePriceRuleSchema = z.object({
  name: z.string().min(1).optional(),
  conditionJson: PriceConditionSchema.optional(),
  adjustmentJson: PriceAdjustmentSchema.optional(),
  priority: z.number().int().optional(),
  active: z.boolean().optional(),
});

// Performance Snapshot Schema
export const CreatePerformanceSnapshotSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  date: z.string().datetime('Invalid date format'),
  views: z.number().int().nonnegative().default(0),
  purchases: z.number().int().nonnegative().default(0),
  revenue: z.number().nonnegative().default(0),
});

// Query Param Schemas
export const PaginationSchema = z.object({
  limit: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 100)),
  offset: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 0)),
});

export const ProductIdQuerySchema = z.object({
  productId: z.string().optional(),
});

// Type exports
export type PriceEvaluationRequest = z.infer<typeof PriceEvaluationRequestSchema>;
export type CreateProductInput = z.infer<typeof CreateProductSchema>;
export type UpdateProductInput = z.infer<typeof UpdateProductSchema>;
export type CreatePriceRuleInput = z.infer<typeof CreatePriceRuleSchema>;
export type UpdatePriceRuleInput = z.infer<typeof UpdatePriceRuleSchema>;
export type CreatePerformanceSnapshotInput = z.infer<typeof CreatePerformanceSnapshotSchema>;
