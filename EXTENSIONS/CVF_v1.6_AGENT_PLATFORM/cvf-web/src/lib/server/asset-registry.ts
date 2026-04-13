/**
 * CVF W67-T1 CP2 — Governed Asset Registry
 *
 * Bounded file-based registry sink for approved `registry_ready_governed_asset` outputs.
 * Write path is completely isolated from /api/execute and PVV evidence files.
 *
 * Persistence: JSONL at data/governed-asset-registry.jsonl (relative to cvf-web root).
 * Each line is one AssetRegistryEntry (append-only, auditable).
 *
 * MVP note: local-server persistence only. Serverless deployment requires an
 * external store; that is a future concern outside W67-T1 scope.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const REGISTRY_DIR = path.join(process.cwd(), 'data');
const REGISTRY_FILE = path.join(REGISTRY_DIR, 'governed-asset-registry.jsonl');

export interface AssetRegistryEntry {
    id: string;
    registeredAt: string;
    source_ref: string;
    candidate_asset_type: string;
    description_or_trigger: string;
    approvalState: string;
    governanceOwner: string;
    riskLevel: string;
    registryRefs: string[];
    workflowStatus: 'registry_ready';
    assetName: string;
    assetVersion: string;
}

export interface RegisterAssetInput {
    source_ref: string;
    candidate_asset_type: string;
    description_or_trigger: string;
    approvalState: string;
    governanceOwner: string;
    riskLevel: string;
    registryRefs?: string[];
    assetName?: string;
    assetVersion?: string;
}

function ensureRegistryDir(): void {
    if (!fs.existsSync(REGISTRY_DIR)) {
        fs.mkdirSync(REGISTRY_DIR, { recursive: true });
    }
}

export function registerAsset(input: RegisterAssetInput): AssetRegistryEntry {
    ensureRegistryDir();

    const entry: AssetRegistryEntry = {
        id: crypto.randomUUID(),
        registeredAt: new Date().toISOString(),
        source_ref: input.source_ref,
        candidate_asset_type: input.candidate_asset_type,
        description_or_trigger: input.description_or_trigger,
        approvalState: input.approvalState,
        governanceOwner: input.governanceOwner,
        riskLevel: input.riskLevel,
        registryRefs: input.registryRefs ?? [],
        workflowStatus: 'registry_ready',
        assetName: input.assetName ?? input.source_ref.split('/').pop() ?? input.source_ref,
        assetVersion: input.assetVersion ?? '1.0.0',
    };

    fs.appendFileSync(REGISTRY_FILE, JSON.stringify(entry) + '\n', 'utf-8');
    return entry;
}

export function listRegistryEntries(): AssetRegistryEntry[] {
    if (!fs.existsSync(REGISTRY_FILE)) return [];

    const lines = fs.readFileSync(REGISTRY_FILE, 'utf-8')
        .split('\n')
        .filter((line) => line.trim().length > 0);

    const entries: AssetRegistryEntry[] = [];
    for (const line of lines) {
        try {
            entries.push(JSON.parse(line) as AssetRegistryEntry);
        } catch {
            // skip malformed lines — registry is append-only; bad lines are inert
        }
    }
    return entries;
}

export function getRegistryEntry(id: string): AssetRegistryEntry | null {
    return listRegistryEntries().find((e) => e.id === id) ?? null;
}

/**
 * Duplicate detection key: source_ref + candidate_asset_type.
 * The same logical asset (same source path, same type) may only be registered once.
 * Returns the existing entry if found, null otherwise.
 */
export function findDuplicate(
    sourceRef: string,
    candidateAssetType: string,
): AssetRegistryEntry | null {
    return (
        listRegistryEntries().find(
            (e) => e.source_ref === sourceRef && e.candidate_asset_type === candidateAssetType,
        ) ?? null
    );
}
