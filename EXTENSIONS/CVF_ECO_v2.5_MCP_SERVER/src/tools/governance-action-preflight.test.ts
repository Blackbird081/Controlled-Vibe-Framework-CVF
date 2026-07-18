import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {
  preflightGovernanceAction,
  redactText,
  serializePreflightPersistence,
  textContainsSecret,
  PREFLIGHT_CONTRACT,
  PREFLIGHT_TOOL,
  REDACTED_PLACEHOLDER,
  type PreflightInput,
  type PreflightPersistencePort,
} from './governance-action-preflight';
import { createGuardEngine } from '../guards/index.js';
import { JsonFileAdapter } from '../persistence/json-file.adapter.js';
import type { GuardAuditEntry } from '../guards/types.js';

const ALLOW_INPUT: PreflightInput = {
  actionClass: 'EDIT',
  action: 'update a non-protected source file',
  phase: 'BUILD',
  riskLevel: 'R1',
  role: 'AI_AGENT',
  agentId: 'claude-worker',
  targetFiles: ['src/feature/widget.ts'],
  mutationCount: 0,
};

describe('cvf_preflight_governance_action', () => {
  let dataDir: string;
  let adapter: JsonFileAdapter;

  beforeEach(async () => {
    dataDir = await mkdtemp(join(tmpdir(), 'cvf-delta-preflight-'));
    adapter = new JsonFileAdapter({ dataDir });
    await adapter.init();
  });

  afterEach(async () => {
    await rm(dataDir, { recursive: true, force: true });
  });

  it('returns an ALLOW receipt with a proceed claim only after durable persistence', async () => {
    const engine = createGuardEngine();
    const receipt = await preflightGovernanceAction(ALLOW_INPUT, engine, adapter);

    expect(receipt).toMatchObject({
      contractVersion: PREFLIGHT_CONTRACT,
      tool: PREFLIGHT_TOOL,
      accepted: true,
      actionClass: 'EDIT',
      decision: 'ALLOW',
      auditPersisted: true,
      governedActionClaimAllowed: true,
      rawSecretPrinted: false,
    });
    expect(receipt.receiptId).toBe(receipt.requestId);

    // Durable readback: the persisted JSON contains the matching requestId.
    const persisted = await adapter.getAuditEntries({ requestId: receipt.requestId! });
    expect(persisted).toHaveLength(1);
    expect(persisted[0].requestId).toBe(receipt.requestId);
  });

  it('persists a BLOCK decision but withholds the proceed claim', async () => {
    const engine = createGuardEngine();
    const receipt = await preflightGovernanceAction(
      { ...ALLOW_INPUT, actionClass: 'RUN', riskLevel: 'R3' },
      engine,
      adapter
    );

    expect(receipt.accepted).toBe(true);
    expect(receipt.decision).toBe('BLOCK');
    expect(receipt.auditPersisted).toBe(true);
    expect(receipt.governedActionClaimAllowed).toBe(false);

    const persisted = await adapter.getAuditEntries({ requestId: receipt.requestId! });
    expect(persisted[0].pipelineResult.finalDecision).toBe('BLOCK');
  });

  it('persists an ESCALATE decision but withholds the proceed claim', async () => {
    const engine = createGuardEngine();
    const receipt = await preflightGovernanceAction(
      { ...ALLOW_INPUT, actionClass: 'COMMIT', riskLevel: 'R2' },
      engine,
      adapter
    );

    expect(receipt.decision).toBe('ESCALATE');
    expect(receipt.auditPersisted).toBe(true);
    expect(receipt.governedActionClaimAllowed).toBe(false);
  });

  it('fails closed when durable persistence throws and issues no valid receipt', async () => {
    const engine = createGuardEngine();
    const failing: PreflightPersistencePort = {
      saveAuditEntry: () => Promise.reject(new Error('disk full')),
    };

    const receipt = await preflightGovernanceAction(ALLOW_INPUT, engine, failing);

    expect(receipt.accepted).toBe(false);
    expect(receipt.auditPersisted).toBe(false);
    expect(receipt.receiptId).toBeNull();
    expect(receipt.governedActionClaimAllowed).toBe(false);
    expect(receipt.error?.code).toBe('AUDIT_PERSISTENCE_FAILED');
  });

  it('rejects structured credential-bearing input before evaluation or persistence', async () => {
    const engine = createGuardEngine();
    let saved = 0;
    const counting: PreflightPersistencePort = {
      saveAuditEntry: async () => {
        saved += 1;
      },
    };

    const receipt = await preflightGovernanceAction(
      { ...ALLOW_INPUT, apiKey: 'sk-should-not-be-here' } as unknown as PreflightInput,
      engine,
      counting
    );

    expect(receipt.accepted).toBe(false);
    expect(receipt.error?.code).toBe('RAW_CREDENTIAL_INPUT_REJECTED');
    expect(saved).toBe(0);
  });

  it('rejects secret material nested in structured context fields', async () => {
    const engine = createGuardEngine();
    let saved = 0;
    const counting: PreflightPersistencePort = {
      saveAuditEntry: async () => {
        saved += 1;
      },
    };

    const receipt = await preflightGovernanceAction(
      { ...ALLOW_INPUT, scope: 'deploy with API_KEY=sk-structured012345' },
      engine,
      counting
    );

    expect(receipt.error?.code).toBe('RAW_CREDENTIAL_INPUT_REJECTED');
    expect(receipt.governedActionClaimAllowed).toBe(false);
    expect(saved).toBe(0);
  });

  it('redacts inline secrets so the raw value is absent from the response and persisted JSON', async () => {
    const engine = createGuardEngine();
    const secretAction = 'export API_KEY=sk-abcdef0123456789 then edit the config';

    expect(textContainsSecret(secretAction)).toBe(true);

    const receipt = await preflightGovernanceAction(
      { ...ALLOW_INPUT, action: secretAction },
      engine,
      adapter
    );

    // Response side: no raw token anywhere in the serialized receipt.
    const serialized = JSON.stringify(receipt);
    expect(serialized).not.toContain('sk-abcdef0123456789');

    // Persisted side: read the JSON file back and confirm the token is gone.
    const raw = await readFile(join(dataDir, 'audit-log.json'), 'utf-8');
    expect(raw).not.toContain('sk-abcdef0123456789');
    expect(raw).toContain(REDACTED_PLACEHOLDER);

    const persisted: GuardAuditEntry[] = await adapter.getAuditEntries({
      requestId: receipt.requestId!,
    });
    expect(persisted[0].context.action).not.toContain('sk-abcdef0123456789');
  });

  it('rejects unknown action classes and empty actions', async () => {
    const engine = createGuardEngine();

    const badClass = await preflightGovernanceAction(
      { ...ALLOW_INPUT, actionClass: 'DELETE' as unknown as PreflightInput['actionClass'] },
      engine,
      adapter
    );
    expect(badClass.error?.code).toBe('INVALID_ACTION_CLASS');

    const empty = await preflightGovernanceAction(
      { ...ALLOW_INPUT, action: '   ' },
      engine,
      adapter
    );
    expect(empty.error?.code).toBe('INVALID_PREFLIGHT_REQUEST');
  });

  it('serializes durable writes and continues after a failed queued write', async () => {
    let activeWrites = 0;
    let maxActiveWrites = 0;
    let calls = 0;
    const underlying: PreflightPersistencePort = {
      async saveAuditEntry() {
        calls += 1;
        activeWrites += 1;
        maxActiveWrites = Math.max(maxActiveWrites, activeWrites);
        await new Promise((resolve) => setTimeout(resolve, 5));
        activeWrites -= 1;
        if (calls === 1) throw new Error('first write failed');
      },
    };
    const serialized = serializePreflightPersistence(underlying);
    const entry: GuardAuditEntry = {
      requestId: 'serialized-test',
      timestamp: new Date().toISOString(),
      context: {
        requestId: 'serialized-test',
        phase: 'BUILD',
        riskLevel: 'R1',
        role: 'AI_AGENT',
        action: 'EDIT: test',
      },
      pipelineResult: {
        requestId: 'serialized-test',
        finalDecision: 'ALLOW',
        results: [],
        executedAt: new Date().toISOString(),
        durationMs: 0,
      },
    };

    const first = serialized.saveAuditEntry(entry);
    const second = serialized.saveAuditEntry({ ...entry, requestId: 'serialized-test-2' });

    await expect(first).rejects.toThrow('first write failed');
    await expect(second).resolves.toBeUndefined();
    expect(maxActiveWrites).toBe(1);
    expect(calls).toBe(2);
  });

  it('redactText leaves benign text unchanged', () => {
    const benign = 'edit the README and run the test suite';
    expect(redactText(benign)).toBe(benign);
    expect(textContainsSecret(benign)).toBe(false);
  });
});
