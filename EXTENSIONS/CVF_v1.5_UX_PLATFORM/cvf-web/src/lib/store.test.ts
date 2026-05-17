import { describe, expect, it, beforeEach } from 'vitest';
import { useExecutionStore } from './store';
import type { Execution } from '@/types';

describe('execution store', () => {
  beforeEach(() => {
    useExecutionStore.setState({ executions: [], currentExecution: null });
  });

  it('adds and retrieves execution', () => {
    const exec: Execution = {
      id: 'exec_1',
      templateId: 't_1',
      templateName: 'Template 1',
      input: { name: 'demo' },
      intent: 'test',
      status: 'pending',
      createdAt: new Date(),
    };

    useExecutionStore.getState().addExecution(exec);
    const stored = useExecutionStore.getState().getExecutionById('exec_1');
    expect(stored?.templateName).toBe('Template 1');
    expect(useExecutionStore.getState().currentExecution?.id).toBe('exec_1');
  });

  it('updates execution and current execution', () => {
    const exec: Execution = {
      id: 'exec_2',
      templateId: 't_2',
      templateName: 'Template 2',
      input: {},
      intent: 'update test',
      status: 'pending',
      createdAt: new Date(),
    };

    useExecutionStore.getState().addExecution(exec);
    useExecutionStore.getState().updateExecution('exec_2', { status: 'completed', result: 'accepted' });

    const updated = useExecutionStore.getState().getExecutionById('exec_2');
    expect(updated?.status).toBe('completed');
    expect(updated?.result).toBe('accepted');
    expect(useExecutionStore.getState().currentExecution?.status).toBe('completed');
  });
});
