// Metrics abstraction for tracking business metrics
// Can be extended to integrate with Prometheus, StatsD, etc.

interface MetricLabels {
  [key: string]: string | number;
}

class MetricsService {
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  recordCounter(name: string, value: number = 1, labels?: MetricLabels): void {
    const key = this.buildKey(name, labels);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);
  }

  recordHistogram(name: string, value: number, labels?: MetricLabels): void {
    const key = this.buildKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
  }

  recordTiming(name: string, durationMs: number, labels?: MetricLabels): void {
    this.recordHistogram(`${name}.duration`, durationMs, labels);
  }

  getCounter(name: string, labels?: MetricLabels): number {
    const key = this.buildKey(name, labels);
    return this.counters.get(key) || 0;
  }

  getHistogram(name: string, labels?: MetricLabels): number[] {
    const key = this.buildKey(name, labels);
    return this.histograms.get(key) || [];
  }

  reset(): void {
    this.counters.clear();
    this.histograms.clear();
  }

  private buildKey(name: string, labels?: MetricLabels): string {
    if (!labels || Object.keys(labels).length === 0) {
      return name;
    }

    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(',');

    return `${name}{${labelStr}}`;
  }

  // Get summary statistics
  getSummary(): any {
    return {
      counters: Object.fromEntries(this.counters),
      histograms: Object.fromEntries(
        Array.from(this.histograms.entries()).map(([key, values]) => {
          if (values.length === 0) {
            return [key, { count: 0, avg: 0, min: 0, max: 0 }];
          }

          const sorted = [...values].sort((a, b) => a - b);
          return [
            key,
            {
              count: values.length,
              avg: values.reduce((a, b) => a + b, 0) / values.length,
              min: sorted[0],
              max: sorted[sorted.length - 1],
              p50: sorted[Math.floor(sorted.length * 0.5)],
              p95: sorted[Math.floor(sorted.length * 0.95)],
              p99: sorted[Math.floor(sorted.length * 0.99)],
            },
          ];
        })
      ),
    };
  }
}

export const metrics = new MetricsService();

// Helper function to track function execution time
export async function trackTiming<T>(
  name: string,
  fn: () => Promise<T>,
  labels?: MetricLabels
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    metrics.recordTiming(name, duration, labels);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    metrics.recordTiming(name, duration, { ...labels, error: 'true' });
    throw error;
  }
}
