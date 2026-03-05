// CVF v1.8 — Anomaly Detector
// Detects cross-phase contamination and behavioral anomalies.

import type { AnomalyFlag, ExecutionPhase } from '../../types/index.js'

// Patterns that indicate AI is attempting mutation outside MUTATION_SANDBOX
const MUTATION_INTENT_PATTERNS = [
    /```diff/i,
    /^\+\+\+\s/m,
    /^---\s/m,
    /\bapply\s+(the\s+)?diff\b/i,
    /\bmodify\s+file\b/i,
    /\bcreate\s+file\b/i,
    /\bdelete\s+file\b/i,
]

// Patterns that indicate reasoning in MUTATION_SANDBOX (not allowed)
const REASONING_IN_MUTATION_PATTERNS = [
    /\blet\s+me\s+think\b/i,
    /\bI\s+should\s+consider\b/i,
    /\bon\s+second\s+thought\b/i,
    /\bactually,?\s+a\s+better\s+approach\b/i,
]

export class AnomalyDetector {
    /**
     * Scan AI output for anomalies given current phase.
     * Returns detected anomaly flags (empty = clean).
     */
    scan(
        executionId: string,
        output: string,
        currentPhase: ExecutionPhase
    ): AnomalyFlag[] {
        const flags: AnomalyFlag[] = []
        const timestamp = Date.now()

        // ANALYSIS phase: AI must not emit mutation intent
        if (currentPhase === 'ANALYSIS') {
            for (const pattern of MUTATION_INTENT_PATTERNS) {
                if (pattern.test(output)) {
                    flags.push({
                        code: 'MUTATION_IN_ANALYSIS',
                        message: `AI emitted mutation intent during ANALYSIS phase (pattern: ${pattern.source})`,
                        phase: currentPhase,
                        timestamp,
                    })
                    break // one flag per category
                }
            }
        }

        // MUTATION_SANDBOX: AI must not add NEW reasoning
        if (currentPhase === 'MUTATION_SANDBOX') {
            for (const pattern of REASONING_IN_MUTATION_PATTERNS) {
                if (pattern.test(output)) {
                    flags.push({
                        code: 'REASONING_IN_MUTATION',
                        message: `AI inserted new reasoning during MUTATION_SANDBOX (pattern: ${pattern.source})`,
                        phase: currentPhase,
                        timestamp,
                    })
                    break
                }
            }
        }

        // Cross-phase: output length anomaly in RISK_ASSESSMENT (should be structured JSON, not prose)
        if (currentPhase === 'RISK_ASSESSMENT' && output.length > 2000) {
            flags.push({
                code: 'VERBOSE_RISK',
                message: 'RISK_ASSESSMENT output exceeds 2000 chars — possible unstructured response',
                phase: currentPhase,
                timestamp,
            })
        }

        return flags
    }

    /**
     * Quick check: is output clean for given phase?
     */
    isClean(executionId: string, output: string, phase: ExecutionPhase): boolean {
        return this.scan(executionId, output, phase).length === 0
    }
}
