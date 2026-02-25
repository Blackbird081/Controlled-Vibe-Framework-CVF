export interface RiskSnapshot {
  level: string
  score: number
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