// CVF v1.9 — Replay Validator
// Validates the correctness and completeness of an ExecutionRecord.
// Used post-capture to ensure all 9 fields are present and commitHash is sound.

import type { ExecutionRecord } from '../types/index.js'
import { verifyHash } from './deterministic.hash.js'

export interface ValidationResult {
    valid: boolean
    errors: string[]
}

const REQUIRED_FIELDS: (keyof ExecutionRecord)[] = [
    'executionId',
    'timestamp',
    'role',
    'mode',
    'frozenContextHash',
    'riskHash',
    'mutationFingerprint',
    'snapshotId',
    'commitHash',
]

export class ReplayValidator {
    /**
     * Validate an ExecutionRecord:
     * 1. All 9 fields present and non-empty
     * 2. commitHash verifiable from other components
     * 3. timestamp is a valid past timestamp
     */
    validate(record: ExecutionRecord): ValidationResult {
        const errors: string[] = []

        // Check all 9 fields present and non-empty
        for (const field of REQUIRED_FIELDS) {
            const value = record[field]
            if (value === undefined || value === null || value === '') {
                errors.push(`Missing or empty field: ${field}`)
            }
        }

        // Verify commitHash integrity
        if (errors.length === 0) {
            const hashValid = verifyHash(
                record.commitHash,
                record.executionId,
                record.riskHash,
                record.mutationFingerprint,
                record.snapshotId
            )
            if (!hashValid) {
                errors.push(
                    `commitHash integrity check failed — hash does not match components. ` +
                    `Record may have been tampered with.`
                )
            }
        }

        // Validate timestamp is in the past
        if (record.timestamp > Date.now() + 1000) {
            errors.push(`timestamp is in the future (${record.timestamp}) — suspicious`)
        }

        // Validate mode value
        if (!['SAFE', 'BALANCED', 'CREATIVE'].includes(record.mode)) {
            errors.push(`Invalid mode: ${record.mode}`)
        }

        return { valid: errors.length === 0, errors }
    }

    /**
     * Assert a record is valid. Throws if invalid.
     */
    assertValid(record: ExecutionRecord): void {
        const result = this.validate(record)
        if (!result.valid) {
            throw new Error(
                `[CVF v1.9] ReplayValidator: invalid ExecutionRecord for ${record.executionId}:\n` +
                result.errors.map(e => `  - ${e}`).join('\n')
            )
        }
    }
}
