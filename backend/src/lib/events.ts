// Event system for domain events

export type DomainEventType =
  | 'price.evaluated'
  | 'price.changed'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted'
  | 'rule.created'
  | 'rule.activated'
  | 'rule.deactivated'
  | 'rule.deleted'
  | 'campaign.started'
  | 'campaign.ended'
  | 'campaign.paused'
  | 'segment.member.added'
  | 'segment.member.removed'
  | 'abtest.started'
  | 'abtest.completed'
  | 'optimization.suggestion.generated';

export interface DomainEvent<T = any> {
  id: string;
  type: DomainEventType;
  timestamp: Date;
  data: T;
  metadata?: Record<string, any>;
}

export type EventHandler<T = any> = (event: DomainEvent<T>) => Promise<void> | void;

class EventBus {
  private handlers: Map<DomainEventType, Set<EventHandler>> = new Map();
  private eventLog: DomainEvent[] = [];
  private maxLogSize = 1000;

  /**
   * Register an event handler for a specific event type
   */
  on<T = any>(eventType: DomainEventType, handler: EventHandler<T>): () => void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }

    this.handlers.get(eventType)!.add(handler as EventHandler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(eventType)?.delete(handler as EventHandler);
    };
  }

  /**
   * Emit an event to all registered handlers
   */
  async emit<T = any>(type: DomainEventType, data: T, metadata?: Record<string, any>): Promise<void> {
    const event: DomainEvent<T> = {
      id: this.generateId(),
      type,
      timestamp: new Date(),
      data,
      metadata,
    };

    // Add to log
    this.eventLog.push(event);
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    // Get handlers for this event type
    const handlers = this.handlers.get(type);
    if (!handlers || handlers.size === 0) {
      return;
    }

    // Execute all handlers (don't wait for completion to avoid blocking)
    const promises = Array.from(handlers).map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${type}:`, error);
      }
    });

    // Optionally wait for all handlers (for critical events)
    if (metadata?.wait) {
      await Promise.all(promises);
    }
  }

  /**
   * Get recent events (for debugging/monitoring)
   */
  getRecentEvents(limit: number = 100): DomainEvent[] {
    return this.eventLog.slice(-limit);
  }

  /**
   * Clear all handlers (useful for testing)
   */
  clearHandlers(): void {
    this.handlers.clear();
  }

  /**
   * Clear event log
   */
  clearLog(): void {
    this.eventLog = [];
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Global event bus instance
export const eventBus = new EventBus();

// Helper function to create typed event emitters
export function createEventEmitter<T = any>(type: DomainEventType) {
  return (data: T, metadata?: Record<string, any>) => eventBus.emit(type, data, metadata);
}

// Pre-configured event emitters
export const events = {
  priceEvaluated: createEventEmitter('price.evaluated'),
  priceChanged: createEventEmitter('price.changed'),
  productCreated: createEventEmitter('product.created'),
  productUpdated: createEventEmitter('product.updated'),
  productDeleted: createEventEmitter('product.deleted'),
  ruleCreated: createEventEmitter('rule.created'),
  ruleActivated: createEventEmitter('rule.activated'),
  ruleDeactivated: createEventEmitter('rule.deactivated'),
  ruleDeleted: createEventEmitter('rule.deleted'),
  campaignStarted: createEventEmitter('campaign.started'),
  campaignEnded: createEventEmitter('campaign.ended'),
  campaignPaused: createEventEmitter('campaign.paused'),
  segmentMemberAdded: createEventEmitter('segment.member.added'),
  segmentMemberRemoved: createEventEmitter('segment.member.removed'),
  abTestStarted: createEventEmitter('abtest.started'),
  abTestCompleted: createEventEmitter('abtest.completed'),
  optimizationSuggestionGenerated: createEventEmitter('optimization.suggestion.generated'),
};
