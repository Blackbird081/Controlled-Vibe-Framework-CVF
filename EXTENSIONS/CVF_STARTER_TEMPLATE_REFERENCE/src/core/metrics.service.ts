// src/core/metrics.service.ts

export class MetricsService {
  private counters: Record<string, number> = {};

  increment(metric: string) {
    this.counters[metric] = (this.counters[metric] || 0) + 1;
  }

  getMetrics() {
    return this.counters;
  }
}
