// /governance/security_scanner/pattern.detector.ts

import { securityRules, SecurityRule } from './rule.registry'

export interface PatternFinding {
  ruleId: string
  description: string
  category: string
  severity: string
  weight: number
  matches: string[]
}

function normalizeContent(content: string): string {
  return content
    .replace(/\u200B/g, '') // remove zero-width space
    .replace(/\u200C/g, '')
    .replace(/\u200D/g, '')
    .replace(/\uFEFF/g, '')
    .toLowerCase()
}

export function detectPatterns(content: string): PatternFinding[] {
  const normalized = normalizeContent(content)

  const findings: PatternFinding[] = []

  for (const rule of securityRules) {
    if (!rule.pattern) continue

    const matches = normalized.match(rule.pattern)

    if (matches) {
      findings.push({
        ruleId: rule.id,
        description: rule.description,
        category: rule.category,
        severity: rule.severity,
        weight: rule.weight,
        matches: matches
      })
    }
  }

  return findings
}