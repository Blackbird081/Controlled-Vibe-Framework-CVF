/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useExecutionStore } from './store';

const trackEventMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/analytics', () => ({
    trackEvent: trackEventMock,
}));

describe('Execution store', () => {
    beforeEach(() => {
        useExecutionStore.setState({ executions: [], currentExecution: null });
        localStorage.clear();
        trackEventMock.mockReset();
    });

    it('adds execution and sets current execution', () => {
        const execution = {
            id: 'exec_1',
            templateId: 'tpl_1',
            templateName: 'Template 1',
            category: 'business',
            input: { goal: 'Test' },
            intent: 'Analyze',
            status: 'pending' as const,
            createdAt: new Date(),
        };

        useExecutionStore.getState().addExecution(execution);
        const state = useExecutionStore.getState();
        expect(state.executions[0].id).toBe('exec_1');
        expect(state.currentExecution?.id).toBe('exec_1');
        expect(trackEventMock).toHaveBeenCalledWith('execution_created', {
            templateId: 'tpl_1',
            templateName: 'Template 1',
            category: 'business',
        });
    });

    it('updates execution and tracks completion/accept/reject', () => {
        const execution = {
            id: 'exec_2',
            templateId: 'tpl_2',
            templateName: 'Template 2',
            category: 'technical',
            input: { goal: 'Test' },
            intent: 'Analyze',
            status: 'pending' as const,
            createdAt: new Date(),
        };

        useExecutionStore.getState().addExecution(execution);
        useExecutionStore.getState().updateExecution('exec_2', { status: 'completed', qualityScore: 85 });
        useExecutionStore.getState().updateExecution('exec_2', { result: 'accepted' });
        useExecutionStore.getState().updateExecution('exec_2', { result: 'rejected' });

        const state = useExecutionStore.getState();
        expect(state.executions[0].status).toBe('completed');
        expect(trackEventMock).toHaveBeenCalledWith('execution_completed', expect.objectContaining({ id: 'exec_2' }));
        expect(trackEventMock).toHaveBeenCalledWith('execution_accepted', expect.objectContaining({ id: 'exec_2' }));
        expect(trackEventMock).toHaveBeenCalledWith('execution_rejected', expect.objectContaining({ id: 'exec_2' }));
    });

    it('sets current execution explicitly', () => {
        useExecutionStore.getState().setCurrentExecution(null);
        expect(useExecutionStore.getState().currentExecution).toBeNull();
    });

    it('gets execution by id', () => {
        const execution = {
            id: 'exec_3',
            templateId: 'tpl_3',
            templateName: 'Template 3',
            category: 'content',
            input: { goal: 'Test' },
            intent: 'Analyze',
            status: 'pending' as const,
            createdAt: new Date(),
        };
        useExecutionStore.getState().addExecution(execution);
        const found = useExecutionStore.getState().getExecutionById('exec_3');
        expect(found?.templateName).toBe('Template 3');
    });
});
