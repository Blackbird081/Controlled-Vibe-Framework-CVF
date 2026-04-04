/**
 * CVF v1.7.1 Safety Runtime — CVF-UI API Controllers & Creative Control Tests (W6-T73)
 * ======================================================================================
 * GC-023: dedicated file — never merge into existing test files.
 *
 * Coverage (10 contracts):
 *   cvf-ui/cvf-api/ai-settings.controller.ts:
 *     getAISettings (defaults) / updateAISettings (partial merge)
 *   cvf-ui/cvf-api/audit.controller.ts:
 *     recordAudit / getAudit — accumulates entries
 *   cvf-ui/cvf-api/proposal.controller.ts:
 *     createProposal — short→APPROVED/low-risk; long→PENDING/high-risk
 *     getProposal — existing returns proposal; unknown returns null
 *   cvf-ui/cvf-api/execution.controller.ts:
 *     executeProposal — APPROVED→success; PENDING→throws; unknown→throws
 *   kernel/05_creative_control/audit.logger.ts:
 *     AuditLogger.log / getEvents
 *   kernel/05_creative_control/lineage.store.ts:
 *     LineageStore.add / getAll
 *   kernel/05_creative_control/refusal.registry.ts:
 *     RefusalRegistry.record / getAll
 *   kernel/05_creative_control/creative_permission.policy.ts:
 *     CreativePermissionPolicy.allow — creative_allowed=false; allowed+R0→true; allowed+R2→false
 *   kernel/05_creative_control/creative_provenance.tagger.ts:
 *     CreativeProvenanceTagger.tag — prepends [creative:controlled] marker
 *   kernel/05_creative_control/creative.controller.ts:
 *     CreativeController.adjust — disabled→passthrough; enabled+denied→passthrough;
 *       enabled+allowed→tagged expansion
 */

import { describe, it, expect } from 'vitest';

import { getAISettings, updateAISettings } from '../cvf-ui/cvf-api/ai-settings.controller';
import { recordAudit, getAudit } from '../cvf-ui/cvf-api/audit.controller';
import { createProposal, getProposal } from '../cvf-ui/cvf-api/proposal.controller';
import { executeProposal } from '../cvf-ui/cvf-api/execution.controller';
import { AuditLogger } from '../kernel-architecture/kernel/05_creative_control/audit.logger';
import { LineageStore } from '../kernel-architecture/kernel/05_creative_control/lineage.store';
import { RefusalRegistry } from '../kernel-architecture/kernel/05_creative_control/refusal.registry';
import { CreativePermissionPolicy } from '../kernel-architecture/kernel/05_creative_control/creative_permission.policy';
import { CreativeProvenanceTagger } from '../kernel-architecture/kernel/05_creative_control/creative_provenance.tagger';
import { CreativeController } from '../kernel-architecture/kernel/05_creative_control/creative.controller';
import type { DomainContextObject } from '../kernel-architecture/kernel/01_domain_lock/domain_context_object';

// ─── helpers ─────────────────────────────────────────────────────────────────

function makeCtx(creative_allowed: boolean): DomainContextObject {
  return {
    domain_id: 'test-domain',
    domain_type: 'analytical',
    input_class: 'text',
    allowed_output_types: ['text'],
    risk_ceiling: 'medium',
    boundary_conditions: [],
    refusal_policy_id: 'v1',
    creative_allowed,
  };
}

// ─── ai-settings.controller ──────────────────────────────────────────────────

describe('ai-settings.controller', () => {
  it('getAISettings returns module default (provider="DIRECT_LLM")', () => {
    const s = getAISettings();
    expect(s.provider).toBe('DIRECT_LLM');
    expect(s.maxTokens).toBe(2000);
    expect(s.temperature).toBe(0.2);
  });

  it('updateAISettings merges partial update — only specified fields change', () => {
    const updated = updateAISettings({ provider: 'OPENCLAW', temperature: 0.9 });
    expect(updated.provider).toBe('OPENCLAW');
    expect(updated.temperature).toBe(0.9);
    expect(updated.maxTokens).toBe(2000); // unchanged
  });

  it('getAISettings after update reflects merged values', () => {
    const s = getAISettings();
    expect(s.provider).toBe('OPENCLAW');
  });
});

// ─── audit.controller ────────────────────────────────────────────────────────

describe('audit.controller', () => {
  it('getAudit() starts empty at module load', () => {
    expect(getAudit().length).toBe(0);
  });

  it('recordAudit + getAudit returns entry with correct fields', () => {
    recordAudit({ timestamp: 1000, model: 'gpt-4', totalTokens: 500 });
    const log = getAudit();
    expect(log.length).toBe(1);
    expect(log[0].model).toBe('gpt-4');
    expect(log[0].totalTokens).toBe(500);
  });
});

// ─── proposal.controller ─────────────────────────────────────────────────────

let approvedProposalId: string;
let pendingProposalId: string;

