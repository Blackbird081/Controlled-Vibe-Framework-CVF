import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

export type EvidenceStatus = 'pass' | 'warning' | 'missing' | 'info';

export interface ReleaseGateState {
    status: 'pass' | 'unknown';
    command: string;
    sourcePath: string;
    summary: string;
}

export interface ProviderLaneEvidence {
    id: string;
    label: string;
    provider: string;
    model: string;
    status: EvidenceStatus;
    attempted: number;
    accepted: number;
    receipts: number;
    useful: number | null;
    capturedAt: string | null;
    sourcePath: string;
}

export interface EvidenceReceiptLocation {
    id: string;
    label: string;
    status: EvidenceStatus;
    sourcePath: string;
    summary: string;
}

export interface PolicySnapshotRef {
    id: string;
    label: string;
    status: EvidenceStatus;
    sourcePath: string;
    policyIds: string[];
}

export interface GovernanceEvidenceReport {
    generatedAt: string;
    releaseGate: ReleaseGateState;
    providerLanes: ProviderLaneEvidence[];
    evidenceReceipts: EvidenceReceiptLocation[];
    policySnapshots: PolicySnapshotRef[];
    approvalRefs: EvidenceReceiptLocation[];
    boundary: string;
}

interface GovernanceEvidenceOptions {
    repoRoot?: string;
    now?: () => string;
}

const W149_CLOSURE = 'docs/reviews/CVF_W149_CLOSURE_DECISION_2026-05-08.md';
const W141_CLOSURE = 'docs/reviews/CVF_W141_CLOSURE_DECISION_2026-05-08.md';
const W149_DIRECT_ALIBABA = 'docs/reviews/CVF_W149_TRUSTED_FORM_DIRECT_API_ALIBABA_EVIDENCE_2026-05-08.json';
const W149_UI_ALIBABA = 'docs/reviews/CVF_W149_TRUSTED_FORM_UI_ALIBABA_EVIDENCE_2026-05-08.json';
const W149_DEEPSEEK = 'docs/reviews/CVF_W149_TRUSTED_FORM_DEEPSEEK_CONFIRMATORY_EVIDENCE_2026-05-08.json';
const W141_ALIBABA = 'docs/reviews/CVF_W141_TRUSTED_FORM_WIZARD_DISAMBIGUATION_ALIBABA_EVIDENCE_2026-05-08.json';

function readText(repoRoot: string, repoPath: string): string | null {
    const absolutePath = resolve(repoRoot, repoPath);
    if (!existsSync(absolutePath)) return null;
    try {
        return readFileSync(absolutePath, 'utf8');
    } catch {
        return null;
    }
}

function readJson(repoRoot: string, repoPath: string): Record<string, unknown> | null {
    const text = readText(repoRoot, repoPath);
    if (!text) return null;
    try {
        return JSON.parse(text) as Record<string, unknown>;
    } catch {
        return null;
    }
}

