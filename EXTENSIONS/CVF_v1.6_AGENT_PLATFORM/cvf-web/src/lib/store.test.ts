/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useExecutionStore } from './store';

const trackEventMock = vi.hoisted(() => vi.fn());
const validateChainMock = vi.hoisted(() => vi.fn());

vi.mock('@/lib/analytics', () => ({
    trackEvent: trackEventMock,
}));

vi.mock('@/lib/ledger-validator', () => ({
    validateChain: validateChainMock,
}));

describe('Execution store', () => {
    beforeEach(() => {
        useExecutionStore.setState({
            executions: [],
            currentExecution: null,
            ledgerEntries: [],
            ledgerValid: true,
            ledgerValidation: null,
            lastLedgerSync: null,
            governanceConnectionStatus: 'disconnected',
            governanceVersion: null,
        });
        localStorage.clear();
        trackEventMock.mockReset();
        validateChainMock.mockReset();
        validateChainMock.mockResolvedValue({
            valid: true,
            totalBlocks: 0,
            validatedBlocks: 0,
        });
        vi.unstubAllGlobals();
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

    it('updateExecution with non-existent id uses empty context (line 36)', () => {
        // No executions exist → existing is undefined → context = {}
        useExecutionStore.getState().updateExecution('non_existent_id', { status: 'completed', qualityScore: 50 });
        expect(trackEventMock).toHaveBeenCalledWith('execution_completed', {
            id: 'non_existent_id',
            qualityScore: 50,
        });
    });

    it('updateExecution does not overwrite currentExecution when id differs (lines 59-61)', () => {
        const exec1 = {
            id: 'exec_a',
            templateId: 'tpl_a',
            templateName: 'Template A',
            category: 'business',
            input: { goal: 'A' },
            intent: 'Analyze',
            status: 'pending' as const,
            createdAt: new Date(),
        };
        const exec2 = {
            id: 'exec_b',
            templateId: 'tpl_b',
            templateName: 'Template B',
            category: 'technical',
            input: { goal: 'B' },
            intent: 'Analyze',
            status: 'pending' as const,
            createdAt: new Date(),
        };

        useExecutionStore.getState().addExecution(exec1);
        useExecutionStore.getState().addExecution(exec2);
        // currentExecution is now exec_b (last added)

        // Update exec_a — currentExecution should remain exec_b
        useExecutionStore.getState().updateExecution('exec_a', { status: 'completed', qualityScore: 90 });

        const state = useExecutionStore.getState();
        expect(state.currentExecution?.id).toBe('exec_b');
        expect(state.executions.find(e => e.id === 'exec_a')?.status).toBe('completed');
    });

    it('fetchLedger updates ledger state on success', async () => {
        const entries = [
            {
                hash: 'h1',
                previous_hash: '0',
                event: { status: 'ok' },
                timestamp: '2026-02-22T00:00:00Z',
                block_index: 1,
            },
        ];
        validateChainMock.mockResolvedValue({
            valid: false,
            totalBlocks: 1,
            validatedBlocks: 0,
            brokenAt: 1,
            error: 'broken',
        });
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: { entries },
            }),
        }));

        await useExecutionStore.getState().fetchLedger();
        const state = useExecutionStore.getState();

        expect(validateChainMock).toHaveBeenCalledWith(entries);
        expect(state.ledgerEntries).toEqual(entries);
        expect(state.ledgerValid).toBe(false);
        expect(state.ledgerValidation?.error).toBe('broken');
        expect(state.lastLedgerSync).toBeTruthy();
    });

    it('fetchLedger ignores unsuccessful response shape', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                success: false,
                data: { entries: [{ hash: 'x' }] },
            }),
        }));

        await useExecutionStore.getState().fetchLedger();
        const state = useExecutionStore.getState();

        expect(validateChainMock).not.toHaveBeenCalled();
        expect(state.ledgerEntries).toEqual([]);
        expect(state.lastLedgerSync).toBeNull();
    });

    it('validateLedger runs validation against current entries', async () => {
        const entries = [
            {
                hash: 'h1',
                previous_hash: '0',
                event: { status: 'ok' },
                timestamp: '2026-02-22T00:00:00Z',
                block_index: 1,
            },
        ];
        useExecutionStore.setState({ ledgerEntries: entries });
        validateChainMock.mockResolvedValue({
            valid: true,
            totalBlocks: 1,
            validatedBlocks: 1,
        });

        await useExecutionStore.getState().validateLedger();
        const state = useExecutionStore.getState();

        expect(validateChainMock).toHaveBeenCalledWith(entries);
        expect(state.ledgerValid).toBe(true);
        expect(state.ledgerValidation?.validatedBlocks).toBe(1);
    });

    it('checkGovernanceHealth sets connected status when API reports success', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ success: true, version: 'v1.6.1' }),
        }));

        await useExecutionStore.getState().checkGovernanceHealth();
        const state = useExecutionStore.getState();

        expect(state.governanceConnectionStatus).toBe('connected');
        expect(state.governanceVersion).toBe('v1.6.1');
    });

    it('checkGovernanceHealth sets null version when success payload has no version', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ success: true }),
        }));

        await useExecutionStore.getState().checkGovernanceHealth();
        const state = useExecutionStore.getState();

        expect(state.governanceConnectionStatus).toBe('connected');
        expect(state.governanceVersion).toBeNull();
    });

    it('checkGovernanceHealth falls back to disconnected on unsuccessful payload', async () => {
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({ success: false }),
        }));

        await useExecutionStore.getState().checkGovernanceHealth();
        const state = useExecutionStore.getState();

        expect(state.governanceConnectionStatus).toBe('disconnected');
        expect(state.governanceVersion).toBeNull();
    });

    it('checkGovernanceHealth falls back to disconnected on fetch error', async () => {
        vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network')));

        await useExecutionStore.getState().checkGovernanceHealth();
        const state = useExecutionStore.getState();

        expect(state.governanceConnectionStatus).toBe('disconnected');
        expect(state.governanceVersion).toBeNull();
    });
});