describe('proposal.controller', () => {
  it('short instruction (≤500 chars) → status=APPROVED, riskScore=3', () => {
    const p = createProposal({ instruction: 'deploy feature' });
    approvedProposalId = p.id;
    expect(p.status).toBe('APPROVED');
    expect(p.riskScore).toBe(3);
    expect(p.requiresApproval).toBe(false);
  });

  it('long instruction (>500 chars) → status=PENDING, riskScore=7', () => {
    const p = createProposal({ instruction: 'x'.repeat(501) });
    pendingProposalId = p.id;
    expect(p.status).toBe('PENDING');
    expect(p.riskScore).toBe(7);
    expect(p.requiresApproval).toBe(true);
  });

  it('getProposal with existing id → returns the proposal', () => {
    const found = getProposal(approvedProposalId);
    expect(found).not.toBeNull();
    expect(found?.id).toBe(approvedProposalId);
  });

  it('getProposal with unknown id → returns null', () => {
    expect(getProposal('no-such-id')).toBeNull();
  });
});

// ─── execution.controller ────────────────────────────────────────────────────

describe('execution.controller', () => {
  it('executeProposal on APPROVED proposal → success=true with proposalId', () => {
    const result = executeProposal({ proposalId: approvedProposalId });
    expect(result.success).toBe(true);
    expect(result.proposalId).toBe(approvedProposalId);
  });

  it('executeProposal on PENDING proposal → throws "Proposal not approved"', () => {
    expect(() => executeProposal({ proposalId: pendingProposalId })).toThrow('Proposal not approved');
  });

  it('executeProposal with unknown proposalId → throws "Proposal not found"', () => {
    expect(() => executeProposal({ proposalId: 'no-such' })).toThrow('Proposal not found');
  });
});

// ─── kernel/05_creative_control/audit.logger ─────────────────────────────────

describe('AuditLogger', () => {
  it('log + getEvents returns entry with type, message, timestamp', () => {
    const logger = new AuditLogger();
    logger.log('INFO', 'test event');
    const events = logger.getEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe('INFO');
    expect(events[0].message).toBe('test event');
    expect(typeof events[0].timestamp).toBe('number');
  });

  it('multiple log calls accumulate in order', () => {
    const logger = new AuditLogger();
    logger.log('A', 'first');
    logger.log('B', 'second');
    expect(logger.getEvents().length).toBe(2);
    expect(logger.getEvents()[1].type).toBe('B');
  });
});

// ─── kernel/05_creative_control/lineage.store ────────────────────────────────

describe('LineageStore', () => {
  it('add + getAll returns the added node', () => {
    const store = new LineageStore();
    const node = { id: 'n1', type: 'input' as const, domain: 'creative', parentIds: [], timestamp: 1 };
    store.add(node);
    expect(store.getAll()).toContain(node);
  });

  it('multiple add calls accumulate nodes', () => {
    const store = new LineageStore();
    store.add({ id: 'n1', type: 'input' as const, domain: 'a', parentIds: [], timestamp: 1 });
    store.add({ id: 'n2', type: 'output' as const, domain: 'b', parentIds: ['n1'], timestamp: 2 });
    expect(store.getAll().length).toBe(2);
  });
});

// ─── kernel/05_creative_control/refusal.registry ─────────────────────────────

describe('RefusalRegistry', () => {
  it('record + getAll returns refusal with reason, domain, timestamp', () => {
    const registry = new RefusalRegistry();
    registry.record('high risk', 'finance');
    const all = registry.getAll();
    expect(all.length).toBe(1);
    expect(all[0].reason).toBe('high risk');
    expect(all[0].domain).toBe('finance');
    expect(typeof all[0].timestamp).toBe('number');
  });

  it('multiple records accumulate', () => {
    const registry = new RefusalRegistry();
    registry.record('r1', 'medical');
    registry.record('r2', 'legal');
    expect(registry.getAll().length).toBe(2);
  });
});

// ─── kernel/05 creative_permission.policy ────────────────────────────────────

describe('CreativePermissionPolicy', () => {
  const policy = new CreativePermissionPolicy();

  it('creative_allowed=false → allow() returns false regardless of risk level', () => {
    expect(policy.allow(makeCtx(false), 'R0')).toBe(false);
  });

  it('creative_allowed=true + R0 → allow() returns true', () => {
    expect(policy.allow(makeCtx(true), 'R0')).toBe(true);
  });

  it('creative_allowed=true + R2 → allow() returns false (exceeds R1 ceiling)', () => {
    expect(policy.allow(makeCtx(true), 'R2')).toBe(false);
  });
});

// ─── kernel/05 creative_provenance.tagger ────────────────────────────────────

describe('CreativeProvenanceTagger', () => {
  it('tag() prepends [creative:controlled] marker', () => {
    const tagger = new CreativeProvenanceTagger();
    const result = tagger.tag('my output');
    expect(result).toBe('[creative:controlled]\nmy output');
  });
});

// ─── kernel/05 creative.controller ───────────────────────────────────────────

describe('CreativeController', () => {
  it('controller disabled → adjust() returns original output unchanged', () => {
    const ctrl = new CreativeController();
    const out = ctrl.adjust('hello', makeCtx(true), 'R0');
    expect(out).toBe('hello');
  });

  it('enabled + permission denied (creative_allowed=false) → returns original', () => {
    const ctrl = new CreativeController();
    ctrl.enable();
    const out = ctrl.adjust('hello', makeCtx(false), 'R0');
    expect(out).toBe('hello');
  });

  it('enabled + permission allowed (creative_allowed=true, R0) → tagged expanded output', () => {
    const ctrl = new CreativeController();
    ctrl.enable();
    const out = ctrl.adjust('hello', makeCtx(true), 'R0');
    expect(out).toContain('[creative:controlled]');
    expect(out).toContain('hello');
    expect(out).toContain('creative variation enabled');
  });
});