function numberValue(value: unknown): number {
    return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function stringValue(value: unknown): string | null {
    return typeof value === 'string' && value.length > 0 ? value : null;
}

function countReceiptRecords(value: unknown): number {
    if (!Array.isArray(value)) return 0;
    return value.filter((record) => (
        typeof record === 'object' &&
        record !== null &&
        'receiptPresent' in record &&
        (record as { receiptPresent?: unknown }).receiptPresent === true
    )).length;
}

function uniqueMatches(text: string | null, pattern: RegExp, limit = 6): string[] {
    if (!text) return [];
    return Array.from(new Set(Array.from(text.matchAll(pattern), (match) => match[0]))).slice(0, limit);
}

function laneFromJson(
    repoRoot: string,
    id: string,
    label: string,
    sourcePath: string,
): ProviderLaneEvidence {
    const json = readJson(repoRoot, sourcePath);

    if (!json) {
        return {
            id,
            label,
            provider: 'unknown',
            model: 'unknown',
            status: 'missing',
            attempted: 0,
            accepted: 0,
            receipts: 0,
            useful: null,
            capturedAt: null,
            sourcePath,
        };
    }

    const attempted = numberValue(json.attempted ?? json.attemptedJourneys);
    const accepted = numberValue(json.accepted ?? json.acceptedWithReceipt);
    const receipts = numberValue(json.acceptedWithReceipt) || countReceiptRecords(json.records);
    const useful = typeof json.usefulByHeuristic === 'number' ? json.usefulByHeuristic : null;
    const status = attempted > 0 && accepted === attempted ? 'pass' : 'warning';

    return {
        id,
        label,
        provider: stringValue(json.provider) ?? 'unknown',
        model: stringValue(json.model) ?? 'unknown',
        status,
        attempted,
        accepted,
        receipts,
        useful,
        capturedAt: stringValue(json.capturedAt),
        sourcePath,
    };
}

function buildReleaseGate(repoRoot: string): ReleaseGateState {
    const text = readText(repoRoot, W149_CLOSURE);
    const hasReleaseGateCommand = Boolean(text?.includes('python scripts/run_cvf_release_gate_bundle.py --json'));
    const hasPass = Boolean(text?.includes('CP7 release gate') && text.includes('PASS'));

    return {
        status: hasReleaseGateCommand && hasPass ? 'pass' : 'unknown',
        command: 'python scripts/run_cvf_release_gate_bundle.py --json',
        sourcePath: W149_CLOSURE,
        summary: hasReleaseGateCommand && hasPass
            ? 'Latest recorded release-quality gate state is PASS in W149 closure.'
            : 'No recorded release gate PASS could be read from the latest closure source.',
    };
}

function evidenceLocation(repoRoot: string, id: string, label: string, sourcePath: string, summary: string): EvidenceReceiptLocation {
    return {
        id,
        label,
        status: existsSync(resolve(repoRoot, sourcePath)) ? 'pass' : 'missing',
        sourcePath,
        summary,
    };
}

function policySnapshot(repoRoot: string, id: string, label: string, sourcePath: string): PolicySnapshotRef {
    const text = readText(repoRoot, sourcePath);
    const policyIds = uniqueMatches(text, /pol-\d{8}-\d{4}/g);

    return {
        id,
        label,
        status: policyIds.length > 0 ? 'pass' : existsSync(resolve(repoRoot, sourcePath)) ? 'info' : 'missing',
        sourcePath,
        policyIds,
    };
}

export function getGovernanceEvidenceReport(options: GovernanceEvidenceOptions = {}): GovernanceEvidenceReport {
    const repoRoot = options.repoRoot ?? resolve(process.cwd(), '..', '..', '..');
    const now = options.now ?? (() => new Date().toISOString());

    return {
        generatedAt: now(),
        releaseGate: buildReleaseGate(repoRoot),
        providerLanes: [
            laneFromJson(repoRoot, 'w149-alibaba-direct', 'W149 Alibaba Direct API', W149_DIRECT_ALIBABA),
            laneFromJson(repoRoot, 'w149-alibaba-ui', 'W149 Alibaba Browser UI', W149_UI_ALIBABA),
            laneFromJson(repoRoot, 'w149-deepseek', 'W149 DeepSeek Confirmatory', W149_DEEPSEEK),
            laneFromJson(repoRoot, 'w141-alibaba-ui', 'W141 Alibaba UI Stability', W141_ALIBABA),
        ],
        evidenceReceipts: [
            evidenceLocation(repoRoot, 'w149-closure', 'W149 closure decision', W149_CLOSURE, 'Latest trusted-form live value gate closure and release gate summary.'),
            evidenceLocation(repoRoot, 'w149-direct-json', 'W149 direct API JSON', W149_DIRECT_ALIBABA, 'Alibaba direct API evidence packet.'),
            evidenceLocation(repoRoot, 'w149-ui-json', 'W149 browser UI JSON', W149_UI_ALIBABA, 'Alibaba browser UI evidence packet with receipt observations.'),
            evidenceLocation(repoRoot, 'w149-deepseek-json', 'W149 DeepSeek JSON', W149_DEEPSEEK, 'DeepSeek confirmatory evidence packet.'),
            evidenceLocation(repoRoot, 'w141-closure', 'W141 closure decision', W141_CLOSURE, 'Prior runtime-stability closure used as baseline.'),
        ],
        policySnapshots: [
            policySnapshot(repoRoot, 'w149-ui-policy-ids', 'W149 UI policy ids', W149_UI_ALIBABA),
            policySnapshot(repoRoot, 'w141-ui-policy-ids', 'W141 UI policy ids', W141_ALIBABA),
        ],
        approvalRefs: [
            {
                id: 'approval-ids',
                label: 'Approval ids',
                status: 'info',
                sourcePath: W149_CLOSURE,
                summary: 'No approval ids are required for the recorded W149 trusted-form ALLOW receipts.',
            },
        ],
        boundary: 'Read-only evidence index. It does not run release gates, call providers, or mutate governance state.',
    };
}
