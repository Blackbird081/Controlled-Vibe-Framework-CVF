import { PhaseReport } from "./phase.report.generator"

export class GovernanceAuditLog {

  private logs: PhaseReport[] = []

  record(report: PhaseReport): void {
    this.logs.push(report)
  }

  getAll(): PhaseReport[] {
    return this.logs
  }

  getByPhase(phase: string): PhaseReport[] {
    return this.logs.filter(r => r.phase === phase)
  }

}