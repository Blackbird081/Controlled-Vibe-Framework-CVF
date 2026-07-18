import { describe, expect, it } from 'vitest';
import {
  CONTEXT_BUDGET_POLICY_VERSION,
  DURABLE_MEMORY_STORE_VERSION,
  MEMORY_EVENT_HOOKS_VERSION,
  createFileBackedDurableMemoryStore,
  createProvisionalEvaluationSignalContract,
  createStage1DiagnosticPacketContract,
  getContextBudget,
} from 'cvf-learning-plane-foundation/web-runtime';

describe('learning-plane web runtime boundary', () => {
  it('exports the Web contracts without importing the knowledge-graph barrel', () => {
    expect(CONTEXT_BUDGET_POLICY_VERSION).toMatch(/^cvf\./);
    expect(DURABLE_MEMORY_STORE_VERSION).toMatch(/^cvf\./);
    expect(MEMORY_EVENT_HOOKS_VERSION).toMatch(/^cvf\./);
    expect(getContextBudget('implementation').budgetTokens).toBeGreaterThan(0);
    expect(createFileBackedDurableMemoryStore).toBeTypeOf('function');
    expect(createProvisionalEvaluationSignalContract).toBeTypeOf('function');
    expect(createStage1DiagnosticPacketContract).toBeTypeOf('function');
  });
});
