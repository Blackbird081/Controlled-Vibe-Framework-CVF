/**
 * Direct tests for asset-registry.ts helper behavior.
 * Verifies: missing file, malformed lines, valid entries, duplicate detection,
 * write behavior, lifecycle semantics (W69-T1), and filtered reads.
 *
 * CP3 persistence posture (documented):
 * - JSONL at data/governed-asset-registry.jsonl (relative to process.cwd())
 * - File is created on first write; directory is created if missing
 * - Two record types coexist: AssetRegistryEntry lines + RegistryRetirementRecord lines
 * - Retirement records are identified by _type: 'retirement'
 * - Malformed lines are skipped silently — registry remains readable
 * - Local-server MVP only: serverless deployment requires an external store
 * - No crash recovery: if the file is corrupted beyond JSONL parse, valid lines
 *   before the corruption are still returned; lines after are skipped
 *
 * Lifecycle rule (W69-T1):
 * - source_ref + candidate_asset_type is the logical identity key
 * - at most one ACTIVE entry may exist per logical identity
 * - retirement is append-only: a retirement record marks a prior entry as retired
 * - re-registration is allowed only after the prior active entry has been retired
 * - historical lines are never mutated
 */

import { beforeEach, describe, expect, it, vi } from 'vitest';

// Hoist mocks before imports so module factory runs before registry module loads
const existsSyncMock = vi.hoisted(() => vi.fn());
const readFileSyncMock = vi.hoisted(() => vi.fn());
const appendFileSyncMock = vi.hoisted(() => vi.fn());
const mkdirSyncMock = vi.hoisted(() => vi.fn());

vi.mock('fs', () => ({
    default: {
        existsSync: existsSyncMock,
        readFileSync: readFileSyncMock,
        appendFileSync: appendFileSyncMock,
        mkdirSync: mkdirSyncMock,
    },
    existsSync: existsSyncMock,
    readFileSync: readFileSyncMock,
    appendFileSync: appendFileSyncMock,
    mkdirSync: mkdirSyncMock,
}));

vi.mock('crypto', () => ({
    default: {
        randomUUID: () => 'mock-uuid-1234',
    },
    randomUUID: () => 'mock-uuid-1234',
}));

import {
    listRegistryEntries,
    getRegistryEntry,
    registerAsset,
    findDuplicate,
    retireEntry,
    filterRegistryEntries,
} from './asset-registry';

const VALID_ENTRY = {
    id: 'entry-001',
    registeredAt: '2026-04-13T10:00:00.000Z',
    source_ref: 'CVF_ADDING_NEW/skill.md',
    candidate_asset_type: 'W7SkillAsset',
    description_or_trigger: 'Convert shell skill into governed CVF asset',
    approvalState: 'approved',
    governanceOwner: 'cvf-architecture',
    riskLevel: 'R1',
    registryRefs: ['cvf://registry/w7/test'],
    workflowStatus: 'registry_ready' as const,
    lifecycleStatus: 'active' as const,
    assetName: 'skill.md',
    assetVersion: '1.0.0',
};

const VALID_ENTRY_2 = {
    ...VALID_ENTRY,
    id: 'entry-002',
    source_ref: 'CVF_TOOLS/tool.md',
    candidate_asset_type: 'W7ToolAsset',
    assetName: 'tool.md',
};

/** Retirement record line as it appears in JSONL. */
const RETIREMENT_RECORD = {
    _type: 'retirement' as const,
    targetId: 'entry-001',
    retiredAt: '2026-04-13T11:00:00.000Z',
};

