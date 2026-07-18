/**
 * CVF Policy Snapshot Registry
 *
 * Owner module for policy snapshot id generation and secret-safe persisted records.
 * Moves the policySnapshotId lifecycle from a process-local monotonic counter in
 * web-governance-envelope.ts into a durable local registry with an id-to-record
 * read path for audit reconstructability.
 *
 * CVF_POLICY_SNAPSHOT_REGISTRY_VERSION: 2026-06-05
 * ERH_DUR1_MARKER: DURABLE_EVIDENCE_STORE_ACTIVE
 * ERH_DUR2_MARKER: EXTERNAL_STORAGE_ADAPTER_ACTIVE
 *
 * Claim boundary: bounded local persistence only. Not a production database,
 * Redis store, distributed registry, external policy service, or tamper-proof audit.
 * Secret-safe: records contain policy metadata only; no raw prompts, raw AI output,
 * API keys, provider secrets, or private memory payloads.
 *
 * Env override: CVF_POLICY_SNAPSHOT_DIR
 */

import path from 'node:path';

import { buildKeyValueAdapter, type KeyValueAdapter } from '@/lib/storage-adapter';

export interface PolicySnapshotRecord {
    id: string;
    createdAt: string;
    policyDate: string;
    evidenceClass: 'BOUNDED_LOCAL';
    bounded: true;
}

export interface BuildPolicySnapshotInput {
    id: string;
    createdAt?: string;
}

const _snapshotAdapter: KeyValueAdapter<PolicySnapshotRecord> = buildKeyValueAdapter<PolicySnapshotRecord>();

export function getSnapshotDir(): string {
    return process.env.CVF_POLICY_SNAPSHOT_DIR
        ? path.resolve(process.env.CVF_POLICY_SNAPSHOT_DIR)
        : path.join(process.cwd(), '.cvf', 'runtime', 'policy-snapshots');
}

export function buildPolicySnapshot(input: BuildPolicySnapshotInput): PolicySnapshotRecord {
    const createdAt = input.createdAt ?? new Date().toISOString();
    return {
        id: input.id,
        createdAt,
        policyDate: createdAt.slice(0, 10),
        evidenceClass: 'BOUNDED_LOCAL',
        bounded: true,
    };
}

export async function persistPolicySnapshot(record: PolicySnapshotRecord): Promise<void> {
    await _snapshotAdapter.write(getSnapshotDir(), record.id, record);
}

export async function readPolicySnapshot(id: string): Promise<PolicySnapshotRecord | null> {
    return _snapshotAdapter.read(getSnapshotDir(), id);
}

let _policySnapshotCounter = 0;

export function generatePolicySnapshotId(): string {
    _policySnapshotCounter++;
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const id = `pol-${date}-${_policySnapshotCounter.toString().padStart(4, '0')}`;
    const record = buildPolicySnapshot({ id });
    void persistPolicySnapshot(record).catch(() => {});
    return id;
}
