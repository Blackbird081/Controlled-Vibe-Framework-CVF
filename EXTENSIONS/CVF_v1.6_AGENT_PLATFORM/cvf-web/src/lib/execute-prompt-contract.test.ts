import { describe, expect, it } from 'vitest';
import { buildExecutionPrompt } from './execute-prompt-contract';

describe('buildExecutionPrompt', () => {
  it('tells the model to keep simple transformations direct', () => {
    const prompt = buildExecutionPrompt({
      templateId: '',
      templateName: 'Plain translation',
      intent: 'Translate this short note into plain English.',
      inputs: {
        note: 'Vui long doc ban nhap va gui gop y truoc thu Sau.',
      },
      provider: 'alibaba',
      model: 'qwen-turbo',
      mode: 'governance',
      cvfPhase: 'PHASE B',
      cvfRiskLevel: 'R0',
    });

    expect(prompt).toContain('For a short translation, rewrite, label, or simple transformation');
    expect(prompt).toContain('preserve the requested tone');
    expect(prompt).toContain('return only the transformed result');
  });

  it('forbids unsupported provider benchmark numbers', () => {
    const prompt = buildExecutionPrompt({
      templateId: '',
      templateName: 'Provider selection',
      intent: 'Recommend a lane for low-risk latency-sensitive summarization without live benchmarks.',
      inputs: {
        request: 'Recommend a lane for low-risk latency-sensitive summarization without live benchmarks.',
      },
      provider: 'alibaba',
      model: 'qwen-turbo',
      mode: 'governance',
      cvfPhase: 'PHASE B',
      cvfRiskLevel: 'R1',
    });

    expect(prompt).toContain('Do not invent latency, accuracy, benchmark, cost, quota, version, or provider-ranking numbers');
    expect(prompt).toContain('use qualitative tradeoffs and a verification plan');
    expect(prompt).toContain('do not choose a specific named provider or model as the final answer unless the user supplied the allowed candidates');
  });

  it('keeps governed ALLOW outputs complete and in the user language', () => {
    const prompt = buildExecutionPrompt({
      templateId: '',
      templateName: 'Product brief',
      intent: 'Draft a non-technical product brief for a simple internal inventory tracker.',
      inputs: {
        request: 'Draft a non-technical product brief for a simple internal inventory tracker used by a five-person operations team.',
      },
      provider: 'alibaba',
      model: 'qwen-turbo',
      mode: 'governance',
      cvfPhase: 'PHASE B',
      cvfRiskLevel: 'R0',
    });

    expect(prompt).toContain("Use the same natural language as the user's request");
    expect(prompt).toContain('purpose, audience/users, scope, key features or steps, success measures, risks/constraints, and next actions');
  });

  it('requires builder handoffs to include implementable verification detail', () => {
    const prompt = buildExecutionPrompt({
      templateId: '',
      templateName: 'Developer handoff',
      intent: 'Produce a developer handoff for adding email-and-password login.',
      inputs: {
        request: 'Produce a developer handoff for adding email-and-password login to an existing small web app.',
      },
      provider: 'alibaba',
      model: 'qwen-turbo',
      mode: 'governance',
      cvfPhase: 'PHASE B',
      cvfRiskLevel: 'R1',
    });

    expect(prompt).toContain('For developer handoffs, include scope, likely files/modules');
    expect(prompt).toContain('security/data considerations, rollback notes, and verification steps');
  });
});