const CVF_ADD_METADATA = {
    governedCapability: {
        capabilityId: 'cap-cvf-adding-new-skill-md-convert-shell-skill-into-governed-cvf-asset',
        capabilityName: 'Convert shell skill into governed CVF asset',
        sourceProvenance: 'CVF_ADDING_NEW/skill.md',
        sourceClass: 'document_bundle' as const,
        capabilityClass: 'skill' as const,
        riskClass: 'R1' as const,
        ownerSurface: 'cvf-architecture',
        allowedOperations: ['record provenance'],
        blockedOperations: ['execute without approved runtime adapter'],
        sandboxTier: 'read_only' as const,
        policyBinding: 'CVF_GOVERNED_CAPABILITY_INTAKE_DOCTRINE_2026-05-07',
        evidenceRequirement: 'unit' as const,
        freshnessStatus: 'unknown' as const,
        evaluationStatus: 'proposed' as const,
        retirementCondition: 'Reassess when source, owner, policy, or runtime behavior changes.',
    },
    boundaryFirstGovernance: {
        policyClass: 'restricted_execution_path' as const,
        agentBehavior: 'follow_restricted_path' as const,
        operatorDecisionRequired: false,
        reasons: ['External capability may proceed only through governed asset intake path.'],
        candidateW7Signals: {
            pathLockSignal: true,
            minimalResponseMatch: false,
            restrictedPathCount: 1,
        },
    },
    governedContextProfile: {
        taskContextType: 'external_asset_governance_prepare',
        capabilityNeed: 'skill',
        skillMatch: 'high' as const,
        contextBudget: 'compact' as const,
        freshnessRequirement: 'unknown' as const,
        reuseCandidate: true,
        reinjectionPolicy: 'artifact_pointer' as const,
        handoffNeed: 'closure' as const,
        evidenceSensitivity: 'medium' as const,
        ownerSurfaceHint: 'cvf-architecture',
        advisoryOnly: true as const,
    },
    continuityDelegation: {
        phase: 'closure' as const,
        checkpointRequired: true,
        handoffUpdateRequired: true,
        delegationAllowed: false,
        delegationAuthority: 'none' as const,
        artifactRefs: ['docs/reference/CVF_GOVERNED_CAPABILITY_INTAKE_DOCTRINE_2026-05-07.md'],
        blockedDelegationReasons: ['External capability intake does not grant worker/runtime authority by itself.'],
        nextOwnerSurface: 'cvf-architecture',
    },
    scopedKnowledgeProvider: {
        providerId: 'source:CVF_ADDING_NEW/skill.md',
        sourcePath: 'CVF_ADDING_NEW/skill.md',
        sourceClass: 'example' as const,
        freshness: 'unknown' as const,
        confidence: 'medium' as const,
        scopeBoundary: 'External asset intake context only; no policy authority.',
        retrievalReason: 'Convert shell skill into governed CVF asset',
        ownerSurface: 'knowledge-layer',
        policyAuthority: false as const,
    },
};

