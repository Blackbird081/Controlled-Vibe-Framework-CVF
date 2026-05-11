import { describe, expect, it } from 'vitest';
import { buildExecutionPrompt } from './execute-prompt-contract';

describe('QBS family-aware ALLOW output contracts', () => {
  it('adds builder handoff detail requirements for QBS family metadata', () => {
    const prompt = buildExecutionPrompt({
      templateId: '',
      templateName: 'QBS Powered Single-Provider Task',
      intent: 'Produce a developer handoff for adding email-and-password login.',
      qbsFamily: 'builder_handoff_technical_planning',
      inputs: {
        request: 'Produce a developer handoff for adding email-and-password login.',
      },
      provider: 'alibaba',
      model: 'qwen-turbo',
      mode: 'governance',
      cvfPhase: 'PHASE B',
      cvfRiskLevel: 'R1',
    });

    expect(prompt).toContain('### Family Output Contract');
    expect(prompt).toContain('Files/modules likely to touch');
    expect(prompt).toContain('Tests to add or run');
    expect(prompt).toContain('Rollback step');
    expect(prompt).toContain('Verification step');
    expect(prompt).toContain('Security/data consideration');
    expect(prompt).toContain('unknown - requires repo inspection');
  });

  it('adds cost and quota restrictions for mapped non-QBS provider tradeoff prompts', () => {
    const prompt = buildExecutionPrompt({
      templateId: '',
      templateName: 'Provider selection',
      intent: 'Compare provider options, cost, quota, model lane, and latency for a small live AI experiment.',
      inputs: {
        request: 'Compare provider options, cost, quota, model lane, and latency for a small live AI experiment.',
      },
      provider: 'alibaba',
      model: 'qwen-turbo',
      mode: 'governance',
      cvfPhase: 'PHASE B',
      cvfRiskLevel: 'R1',
    });

    expect(prompt).toContain('Governance family: cost_quota_provider_selection');
    expect(prompt).toContain('do not invent or assert a specific provider name, model name, latency number');
    expect(prompt).toContain('decision criteria, tradeoff categories, and a verification plan');
  });

  it('adds non-technical planning components for mapped app templates', () => {
    const prompt = buildExecutionPrompt({
      templateId: 'app_builder_complete',
      templateName: 'Complete app brief',
      intent: 'Draft a non-technical product brief for a simple inventory tracker.',
      inputs: {
        request: 'Draft a non-technical product brief for a simple inventory tracker.',
      },
      provider: 'alibaba',
      model: 'qwen-turbo',
      mode: 'governance',
      cvfPhase: 'PHASE B',
      cvfRiskLevel: 'R0',
    });

    expect(prompt).toContain('Governance family: normal_productivity_app_planning');
    expect(prompt).toContain('preserve the user input language');
    expect(prompt).toContain('purpose, audience/users, scope, workflow');
    expect(prompt).toContain('minimum useful features or steps');
    expect(prompt).toContain('success measures, risks/constraints, and next actions');
  });

  it('does not add a family contract for unrelated templates', () => {
    const prompt = buildExecutionPrompt({
      templateId: 'email_campaign',
      templateName: 'Email campaign',
      intent: 'Write a harmless newsletter draft.',
      inputs: {
        request: 'Write a harmless newsletter draft.',
      },
      provider: 'alibaba',
      model: 'qwen-turbo',
      mode: 'governance',
      cvfPhase: 'PHASE B',
      cvfRiskLevel: 'R0',
    });

    expect(prompt).not.toContain('### Family Output Contract');
  });
});
