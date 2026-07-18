import { mkdtempSync, readFileSync, rmSync, writeFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  Sot3ActivationEvidenceStore,
  Sot3EvidenceCorruptStoreError,
  Sot3EvidenceDuplicateConflictError,
  Sot3EvidencePersistenceFailedError,
  Sot3EvidenceRecordIntegrityError,
  SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION,
  computeSot3EvidenceRecordIntegrityHash,
  deriveSot3EvidenceRecordId,
  nodeFsPort,
  type Sot3ActivationEvidenceRecord,
  type Sot3EvidenceFsPort,
} from './sot3-activation-evidence-store';

function buildRecord(overrides: Partial<Sot3ActivationEvidenceRecord> = {}): Sot3ActivationEvidenceRecord {
  const base = {
    recordId: deriveSot3EvidenceRecordId({
      requestId: overrides.requestId ?? 'req-1',
      actorId: 'usr_a',
      organization: 'org_a',
      team: 'team_a',
      mode: 'ENFORCE' as const,
    }),
    requestId: 'req-1',
    actorId: 'usr_a',
    organization: 'org_a',
    team: 'team_a' as string | null,
    mode: 'ENFORCE' as const,
    terminalOutcome: 'APPROVED' as const,
    failureStage: null,
    createdAtUtc: '2026-07-13T00:00:00.000Z',
    diagnosticClass: 'PERSISTED' as const,
    schemaVersion: SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION,
    traces: [],
    ...overrides,
  };
  const { integrityHash: _ignored, ...rest } = base as Sot3ActivationEvidenceRecord;
  const integrityHash = computeSot3EvidenceRecordIntegrityHash(rest);
  return { ...rest, integrityHash };
}