describe('asset-registry', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('listRegistryEntries()', () => {
        it('returns empty array when registry file does not exist', () => {
            existsSyncMock.mockReturnValue(false);

            const result = listRegistryEntries();

            expect(result).toEqual([]);
            expect(readFileSyncMock).not.toHaveBeenCalled();
        });

        it('returns parsed entries when file contains valid JSONL', () => {
            existsSyncMock.mockReturnValue(true);
            readFileSyncMock.mockReturnValue(
                JSON.stringify(VALID_ENTRY) + '\n' + JSON.stringify(VALID_ENTRY_2) + '\n',
            );

            const result = listRegistryEntries();

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('entry-001');
            expect(result[1].id).toBe('entry-002');
        });

        it('skips malformed lines and returns remaining valid entries (CP3 resilience)', () => {
            existsSyncMock.mockReturnValue(true);
            readFileSyncMock.mockReturnValue(
                JSON.stringify(VALID_ENTRY) +
                    '\n' +
                    'THIS IS NOT JSON {{{{\n' +
                    JSON.stringify(VALID_ENTRY_2) +
                    '\n',
            );

            const result = listRegistryEntries();

            expect(result).toHaveLength(2);
            expect(result[0].id).toBe('entry-001');
            expect(result[1].id).toBe('entry-002');
        });

        it('returns empty array when file exists but is empty', () => {
            existsSyncMock.mockReturnValue(true);
            readFileSyncMock.mockReturnValue('');

            const result = listRegistryEntries();

            expect(result).toEqual([]);
        });

        it('returns empty array when file contains only blank lines', () => {
            existsSyncMock.mockReturnValue(true);
            readFileSyncMock.mockReturnValue('\n\n\n');

            const result = listRegistryEntries();

            expect(result).toEqual([]);
        });
    });

    describe('getRegistryEntry()', () => {
        it('returns entry by id when found', () => {
            existsSyncMock.mockReturnValue(true);
            readFileSyncMock.mockReturnValue(
                JSON.stringify(VALID_ENTRY) + '\n' + JSON.stringify(VALID_ENTRY_2) + '\n',
            );

            const result = getRegistryEntry('entry-002');

            expect(result).not.toBeNull();
            expect(result?.id).toBe('entry-002');
            expect(result?.source_ref).toBe('CVF_TOOLS/tool.md');
        });

        it('returns null when id not found', () => {
            existsSyncMock.mockReturnValue(true);
            readFileSyncMock.mockReturnValue(JSON.stringify(VALID_ENTRY) + '\n');

            const result = getRegistryEntry('nonexistent-id');

            expect(result).toBeNull();
        });

        it('returns null when registry file does not exist', () => {
            existsSyncMock.mockReturnValue(false);

            const result = getRegistryEntry('entry-001');

            expect(result).toBeNull();
        });
    });

    describe('findDuplicate()', () => {
        it('returns existing entry when source_ref + candidate_asset_type match (active)', () => {
            existsSyncMock.mockReturnValue(true);
            readFileSyncMock.mockReturnValue(JSON.stringify(VALID_ENTRY) + '\n');

            const result = findDuplicate('CVF_ADDING_NEW/skill.md', 'W7SkillAsset');

            expect(result).not.toBeNull();
            expect(result?.id).toBe('entry-001');
        });

        it('returns null when source_ref matches but candidate_asset_type differs', () => {
            existsSyncMock.mockReturnValue(true);
            readFileSyncMock.mockReturnValue(JSON.stringify(VALID_ENTRY) + '\n');

            const result = findDuplicate('CVF_ADDING_NEW/skill.md', 'W7ToolAsset');

            expect(result).toBeNull();
        });

        it('returns null when registry is empty', () => {
            existsSyncMock.mockReturnValue(false);

            const result = findDuplicate('CVF_ADDING_NEW/skill.md', 'W7SkillAsset');

            expect(result).toBeNull();
        });
    });

    describe('registerAsset()', () => {
        it('creates registry directory and appends entry to file', () => {
            existsSyncMock.mockReturnValue(false);

            const entry = registerAsset({
                source_ref: 'CVF_ADDING_NEW/skill.md',
                candidate_asset_type: 'W7SkillAsset',
                description_or_trigger: 'Convert shell skill into governed CVF asset',
                approvalState: 'approved',
                governanceOwner: 'cvf-architecture',
                riskLevel: 'R1',
                registryRefs: ['cvf://registry/w7/test'],
            });

            expect(mkdirSyncMock).toHaveBeenCalledOnce();
            expect(appendFileSyncMock).toHaveBeenCalledOnce();
            expect(entry.id).toBe('mock-uuid-1234');
            expect(entry.workflowStatus).toBe('registry_ready');
            expect(entry.approvalState).toBe('approved');
        });

        it('derives assetName from source_ref when not provided', () => {
            existsSyncMock.mockReturnValue(true);

            const entry = registerAsset({
                source_ref: 'CVF_ADDING_NEW/skill.md',
                candidate_asset_type: 'W7SkillAsset',
                description_or_trigger: 'test',
                approvalState: 'approved',
                governanceOwner: 'cvf-operator',
                riskLevel: 'R1',
            });

            expect(entry.assetName).toBe('skill.md');
            expect(entry.assetVersion).toBe('1.0.0');
        });

        it('appended line is valid JSON matching the returned entry', () => {
            existsSyncMock.mockReturnValue(true);
            let appendedLine = '';
            appendFileSyncMock.mockImplementation((_file: string, content: string) => {
                appendedLine = content;
            });

            const entry = registerAsset({
                source_ref: 'CVF_ADDING_NEW/skill.md',
                candidate_asset_type: 'W7SkillAsset',
                description_or_trigger: 'test',
                approvalState: 'approved',
                governanceOwner: 'cvf-operator',
                riskLevel: 'R1',
            });

            const parsed = JSON.parse(appendedLine.trim());
            expect(parsed.id).toBe(entry.id);
            expect(parsed.workflowStatus).toBe('registry_ready');
        });

        it('registered entry has lifecycleStatus active', () => {
            existsSyncMock.mockReturnValue(true);

            const entry = registerAsset({
                source_ref: 'CVF_ADDING_NEW/skill.md',
                candidate_asset_type: 'W7SkillAsset',
                description_or_trigger: 'test',
                approvalState: 'approved',
                governanceOwner: 'cvf-operator',
                riskLevel: 'R1',
            });

            expect(entry.lifecycleStatus).toBe('active');
        });

        it('persists CVF ADD runtime metadata on registry entries', () => {
            existsSyncMock.mockReturnValue(true);
            let appendedLine = '';
            appendFileSyncMock.mockImplementation((_file: string, content: string) => {
                appendedLine = content;
            });

            const entry = registerAsset({
                source_ref: 'CVF_ADDING_NEW/skill.md',
                candidate_asset_type: 'W7SkillAsset',
                description_or_trigger: 'test',
                approvalState: 'approved',
                governanceOwner: 'cvf-operator',
                riskLevel: 'R1',
                ...CVF_ADD_METADATA,
            });

            const parsed = JSON.parse(appendedLine.trim());
            expect(entry.governedCapability?.policyBinding).toBe(
                'CVF_GOVERNED_CAPABILITY_INTAKE_DOCTRINE_2026-05-07',
            );
            expect(parsed.boundaryFirstGovernance.candidateW7Signals.pathLockSignal).toBe(true);
            expect(parsed.governedContextProfile.advisoryOnly).toBe(true);
            expect(parsed.continuityDelegation.delegationAllowed).toBe(false);
            expect(parsed.scopedKnowledgeProvider.policyAuthority).toBe(false);
        });
    });

    // W69-T1 lifecycle tests
    describe('lifecycleStatus annotation (readAllLines)', () => {
        it('defaults legacy entries (no lifecycleStatus field) to active', () => {
            const legacyEntry = { ...VALID_ENTRY };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            delete (legacyEntry as any).lifecycleStatus;

            existsSyncMock.mockReturnValue(true);
            readFileSyncMock.mockReturnValue(JSON.stringify(legacyEntry) + '\n');

            const result = listRegistryEntries();

            expect(result[0].lifecycleStatus).toBe('active');
        });

        it('applies retirement record: annotates matching entry as retired', () => {
            existsSyncMock.mockReturnValue(true);
            readFileSyncMock.mockReturnValue(
                JSON.stringify(VALID_ENTRY) + '\n' + JSON.stringify(RETIREMENT_RECORD) + '\n',
            );

            const result = listRegistryEntries();

            expect(result).toHaveLength(1);
            expect(result[0].lifecycleStatus).toBe('retired');
            expect(result[0].retiredAt).toBe('2026-04-13T11:00:00.000Z');
        });

        it('active entry is not affected by a retirement record targeting a different id', () => {
            const otherRetirement = { ...RETIREMENT_RECORD, targetId: 'entry-999' };
            existsSyncMock.mockReturnValue(true);
            readFileSyncMock.mockReturnValue(
                JSON.stringify(VALID_ENTRY) + '\n' + JSON.stringify(otherRetirement) + '\n',
            );

            const result = listRegistryEntries();

            expect(result[0].lifecycleStatus).toBe('active');
        });
    });

    describe('findDuplicate() — lifecycle-aware (W69-T1)', () => {
        it('returns null for a retired entry (allows re-registration)', () => {
            existsSyncMock.mockReturnValue(true);
            readFileSyncMock.mockReturnValue(
                JSON.stringify(VALID_ENTRY) + '\n' + JSON.stringify(RETIREMENT_RECORD) + '\n',
            );

            const result = findDuplicate('CVF_ADDING_NEW/skill.md', 'W7SkillAsset');

            expect(result).toBeNull();
        });

        it('returns active entry when no retirement record exists', () => {
            existsSyncMock.mockReturnValue(true);
            readFileSyncMock.mockReturnValue(JSON.stringify(VALID_ENTRY) + '\n');

            const result = findDuplicate('CVF_ADDING_NEW/skill.md', 'W7SkillAsset');

            expect(result).not.toBeNull();
            expect(result?.lifecycleStatus).toBe('active');
        });
    });

    describe('retireEntry()', () => {
        it('returns null when entry id not found', () => {
            existsSyncMock.mockReturnValue(false);

            const result = retireEntry('nonexistent-id');

            expect(result).toBeNull();
            expect(appendFileSyncMock).not.toHaveBeenCalled();
        });

        it('returns null when entry is already retired', () => {
            existsSyncMock.mockReturnValue(true);
            readFileSyncMock.mockReturnValue(
                JSON.stringify(VALID_ENTRY) + '\n' + JSON.stringify(RETIREMENT_RECORD) + '\n',
            );

            const result = retireEntry('entry-001');

            expect(result).toBeNull();
            expect(appendFileSyncMock).not.toHaveBeenCalled();
        });

        it('appends a retirement record and returns entry with retired status', () => {
            existsSyncMock.mockReturnValue(true);
            readFileSyncMock.mockReturnValue(JSON.stringify(VALID_ENTRY) + '\n');
            let appendedLine = '';
            appendFileSyncMock.mockImplementation((_file: string, content: string) => {
                appendedLine = content;
            });

            const result = retireEntry('entry-001');

            expect(result).not.toBeNull();
            expect(result?.lifecycleStatus).toBe('retired');
            expect(result?.retiredAt).toBeTruthy();
            expect(appendFileSyncMock).toHaveBeenCalledOnce();

            const record = JSON.parse(appendedLine.trim());
            expect(record._type).toBe('retirement');
            expect(record.targetId).toBe('entry-001');
            expect(record.retiredAt).toBeTruthy();
        });
    });

    describe('filterRegistryEntries()', () => {
        beforeEach(() => {
            existsSyncMock.mockReturnValue(true);
            // VALID_ENTRY: active, CVF_ADDING_NEW/skill.md, W7SkillAsset
            // VALID_ENTRY_2: active, CVF_TOOLS/tool.md, W7ToolAsset
            // RETIREMENT_RECORD retires entry-001 → entry-001 becomes retired
            const entryWithMetadata = { ...VALID_ENTRY, ...CVF_ADD_METADATA };
            const toolEntryWithMetadata = {
                ...VALID_ENTRY_2,
                governedCapability: {
                    ...CVF_ADD_METADATA.governedCapability,
                    capabilityClass: 'tool' as const,
                },
                boundaryFirstGovernance: {
                    ...CVF_ADD_METADATA.boundaryFirstGovernance,
                    policyClass: 'hard_prohibition' as const,
                },
                governedContextProfile: CVF_ADD_METADATA.governedContextProfile,
                continuityDelegation: CVF_ADD_METADATA.continuityDelegation,
                scopedKnowledgeProvider: CVF_ADD_METADATA.scopedKnowledgeProvider,
            };
            readFileSyncMock.mockReturnValue(
                JSON.stringify(entryWithMetadata) +
                    '\n' +
                    JSON.stringify(toolEntryWithMetadata) +
                    '\n' +
                    JSON.stringify(RETIREMENT_RECORD) +
                    '\n',
            );
        });

        it('returns all entries when no filter is applied', () => {
            const result = filterRegistryEntries({});
            expect(result).toHaveLength(2);
        });

        it('filters by status=active', () => {
            const result = filterRegistryEntries({ status: 'active' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('entry-002');
        });

        it('filters by status=retired', () => {
            const result = filterRegistryEntries({ status: 'retired' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('entry-001');
            expect(result[0].lifecycleStatus).toBe('retired');
        });

        it('filters by source_ref', () => {
            const result = filterRegistryEntries({ source_ref: 'CVF_TOOLS/tool.md' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('entry-002');
        });

        it('filters by candidate_asset_type', () => {
            const result = filterRegistryEntries({ candidate_asset_type: 'W7SkillAsset' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('entry-001');
        });

        it('ANDs multiple filters — status=active + candidate_asset_type', () => {
            // entry-001 is W7SkillAsset but retired; entry-002 is active but W7ToolAsset
            const result = filterRegistryEntries({
                status: 'active',
                candidate_asset_type: 'W7SkillAsset',
            });
            expect(result).toHaveLength(0);
        });

        it('filters by governed capability class', () => {
            const result = filterRegistryEntries({ capability_class: 'tool' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('entry-002');
        });

        it('filters by boundary policy class', () => {
            const result = filterRegistryEntries({ boundary_policy_class: 'restricted_execution_path' });
            expect(result).toHaveLength(1);
            expect(result[0].id).toBe('entry-001');
        });

        it('filters by scoped knowledge provider policy authority', () => {
            const result = filterRegistryEntries({ policy_authority: false });
            expect(result).toHaveLength(2);
            expect(result.every((entry) => entry.scopedKnowledgeProvider?.policyAuthority === false)).toBe(true);
        });

        it('returns empty array when registry file does not exist', () => {
            existsSyncMock.mockReturnValue(false);
            const result = filterRegistryEntries({ status: 'active' });
            expect(result).toHaveLength(0);
        });
    });
});
