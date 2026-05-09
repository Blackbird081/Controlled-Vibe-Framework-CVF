/**
 * CVF W67-T1 CP2 / W69-T1 — Governed Asset Registry
 *
 * Bounded file-based registry with lifecycle semantics.
 * Write path is completely isolated from /api/execute and PVV evidence files.
 *
 * Persistence: JSONL at data/governed-asset-registry.jsonl (relative to cvf-web root).
 * Append-only — two record types coexist in the file:
 *   - AssetRegistryEntry lines (registration records)
 *   - RegistryRetirementRecord lines (retirement events, identified by _type: 'retirement')
 *
 * Lifecycle rule (W69-T1):
 *   - source_ref + candidate_asset_type is the logical identity key
 *   - at most one ACTIVE entry may exist per logical identity
 *   - retirement is append-only: a retirement record marks a prior entry as retired
 *   - re-registration is allowed only after the prior active entry has been retired
 *   - historical lines are never mutated
 *
 * MVP note: local-server persistence only. Serverless deployment requires an
 * external store; that is a future concern outside W67-T1/W68-T1/W69-T1 scope.
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import type {
    AgentContinuityDelegationRecord,
    BoundaryFirstGovernanceRecord,
    GovernedCapabilityRecord,
    GovernedContextProfileMetadata,
    ScopedKnowledgeProviderBoundary,
} from '@/lib/cvf-add-runtime-doctrine';

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
    /** Lifecycle status — 'active' on registration; 'retired' after retireEntry(). */
    lifecycleStatus: 'active' | 'retired';
    /** ISO timestamp; present when lifecycleStatus === 'retired'. */
    retiredAt?: string;
    assetName: string;
    assetVersion: string;
    governedCapability?: GovernedCapabilityRecord;
    boundaryFirstGovernance?: BoundaryFirstGovernanceRecord;
    governedContextProfile?: GovernedContextProfileMetadata;
    continuityDelegation?: AgentContinuityDelegationRecord;
    scopedKnowledgeProvider?: ScopedKnowledgeProviderBoundary;
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
    governedCapability?: GovernedCapabilityRecord;
    boundaryFirstGovernance?: BoundaryFirstGovernanceRecord;
    governedContextProfile?: GovernedContextProfileMetadata;
    continuityDelegation?: AgentContinuityDelegationRecord;
    scopedKnowledgeProvider?: ScopedKnowledgeProviderBoundary;
}

export interface RegistryFilter {
    status?: 'active' | 'retired';
    source_ref?: string;
    candidate_asset_type?: string;
    capability_class?: string;
    boundary_policy_class?: string;
    policy_authority?: boolean;
}

/** Internal type for retirement events written into the JSONL file. */
interface RegistryRetirementRecord {
    _type: 'retirement';
    targetId: string;
    retiredAt: string;
}

function ensureRegistryDir(): void {
    if (!fs.existsSync(REGISTRY_DIR)) {
        fs.mkdirSync(REGISTRY_DIR, { recursive: true });
    }
}

/**
 * Reads all JSONL lines; separates entry records from retirement records.
 * Returns entries annotated with their effective lifecycle status.
 */
