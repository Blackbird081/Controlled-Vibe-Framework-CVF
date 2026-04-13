/**
 * Direct tests for asset-registry.ts helper behavior.
 * Verifies: missing file, malformed lines, valid entries, duplicate detection,
 * and write behavior — without touching the real filesystem.
 *
 * CP3 persistence posture (documented):
 * - JSONL at data/governed-asset-registry.jsonl (relative to process.cwd())
 * - File is created on first write; directory is created if missing
 * - Each line is one JSON entry (append-only)
 * - Malformed lines are skipped silently — registry remains readable
 * - Local-server MVP only: serverless deployment requires an external store
 * - No crash recovery: if the file is corrupted beyond JSONL parse, valid lines
 *   before the corruption are still returned; lines after are skipped
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
        it('returns existing entry when source_ref + candidate_asset_type match', () => {
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
    });
});
