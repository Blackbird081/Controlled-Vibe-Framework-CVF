// /governance/security_scanner/report.generator.ts
import { RiskReport } from './risk.scorer'

export interface GeneratedReport {
  summary: string
  details: string[]
  json: RiskReport
}

export function generateScanReport(report: RiskReport): GeneratedReport {

  const details: string[] = []

  for (const p of report.patternFindings) {
    details.push(
      `[PATTERN] ${p.description} | weight=${p.weight}`
    )
  }

  for (const c of report.chainFindings) {
    details.push(
      `[CHAIN] ${c.description} | sequence=${c.matchedSequence.join(' → ')} | weight=${c.weight}`
    )
  }

  for (const d of report.decodedFindings) {
    details.push(
      `[DECODED] ${d.description} | weight=${d.weight}`
    )
  }

  const summary =
    `Risk Score: ${report.totalScore} | ` +
    `Severity: ${report.severity.toUpperCase()} | ` +
    `Decision Hint: ${report.decisionHint.toUpperCase()}`

  return {
    summary,
    details,
    json: report
  }
}