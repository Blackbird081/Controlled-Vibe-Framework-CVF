// deviation.report.ts
// Phân tích severity dựa trên content của issue, không chỉ số lượng.

export interface DeviationReport {
  sessionId: string
  issues: string[]
  severity: "LOW" | "MEDIUM" | "HIGH"
  timestamp: number
}

const HIGH_SEVERITY_KEYWORDS = [
  "policy", "governance", "block", "critical", "security", "override"
]
const MEDIUM_SEVERITY_KEYWORDS = [
  "risk", "escalat", "entropy", "loop", "recursion", "threshold"
]

function classifySeverity(issues: string[]): "LOW" | "MEDIUM" | "HIGH" {
  const combined = issues.join(" ").toLowerCase()

  if (HIGH_SEVERITY_KEYWORDS.some(k => combined.includes(k))) return "HIGH"
  if (MEDIUM_SEVERITY_KEYWORDS.some(k => combined.includes(k))) return "MEDIUM"
  if (issues.length > 3) return "MEDIUM"
  return "LOW"
}

export function generateDeviationReport(
  sessionId: string,
  issues: string[]
): DeviationReport {
  return {
    sessionId,
    issues,
    severity: classifySeverity(issues),
    timestamp: Date.now()
  }
}