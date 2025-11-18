// Domain types for the pricing engine

export interface UserContext {
  userId?: string;
  segment?: string; // e.g., "vip", "regular", "new"
  channel?: string; // e.g., "web", "mobile", "api"
  region?: string;
  [key: string]: any; // Allow additional context fields
}

export interface PriceEvaluationRequest {
  sku: string;
  userContext: UserContext;
  channel?: string;
  timestamp?: string;
}

export interface PriceCondition {
  segment?: string;
  channel?: string;
  region?: string;
  minOrderValue?: number;
  maxOrderValue?: number;
  [key: string]: any; // Allow additional condition types
}

export type AdjustmentType =
  | "percent_off"
  | "fixed_off"
  | "fixed_price"
  | "percent_increase";

export interface PriceAdjustment {
  type: AdjustmentType;
  value: number;
}

export interface AppliedRule {
  ruleId: string;
  ruleName: string;
  adjustment: PriceAdjustment;
  priceAfter: number;
}

export interface PriceBreakdown {
  basePrice: number;
  appliedRules: AppliedRule[];
  finalPrice: number;
}

export interface PriceEvaluationResponse {
  sku: string;
  productName: string;
  basePrice: number;
  finalPrice: number;
  currency: string;
  breakdown: PriceBreakdown;
}

export interface OptimizationSuggestion {
  productId: string;
  productName: string;
  sku: string;
  currentPerformance: {
    views: number;
    purchases: number;
    revenue: number;
    conversionRate: number;
  };
  suggestion: {
    action: "increase_discount" | "decrease_discount" | "maintain";
    reason: string;
    recommendedAdjustment?: number;
  };
}
