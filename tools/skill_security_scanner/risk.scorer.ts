// /governance/security_scanner/risk.scorer.ts

import { PatternFinding } from './pattern.detector'
import { BehaviorChainFinding } from './behavior.chain'

export type Severity = 'low' | 'medium' | 'high' | 'critical'

export interface RiskReport {
  totalScore: number
  severity: Severity
  patternFindings: PatternFinding[]
  chainFindings: BehaviorChainFinding[]
  decodedFindings: PatternFinding[]
  decisionHint: 'allow' | 'review' | 'block'
}

function calculateSeverity(score: number): Severity {
  if (score >= 80) return 'critical'
  if (score >= 50) return 'high'
  if (score >= 20) return 'medium'
  return 'low'
}

function calculateDecisionHint(severity: Severity): 'allow' | 'review' | 'block' {
  switch (severity) {
    case 'critical':
      return 'block'
    case 'high':
      return 'review'
    case 'medium':
      return 'review'
    case 'low':
      return 'allow'
  }
}

export function computeRiskReport(params: {
  patternFindings: PatternFinding[]
  chainFindings: BehaviorChainFinding[]
  decodedFindings: PatternFinding[]
}): RiskReport {

  const { patternFindings, chainFindings, decodedFindings } = params

  const patternScore = patternFindings.reduce((sum, f) => sum + f.weight, 0)
  const chainScore = chainFindings.reduce((sum, f) => sum + f.weight, 0)
  const decodedScore = decodedFindings.reduce((sum, f) => sum + f.weight, 0)

  const totalScore = patternScore + chainScore + decodedScore

  const severity = calculateSeverity(totalScore)
  const decisionHint = calculateDecisionHint(severity)

  return {
    totalScore,
    severity,
    patternFindings,
    chainFindings,
    decodedFindings,
    decisionHint
  }
}