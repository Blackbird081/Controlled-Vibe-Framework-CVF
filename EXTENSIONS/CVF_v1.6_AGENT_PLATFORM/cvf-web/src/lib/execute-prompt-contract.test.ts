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
  });
});
