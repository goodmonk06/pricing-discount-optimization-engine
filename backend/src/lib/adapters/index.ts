// Adapter interfaces for extensibility

/**
 * Notification adapter for sending alerts and notifications
 */
export interface INotificationAdapter {
  sendEmail(to: string, subject: string, body: string): Promise<void>;
  sendSMS(to: string, message: string): Promise<void>;
  sendPush(userId: string, title: string, body: string): Promise<void>;
}

/**
 * Analytics adapter for pushing metrics to external platforms
 */
export interface IAnalyticsAdapter {
  trackEvent(event: string, properties: Record<string, any>): Promise<void>;
  trackMetric(name: string, value: number, tags?: Record<string, string>): Promise<void>;
  flush(): Promise<void>;
}

/**
 * Machine Learning adapter for optimization suggestions
 */
export interface IMLAdapter {
  predictOptimalPrice(productId: string, context: Record<string, any>): Promise<number>;
  generatePricingRecommendations(productIds: string[]): Promise<Array<{
    productId: string;
    recommendedPrice: number;
    confidence: number;
  }>>;
}

/**
 * Inventory adapter for stock-aware pricing
 */
export interface IInventoryAdapter {
  getStock(productId: string): Promise<number>;
  isLowStock(productId: string, threshold?: number): Promise<boolean>;
  reserveStock(productId: string, quantity: number): Promise<boolean>;
}

/**
 * External Profile adapter for customer data
 */
export interface IExternalProfileAdapter {
  getCustomerProfile(customerId: string): Promise<{
    id: string;
    segment: string;
    lifetimeValue: number;
    purchaseHistory: any[];
    preferences: Record<string, any>;
  }>;
  updateCustomerSegment(customerId: string, segment: string): Promise<void>;
}

/**
 * Webhook adapter for outbound webhooks
 */
export interface IWebhookAdapter {
  send(url: string, event: string, payload: any): Promise<void>;
  retry(webhookId: string): Promise<void>;
}

// Default no-op implementations

export class NoOpNotificationAdapter implements INotificationAdapter {
  async sendEmail(_to: string, _subject: string, _body: string): Promise<void> {
    console.log('[NoOp] Email notification skipped');
  }

  async sendSMS(_to: string, _message: string): Promise<void> {
    console.log('[NoOp] SMS notification skipped');
  }

  async sendPush(_userId: string, _title: string, _body: string): Promise<void> {
    console.log('[NoOp] Push notification skipped');
  }
}

export class NoOpAnalyticsAdapter implements IAnalyticsAdapter {
  async trackEvent(_event: string, _properties: Record<string, any>): Promise<void> {
    console.log('[NoOp] Analytics event skipped');
  }

  async trackMetric(_name: string, _value: number, _tags?: Record<string, string>): Promise<void> {
    console.log('[NoOp] Analytics metric skipped');
  }

  async flush(): Promise<void> {
    // No-op
  }
}

export class NoOpMLAdapter implements IMLAdapter {
  async predictOptimalPrice(_productId: string, _context: Record<string, any>): Promise<number> {
    throw new Error('ML adapter not configured');
  }

  async generatePricingRecommendations(_productIds: string[]): Promise<Array<{
    productId: string;
    recommendedPrice: number;
    confidence: number;
  }>> {
    return [];
  }
}

export class NoOpInventoryAdapter implements IInventoryAdapter {
  async getStock(_productId: string): Promise<number> {
    return 9999; // Assume unlimited stock
  }

  async isLowStock(_productId: string, _threshold?: number): Promise<boolean> {
    return false;
  }

  async reserveStock(_productId: string, _quantity: number): Promise<boolean> {
    return true;
  }
}

export class NoOpExternalProfileAdapter implements IExternalProfileAdapter {
  async getCustomerProfile(customerId: string): Promise<any> {
    return {
      id: customerId,
      segment: 'regular',
      lifetimeValue: 0,
      purchaseHistory: [],
      preferences: {},
    };
  }

  async updateCustomerSegment(_customerId: string, _segment: string): Promise<void> {
    // No-op
  }
}

export class NoOpWebhookAdapter implements IWebhookAdapter {
  async send(_url: string, _event: string, _payload: any): Promise<void> {
    console.log('[NoOp] Webhook send skipped');
  }

  async retry(_webhookId: string): Promise<void> {
    console.log('[NoOp] Webhook retry skipped');
  }
}

// Adapter registry
class AdapterRegistry {
  private adapters: Map<string, any> = new Map();

  register<T>(name: string, adapter: T): void {
    this.adapters.set(name, adapter);
  }

  get<T>(name: string): T {
    return this.adapters.get(name) as T;
  }

  has(name: string): boolean {
    return this.adapters.has(name);
  }
}

export const adapters = new AdapterRegistry();

// Register default adapters
adapters.register<INotificationAdapter>('notification', new NoOpNotificationAdapter());
adapters.register<IAnalyticsAdapter>('analytics', new NoOpAnalyticsAdapter());
adapters.register<IMLAdapter>('ml', new NoOpMLAdapter());
adapters.register<IInventoryAdapter>('inventory', new NoOpInventoryAdapter());
adapters.register<IExternalProfileAdapter>('profile', new NoOpExternalProfileAdapter());
adapters.register<IWebhookAdapter>('webhook', new NoOpWebhookAdapter());
