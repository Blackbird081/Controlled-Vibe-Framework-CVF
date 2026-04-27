/**
 * deliverable-pack.test.ts — W125-T1 CP1
 */

import { describe, it, expect } from 'vitest';
import {
  inferPackType,
  generateDeliverablePack,
  serializePackToMarkdown,
} from './deliverable-pack';
import type { Execution } from '@/types';

// ── helpers ───────────────────────────────────────────────────────────────────

function makeExecution(overrides: Partial<Execution> = {}): Execution {
  return {
    id: 'exec_test_1',
    templateId: 'documentation',
    templateName: 'Documentation',
    category: 'content',
    input: { subject: 'Test subject' },
    intent: 'Create documentation for the project',
    output: 'This is the generated documentation.\n\nIt covers the main topics.',
    status: 'completed',
    result: 'accepted',
    qualityScore: 8.5,
    createdAt: new Date('2026-04-27T10:00:00Z'),
    completedAt: new Date('2026-04-27T10:01:00Z'),
    ...overrides,
  };
}

// ── inferPackType ─────────────────────────────────────────────────────────────

describe('inferPackType', () => {
  it('maps app_builder_wizard → app_planning', () => {
    expect(inferPackType('app_builder_wizard')).toBe('app_planning');
  });

  it('maps business_strategy_wizard → business_decision', () => {
    expect(inferPackType('business_strategy_wizard')).toBe('business_decision');
  });

  it('maps security_assessment_wizard → review_findings', () => {
    expect(inferPackType('security_assessment_wizard')).toBe('review_findings');
  });

  it('maps documentation_wizard → documentation_handoff', () => {
    expect(inferPackType('documentation_wizard')).toBe('documentation_handoff');
  });

  it('maps system_design_wizard → app_planning', () => {
    expect(inferPackType('system_design_wizard')).toBe('app_planning');
  });

  it('maps data_analysis_wizard → review_findings', () => {
    expect(inferPackType('data_analysis_wizard')).toBe('review_findings');
  });

  it('falls back to category when template is unrecognized', () => {
    expect(inferPackType('unknown_template', 'business')).toBe('business_decision');
    expect(inferPackType('unknown_template', 'development')).toBe('app_planning');
    expect(inferPackType('unknown_template', 'security')).toBe('review_findings');
    expect(inferPackType('unknown_template', 'content')).toBe('documentation_handoff');
  });

  it('falls back to documentation_handoff when neither template nor category match', () => {
    expect(inferPackType('completely_unknown_xyz')).toBe('documentation_handoff');
  });

  it('template match takes priority over category', () => {
    // app_builder_wizard is app_planning even if category says business
    expect(inferPackType('app_builder_wizard', 'business')).toBe('app_planning');
  });
});

// ── generateDeliverablePack ───────────────────────────────────────────────────

