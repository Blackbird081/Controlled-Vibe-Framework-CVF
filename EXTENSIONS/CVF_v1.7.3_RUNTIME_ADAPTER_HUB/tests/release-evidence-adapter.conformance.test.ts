import fs from 'fs'
import os from 'os'
import path from 'path'
import { describe, expect, it } from 'vitest'
import { ReleaseEvidenceAdapter } from '../adapters/release.evidence.adapter.js'

describe('CVF v1.7.3 release-evidence adapter conformance', () => {
    const adapter = new ReleaseEvidenceAdapter()

    it('emits remediation evidence in both json and markdown form', async () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cvf173-release-conformance-'))
        try {
            const artifactPath = path.join(root, 'receipts.json')
            const markdownLogPath = path.join(root, 'receipts.md')
            const result = await adapter.execute({
                capability: 'custom',
                action: 'emit_remediation_evidence',
                payload: {
                    artifactPath,
                    markdownLogPath,
                    receipts: [
                        {
                            receiptId: 'RESUMED:proposal-001:persist_resume_evidence',
                            action: 'RESUMED',
                            sourceProposalId: 'proposal-001',
                            step: 'persist_resume_evidence',
                            recordedAt: 1709803300000,
                        },
                        {
                            receiptId: 'INTERRUPTED:proposal-001:verify_checkpoint_integrity',
                            action: 'INTERRUPTED',
                            sourceProposalId: 'proposal-001',
                            step: 'verify_checkpoint_integrity',
                            recordedAt: 1709803301000,
                        },
                    ],
                },
            })

            expect(result.success).toBe(true)
            expect(fs.readFileSync(markdownLogPath, 'utf-8')).toContain('## Action Summary')
            expect(fs.readFileSync(artifactPath, 'utf-8')).toContain('"receiptCount": 2')
        } finally {
            fs.rmSync(root, { recursive: true, force: true })
        }
    })

    it('supports filesystem readback of emitted remediation artifacts', async () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cvf173-release-readback-'))
        try {
            const artifactPath = path.join(root, 'receipts.json')
            const markdownLogPath = path.join(root, 'receipts.md')
            await adapter.execute({
                capability: 'custom',
                action: 'emit_remediation_evidence',
                payload: {
                    artifactPath,
                    markdownLogPath,
                    receipts: [
                        {
                            receiptId: 'RESUMED:proposal-002:mark_trace_ready_for_append',
                            action: 'RESUMED',
                            sourceProposalId: 'proposal-002',
                            step: 'mark_trace_ready_for_append',
                            recordedAt: 1709803302000,
                        },
                    ],
                },
            })

            const readBack = await adapter.execute({
                capability: 'filesystem',
                action: 'read',
                payload: { path: markdownLogPath },
            })
            expect(readBack.success).toBe(true)
            expect(readBack.data).toBeTypeOf('string')
            expect(String(readBack.data)).toContain('proposal-002')
        } finally {
            fs.rmSync(root, { recursive: true, force: true })
        }
    })

    it('fails closed for invalid remediation payload', async () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cvf173-release-invalid-'))
        try {
            const artifactPath = path.join(root, 'receipts.json')
            const markdownLogPath = path.join(root, 'receipts.md')
            const result = await adapter.execute({
                capability: 'custom',
                action: 'emit_remediation_evidence',
                payload: {
                    artifactPath,
                    markdownLogPath,
                    receipts: [{ bad: true }],
                },
            })

            expect(result.success).toBe(false)
            expect(result.error).toContain('payload.receipts')
            expect(fs.existsSync(artifactPath)).toBe(false)
            expect(fs.existsSync(markdownLogPath)).toBe(false)
        } finally {
            fs.rmSync(root, { recursive: true, force: true })
        }
    })
})
