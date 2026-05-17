import * as fs from 'fs'
import * as path from 'path'
import type {
    RuntimeAdapter,
    RuntimeCapability,
    RuntimeRequest,
    RuntimeResult,
} from '../contracts/runtime.adapter.interface.js'
import { executeFilesystemAction } from './base.adapter.js'

interface RemediationReceiptLike {
    receiptId: string
    action: string
    sourceProposalId: string
    step: string
    recordedAt: number
}

interface ReleaseEvidenceArtifact {
    schemaVersion: string
    adapter: string
    receiptCount: number
    receipts: RemediationReceiptLike[]
}

export class ReleaseEvidenceAdapter implements RuntimeAdapter {
    readonly name = 'release-evidence'
    readonly capabilities: RuntimeCapability[] = ['filesystem', 'custom']

    async execute(request: RuntimeRequest): Promise<RuntimeResult> {
        try {
            switch (request.capability) {
                case 'filesystem':
                    return executeFilesystemAction(request)
                case 'custom':
                    return this.executeCustom(request)
                default:
                    return { success: false, error: `Unsupported capability: ${request.capability}` }
            }
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err)
            return { success: false, error: message }
        }
    }

    private executeCustom(request: RuntimeRequest): RuntimeResult {
        if (request.action !== 'emit_remediation_evidence') {
            return { success: false, error: `Unsupported custom action: ${request.action}` }
        }

        const payload = request.payload ?? {}
        const artifactPath = payload['artifactPath'] as string | undefined
        const markdownLogPath = payload['markdownLogPath'] as string | undefined
        const receipts = payload['receipts']

        if (!artifactPath) {
            return { success: false, error: 'Missing required field: payload.artifactPath' }
        }
        if (!markdownLogPath) {
            return { success: false, error: 'Missing required field: payload.markdownLogPath' }
        }
        if (!Array.isArray(receipts) || !receipts.every(this.isReceipt)) {
            return { success: false, error: 'Missing or invalid field: payload.receipts' }
        }

        const artifact: ReleaseEvidenceArtifact = {
            schemaVersion: '2026-03-07',
            adapter: 'RUNTIME_ADAPTER_HUB_RELEASE_EVIDENCE',
            receiptCount: receipts.length,
            receipts,
        }

        this.writeFile(artifactPath, JSON.stringify(artifact, null, 2) + '\n')
        this.writeFile(markdownLogPath, this.buildMarkdownLog(artifactPath, artifact))

        return {
            success: true,
            data: {
                artifactPath,
                markdownLogPath,
                receiptCount: artifact.receiptCount,
            },
            raw: artifact,
        }
    }

    private buildMarkdownLog(artifactPath: string, artifact: ReleaseEvidenceArtifact): string {
        const actionCounts = this.countBy(artifact.receipts, receipt => receipt.action)
        const stepCounts = this.countBy(artifact.receipts, receipt => receipt.step)
        const proposalIds = [...new Set(artifact.receipts.map(receipt => receipt.sourceProposalId))].sort()
        const recordedAtValues = artifact.receipts.map(receipt => receipt.recordedAt).sort((a, b) => a - b)

        return [
            '# CVF Runtime Adapter Hub Remediation Evidence Log - 2026-03-07',
            '',
            '## Header',
            '',
            `- source artifact: \`${artifactPath.replace(/\\/g, '/')}\``,
            `- schemaVersion: \`${artifact.schemaVersion}\``,
            `- adapter: \`${artifact.adapter}\``,
            `- receiptCount: \`${artifact.receiptCount}\``,
            '',
            '## Action Summary',
            '',
            ...Object.keys(actionCounts).sort().map(action => `- ${action}: \`${actionCounts[action]}\``),
            '',
            '## Step Summary',
            '',
            ...Object.keys(stepCounts).sort().map(step => `- ${step}: \`${stepCounts[step]}\``),
            '',
            '## Proposal Scope',
            '',
            `- proposalIds: \`${proposalIds.join(', ') || 'none'}\``,
            `- firstRecordedAt: \`${recordedAtValues[0] ?? 'UNKNOWN'}\``,
            `- lastRecordedAt: \`${recordedAtValues[recordedAtValues.length - 1] ?? 'UNKNOWN'}\``,
            '',
            '## Receipts',
            '',
            '| Receipt ID | Action | Proposal | Step | Recorded At |',
            '|---|---|---|---|---|',
            ...artifact.receipts.map(
                receipt =>
                    `| \`${receipt.receiptId}\` | \`${receipt.action}\` | \`${receipt.sourceProposalId}\` | \`${receipt.step}\` | \`${receipt.recordedAt}\` |`
            ),
            '',
        ].join('\n')
    }

    private writeFile(filePath: string, content: string): void {
        const dir = path.dirname(filePath)
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true })
        }
        fs.writeFileSync(filePath, content, 'utf-8')
    }

    private isReceipt(value: unknown): value is RemediationReceiptLike {
        if (!value || typeof value !== 'object') {
            return false
        }

        const candidate = value as Partial<RemediationReceiptLike>
        return typeof candidate.receiptId === 'string'
            && typeof candidate.action === 'string'
            && typeof candidate.sourceProposalId === 'string'
            && typeof candidate.step === 'string'
            && typeof candidate.recordedAt === 'number'
    }

    private countBy(
        receipts: RemediationReceiptLike[],
        selector: (receipt: RemediationReceiptLike) => string
    ): Record<string, number> {
        const counts: Record<string, number> = {}
        for (const receipt of receipts) {
            const key = selector(receipt)
            counts[key] = (counts[key] ?? 0) + 1
        }
        return counts
    }
}
