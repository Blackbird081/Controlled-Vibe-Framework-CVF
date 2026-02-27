export interface RiskSnapshot {
  requestId: string
  policyVersion: string
  decisionCode: string
  traceHash: string
  level: string
  score: number
  reasons?: string[]
  timestamp: number
}

export class RiskEvolution {
  private history: RiskSnapshot[] = []

  record(snapshot: RiskSnapshot) {
    this.history.push(snapshot)
  }

  getHistory() {
    return this.history
  }
}
