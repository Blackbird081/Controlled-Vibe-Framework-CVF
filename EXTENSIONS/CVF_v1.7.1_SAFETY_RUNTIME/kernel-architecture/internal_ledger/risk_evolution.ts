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

export const RISK_EVOLUTION_ADAPTER_VERSION = "phase2b-risk-evolution-adapter-1"

export interface RiskEvolutionAdapterSnapshot {
  version: typeof RISK_EVOLUTION_ADAPTER_VERSION
  source: "safety-runtime:internal-ledger-risk-evolution"
  latest: RiskSnapshot | null
  historyCount: number
  highestScore: number | null
  latestLevel: string | null
}

export function buildRiskEvolutionAdapterSnapshot(history: RiskSnapshot[]): RiskEvolutionAdapterSnapshot {
  const latest = history.length > 0 ? history[history.length - 1] : null
  const highestScore = history.reduce<number | null>(
    (max, snapshot) => (max === null ? snapshot.score : Math.max(max, snapshot.score)),
    null
  )

  return {
    version: RISK_EVOLUTION_ADAPTER_VERSION,
    source: "safety-runtime:internal-ledger-risk-evolution",
    latest,
    historyCount: history.length,
    highestScore,
    latestLevel: latest?.level ?? null,
  }
}

export class RiskEvolution {
  private history: RiskSnapshot[] = []

  record(snapshot: RiskSnapshot) {
    this.history.push(snapshot)
  }

  recordWithAdapter(snapshot: RiskSnapshot): RiskEvolutionAdapterSnapshot {
    this.record(snapshot)
    return this.getAdapterSnapshot()
  }

  getHistory() {
    return this.history
  }

  getAdapterSnapshot(): RiskEvolutionAdapterSnapshot {
    return buildRiskEvolutionAdapterSnapshot(this.history)
  }
}