describe('generateDeliverablePack', () => {
  it('returns a pack with correct packType inferred from templateId', () => {
    const exec = makeExecution({ templateId: 'app_builder_wizard', category: 'development' });
    const pack = generateDeliverablePack(exec);
    expect(pack.packType).toBe('app_planning');
  });

  it('returns a pack with correct packType inferred from category fallback', () => {
    const exec = makeExecution({ templateId: 'unknown_xyz', category: 'business' });
    const pack = generateDeliverablePack(exec);
    expect(pack.packType).toBe('business_decision');
  });

  it('includes headline with intent', () => {
    const exec = makeExecution({ templateId: 'documentation_wizard', intent: 'API docs' });
    const pack = generateDeliverablePack(exec);
    expect(pack.headline).toContain('API docs');
  });

  it('includes mainOutput from execution.output', () => {
    const exec = makeExecution({ output: 'My output text' });
    const pack = generateDeliverablePack(exec);
    expect(pack.mainOutput).toBe('My output text');
  });

  it('has empty mainOutput when execution.output is undefined', () => {
    const exec = makeExecution({ output: undefined });
    const pack = generateDeliverablePack(exec);
    expect(pack.mainOutput).toBe('');
  });

  it('builds executiveSummary from first long paragraph of output', () => {
    const longPara = 'A'.repeat(80);
    const exec = makeExecution({ output: `Short\n${longPara}` });
    const pack = generateDeliverablePack(exec);
    expect(pack.executiveSummary).toBe(longPara.slice(0, 300));
  });

  it('falls back to default executive summary when output is empty', () => {
    const exec = makeExecution({ output: '' });
    const pack = generateDeliverablePack(exec);
    expect(pack.executiveSummary.length).toBeGreaterThan(0);
  });

  it('has non-empty scopeBoundary for all pack types', () => {
    const packTypes: Array<{ templateId: string; category: 'development' | 'business' | 'security' | 'content' }> = [
      { templateId: 'app_builder_wizard', category: 'development' },
      { templateId: 'business_strategy_wizard', category: 'business' },
      { templateId: 'security_assessment_wizard', category: 'security' },
      { templateId: 'documentation_wizard', category: 'content' },
    ];
    for (const { templateId, category } of packTypes) {
      const exec = makeExecution({ templateId, category });
      const pack = generateDeliverablePack(exec);
      expect(pack.scopeBoundary.length).toBeGreaterThan(10);
    }
  });

  it('has at least 3 recommendedNextActions for every pack type', () => {
    const templateIds = [
      'app_builder_wizard',
      'business_strategy_wizard',
      'security_assessment_wizard',
      'documentation_wizard',
    ];
    for (const templateId of templateIds) {
      const exec = makeExecution({ templateId });
      const pack = generateDeliverablePack(exec);
      expect(pack.recommendedNextActions.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('sets governanceEvidence.receiptAvailable=false when no receipt', () => {
    const exec = makeExecution();
    const pack = generateDeliverablePack(exec);
    expect(pack.governanceEvidence.receiptAvailable).toBe(false);
  });

  it('sets governanceEvidence from receipt when provided', () => {
    const exec = makeExecution();
    const receipt = {
      receiptId: 'rcpt_test_abc',
      evidenceMode: 'live' as const,
      routeId: '/api/execute',
      generatedAt: '2026-04-27T10:00:00Z',
      decision: 'ALLOWED',
      provider: 'alibaba',
      model: 'qwen-turbo',
      policySnapshotId: 'snap_abc',
    };
    const pack = generateDeliverablePack(exec, receipt);
    expect(pack.governanceEvidence.receiptAvailable).toBe(true);
    expect(pack.governanceEvidence.provider).toBe('alibaba');
    expect(pack.governanceEvidence.model).toBe('qwen-turbo');
    expect(pack.governanceEvidence.decision).toBe('ALLOWED');
  });

  it('includes sourceExecutionId matching execution.id', () => {
    const exec = makeExecution({ id: 'exec_xyz_789' });
    const pack = generateDeliverablePack(exec);
    expect(pack.sourceExecutionId).toBe('exec_xyz_789');
  });

  it('generatedAt is a valid ISO string', () => {
    const exec = makeExecution();
    const pack = generateDeliverablePack(exec);
    expect(() => new Date(pack.generatedAt)).not.toThrow();
    expect(pack.generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

// ── serializePackToMarkdown ───────────────────────────────────────────────────

describe('serializePackToMarkdown', () => {
  it('includes headline as H1', () => {
    const exec = makeExecution({ templateId: 'documentation_wizard', intent: 'API Reference' });
    const pack = generateDeliverablePack(exec);
    const md = serializePackToMarkdown(pack);
    expect(md).toContain('# Documentation: API Reference');
  });

  it('includes all required sections', () => {
    const exec = makeExecution();
    const pack = generateDeliverablePack(exec);
    const md = serializePackToMarkdown(pack);
    expect(md).toContain('## Executive Summary');
    expect(md).toContain('## Main Output');
    expect(md).toContain('## Scope Boundary');
    expect(md).toContain('## Governance Evidence');
    expect(md).toContain('## Recommended Next Actions');
    expect(md).toContain('## Handoff Notes');
  });

  it('includes numbered next actions', () => {
    const exec = makeExecution({ templateId: 'app_builder_wizard' });
    const pack = generateDeliverablePack(exec);
    const md = serializePackToMarkdown(pack);
    expect(md).toContain('1. ');
    expect(md).toContain('2. ');
  });

  it('includes provider info when receipt is provided', () => {
    const exec = makeExecution();
    const receipt = {
      receiptId: 'rcpt_test_xyz',
      evidenceMode: 'live' as const,
      routeId: '/api/execute',
      generatedAt: '2026-04-27T10:00:00Z',
      decision: 'ALLOWED',
      provider: 'alibaba',
      model: 'qwen-turbo',
      policySnapshotId: 'snap_xyz',
    };
    const pack = generateDeliverablePack(exec, receipt);
    const md = serializePackToMarkdown(pack);
    expect(md).toContain('alibaba');
    expect(md).toContain('qwen-turbo');
  });

  it('includes sourceExecutionId in footer', () => {
    const exec = makeExecution({ id: 'exec_footer_test' });
    const pack = generateDeliverablePack(exec);
    const md = serializePackToMarkdown(pack);
    expect(md).toContain('exec_footer_test');
  });

  it('produces non-empty markdown for all 4 pack types', () => {
    const templateIds = [
      'app_builder_wizard',
      'business_strategy_wizard',
      'security_assessment_wizard',
      'documentation_wizard',
    ];
    for (const templateId of templateIds) {
      const exec = makeExecution({ templateId });
      const pack = generateDeliverablePack(exec);
      const md = serializePackToMarkdown(pack);
      expect(md.length).toBeGreaterThan(200);
    }
  });
});
