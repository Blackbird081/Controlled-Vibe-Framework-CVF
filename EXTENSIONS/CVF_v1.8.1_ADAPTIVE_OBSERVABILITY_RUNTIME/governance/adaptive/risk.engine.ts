export interface RiskInput {
  cancelRate: number
  correctionRate: number
  tokenSpike: number
  modelShift: boolean
  securityFlags: number
}

export interface RiskScore {
  value: number
  severity: 'low' | 'medium' | 'high' | 'critical'
}

export function computeRisk(input: RiskInput): RiskScore {
  let score = 0

  score += input.cancelRate * 0.25
  score += input.correctionRate * 0.25
  score += input.tokenSpike * 0.2
  score += input.securityFlags * 0.2
  if (input.modelShift) score += 10

  if (score > 80) return { value: score, severity: 'critical' }
  if (score > 60) return { value: score, severity: 'high' }
  if (score > 40) return { value: score, severity: 'medium' }
  return { value: score, severity: 'low' }
}