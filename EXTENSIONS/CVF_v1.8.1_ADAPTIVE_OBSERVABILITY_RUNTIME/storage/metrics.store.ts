// storage/metrics.store.ts

export interface MetricsRecord {
  id: string
  skillId: string
  timestamp: number
  tokensUsed: number
  durationMs: number
  model: string
  satisfaction?: "satisfied" | "correction" | "followup"
}

const metricsDB: MetricsRecord[] = []

export function saveMetric(record: MetricsRecord) {
  metricsDB.push(record)
}

export function getMetricsBySkill(skillId: string): MetricsRecord[] {
  return metricsDB.filter(r => r.skillId === skillId)
}

export function getAllMetrics(): MetricsRecord[] {
  return metricsDB
}