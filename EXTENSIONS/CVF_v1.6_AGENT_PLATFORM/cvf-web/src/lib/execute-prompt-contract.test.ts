import { describe, expect, it } from 'vitest';
import { buildExecutionPrompt } from './execute-prompt-contract';
import type { ExecutionRequest } from '@/lib/ai';

const baseRequest: ExecutionRequest = {
  templateId: 'web_build_handoff',
  templateName: 'Bàn giao Web cho Agent',
  inputs: {
    websiteGoal: 'Build an internal operations portal',
    audience: 'Non-technical supervisors',
  },
  intent: 'Tôi là non-coder và muốn dựng web mới',
};

describe('buildExecutionPrompt', () => {
  it('attaches CVF Web Redesign DNA for non-coder web handoff requests', () => {
    const prompt = buildExecutionPrompt(baseRequest);

    expect(prompt).toContain('Bound UX Skill Context');
    expect(prompt).toContain('Template Output Contract');
    expect(prompt).toContain('Do not return the raw skeleton');
    expect(prompt).toContain('Acceptance Checklist');
    expect(prompt).toContain('CVF Web Redesign DNA');
    expect(prompt).toContain('professional command workspace');
    expect(prompt).toContain('preserve existing routes, auth, API payloads');
  });

  it('injects exact template headings into the live prompt for guarded UX packets', () => {
    const prompt = buildExecutionPrompt({
      ...baseRequest,
      templateId: 'web_ux_redesign_system',
      templateName: 'CVF Web UX Redesign System',
      intent: 'Create a governed UX redesign packet',
    });

    expect(prompt).toContain('Use these headings and labels exactly where applicable');
    expect(prompt).toContain('## 7. Review Gate & Acceptance Checklist');
    expect(prompt).toContain('What requires explicit builder approval');
  });

  it('does not attach CVF Web Redesign DNA for unrelated templates', () => {
    const prompt = buildExecutionPrompt({
      ...baseRequest,
      templateId: 'strategy_analysis',
      templateName: 'Strategy Analysis',
      intent: 'Review business strategy',
    });

    expect(prompt).not.toContain('CVF Web Redesign DNA');
  });
});
