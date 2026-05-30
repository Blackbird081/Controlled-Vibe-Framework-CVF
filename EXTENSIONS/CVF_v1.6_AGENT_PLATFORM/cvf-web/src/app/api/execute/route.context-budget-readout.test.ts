import { describe, it, expect } from 'vitest';
import {
  buildContextBudgetReadout,
  CONTEXT_BUDGET_READOUT_VERSION,
} from '@/lib/context-budget-readout';

describe('buildContextBudgetReadout', () => {
  it('returns advisory readout for OPERATOR role', () => {
    const readout = buildContextBudgetReadout('OPERATOR');
    expect(readout.contractVersion).toBe(CONTEXT_BUDGET_READOUT_VERSION);
    expect(readout.taskClass).toBe('orchestration');
    expect(readout.budgetTokens).toBe(4_000);
    expect(readout.withinBudget).toBe(true);
    expect(readout.runtimeExecutionAuthorized).toBe(false);
  });

  it('returns implementation task class for AI_AGENT role', () => {
    const readout = buildContextBudgetReadout('AI_AGENT');
    expect(readout.taskClass).toBe('implementation');
    expect(readout.budgetTokens).toBe(8_000);
  });

  it('returns review task class for REVIEWER role', () => {
    const readout = buildContextBudgetReadout('REVIEWER');
    expect(readout.taskClass).toBe('review');
    expect(readout.budgetTokens).toBe(6_000);
  });

  it('marks withinBudget false when estimated tokens exceed budget', () => {
    const readout = buildContextBudgetReadout('REVIEWER', 10_000);
    expect(readout.withinBudget).toBe(false);
    expect(readout.advisoryNote).toContain('exceeds advisory budget');
  });

  it('marks withinBudget true when estimated tokens within budget', () => {
    const readout = buildContextBudgetReadout('AI_AGENT', 5_000);
    expect(readout.withinBudget).toBe(true);
    expect(readout.advisoryNote).toContain('within budget');
  });

  it('returns general task class for unknown role', () => {
    const readout = buildContextBudgetReadout('UNKNOWN_ROLE');
    expect(readout.taskClass).toBe('general');
    expect(readout.budgetTokens).toBe(4_000);
  });

  it('always sets runtimeExecutionAuthorized to false', () => {
    const roles = ['OPERATOR', 'AI_AGENT', 'REVIEWER', 'BUILDER', 'HUMAN', 'GOVERNOR'];
    for (const role of roles) {
      const readout = buildContextBudgetReadout(role);
      expect(readout.runtimeExecutionAuthorized).toBe(false);
    }
  });

  it('uses zero estimate when no token count provided', () => {
    const readout = buildContextBudgetReadout('BUILDER');
    expect(readout.withinBudget).toBe(true);
  });
});
