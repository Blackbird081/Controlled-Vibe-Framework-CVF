import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import type {
    CrossExtensionRemediationAdapter,
    CrossExtensionRemediationReceipt,
} from '../types/index.js'

export class InMemoryRemediationAdapter implements CrossExtensionRemediationAdapter {
    private receipts: string[] = []

    execute(step: string, context: { action: string; sourceProposalId: string }): string {
        const receipt = `${context.action}:${context.sourceProposalId}:${step}`
        this.receipts.push(receipt)
        return receipt
    }

    listReceipts(): readonly string[] {
        return this.receipts
    }

    clear(): void {
        this.receipts.length = 0
    }
}

interface FileBackedRemediationArtifact {
    schemaVersion: '2026-03-07'
    adapter: 'FILE_BACKED_REMEDIATION_ADAPTER'
    receiptCount: number
    receipts: CrossExtensionRemediationReceipt[]
}

export class FileBackedRemediationAdapter implements CrossExtensionRemediationAdapter {
    constructor(private readonly artifactPath: string) {}

    execute(step: string, context: { action: string; sourceProposalId: string }): string {
        const artifact = this.readArtifact()
        const receipt = this.buildReceipt(step, context)
        artifact.receipts.push(receipt)
        artifact.receiptCount = artifact.receipts.length
        this.writeArtifact(artifact)
        return receipt.receiptId
    }

    readArtifact(): FileBackedRemediationArtifact {
        if (!existsSync(this.artifactPath)) {
            return this.emptyArtifact()
        }

        const raw = JSON.parse(readFileSync(this.artifactPath, 'utf-8')) as Partial<FileBackedRemediationArtifact>
        const receipts = Array.isArray(raw.receipts)
            ? raw.receipts.filter(this.isReceipt)
            : []
        return {
            schemaVersion: '2026-03-07',
            adapter: 'FILE_BACKED_REMEDIATION_ADAPTER',
            receiptCount: receipts.length,
            receipts,
        }
    }

    listReceipts(): readonly string[] {
        return this.readArtifact().receipts.map(receipt => receipt.receiptId)
    }

    clear(): void {
        if (existsSync(this.artifactPath)) {
            rmSync(this.artifactPath)
        }
    }

    private emptyArtifact(): FileBackedRemediationArtifact {
        return {
            schemaVersion: '2026-03-07',
            adapter: 'FILE_BACKED_REMEDIATION_ADAPTER',
            receiptCount: 0,
            receipts: [],
        }
    }

    private buildReceipt(
        step: string,
        context: { action: string; sourceProposalId: string }
    ): CrossExtensionRemediationReceipt {
        const recordedAt = Date.now()
        return {
            receiptId: `${context.action}:${context.sourceProposalId}:${step}`,
            action: context.action as CrossExtensionRemediationReceipt['action'],
            sourceProposalId: context.sourceProposalId,
            step,
            recordedAt,
        }
    }

    private writeArtifact(artifact: FileBackedRemediationArtifact): void {
        mkdirSync(dirname(this.artifactPath), { recursive: true })
        writeFileSync(this.artifactPath, JSON.stringify(artifact, null, 2) + '\n', 'utf-8')
    }

    private isReceipt(value: unknown): value is CrossExtensionRemediationReceipt {
        if (!value || typeof value !== 'object') {
            return false
        }

        const candidate = value as Partial<CrossExtensionRemediationReceipt>
        return typeof candidate.receiptId === 'string'
            && typeof candidate.action === 'string'
            && typeof candidate.sourceProposalId === 'string'
            && typeof candidate.step === 'string'
            && typeof candidate.recordedAt === 'number'
    }
}

export class ReleaseEvidenceRemediationAdapter implements CrossExtensionRemediationAdapter {
    private readonly fileAdapter: FileBackedRemediationAdapter

    constructor(
        private readonly artifactPath: string,
        private readonly markdownLogPath: string
    ) {
        this.fileAdapter = new FileBackedRemediationAdapter(artifactPath)
    }

    execute(step: string, context: { action: string; sourceProposalId: string }): string {
        const receiptId = this.fileAdapter.execute(step, context)
        this.writeMarkdownLog(this.fileAdapter.readArtifact())
        return receiptId
    }

    listReceipts(): readonly string[] {
        return this.fileAdapter.listReceipts()
    }

    clear(): void {
        this.fileAdapter.clear()
        if (existsSync(this.markdownLogPath)) {
            rmSync(this.markdownLogPath)
        }
    }

    private writeMarkdownLog(artifact: FileBackedRemediationArtifact): void {
        const actionCounts = this.countBy(artifact.receipts, receipt => receipt.action)
        const stepCounts = this.countBy(artifact.receipts, receipt => receipt.step)
        const proposalIds = [...new Set(artifact.receipts.map(receipt => receipt.sourceProposalId))].sort()
        const recordedAtValues = artifact.receipts.map(receipt => receipt.recordedAt).sort((a, b) => a - b)

        const lines = [
            '# CVF W4 Remediation Receipt Log - 2026-03-07',
            '',
            '## Header',
            '',
            `- source artifact: \`${this.artifactPath.replace(/\\/g, '/')}\``,
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
        ]

        mkdirSync(dirname(this.markdownLogPath), { recursive: true })
        writeFileSync(this.markdownLogPath, lines.join('\n'), 'utf-8')
    }

    private countBy(
        receipts: CrossExtensionRemediationReceipt[],
        selector: (receipt: CrossExtensionRemediationReceipt) => string
    ): Record<string, number> {
        const counts: Record<string, number> = {}
        for (const receipt of receipts) {
            const key = selector(receipt)
            counts[key] = (counts[key] ?? 0) + 1
        }
        return counts
    }
}
