import {
  CanvasReport,
  CanvasConfig,
  DEFAULT_CANVAS_CONFIG,
  SessionSnapshot,
} from "./types";
import { MetricsCollector } from "./metrics.collector";
import { ReportRenderer } from "./report.renderer";

export class GovernanceCanvas {
  private collector: MetricsCollector;
  private renderer: ReportRenderer;
  private config: CanvasConfig;

  constructor(config: Partial<CanvasConfig> = {}) {
    this.config = { ...DEFAULT_CANVAS_CONFIG, ...config };
    this.collector = new MetricsCollector();
    this.renderer = new ReportRenderer(this.config);
  }

  addSession(snapshot: SessionSnapshot): void {
    this.collector.addSession(snapshot);
  }

  addSessions(snapshots: SessionSnapshot[]): void {
    this.collector.addSessions(snapshots);
  }

  generateReport(): CanvasReport {
    const metrics = this.collector.compute();
    const sessions = this.collector.getSessions();
    const textReport = this.renderer.renderText(metrics, sessions);
    const markdownReport = this.renderer.renderMarkdown(metrics, sessions);

    return {
      title: this.config.title,
      generatedAt: Date.now(),
      metrics,
      sessions,
      textReport,
      markdownReport,
    };
  }

  getTextReport(): string {
    const report = this.generateReport();
    return report.textReport;
  }

  getMarkdownReport(): string {
    const report = this.generateReport();
    return report.markdownReport;
  }

  getMetrics() {
    return this.collector.compute();
  }

  clear(): void {
    this.collector.clear();
  }
}