function readAllLines(): AssetRegistryEntry[] {
    if (!fs.existsSync(REGISTRY_FILE)) return [];

    const lines = fs
        .readFileSync(REGISTRY_FILE, 'utf-8')
        .split('\n')
        .filter((line) => line.trim().length > 0);

    const entryMap = new Map<string, AssetRegistryEntry>();
    const retirements = new Map<string, string>(); // targetId → retiredAt

    for (const line of lines) {
        try {
            const parsed = JSON.parse(line) as
                | RegistryRetirementRecord
                | Partial<AssetRegistryEntry>;
            if ('_type' in parsed && parsed._type === 'retirement') {
                const r = parsed as RegistryRetirementRecord;
                retirements.set(r.targetId, r.retiredAt);
            } else {
                // Default legacy entries (pre-W69) to 'active' if field absent
                const raw = parsed as Omit<AssetRegistryEntry, 'lifecycleStatus'> &
                    Partial<Pick<AssetRegistryEntry, 'lifecycleStatus'>>;
                entryMap.set(raw.id, {
                    ...raw,
                    lifecycleStatus: raw.lifecycleStatus ?? 'active',
                } as AssetRegistryEntry);
            }
        } catch {
            // skip malformed lines — registry is append-only; bad lines are inert
        }
    }

    // Apply retirement markers to entries
    const result: AssetRegistryEntry[] = [];
    for (const entry of entryMap.values()) {
        if (retirements.has(entry.id)) {
            result.push({
                ...entry,
                lifecycleStatus: 'retired',
                retiredAt: retirements.get(entry.id),
            });
        } else {
            result.push(entry);
        }
    }
    return result;
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
        lifecycleStatus: 'active',
        assetName: input.assetName ?? input.source_ref.split('/').pop() ?? input.source_ref,
        assetVersion: input.assetVersion ?? '1.0.0',
        governedCapability: input.governedCapability,
        boundaryFirstGovernance: input.boundaryFirstGovernance,
        governedContextProfile: input.governedContextProfile,
        continuityDelegation: input.continuityDelegation,
        scopedKnowledgeProvider: input.scopedKnowledgeProvider,
    };

    fs.appendFileSync(REGISTRY_FILE, JSON.stringify(entry) + '\n', 'utf-8');
    return entry;
}

export function listRegistryEntries(): AssetRegistryEntry[] {
    return readAllLines();
}

export function getRegistryEntry(id: string): AssetRegistryEntry | null {
    return readAllLines().find((e) => e.id === id) ?? null;
}

/**
 * Retires an active registry entry (append-only).
 * Appends a retirement record; the original entry line is not mutated.
 * Returns the entry with lifecycleStatus='retired', or null if not found or already retired.
 */
export function retireEntry(id: string): AssetRegistryEntry | null {
    const entry = readAllLines().find((e) => e.id === id && e.lifecycleStatus === 'active');
    if (!entry) return null;

    const retiredAt = new Date().toISOString();
    const record: RegistryRetirementRecord = { _type: 'retirement', targetId: id, retiredAt };

    ensureRegistryDir();
    fs.appendFileSync(REGISTRY_FILE, JSON.stringify(record) + '\n', 'utf-8');
    return { ...entry, lifecycleStatus: 'retired', retiredAt };
}

/**
 * Duplicate detection: source_ref + candidate_asset_type, ACTIVE entries only.
 * Returns the active entry if found; null if the logical asset is unregistered or retired.
 * Re-registration is allowed only when this returns null.
 */
export function findDuplicate(
    sourceRef: string,
    candidateAssetType: string,
): AssetRegistryEntry | null {
    return (
        readAllLines().find(
            (e) =>
                e.source_ref === sourceRef &&
                e.candidate_asset_type === candidateAssetType &&
                e.lifecycleStatus === 'active',
        ) ?? null
    );
}

/** Filtered read for operator use. All filter fields are optional and ANDed. */
export function filterRegistryEntries(filter: RegistryFilter): AssetRegistryEntry[] {
    let entries = readAllLines();
    if (filter.status !== undefined) {
        entries = entries.filter((e) => e.lifecycleStatus === filter.status);
    }
    if (filter.source_ref !== undefined) {
        entries = entries.filter((e) => e.source_ref === filter.source_ref);
    }
    if (filter.candidate_asset_type !== undefined) {
        entries = entries.filter((e) => e.candidate_asset_type === filter.candidate_asset_type);
    }
    if (filter.capability_class !== undefined) {
        entries = entries.filter(
            (e) => e.governedCapability?.capabilityClass === filter.capability_class,
        );
    }
    if (filter.boundary_policy_class !== undefined) {
        entries = entries.filter(
            (e) => e.boundaryFirstGovernance?.policyClass === filter.boundary_policy_class,
        );
    }
    if (filter.policy_authority !== undefined) {
        entries = entries.filter(
            (e) => e.scopedKnowledgeProvider?.policyAuthority === filter.policy_authority,
        );
    }
    return entries;
}
