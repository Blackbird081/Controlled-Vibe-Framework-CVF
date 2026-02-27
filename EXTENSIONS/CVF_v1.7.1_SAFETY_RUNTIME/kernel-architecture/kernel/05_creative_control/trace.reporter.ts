import { LineageStore } from "./lineage.store"
import { AuditLogger } from "./audit.logger"

export class TraceReporter {
  constructor(
    private lineage: LineageStore,
    private logger: AuditLogger
  ) {}

  generateReport() {
    return {
      lineage: this.lineage.getAll(),
      events: this.logger.getEvents(),
    }
  }
}
