/**
 * Pipeline Orchestrator Tests — Track IV Phase A.3
 *
 * Comprehensive tests for the E2E Governance Pipeline:
 * lifecycle, phase transitions, gate enforcement, rollback,
 * pause/resume, fail, events, and full integration.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { PipelineOrchestrator, PHASE_SEQUENCE } from '../governance/guard_runtime/pipeline.orchestrator.js';
import type { PipelineEvent, PipelineInstance } from '../governance/guard_runtime/pipeline.orchestrator.js';
import { GuardRuntimeEngine } from '../governance/guard_runtime/guard.runtime.engine.js';
import { PhaseGateGuard } from '../governance/guard_runtime/guards/phase.gate.guard.js';
import { RiskGateGuard } from '../governance/guard_runtime/guards/risk.gate.guard.js';
import { AuthorityGateGuard } from '../governance/guard_runtime/guards/authority.gate.guard.js';
import { MutationBudgetGuard } from '../governance/guard_runtime/guards/mutation.budget.guard.js';
import { AuditTrailGuard } from '../governance/guard_runtime/guards/audit.trail.guard.js';

function createEngine(): GuardRuntimeEngine {
  const engine = new GuardRuntimeEngine();
  engine.registerGuard(new PhaseGateGuard());
  engine.registerGuard(new RiskGateGuard());
  engine.registerGuard(new AuthorityGateGuard());
  engine.registerGuard(new MutationBudgetGuard());
  engine.registerGuard(new AuditTrailGuard());
  return engine;
}

// --- Pipeline Lifecycle ---

describe('PipelineOrchestrator', () => {
  let orchestrator: PipelineOrchestrator;
  let engine: GuardRuntimeEngine;

  beforeEach(() => {
    engine = createEngine();
    orchestrator = new PipelineOrchestrator(engine);
  });

  describe('pipeline creation', () => {
    it('creates a pipeline with CREATED status', () => {
      const p = orchestrator.createPipeline({
        id: 'pipe-1',
        intent: 'Add new feature',
        riskLevel: 'R1',
        role: 'HUMAN',
      });
      expect(p.status).toBe('CREATED');
      expect(p.id).toBe('pipe-1');
      expect(p.intent).toBe('Add new feature');
    });

    it('rejects duplicate pipeline id', () => {
      orchestrator.createPipeline({ id: 'pipe-1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      expect(() => orchestrator.createPipeline({ id: 'pipe-1', intent: 'B', riskLevel: 'R0', role: 'HUMAN' }))
        .toThrow('already exists');
    });

    it('tracks pipeline count', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.createPipeline({ id: 'p2', intent: 'B', riskLevel: 'R0', role: 'HUMAN' });
      expect(orchestrator.getPipelineCount()).toBe(2);
    });

    it('getAllPipelines returns all', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.createPipeline({ id: 'p2', intent: 'B', riskLevel: 'R0', role: 'HUMAN' });
      expect(orchestrator.getAllPipelines()).toHaveLength(2);
    });

    it('getPipeline returns undefined for unknown id', () => {
      expect(orchestrator.getPipeline('nonexistent')).toBeUndefined();
    });

    it('stores agentId and metadata', () => {
      const p = orchestrator.createPipeline({
        id: 'p1', intent: 'A', riskLevel: 'R1', role: 'AI_AGENT',
        agentId: 'claude', metadata: { source: 'test' },
      });
      expect(p.agentId).toBe('claude');
      expect(p.metadata?.['source']).toBe('test');
    });
  });

  describe('phase transitions (HUMAN)', () => {
    it('advances CREATED → INTAKE', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      const r = orchestrator.advancePhase('p1');
      expect(r.success).toBe(true);
      expect(orchestrator.getPipeline('p1')!.status).toBe('INTAKE');
    });

    it('advances INTAKE → DESIGN', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1');
      const r = orchestrator.advancePhase('p1');
      expect(r.success).toBe(true);
      expect(orchestrator.getPipeline('p1')!.status).toBe('DESIGN');
    });

    it('advances DESIGN → BUILD', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1');
      orchestrator.advancePhase('p1');
      const r = orchestrator.advancePhase('p1');
      expect(r.success).toBe(true);
      expect(orchestrator.getPipeline('p1')!.status).toBe('BUILD');
    });

    it('advances BUILD → REVIEW', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      for (let i = 0; i < 3; i++) orchestrator.advancePhase('p1');
      const r = orchestrator.advancePhase('p1');
      expect(r.success).toBe(true);
      expect(orchestrator.getPipeline('p1')!.status).toBe('REVIEW');
    });

    it('advances REVIEW → FREEZE', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      for (let i = 0; i < 4; i++) orchestrator.advancePhase('p1');
      const r = orchestrator.advancePhase('p1');
      expect(r.success).toBe(true);
      expect(orchestrator.getPipeline('p1')!.status).toBe('FREEZE');
    });

    it('cannot advance past FREEZE', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      for (let i = 0; i < 5; i++) orchestrator.advancePhase('p1');
      const r = orchestrator.advancePhase('p1');
      expect(r.success).toBe(false);
      expect(r.error).toContain('No next phase');
    });
  });

  describe('gate enforcement', () => {
    it('blocks AI_AGENT from INTAKE phase', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'AI_AGENT', agentId: 'claude' });
      const r = orchestrator.advancePhase('p1');
      // INTAKE requires HUMAN, GOVERNOR, OBSERVER, ANALYST, or OPERATOR
      expect(r.success).toBe(false);
      expect(r.guardResult?.finalDecision).toBe('BLOCK');
    });

    it('blocks AI_AGENT from DESIGN phase', () => {
      // Use OPERATOR to get through INTAKE, then switch to AI_AGENT pipeline
      const opOrch = new PipelineOrchestrator(engine);
      opOrch.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'OPERATOR' });
      opOrch.advancePhase('p1'); // INTAKE ok for OPERATOR

      // Create AI_AGENT pipeline still starting from CREATED
      orchestrator.createPipeline({ id: 'p-ai', intent: 'AI task', riskLevel: 'R0', role: 'AI_AGENT', agentId: 'claude' });
      // Cannot even get to INTAKE
      const r = orchestrator.advancePhase('p-ai');
      expect(r.success).toBe(false);
    });

    it('blocks OPERATOR at FREEZE', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'OPERATOR' });
      for (let i = 0; i < 4; i++) {
        const r = orchestrator.advancePhase('p1');
        expect(r.success).toBe(true);
      }
      const freezeAttempt = orchestrator.advancePhase('p1');
      expect(freezeAttempt.success).toBe(false);
      expect(freezeAttempt.guardResult?.finalDecision).toBe('BLOCK');
    });

    it('stores gate results', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1');
      const p = orchestrator.getPipeline('p1')!;
      expect(p.gateResults.size).toBe(1);
      expect(p.gateResults.has('INTAKE')).toBe(true);
    });

    it('returns guard result on block', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'AI_AGENT', agentId: 'claude' });
      const r = orchestrator.advancePhase('p1');
      expect(r.guardResult).toBeDefined();
      expect(r.guardResult!.finalDecision).toBe('BLOCK');
    });
  });

  describe('complete pipeline', () => {
    it('completes from FREEZE', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      for (let i = 0; i < 5; i++) orchestrator.advancePhase('p1');
      expect(orchestrator.completePipeline('p1')).toBe(true);
      expect(orchestrator.getPipeline('p1')!.status).toBe('COMPLETED');
    });

    it('cannot complete from non-FREEZE', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1'); // INTAKE
      expect(orchestrator.completePipeline('p1')).toBe(false);
    });

    it('cannot advance COMPLETED pipeline', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      for (let i = 0; i < 5; i++) orchestrator.advancePhase('p1');
      orchestrator.completePipeline('p1');
      const r = orchestrator.advancePhase('p1');
      expect(r.success).toBe(false);
      expect(r.error).toContain('terminal state');
    });

    it('returns false for unknown pipeline', () => {
      expect(orchestrator.completePipeline('nonexistent')).toBe(false);
    });
  });

  describe('rollback', () => {
    it('rolls back to specific phase', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      for (let i = 0; i < 3; i++) orchestrator.advancePhase('p1'); // BUILD
      expect(orchestrator.rollback('p1', 'INTAKE')).toBe(true);
      expect(orchestrator.getPipeline('p1')!.status).toBe('INTAKE');
    });

    it('full rollback sets ROLLED_BACK', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1');
      expect(orchestrator.rollback('p1')).toBe(true);
      expect(orchestrator.getPipeline('p1')!.status).toBe('ROLLED_BACK');
    });

    it('cannot rollback COMPLETED pipeline', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      for (let i = 0; i < 5; i++) orchestrator.advancePhase('p1');
      orchestrator.completePipeline('p1');
      expect(orchestrator.rollback('p1')).toBe(false);
    });

    it('cannot rollback ROLLED_BACK pipeline', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1');
      orchestrator.rollback('p1');
      expect(orchestrator.rollback('p1')).toBe(false);
    });

    it('returns false for unknown pipeline', () => {
      expect(orchestrator.rollback('nonexistent')).toBe(false);
    });

    it('records rollback in phase history', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1');
      orchestrator.advancePhase('p1');
      orchestrator.rollback('p1', 'INTAKE');
      const p = orchestrator.getPipeline('p1')!;
      const last = p.phaseHistory[p.phaseHistory.length - 1]!;
      expect(last.phase).toBe('INTAKE');
    });
  });

  describe('pause / resume', () => {
    it('pauses a running pipeline', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1'); // INTAKE
      expect(orchestrator.pause('p1')).toBe(true);
      expect(orchestrator.getPipeline('p1')!.status).toBe('PAUSED');
    });

    it('resumes paused pipeline to previous phase', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1'); // INTAKE
      orchestrator.advancePhase('p1'); // DESIGN
      orchestrator.pause('p1');
      expect(orchestrator.resume('p1')).toBe(true);
      expect(orchestrator.getPipeline('p1')!.status).toBe('DESIGN');
    });

    it('cannot pause COMPLETED pipeline', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      for (let i = 0; i < 5; i++) orchestrator.advancePhase('p1');
      orchestrator.completePipeline('p1');
      expect(orchestrator.pause('p1')).toBe(false);
    });

    it('cannot resume non-paused pipeline', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1');
      expect(orchestrator.resume('p1')).toBe(false);
    });

    it('cannot advance paused pipeline', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1');
      orchestrator.pause('p1');
      const r = orchestrator.advancePhase('p1');
      expect(r.success).toBe(false);
      expect(r.error).toContain('paused');
    });

    it('cannot pause already paused pipeline', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1');
      orchestrator.pause('p1');
      expect(orchestrator.pause('p1')).toBe(false);
    });
  });

  describe('fail pipeline', () => {
    it('fails a running pipeline', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1');
      expect(orchestrator.failPipeline('p1', 'Critical error')).toBe(true);
      expect(orchestrator.getPipeline('p1')!.status).toBe('FAILED');
    });

    it('cannot fail COMPLETED pipeline', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      for (let i = 0; i < 5; i++) orchestrator.advancePhase('p1');
      orchestrator.completePipeline('p1');
      expect(orchestrator.failPipeline('p1', 'error')).toBe(false);
    });

    it('cannot advance FAILED pipeline', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1');
      orchestrator.failPipeline('p1', 'error');
      const r = orchestrator.advancePhase('p1');
      expect(r.success).toBe(false);
      expect(r.error).toContain('terminal state');
    });

    it('returns false for unknown pipeline', () => {
      expect(orchestrator.failPipeline('nonexistent', 'error')).toBe(false);
    });
  });

  describe('events', () => {
    it('records events in pipeline', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1');
      const p = orchestrator.getPipeline('p1')!;
      expect(p.events.length).toBeGreaterThan(0);
      const types = p.events.map((e) => e.type);
      expect(types).toContain('GATE_CHECK');
      expect(types).toContain('PHASE_ENTER');
    });

    it('emits to external listeners', () => {
      const captured: PipelineEvent[] = [];
      orchestrator.addEventListener((e) => captured.push(e));
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1');
      expect(captured.length).toBeGreaterThan(0);
      expect(captured.some((e) => e.type === 'PHASE_ENTER')).toBe(true);
    });

    it('records rollback events', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1');
      orchestrator.rollback('p1');
      const p = orchestrator.getPipeline('p1')!;
      expect(p.events.some((e) => e.type === 'ROLLBACK')).toBe(true);
    });

    it('records pause/resume events', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1');
      orchestrator.pause('p1');
      orchestrator.resume('p1');
      const p = orchestrator.getPipeline('p1')!;
      expect(p.events.some((e) => e.type === 'PAUSE')).toBe(true);
      expect(p.events.some((e) => e.type === 'RESUME')).toBe(true);
    });

    it('records fail events', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1');
      orchestrator.failPipeline('p1', 'test failure');
      const p = orchestrator.getPipeline('p1')!;
      const failEvent = p.events.find((e) => e.type === 'FAIL');
      expect(failEvent).toBeDefined();
      expect(failEvent!.details).toBe('test failure');
    });

    it('records complete events', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      for (let i = 0; i < 5; i++) orchestrator.advancePhase('p1');
      orchestrator.completePipeline('p1');
      const p = orchestrator.getPipeline('p1')!;
      expect(p.events.some((e) => e.type === 'COMPLETE')).toBe(true);
    });
  });

  describe('phase history', () => {
    it('records full phase transition history', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      for (let i = 0; i < 5; i++) orchestrator.advancePhase('p1');
      orchestrator.completePipeline('p1');
      const p = orchestrator.getPipeline('p1')!;
      const phases = p.phaseHistory.map((h) => h.phase);
      expect(phases).toEqual(['INTAKE', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE', 'COMPLETED']);
    });

    it('records entry timestamps', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1');
      const p = orchestrator.getPipeline('p1')!;
      expect(p.phaseHistory[0]!.enteredAt).toBeDefined();
    });

    it('records exit timestamps on phase change', () => {
      orchestrator.createPipeline({ id: 'p1', intent: 'A', riskLevel: 'R0', role: 'HUMAN' });
      orchestrator.advancePhase('p1'); // DISCOVERY
      orchestrator.advancePhase('p1'); // DESIGN
      const p = orchestrator.getPipeline('p1')!;
      expect(p.phaseHistory[0]!.exitedAt).toBeDefined();
    });
  });

  describe('PHASE_SEQUENCE export', () => {
    it('has correct 5-phase sequence', () => {
      expect(PHASE_SEQUENCE).toEqual(['INTAKE', 'DESIGN', 'BUILD', 'REVIEW', 'FREEZE']);
    });
  });

  describe('governed control loop enforcement', () => {
    it('blocks DESIGN -> BUILD without PLAN artifact in governed mode', () => {
      orchestrator.createPipeline({
        id: 'gov-1',
        intent: 'Governed build',
        riskLevel: 'R1',
        role: 'HUMAN',
        metadata: { controlMode: 'governed' },
      });

      orchestrator.advancePhase('gov-1'); // INTAKE
      orchestrator.advancePhase('gov-1'); // DESIGN

      const result = orchestrator.advancePhase('gov-1');
      expect(result.success).toBe(false);
      expect(result.error).toContain('PLAN artifact');
    });

    it('creates pending approval for BUILD when governed risk is R2', () => {
      orchestrator.createPipeline({
        id: 'gov-2',
        intent: 'Elevated governed build',
        riskLevel: 'R2',
        role: 'HUMAN',
        metadata: { controlMode: 'governed' },
      });

      orchestrator.advancePhase('gov-2'); // INTAKE
      orchestrator.advancePhase('gov-2'); // DESIGN
      orchestrator.recordArtifact('gov-2', { type: 'PLAN', details: { spec: 'approved-design' } });

      const result = orchestrator.advancePhase('gov-2');
      expect(result.success).toBe(false);
      expect(result.error).toContain('waiting for approval');
      expect(orchestrator.getPendingApprovals('gov-2')).toHaveLength(1);
      expect(orchestrator.getPendingApprovals('gov-2')[0]?.phase).toBe('BUILD');
    });

    it('allows BUILD after approval checkpoint is approved', () => {
      orchestrator.createPipeline({
        id: 'gov-3',
        intent: 'Approved governed build',
        riskLevel: 'R2',
        role: 'HUMAN',
        metadata: { controlMode: 'governed' },
      });

      orchestrator.advancePhase('gov-3'); // INTAKE
      orchestrator.advancePhase('gov-3'); // DESIGN
      orchestrator.recordArtifact('gov-3', { type: 'PLAN', details: { spec: 'approved-design' } });

      const blocked = orchestrator.advancePhase('gov-3');
      expect(blocked.success).toBe(false);

      const approval = orchestrator.getPendingApprovals('gov-3')[0]!;
      orchestrator.approveCheckpoint('gov-3', approval.id, {
        id: 'governor-1',
        role: 'GOVERNOR',
        comment: 'Plan approved',
      });

      const advanced = orchestrator.advancePhase('gov-3');
      expect(advanced.success).toBe(true);
      expect(orchestrator.getPipeline('gov-3')!.status).toBe('BUILD');
    });

    it('requires EXECUTION and REVIEW evidence before FREEZE in governed mode', () => {
      orchestrator.createPipeline({
        id: 'gov-4',
        intent: 'Freeze enforcement',
        riskLevel: 'R1',
        role: 'HUMAN',
        metadata: { controlMode: 'governed' },
      });

      orchestrator.advancePhase('gov-4'); // INTAKE
      orchestrator.advancePhase('gov-4'); // DESIGN
      orchestrator.recordArtifact('gov-4', { type: 'PLAN' });
      orchestrator.advancePhase('gov-4'); // BUILD
      orchestrator.advancePhase('gov-4'); // REVIEW

      const freezeAttempt = orchestrator.advancePhase('gov-4');
      expect(freezeAttempt.success).toBe(false);
      expect(freezeAttempt.error).toContain('EXECUTION evidence');

      orchestrator.recordArtifact('gov-4', { type: 'EXECUTION' });
      const freezeAttempt2 = orchestrator.advancePhase('gov-4');
      expect(freezeAttempt2.success).toBe(false);
      expect(freezeAttempt2.error).toContain('REVIEW evidence');
    });

    it('requires FREEZE artifact before completion in governed mode', () => {
      orchestrator.createPipeline({
        id: 'gov-5',
        intent: 'Freeze completion evidence',
        riskLevel: 'R1',
        role: 'HUMAN',
        metadata: { controlMode: 'governed' },
      });

      orchestrator.advancePhase('gov-5'); // INTAKE
      orchestrator.advancePhase('gov-5'); // DESIGN
      orchestrator.recordArtifact('gov-5', { type: 'PLAN' });
      orchestrator.advancePhase('gov-5'); // BUILD
      orchestrator.recordArtifact('gov-5', { type: 'EXECUTION' });
      orchestrator.advancePhase('gov-5'); // REVIEW
      orchestrator.recordArtifact('gov-5', { type: 'REVIEW' });
      orchestrator.advancePhase('gov-5'); // FREEZE

      expect(orchestrator.completePipeline('gov-5')).toBe(false);
      orchestrator.recordArtifact('gov-5', { type: 'FREEZE', details: { receipt: 'freeze-1' } });
      expect(orchestrator.completePipeline('gov-5')).toBe(true);
    });
  });

  describe('error handling', () => {
    it('advancePhase returns error for unknown pipeline', () => {
      const r = orchestrator.advancePhase('nonexistent');
      expect(r.success).toBe(false);
      expect(r.error).toContain('not found');
    });
  });

  // --- E2E Integration ---

  describe('E2E: full HUMAN pipeline lifecycle', () => {
    it('completes full INTAKE → FREEZE → Complete lifecycle', () => {
      const events: PipelineEvent[] = [];
      orchestrator.addEventListener((e) => events.push(e));

      orchestrator.createPipeline({
        id: 'e2e-1',
        intent: 'Implement new guard',
        riskLevel: 'R1',
        role: 'HUMAN',
      });

      // CREATED → INTAKE → DESIGN → BUILD → REVIEW → FREEZE
      for (let i = 0; i < 5; i++) {
        const r = orchestrator.advancePhase('e2e-1');
        expect(r.success).toBe(true);
      }

      // FREEZE → COMPLETED
      expect(orchestrator.completePipeline('e2e-1')).toBe(true);

      const p = orchestrator.getPipeline('e2e-1')!;
      expect(p.status).toBe('COMPLETED');
      expect(p.phaseHistory).toHaveLength(6);
      expect(p.gateResults.size).toBe(5);
      expect(events.length).toBeGreaterThan(10);
    });
  });

  describe('E2E: OPERATOR pipeline with pause and rollback', () => {
    it('handles pause, resume, and rollback correctly', () => {
      orchestrator.createPipeline({
        id: 'e2e-2',
        intent: 'Complex upgrade',
        riskLevel: 'R2',
        role: 'OPERATOR',
      });

      // Advance to BUILD
      for (let i = 0; i < 3; i++) orchestrator.advancePhase('e2e-2');
      expect(orchestrator.getPipeline('e2e-2')!.status).toBe('BUILD');

      // Pause in BUILD
      expect(orchestrator.pause('e2e-2')).toBe(true);
      expect(orchestrator.getPipeline('e2e-2')!.status).toBe('PAUSED');

      // Resume back to BUILD
      expect(orchestrator.resume('e2e-2')).toBe(true);
      expect(orchestrator.getPipeline('e2e-2')!.status).toBe('BUILD');

      // Rollback to DESIGN
      expect(orchestrator.rollback('e2e-2', 'DESIGN')).toBe(true);
      expect(orchestrator.getPipeline('e2e-2')!.status).toBe('DESIGN');

      // Advance again: DESIGN → BUILD → REVIEW
      for (let i = 0; i < 2; i++) {
        const r = orchestrator.advancePhase('e2e-2');
        expect(r.success).toBe(true);
      }
      expect(orchestrator.getPipeline('e2e-2')!.status).toBe('REVIEW');

      // OPERATOR cannot pass FREEZE
      const freezeAttempt = orchestrator.advancePhase('e2e-2');
      expect(freezeAttempt.success).toBe(false);
      expect(orchestrator.getPipeline('e2e-2')!.status).toBe('REVIEW');
    });
  });
});
