// /governance/security_scanner/scanner.engine.ts
import { detectPatterns } from './pattern.detector'
import { detectBehaviorChains } from './behavior.chain'
import { decodeSuspiciousContent } from './decoder'
import { computeRiskReport } from './risk.scorer'

export interface ScanInput {
  content: string
  metadata?: {
    source?: string
    actorId?: string
    domain?: string
  }
}

export interface ScanResult {
  report: ReturnType<typeof computeRiskReport>
  rawFindings: {
    patternCount: number
    chainCount: number
    decodedPatternCount: number
  }
}

export function runSecurityScan(input: ScanInput): ScanResult {
  const { content } = input

  // 1️⃣ Direct pattern detection
  const patternFindings = detectPatterns(content)

  // 2️⃣ Decode suspicious encoded content
  const decodedContent = decodeSuspiciousContent(content)
  const decodedFindings = decodedContent
    ? detectPatterns(decodedContent)
    : []

  // 3️⃣ Behavior chain detection
  const chainFindings = detectBehaviorChains(content)

  // 4️⃣ Compute final risk report
  const report = computeRiskReport({
    patternFindings,
    chainFindings,
    decodedFindings
  })

  return {
    report,
    rawFindings: {
      patternCount: patternFindings.length,
      chainCount: chainFindings.length,
      decodedPatternCount: decodedFindings.length
    }
  }
}