describe('sot3-activation-evidence-store', () => {
  let tempDir: string;
  let storePath: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), 'cvf-sot3-evidence-'));
    storePath = join(tempDir, 'sot3-activation-evidence.json');
  });

  afterEach(() => {
    rmSync(tempDir, { recursive: true, force: true });
  });

  describe('deriveSot3EvidenceRecordId', () => {
    it('produces identical identity for identical semantic input', () => {
      const a = deriveSot3EvidenceRecordId({ requestId: 'req-1', actorId: 'usr_a', organization: 'org_a', team: 'team_a', mode: 'ENFORCE' });
      const b = deriveSot3EvidenceRecordId({ requestId: 'req-1', actorId: 'usr_a', organization: 'org_a', team: 'team_a', mode: 'ENFORCE' });
      expect(a).toBe(b);
    });

    it('produces different identity for a different requestId', () => {
      const a = deriveSot3EvidenceRecordId({ requestId: 'req-1', actorId: 'usr_a', organization: 'org_a', team: 'team_a', mode: 'ENFORCE' });
      const b = deriveSot3EvidenceRecordId({ requestId: 'req-2', actorId: 'usr_a', organization: 'org_a', team: 'team_a', mode: 'ENFORCE' });
      expect(a).not.toBe(b);
    });
  });

  describe('computeSot3EvidenceRecordIntegrityHash', () => {
    it('is deterministic for identical record content', () => {
      const record = buildRecord();
      const { integrityHash: _ignored, ...rest } = record;
      expect(computeSot3EvidenceRecordIntegrityHash(rest)).toBe(record.integrityHash);
    });

    it('changes when a semantic field changes', () => {
      const record = buildRecord();
      const { integrityHash: _ignored, ...rest } = record;
      const changed = computeSot3EvidenceRecordIntegrityHash({ ...rest, terminalOutcome: 'REJECTED' });
      expect(changed).not.toBe(record.integrityHash);
    });
  });

  describe('atomic first write and restart lookup', () => {
    it('writes a valid versioned document only at the main path after replace', async () => {
      const store = new Sot3ActivationEvidenceStore(storePath);
      const record = buildRecord();
      const outcome = await store.append(record);

      expect(outcome.diagnosticClass).toBe('PERSISTED');
      const raw = readFileSync(storePath, 'utf8');
      const parsed = JSON.parse(raw);
      expect(parsed.schemaVersion).toBe(SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION);
      expect(parsed.records).toHaveLength(1);
      expect(parsed.records[0].recordId).toBe(record.recordId);
    });

    it('retrieves a record by record ID and request ID from a fresh store instance after restart', async () => {
      const record = buildRecord();
      const writer = new Sot3ActivationEvidenceStore(storePath);
      await writer.append(record);

      const reader = new Sot3ActivationEvidenceStore(storePath);
      const byRecordId = reader.findByRecordId(record.recordId);
      const byRequestId = reader.findByRequestId(record.requestId);

      expect(byRecordId?.recordId).toBe(record.recordId);
      expect(byRequestId).toHaveLength(1);
      expect(byRequestId[0].recordId).toBe(record.recordId);
    });

    it('treats a missing main file as an empty store', () => {
      const store = new Sot3ActivationEvidenceStore(storePath);
      expect(store.list()).toEqual([]);
      expect(store.findByRecordId('SOT3EV-nonexistent')).toBeUndefined();
    });
  });

  describe('duplicate and conflict semantics', () => {
    it('returns DUPLICATE_NOOP and leaves main bytes and record count unchanged for identical duplicates', async () => {
      const store = new Sot3ActivationEvidenceStore(storePath);
      const record = buildRecord();
      await store.append(record);
      const bytesBefore = readFileSync(storePath, 'utf8');

      const outcome = await store.append(record);
      const bytesAfter = readFileSync(storePath, 'utf8');

      expect(outcome.diagnosticClass).toBe('DUPLICATE_NOOP');
      expect(bytesAfter).toBe(bytesBefore);
      expect(store.list()).toHaveLength(1);
    });

    it('throws a classified conflict and leaves main bytes unchanged for a same-identity different-hash duplicate', async () => {
      const store = new Sot3ActivationEvidenceStore(storePath);
      const record = buildRecord();
      await store.append(record);
      const bytesBefore = readFileSync(storePath, 'utf8');

      const { integrityHash: _ignored, ...conflictingRest } = record;
      const conflicting = { ...conflictingRest, terminalOutcome: 'REJECTED' as const, integrityHash: computeSot3EvidenceRecordIntegrityHash({ ...conflictingRest, terminalOutcome: 'REJECTED' as const }) };
      await expect(store.append(conflicting)).rejects.toBeInstanceOf(Sot3EvidenceDuplicateConflictError);

      const bytesAfter = readFileSync(storePath, 'utf8');
      expect(bytesAfter).toBe(bytesBefore);
    });
  });

  describe('corrupt store handling', () => {
    it('throws a classified corrupt-store error and preserves exact bytes for invalid JSON', () => {
      writeFileSync(storePath, '{ not valid json', 'utf8');
      const store = new Sot3ActivationEvidenceStore(storePath);

      expect(() => store.list()).toThrow(Sot3EvidenceCorruptStoreError);
      expect(readFileSync(storePath, 'utf8')).toBe('{ not valid json');
    });

    it('throws a classified corrupt-store error for valid JSON with a bad record integrity hash', () => {
      const record = buildRecord();
      const tampered = { ...record, terminalOutcome: 'REJECTED' as const };
      writeFileSync(storePath, JSON.stringify({ schemaVersion: SOT3_ACTIVATION_EVIDENCE_SCHEMA_VERSION, records: [tampered] }, null, 2), 'utf8');
      const store = new Sot3ActivationEvidenceStore(storePath);

      expect(() => store.list()).toThrow(Sot3EvidenceCorruptStoreError);
    });

    it('does not reset, overwrite, seed, or repair a corrupt main file on append attempt', async () => {
      writeFileSync(storePath, '{ not valid json', 'utf8');
      const store = new Sot3ActivationEvidenceStore(storePath);

      await expect(store.append(buildRecord())).rejects.toBeInstanceOf(Sot3EvidenceCorruptStoreError);
      expect(readFileSync(storePath, 'utf8')).toBe('{ not valid json');
    });
  });

  describe('leftover temp file handling', () => {
    it('keeps the valid main file authoritative and readable when a leftover temp file exists', async () => {
      const store = new Sot3ActivationEvidenceStore(storePath);
      await store.append(buildRecord());

      writeFileSync(join(tempDir, '.sot3-activation-evidence.leftover-uuid.tmp'), 'garbage-not-json', 'utf8');

      const reader = new Sot3ActivationEvidenceStore(storePath);
      expect(reader.list()).toHaveLength(1);
    });
  });

  describe('injected write and rename failure', () => {
    it('propagates a classified persistence failure and leaves prior valid main bytes unchanged on write failure', async () => {
      const realStore = new Sot3ActivationEvidenceStore(storePath);
      await realStore.append(buildRecord({ requestId: 'req-first' }));
      const bytesBefore = readFileSync(storePath, 'utf8');

      const failingWritePort: Sot3EvidenceFsPort = {
        ...nodeFsPort,
        writeFileSync: () => {
          throw new Error('injected write failure');
        },
      };
      const store = new Sot3ActivationEvidenceStore(storePath, failingWritePort);

      await expect(store.append(buildRecord({ requestId: 'req-second' }))).rejects.toBeInstanceOf(Sot3EvidencePersistenceFailedError);
      expect(readFileSync(storePath, 'utf8')).toBe(bytesBefore);
    });

    it('propagates a classified persistence failure and leaves prior valid main bytes unchanged on rename failure', async () => {
      const realStore = new Sot3ActivationEvidenceStore(storePath);
      await realStore.append(buildRecord({ requestId: 'req-first' }));
      const bytesBefore = readFileSync(storePath, 'utf8');

      const failingRenamePort: Sot3EvidenceFsPort = {
        ...nodeFsPort,
        renameSync: () => {
          throw new Error('injected rename failure');
        },
      };
      const store = new Sot3ActivationEvidenceStore(storePath, failingRenamePort);

      await expect(store.append(buildRecord({ requestId: 'req-second' }))).rejects.toBeInstanceOf(Sot3EvidencePersistenceFailedError);
      expect(readFileSync(storePath, 'utf8')).toBe(bytesBefore);

      const leftoverTemp = readdirSync(tempDir).filter((name) => name.endsWith('.tmp'));
      expect(leftoverTemp).toEqual([]);
    });
  });

  describe('concurrent local appends', () => {
    it('serializes concurrent appends so no record is lost', async () => {
      const store = new Sot3ActivationEvidenceStore(storePath);
      const records = Array.from({ length: 8 }, (_, index) => buildRecord({ requestId: `req-concurrent-${index}` }));

      await Promise.all(records.map((record) => store.append(record)));

      const finalDocument = JSON.parse(readFileSync(storePath, 'utf8'));
      expect(finalDocument.records).toHaveLength(8);
      const recordIds = new Set(finalDocument.records.map((item: Sot3ActivationEvidenceRecord) => item.recordId));
      expect(recordIds.size).toBe(8);
    });
  });

  describe('secret and content negative', () => {
    it('never persists raw content or secret-shaped values in a persisted record', async () => {
      const store = new Sot3ActivationEvidenceStore(storePath);
      const record = buildRecord({
        traces: [{
          chunkId: 'chunk-1',
          collectionId: 'col-1',
          sourceId: 'src-1',
          terminalOutcome: 'APPROVED',
          failureStage: null,
          refineryPacketId: 'RP-1',
          refineryPacketHash: 'sha256:abc',
          refineryStatus: 'READY_FOR_KERNEL',
          kernelDecision: { decision_id: 'KD-1', request_id: 'req-1', packet_hash: 'sha256:abc', decision: 'ACCEPT_EVIDENCE_CANDIDATE', reasons: [], failed_obligations: [], verification_result_refs: [], policy_version: 'v1', rule_version: 'v1', decided_at_utc: '2026-07-13T00:00:00.000Z' },
          truthReceipt: { receipt_id: 'TR-1', evaluated_content_hash: 'sha256:abc', decision_id: 'KD-1', decision: 'ACCEPT_EVIDENCE_CANDIDATE', evidence_refs: ['EV-1'], obligation_refs: [], verification_result_refs: [], policy_version: 'v1', rule_version: 'v1', decided_at_utc: '2026-07-13T00:00:00.000Z', issued_at_utc: '2026-07-13T00:00:00.000Z', predecessor_receipt_hash: null, receipt_hash: 'sha256:def', status: 'ISSUED' },
          truthReference: { reference_id: 'TREF-1', receipt_id: 'TR-1', scope: 'org_a', version: 'v1', valid_from_utc: '2026-07-13T00:00:00.000Z', valid_until_utc: '2026-07-13T00:05:00.000Z', reference_state: 'ACTIVE' },
          flowPackage: { package_id: 'DPKG-1', recipient: 'usr_a', role: 'execute-route-consumer', task: 'knowledge-context-injection', phase: 'PHASE_D_EXECUTE', truth_references: ['TREF-1'], dose: 'single-use-context', restrictions: [], routing_decision: 'KERNEL_RESOLVED_ACTIVE:TREF-1', expiry_utc: '2026-07-13T00:05:00.000Z', acknowledgement_state: 'ACKNOWLEDGED' },
        }],
      });

      await store.append(record);
      const raw = readFileSync(storePath, 'utf8');

      expect(raw).not.toContain('RAW-CHUNK-CONTENT');
      expect(raw).not.toMatch(/sk-[a-zA-Z0-9]|api[_-]?key|bearer\s/i);
    });
  });

  describe('incoming record admission and canonical document ordering', () => {
    it('rejects an incoming record with a mismatched integrity hash before creating the main file', async () => {
      const store = new Sot3ActivationEvidenceStore(storePath);
      const invalid = { ...buildRecord(), integrityHash: `sha256:${'0'.repeat(64)}` };

      await expect(store.append(invalid)).rejects.toBeInstanceOf(Sot3EvidenceRecordIntegrityError);
      expect(() => readFileSync(storePath, 'utf8')).toThrow();
    });

    it('rejects schema extensions that could smuggle raw content even when their hash is recomputed', async () => {
      const store = new Sot3ActivationEvidenceStore(storePath);
      const record = buildRecord();
      const { integrityHash: _ignored, ...rest } = record;
      const extended = { ...rest, rawContent: 'RAW-CHUNK-CONTENT' };
      const withHash = {
        ...extended,
        integrityHash: computeSot3EvidenceRecordIntegrityHash(extended as Omit<Sot3ActivationEvidenceRecord, 'integrityHash'>),
      } as unknown as Sot3ActivationEvidenceRecord;

      await expect(store.append(withHash)).rejects.toBeInstanceOf(Sot3EvidenceRecordIntegrityError);
      expect(() => readFileSync(storePath, 'utf8')).toThrow();
    });

    it('SOT3-ACT-A4: restart-and-valid-recovery row - a fresh store instance after process restart integrity-verifies and restores every previously persisted record with zero additional writes', async () => {
      const writer = new Sot3ActivationEvidenceStore(storePath);
      const first = buildRecord({ requestId: 'req-a4-restart-1' });
      const second = buildRecord({ requestId: 'req-a4-restart-2' });
      await writer.append(first);
      await writer.append(second);
      const bytesBeforeRestart = readFileSync(storePath, 'utf8');

      // Simulates process restart: a brand-new store instance with no
      // in-memory state, reading only from the durable main file.
      const restarted = new Sot3ActivationEvidenceStore(storePath);
      const restoredAll = restarted.list();
      const restoredFirst = restarted.findByRecordId(first.recordId);
      const restoredSecond = restarted.findByRequestId('req-a4-restart-2');

      expect(restoredAll).toHaveLength(2);
      expect(restoredFirst?.integrityHash).toBe(first.integrityHash);
      expect(restoredSecond).toHaveLength(1);
      expect(restoredSecond[0].integrityHash).toBe(second.integrityHash);
      // A read-only restart-recovery path must never rewrite the main file.
      expect(readFileSync(storePath, 'utf8')).toBe(bytesBeforeRestart);
    });

    it('writes byte-identical canonical documents regardless of append order', async () => {
      const secondPath = join(tempDir, 'second-order.json');
      const first = buildRecord({ requestId: 'req-canonical-a' });
      const second = buildRecord({ requestId: 'req-canonical-b' });
      const storeA = new Sot3ActivationEvidenceStore(storePath);
      const storeB = new Sot3ActivationEvidenceStore(secondPath);

      await storeA.append(first);
      await storeA.append(second);
      await storeB.append(second);
      await storeB.append(first);

      expect(readFileSync(storePath, 'utf8')).toBe(readFileSync(secondPath, 'utf8'));
    });
  });
});
