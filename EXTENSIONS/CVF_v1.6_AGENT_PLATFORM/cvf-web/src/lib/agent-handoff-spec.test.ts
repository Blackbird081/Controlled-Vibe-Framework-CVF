// Text Encoding Exception: Vietnamese user-facing fixtures and language-matching literals require UTF-8.
import { describe, it, expect } from 'vitest';
import { generateDeliverablePack, serializePackToMarkdown } from './deliverable-pack';
import type { Execution } from '@/types';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';

function makeExecution(overrides: Partial<Execution> = {}): Execution {
  return {
    id: 'exec_spec_1',
    templateId: 'documentation',
    templateName: 'Tài liệu',
    category: 'content',
    input: { subject: 'SOP nhận hàng', notes: 'Viết SOP 3 bước, tối đa 150 từ.', _internal: 'hidden' },
    intent: 'SOP',
    output: '# SOP\n\n1. Nhận hàng\n2. Kiểm tra\n3. Ký nhận',
    status: 'completed',
    createdAt: new Date('2026-11-15T00:00:00Z'),
    ...overrides,
  };
}

const receipt = {
  receiptId: 'rcpt_1',
  decision: 'ALLOW',
  provider: 'anthropic',
  model: 'claude-cli',
} as unknown as GovernanceEvidenceReceipt;

function extractJson(markdown: string) {
  const match = markdown.match(/### Machine-Readable Spec\n\n(`{3,})json\n([\s\S]*?)\n\1/);
  expect(match).not.toBeNull();
  return JSON.parse(match![2]);
}

describe('agent handoff spec', () => {
  it('marks an over-limit SOP as REWORK_REQUIRED with the limit as remaining work', () => {
    const longOutput = `# SOP\n\n1. ${'từ '.repeat(80)}\n2. ${'từ '.repeat(80)}\n3. xong`;
    const pack = generateDeliverablePack(makeExecution({ output: longOutput }), receipt);
    const spec = pack.agentHandoffSpec;
    expect(spec.readiness).toBe('REWORK_REQUIRED');
    const limit = spec.acceptanceCriteria.find(item => item.id === 'word_limit_150');
    expect(limit?.status).toBe('UNMET');
    expect(spec.remainingWork[0]).toMatch(/^Rework the deliverable until "150-word maximum" is met/);
  });

  it('keeps business accuracy UNVERIFIED and never reports acceptance when mechanical checks pass', () => {
    const spec = generateDeliverablePack(makeExecution(), receipt).agentHandoffSpec;
    expect(spec.readiness).toBe('READY_FOR_HUMAN_REVIEW');
    expect(spec.acceptanceCriteria.find(item => item.id === 'word_limit_150')?.status).toBe('MET');
    expect(spec.acceptanceCriteria.find(item => item.id === 'three_steps')?.status).toBe('MET');
    expect(spec.acceptanceCriteria.find(item => item.id === 'business_accuracy')?.status).toBe('UNVERIFIED');
    expect(JSON.stringify(spec)).not.toMatch(/ACCEPTED|APPROVED/);
  });

  it('omits checks that were never requested and preserves the original request verbatim', () => {
    const spec = generateDeliverablePack(makeExecution(), receipt).agentHandoffSpec;
    expect(spec.acceptanceCriteria.map(item => item.id)).not.toContain('checklist');
    expect(spec.originalRequest).toEqual([
      { field: 'subject', value: 'SOP nhận hàng' },
      { field: 'notes', value: 'Viết SOP 3 bước, tối đa 150 từ.' },
    ]);
  });

  it('uses the English template name in the goal and flags a missing receipt', () => {
    const spec = generateDeliverablePack(makeExecution()).agentHandoffSpec;
    expect(spec.goal).toBe('Deliver a Documentation output for "SOP nhận hàng" that satisfies the original request below within the stated limits.');
    expect(spec.limits.some(item => /No governance receipt/.test(item))).toBe(true);
    expect(spec.remainingWork.some(item => /attach a receipt/.test(item))).toBe(true);
    expect(spec.evidence).toContain('Receipt: none');
  });

  it('adds an accuracy criterion for non-documentation packs and marks missing output UNMET', () => {
    const spec = generateDeliverablePack(makeExecution({ templateId: 'app_builder_wizard', output: '' }), receipt).agentHandoffSpec;
    expect(spec.readiness).toBe('REWORK_REQUIRED');
    expect(spec.acceptanceCriteria.find(item => item.id === 'main_output_present')?.status).toBe('UNMET');
    expect(spec.acceptanceCriteria.find(item => item.id === 'business_accuracy')?.status).toBe('UNVERIFIED');
    expect(spec.remainingWork[0]).toBe('Fix blocking verification failure: Main output present.');
  });

  it('serializes canonical English headings and a parseable machine-readable copy', () => {
    const pack = generateDeliverablePack(makeExecution(), receipt);
    const markdown = serializePackToMarkdown(pack);
    for (const heading of ['## Agent Handoff Spec', '### Goal', '### Original Request (verbatim, source language preserved)',
      '### Acceptance Criteria', '### Limits', '### Evidence', '### Remaining Work', '### Continuation Instructions']) {
      expect(markdown).toContain(heading);
    }
    expect(markdown).not.toContain('hidden');
    expect(extractJson(markdown)).toEqual(pack.agentHandoffSpec);
  });

  it('keeps the machine-readable block intact when the request contains backtick fences', () => {
    const pack = generateDeliverablePack(makeExecution({ input: { subject: 'x', notes: 'see ````json {} ```` here' } }), receipt);
    expect(extractJson(serializePackToMarkdown(pack)).originalRequest[1].value).toBe('see ````json {} ```` here');
  });
});

describe('agent handoff spec language criterion', () => {
  it('marks the clear language mismatch UNMET and requires rework instead of leaving it UNVERIFIED', () => {
    const englishBody = 'This procedure explains how the shift team records staff positions, work progress and output during the shift. '.repeat(4);
    const spec = generateDeliverablePack(makeExecution({ input: { subject: 'Báo cáo ca làm việc', notes: 'vị trí nhân sự làm trong ca, tiến độ công việc, sản lượng' }, output: englishBody }), receipt).agentHandoffSpec;
    expect(spec.acceptanceCriteria.find(item => item.id === 'language_correctness')?.status).toBe('UNMET');
    expect(spec.readiness).toBe('REWORK_REQUIRED');
    expect(spec.remainingWork.some(item => item.startsWith('Rework the deliverable until "Language correctness" is met'))).toBe(true);
  });
  it('keeps the language criterion UNVERIFIED when no clear mismatch is detected', () => {
    const spec = generateDeliverablePack(makeExecution(), receipt).agentHandoffSpec;
    expect(spec.acceptanceCriteria.find(item => item.id === 'language_correctness')?.status).toBe('UNVERIFIED');
  });
});
