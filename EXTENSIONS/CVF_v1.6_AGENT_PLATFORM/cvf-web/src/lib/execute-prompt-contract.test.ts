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
    expect(prompt).toContain('CVF Web Redesign DNA');
    expect(prompt).toContain('professional command workspace');
    expect(prompt).toContain('preserve existing routes, auth, API payloads');
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

