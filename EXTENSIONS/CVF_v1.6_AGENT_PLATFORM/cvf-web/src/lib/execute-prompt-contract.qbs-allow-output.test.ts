import { describe, expect, it } from 'vitest';
import { buildExecutionPrompt } from './execute-prompt-contract';

const base = { provider: 'alibaba' as const, model: 'qwen-flash', mode: 'governance' as const, cvfPhase: 'PHASE B' };

describe('QBS family-aware ALLOW output contracts', () => {
  it('adds builder handoff detail requirements', () => {
    const prompt = buildExecutionPrompt({ ...base, templateId: '', templateName: 'QBS Task', intent: 'Produce a developer handoff for login.', qbsFamily: 'builder_handoff_technical_planning', inputs: { request: 'Produce a developer handoff for login.' }, cvfRiskLevel: 'R1' });
    expect(prompt).toContain('### Family Output Contract');
    for (const item of ['Files/modules likely to touch', 'Tests to add or run', 'Rollback step', 'Verification step', 'Security/data consideration', 'unknown - requires repo inspection']) expect(prompt).toContain(item);
  });

  it('adds cost and quota restrictions for mapped prompts', () => {
    const prompt = buildExecutionPrompt({ ...base, templateId: '', templateName: 'Provider selection', intent: 'Compare provider options, cost, quota, model lane, and latency for a small live AI experiment.', inputs: { request: 'Compare provider options.' }, cvfRiskLevel: 'R1' });
    expect(prompt).toContain('Governance family: cost_quota_provider_selection');
    expect(prompt).toContain('do not invent or assert a specific provider name, model name, latency number');
    expect(prompt).toContain('decision criteria, tradeoff categories, and a verification plan');
  });

  it('adds non-technical app planning components', () => {
    const prompt = buildExecutionPrompt({ ...base, templateId: 'app_builder_complete', templateName: 'Complete app brief', intent: 'Draft a non-technical product brief.', inputs: { request: 'Draft a non-technical product brief.' }, cvfRiskLevel: 'R0' });
    expect(prompt).toContain('Governance family: normal_productivity_app_planning');
    expect(prompt).toContain('preserve the user input language');
    expect(prompt).toContain('purpose, audience/users, scope, workflow');
    expect(prompt).toContain('minimum useful features or steps');
  });

  it('does not add a family contract for unrelated templates', () => {
    const prompt = buildExecutionPrompt({ ...base, templateId: 'email_campaign', templateName: 'Email campaign', intent: 'Write a harmless newsletter draft.', inputs: { request: 'Write a harmless newsletter draft.' }, cvfRiskLevel: 'R0' });
    expect(prompt).not.toContain('### Family Output Contract');
  });
});
