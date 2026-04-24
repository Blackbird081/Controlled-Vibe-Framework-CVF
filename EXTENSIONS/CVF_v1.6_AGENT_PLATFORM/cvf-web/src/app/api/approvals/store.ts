import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

// C4.0: Unified ApprovalRequestRecord for web API layer.
// Single canonical model for all web-layer approval operations.
// The guard contract's ApprovalRequest (enterprise-org) remains unchanged (contract layer).

export type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

export interface ApprovalRequestContext {
    templateName?: string;
    intent?: string;
    cvfPhase?: string;
    cvfRiskLevel?: string;
    provider?: string;
    model?: string;
    policySnapshotId?: string;
    envelopeId?: string;
}

export interface ApprovalRequestSnapshot {
    templateId: string;
    templateName: string;
    intent: string;
    inputs?: Record<string, string>;
    provider?: string;
    model?: string;
    cvfPhase?: string;
    cvfRiskLevel?: string;
    knowledgeCollectionId?: string | null;
    actorId?: string;
    actorOrgId?: string | null;
    actorTeamId?: string | null;
    actorAuthMode?: 'session' | 'service';
}

export interface ApprovalRequestRecord {
    id: string;
    templateId: string;
    templateName: string;
    intent: string;
    toolId?: string;
    toolPayload?: Record<string, unknown>;
    riskLevel?: string;
    phase?: string;
    reason: string;
    blockReason?: string;
    requestContext?: ApprovalRequestContext;
    expiresAt: string;
    status: ApprovalStatus;
    submittedAt: string;
    reviewedAt?: string;
    reviewedBy?: string;
    reviewComment?: string;
    requestHash?: string;
    requestSnapshot?: ApprovalRequestSnapshot;
    submittedByActorId?: string;
    submittedByOrgId?: string | null;
    submittedByTeamId?: string | null;
    submittedByAuthMode?: 'session' | 'service';
}

class ApprovalStore extends Map<string, ApprovalRequestRecord> {
    constructor(private readonly filePath?: string) {
        super();
        this.load();
    }

    private load(): void {
        if (!this.filePath || !existsSync(this.filePath)) {
            return;
        }

        try {
            const raw = JSON.parse(readFileSync(this.filePath, 'utf8')) as ApprovalRequestRecord[];
            super.clear();
            for (const record of raw) {
                super.set(record.id, record);
            }
        } catch {
            super.clear();
        }
    }

    private persist(): void {
        if (!this.filePath) {
            return;
        }

        try {
            mkdirSync(dirname(this.filePath), { recursive: true });
            const tmpPath = `${this.filePath}.tmp`;
            writeFileSync(tmpPath, JSON.stringify(Array.from(this.values()), null, 2), 'utf8');
            renameSync(tmpPath, this.filePath);
        } catch (error) {
            console.warn('[approvals-store] persist failed:', error);
        }
    }

    override set(key: string, value: ApprovalRequestRecord): this {
        const result = super.set(key, value);
        this.persist();
        return result;
    }

    override delete(key: string): boolean {
        const deleted = super.delete(key);
        this.persist();
        return deleted;
    }

    override clear(): void {
        super.clear();
        this.persist();
    }
}

export class FileBackedApprovalStore extends ApprovalStore {
    constructor(filePath: string) {
        super(filePath);
    }
}

function createApprovalStore(): ApprovalStore {
    if (process.env.NODE_ENV === 'test') {
        return new ApprovalStore();
    }

    const storePath = process.env.APPROVAL_STORE_PATH ?? join(process.cwd(), '.data', 'approval-store.json');
    return new FileBackedApprovalStore(storePath);
}

const approvalStore = createApprovalStore();

export function getApprovalStore(): ApprovalStore {
    return approvalStore;
}
