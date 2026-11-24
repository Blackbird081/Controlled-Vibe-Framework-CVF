// Text Encoding Exception: Vietnamese user-facing fixtures and language-matching literals require UTF-8.
/**
 * deliverable-pack.test.ts — W125-T1 CP1
 */

import { describe, it, expect, vi } from 'vitest';
import {
  inferPackType,
  generateDeliverablePack,
  serializePackToMarkdown,
} from './deliverable-pack';
import type { Execution } from '@/types';
import { countVisibleWhitespaceUnits, originalBrief, parseExplicitWordLimit } from '@/lib/pack-content-constraints';

describe('shared documentation acceptance oracle', () => {
  it('counts the same visible units across fences, checkbox and numbered markers and Unicode whitespace', () => {
    const text = '## Warehouse\n1. Check\u2003goods\n- [ ] Take photos\n- [X] Notify purchasing';
    expect(countVisibleWhitespaceUnits(text)).toBe(7);
    expect(countVisibleWhitespaceUnits('```markdown\n' + text + '\n```')).toBe(7);
    expect(countVisibleWhitespaceUnits(' \n\t')).toBe(0);
  });
});

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

  it('maps app_builder_complete → app_planning', () => {
    expect(inferPackType('app_builder_complete')).toBe('app_planning');
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

  it('uses the structured subject for the headline', () => {
    const exec = makeExecution({ templateId: 'documentation_wizard', intent: 'API docs' });
    const pack = generateDeliverablePack(exec);
    expect(pack.headline).toBe('Documentation: Test subject');
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

  it('strips a leading list or heading marker from the executive summary', () => {
    const sentence = 'Tài liệu hướng dẫn quy trình nhận hàng tại kho cho nhân viên mới.';
    for (const prefix of ['- ', '* ', '## ', '1. ', '- [ ] ', '> ']) {
      const pack = generateDeliverablePack(makeExecution({ output: `# SOP\n\n${prefix}${sentence}` }));
      expect(pack.executiveSummary).toBe(sentence);
    }
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

  it('keeps missing receipt visible as artifact verification warning', () => {
    const exec = makeExecution();
    const pack = generateDeliverablePack(exec);
    expect(pack.artifactVerification.status).toBe('PASS_WITH_WARNINGS');
    expect(pack.artifactVerification.provenance).toMatchObject({
      rendererPolicy: 'cvf.packArtifactVerification.w6.v1',
      cvfRootAuthority: 'Controlled Vibe Framework',
      sourceExecutionId: 'exec_test_1',
      sourceTemplateId: 'documentation',
      receiptAvailable: false,
    });
    expect(pack.artifactVerification.checks).toContainEqual(expect.objectContaining({
      id: 'governance_receipt_visible',
      passed: false,
      severity: 'warning',
    }));
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
      model: 'qwen-flash',
      policySnapshotId: 'snap_abc',
    };
    const pack = generateDeliverablePack(exec, receipt);
    expect(pack.governanceEvidence.receiptAvailable).toBe(true);
    expect(pack.governanceEvidence.provider).toBe('alibaba');
    expect(pack.governanceEvidence.model).toBe('qwen-flash');
    expect(pack.governanceEvidence.decision).toBe('ALLOWED');
    expect(pack.artifactVerification.status).toBe('PASS');
    expect(pack.artifactVerification.provenance.receiptId).toBe('rcpt_test_abc');
  });

  it('fails artifact verification when main output is missing', () => {
    const exec = makeExecution({ output: '' });
    const pack = generateDeliverablePack(exec);
    expect(pack.artifactVerification.status).toBe('FAIL');
    expect(pack.artifactVerification.checks).toContainEqual(expect.objectContaining({
      id: 'main_output_present',
      passed: false,
      severity: 'blocking',
    }));
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
  it('unwraps a whole-output ```markdown fence in the Main Output section', () => {
    const exec = makeExecution({ output: '```markdown\n## Section Title\n\nBody text.\n```' });
    const md = serializePackToMarkdown(generateDeliverablePack(exec));
    const mainOutput = md.slice(md.indexOf('## Main Output'), md.indexOf('## Scope Boundary'));
    expect(mainOutput).toContain('## Section Title');
    expect(mainOutput).not.toContain('```markdown');
  });

  it('keeps a ts fence in the Main Output section unchanged', () => {
    const exec = makeExecution({ output: '```ts\nconst a = 1;\n```' });
    const md = serializePackToMarkdown(generateDeliverablePack(exec));
    expect(md).toContain('```ts\nconst a = 1;\n```');
  });

  it('includes headline as H1', () => {
    const exec = makeExecution({ templateId: 'documentation_wizard', intent: 'API Reference' });
    const pack = generateDeliverablePack(exec);
    const md = serializePackToMarkdown(pack);
    expect(md).toContain('# Documentation: Test subject');
  });

  it('includes all required sections', () => {
    const exec = makeExecution();
    const pack = generateDeliverablePack(exec);
    const md = serializePackToMarkdown(pack);
    expect(md).toContain('## Executive Summary');
    expect(md).toContain('## Main Output');
    expect(md).toContain('## Scope Boundary');
    expect(md).toContain('## Governance Evidence');
    expect(md).toContain('## Artifact Verification');
    expect(md).toContain('## Recommended Next Actions');
    expect(md).toContain('## Handoff Notes');
  });

  it('serializes artifact verification and provenance without upgrading missing receipt', () => {
    const exec = makeExecution();
    const pack = generateDeliverablePack(exec);
    const md = serializePackToMarkdown(pack);

    expect(md).toContain('- **Status**: PASS_WITH_WARNINGS');
    expect(md).toContain('- **Renderer policy**: cvf.packArtifactVerification.w6.v1');
    expect(md).toContain('- **Receipt available**: no');
    expect(md).toContain('No receipt is attached; do not treat this export as live governance proof.');
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
      model: 'qwen-flash',
      policySnapshotId: 'snap_xyz',
    };
    const pack = generateDeliverablePack(exec, receipt);
    const md = serializePackToMarkdown(pack);
    expect(md).toContain('alibaba');
    expect(md).toContain('qwen-flash');
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


describe('documentation content constraint readout', () => {
  const notes = 'Nhận công việc → kiểm tra tiến độ → bàn giao cho ca sau. Viết tiếng Việt, tối đa 150 từ, gồm 3 bước và checklist.';
  const receipt = { receiptId: 'r1', evidenceMode: 'static' as const, routeId: '/fixture', generatedAt: '2026-11-15T00:00:00Z', decision: 'ALLOWED' };
  const check = (pack: ReturnType<typeof generateDeliverablePack>, id: string) => pack.contentConstraints?.find(item => item.id === id);

  it('reports an over-limit main output separately from structural PASS and preserves evidence', () => {
    const body = Array(151).fill('word').join(' ');
    const execution = makeExecution({ input: { subject: 'Shift handoff', currentNotes: notes }, output: body });
    const original = structuredClone(execution);
    const originalReceipt = structuredClone(receipt);
    const pack = generateDeliverablePack(execution, receipt);
    expect(pack.artifactVerification.status).toBe('PASS');
    expect(check(pack, 'word_limit_150')).toMatchObject({ status: 'FAIL' });
    expect(check(pack, 'word_limit_150')?.detail).toContain('151 visible whitespace-delimited units');
    expect(check(pack, 'business_accuracy')?.status).toBe('NOT_CHECKED');
    expect(pack.mainOutput).toBe(body);
    expect(pack.governanceEvidence.rawReceipt).toEqual(originalReceipt);
    expect(execution).toEqual(original);
    expect(receipt).toEqual(originalReceipt);
    const markdown = serializePackToMarkdown(pack);
    expect(markdown).toContain('Structural checks only');
    expect(markdown).toContain('**FAIL** 150-word maximum');
    expect(markdown).toContain(body);
  });

  it('counts visible words consistently at and over an explicit numeric cap', () => {
    const body = `# Heading\n\n- [ ] ${Array(149).fill('word').join(' ')}`;
    const generate = (output: string, currentNotes = 'maximum 150 words') => generateDeliverablePack(makeExecution({ input: { subject: 'Shift', currentNotes }, output }));
    expect(check(generate(body), 'word_limit_150')?.status).toBe('PASS');
    expect(check(generate('```markdown\n' + body + '\n```'), 'word_limit_150')?.status).toBe('PASS');
    expect(check(generate(`${body} extra`), 'word_limit_150')?.status).toBe('FAIL');
    expect(check(generate('one two three', 'at most 2 words'), 'word_limit_150')).toMatchObject({ label: '2-word maximum', status: 'FAIL' });
    expect(check(generate(body, 'not maximum 150 words'), 'word_limit_150')?.status).toBe('NOT_CHECKED');
    expect(check(generate(body, 'maximum 150 words or at most 100 words'), 'word_limit_150')?.status).toBe('NOT_CHECKED');
  });

  it('recognizes strict Vietnamese and English caps and a cap repeated across fields (operator Web run 2026-11-16)', () => {
    const words = (n: number) => Array(n).fill('từ').join(' ');
    const pack = (output: string, input: Record<string, string>) => generateDeliverablePack(makeExecution({ input, output }));
    const strict = { subject: 'Viết quy trình nhận hàng 3 bước, dưới 100 từ', currentNotes: 'Viết quy trình nhận hàng 3 bước, dưới 100 từ' };
    expect(parseExplicitWordLimit(originalBrief(strict))).toBe(99);
    expect(check(pack(words(99), strict), 'word_limit_150')).toMatchObject({ label: '99-word maximum', status: 'PASS' });
    expect(check(pack(words(100), strict), 'word_limit_150')?.status).toBe('FAIL');
    expect(parseExplicitWordLimit('Viết ít hơn 50 từ')).toBe(49);
    expect(parseExplicitWordLimit('Keep it under 120 words')).toBe(119);
    expect(parseExplicitWordLimit('less than 80 words please')).toBe(79);
    expect(parseExplicitWordLimit('fewer than 30 words')).toBe(29);
    expect(parseExplicitWordLimit('tối đa 150 từ\ntối đa 150 từ')).toBe(150);
    expect(parseExplicitWordLimit('dưới 100 từ\ntối đa 100 từ')).toBeUndefined();
    expect(parseExplicitWordLimit('không phải dưới 100 từ')).toBeUndefined();
    expect(parseExplicitWordLimit('khoảng dưới 100 từ')).toBeUndefined();
    expect(parseExplicitWordLimit('dưới 1 từ')).toBeUndefined();
    expect(parseExplicitWordLimit('dưới 100 tuần')).toBeUndefined();
  });

  it('reports recognized short format mechanically without approving accuracy or language', () => {
    const pack = generateDeliverablePack(makeExecution({ input: { subject: 'Shift', currentNotes: notes }, output: '1. Receive work\n2. Check progress\n3. Hand over\nChecklist\n- [ ] Verify' }), receipt);
    expect(check(pack, 'word_limit_150')?.status).toBe('PASS');
    expect(check(pack, 'three_steps')?.status).toBe('PASS');
    expect(check(pack, 'checklist')?.status).toBe('PASS');
    expect(check(pack, 'business_accuracy')?.status).toBe('NOT_CHECKED');
    expect(check(pack, 'language_correctness')?.status).toBe('NOT_CHECKED');
  });

  it('does not derive requests from generated intent or claim unrecognized constraints were checked', () => {
    const pack = generateDeliverablePack(makeExecution({ input: { subject: 'Shift', currentNotes: 'Exactly 90 words', _previousOutput: 'tối đa 150 từ, 3 bước, checklist' }, intent: 'SUCCESS CRITERIA: tối đa 150 từ, 3 bước, checklist' }));
    expect(check(pack, 'word_limit_150')?.status).toBe('NOT_CHECKED');
    expect(check(pack, 'three_steps')?.status).toBe('NOT_CHECKED');
    expect(check(pack, 'checklist')?.status).toBe('NOT_CHECKED');
    expect(check(pack, 'other_constraints')?.status).toBe('NOT_CHECKED');
    expect(pack.governanceEvidence.decision).toBe('UNKNOWN');
    expect(serializePackToMarkdown(pack)).toContain('UNKNOWN (no receipt recorded)');
  });

  it('sanitizes multiline titles and falls back when the subject is empty', () => {
    const pack = generateDeliverablePack(makeExecution({ input: { subject: 'Shift\n# injected' }, intent: 'long generated prompt' }));
    expect(pack.headline).toBe('Documentation: Shift');
    expect(generateDeliverablePack(makeExecution({ input: { subject: '  ' }, templateName: 'Guide' })).headline).toBe('Documentation: Guide');
    expect(generateDeliverablePack(makeExecution({ input: { subject: 'a'.repeat(200) } })).headline.length).toBeLessThanOrEqual(115);
  });
});

describe('Role Plan Review section (outcome fidelity O6)', () => {
  it('does not echo an arbitrary runtime diagnostic into a pack', () => {
    const receipt = { receiptId: 'r', evidenceMode: 'static' as const, routeId: '/api/execute', generatedAt: '',
      rolePlan: { reviewerVerdict: 'UNPARSEABLE', reviewerDiagnostic: 'PRIVATE PROVIDER TEXT', revisionApplied: false,
        revisionReviewed: null, recheckVerdict: null, stoppedEarly: null, promptContract: 'role-plan-review-v4', stepCount: 2 } };
    const markdown = serializePackToMarkdown(generateDeliverablePack(makeExecution(), receipt as never));
    expect(markdown).not.toContain('PRIVATE PROVIDER TEXT');
    expect(markdown).toContain('No detailed diagnostic was recorded');
  });
  const baseReceipt = { receiptId: 'receipt-rp', evidenceMode: 'live' as const, routeId: '/api/execute', decision: 'ALLOW', provider: 'alibaba', model: 'qwen-plus-character', generatedAt: '2026-11-16T00:00:00Z' };
  const rolePlan = { reviewerVerdict: 'REVISE' as const, revisionApplied: true, revisionReviewed: false, recheckVerdict: 'NOT_RUN' as const, stoppedEarly: 'ATTEMPT_DENIED' as const, promptContract: 'role-plan-review-v4', stepCount: 3 };

  it('adds the review to the pack object and the markdown, labelled as reviewer-model verdicts and not human approval', () => {
    const pack = generateDeliverablePack(makeExecution(), { ...baseReceipt, rolePlan });
    expect(pack.rolePlanReview).toEqual({ summary: rolePlan, label: 'Reviewer-model verdicts from the same provider as the drafting model; not human approval.' });
    const markdown = serializePackToMarkdown(pack);
    expect(markdown).toContain('## Role Plan Review');
    for (const line of ['not human approval', '- **Reviewer verdict (draft)**: REVISE', '- **Revision applied**: yes', '- **Revision re-reviewed**: no', '- **Recheck verdict**: NOT_RUN', '- **Stopped early**: ATTEMPT_DENIED', '- **Steps run**: 3', '- **Prompt contract**: role-plan-review-v4']) expect(markdown).toContain(line);
    expect(markdown.indexOf('## Role Plan Review')).toBeGreaterThan(markdown.indexOf('## Artifact Verification'));
    expect(markdown.indexOf('## Role Plan Review')).toBeLessThan(markdown.indexOf('## Recommended Next Actions'));
  });
  it('adds exactly one Agent Handoff Spec evidence line carrying the verdicts and the not-human-approval statement', () => {
    // Both packs must have the same timestamp so the evidence diff isolates the role plan.
    vi.useFakeTimers({ toFake: ['Date'] });
    let withPlan: ReturnType<typeof generateDeliverablePack>;
    let without: ReturnType<typeof generateDeliverablePack>;
    try {
      vi.setSystemTime(new Date(baseReceipt.generatedAt));
      withPlan = generateDeliverablePack(makeExecution(), { ...baseReceipt, rolePlan });
      without = generateDeliverablePack(makeExecution(), baseReceipt);
    } finally {
      vi.useRealTimers();
    }
    const added = withPlan.agentHandoffSpec.evidence.filter(line => !without.agentHandoffSpec.evidence.includes(line));
    expect(added).toHaveLength(1); expect(withPlan.agentHandoffSpec.evidence).toHaveLength(without.agentHandoffSpec.evidence.length + 1);
    expect(added[0]).toContain('reviewer-model verdicts, not human approval'); expect(added[0]).toContain('reviewer REVISE'); expect(added[0]).toContain('recheck NOT_RUN'); expect(added[0]).toContain('stopped early ATTEMPT_DENIED'); expect(added[0]).toContain('3 steps');
    expect(serializePackToMarkdown(withPlan)).toContain(added[0]);
  });
  it('shows a PASS plan without a recheck as not run and not applicable, without a stop reason', () => {
    const pack = generateDeliverablePack(makeExecution(), { ...baseReceipt, rolePlan: { ...rolePlan, reviewerVerdict: 'PASS', revisionApplied: false, revisionReviewed: null, recheckVerdict: null, stoppedEarly: null, stepCount: 2 } });
    const markdown = serializePackToMarkdown(pack);
    for (const line of ['- **Reviewer verdict (draft)**: PASS', '- **Revision applied**: no', '- **Revision re-reviewed**: not applicable', '- **Recheck verdict**: not run', '- **Stopped early**: no', '- **Steps run**: 2']) expect(markdown).toContain(line);
  });
  it('omits the section, the pack key and the evidence line when the receipt has no role-plan summary or there is no receipt', () => {
    for (const receipt of [baseReceipt, undefined]) {
      const pack = generateDeliverablePack(makeExecution(), receipt);
      expect('rolePlanReview' in pack).toBe(false); expect(serializePackToMarkdown(pack)).not.toContain('Role Plan Review'); expect(pack.agentHandoffSpec.evidence.join(' | ')).not.toContain('Role plan review');
    }
  });
  it('does not turn a role-plan summary into a pass of the artifact verification or a human approval claim', () => {
    const pack = generateDeliverablePack(makeExecution(), { ...baseReceipt, rolePlan: { ...rolePlan, reviewerVerdict: 'PASS', recheckVerdict: 'PASS', stoppedEarly: null } });
    expect(pack.artifactVerification.status).toBe(generateDeliverablePack(makeExecution(), baseReceipt).artifactVerification.status);
    expect(serializePackToMarkdown(pack)).not.toMatch(/human[- ]approved|approved by a (person|human)/i);
  });
});

describe('mechanical language correctness readout', () => {
  const viInputs = { subject: 'Báo cáo ca làm việc', currentNotes: 'vị trí nhân sự làm trong ca, tiến độ công việc, sản lượng', readerGoal: 'Nắm tình hình khai thác trong ca' };
  const englishBody = 'This procedure explains how the shift team records staff positions, work progress and output during the shift. '.repeat(4);
  const vietnameseBody = 'Quy trình này hướng dẫn nhóm trực ca ghi nhận vị trí nhân sự, tiến độ công việc và sản lượng trong suốt ca làm việc. '.repeat(4);
  const language = (input: Record<string, string>, output: string) => generateDeliverablePack(makeExecution({ input, output })).contentConstraints?.find(item => item.id === 'language_correctness');
  const NOT_CHECKED = { status: 'NOT_CHECKED', detail: 'Language and quality require human review.' };
  const fence = '```';

  it('fails the clear mismatch of Vietnamese inputs and an English body and excludes the English template headings', () => {
    const output = `# Shift Report\n\n## What This Document Is For\n\n${englishBody}`;
    expect(language(viInputs, output)).toMatchObject({ status: 'FAIL', detail: 'The original inputs are Vietnamese but the body appears to be in another language; headings are excluded from this check.' });
    expect(language(viInputs, `${fence}markdown\n${output}\n${fence}`)?.status).toBe('FAIL');
  });
  it('stays NOT_CHECKED for a Vietnamese body even under English headings, for English inputs, an explicit English request and tiny bodies', () => {
    expect(language(viInputs, `## What This Document Is For\n\n${vietnameseBody}`)).toMatchObject(NOT_CHECKED);
    expect(language({ subject: 'Shift report', currentNotes: 'staff positions, progress and output' }, englishBody)).toMatchObject(NOT_CHECKED);
    expect(language({ ...viInputs, currentNotes: 'Viết bằng tiếng Anh, vị trí nhân sự, tiến độ' }, englishBody)).toMatchObject(NOT_CHECKED);
    expect(language({ ...viInputs, currentNotes: 'Write it in English, vị trí nhân sự' }, englishBody)).toMatchObject(NOT_CHECKED);
    expect(language(viInputs, '## Shift\n\nShort English note.')).toMatchObject(NOT_CHECKED);
    expect(language(viInputs, `## Heading only\n\n${fence}\n${englishBody}\n${fence}`)).toMatchObject(NOT_CHECKED);
    expect(language(viInputs, '')).toMatchObject(NOT_CHECKED);
  });
  it('never reports PASS for this row', () => {
    for (const output of [englishBody, vietnameseBody, '']) expect(language(viInputs, output)?.status).not.toBe('PASS');
  });
  it('renders the FAIL in the Markdown readout', () => {
    const markdown = serializePackToMarkdown(generateDeliverablePack(makeExecution({ input: viInputs, output: englishBody })));
    expect(markdown).toContain('**FAIL** Language correctness: The original inputs are Vietnamese but the body appears to be in another language');
  });
});
