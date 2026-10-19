/**
 * @vitest-environment jsdom
 */
import { StrictMode, type ComponentProps } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { ProcessingScreen } from './ProcessingScreen';
import { trackEvent } from '@/lib/analytics';

// Language is switchable so a presentation-only rerender can be exercised.
const language = vi.hoisted(() => ({ current: 'en' }));

vi.mock('./Settings', () => ({
    useSettings: () => ({
        settings: { preferences: { defaultExportMode: 'governance' } },
        isLoaded: true,
    }),
}));

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: language.current }),
}));

vi.mock('@/lib/enforcement-log', () => ({
    logEnforcementDecision: vi.fn(),
}));

vi.mock('@/lib/analytics', () => ({
    trackEvent: vi.fn(),
}));

type Props = ComponentProps<typeof ProcessingScreen>;

// Each helper call builds independent objects, so attempt A and attempt B never share data.
const receiptFor = (id: string) => ({ receiptId: `receipt_${id}`, decision: 'ALLOW' });
const responseFor = (output: string, badge = false) => ({
    json: async () => ({
        success: true,
        output,
        governanceEvidenceReceipt: receiptFor(output),
        ...(badge ? { enforcement: { status: 'ALLOW', riskGate: { riskLevel: 'R1' } } } : {}),
    }),
});

// A transport whose response is released by the test, and which ignores abort on purpose.
function deferredTransport() {
    const pending: Array<(value: ReturnType<typeof responseFor>) => void> = [];
    const fetchMock = vi.fn().mockImplementation(
        () => new Promise(resolve => { pending.push(resolve as (value: ReturnType<typeof responseFor>) => void); }),
    );
    return { fetchMock, release: (index: number, value: ReturnType<typeof responseFor>) => pending[index](value) };
}

const taskA = (): Pick<Props, 'templateId' | 'templateName' | 'inputs' | 'intent'> => ({
    templateId: 'task_a',
    templateName: 'Task A',
    inputs: { topic: 'synthetic task A' },
    intent: 'Synthetic offline A',
});

const taskB = (): Pick<Props, 'templateId' | 'templateName' | 'inputs' | 'intent'> => ({
    templateId: 'task_b',
    templateName: 'Task B',
    inputs: { topic: 'synthetic task B' },
    intent: 'Synthetic offline B',
});

// Advances fake time in small acts so React flushes state (and schedules effect timers) between steps.
const advance = async (ms: number) => {
    for (let left = ms; left > 0; left -= 100) {
        const step = Math.min(left, 100);
        await act(async () => { await vi.advanceTimersByTimeAsync(step); });
    }
};
const bodyOf = (fetchMock: ReturnType<typeof vi.fn>, call: number) => JSON.parse(String(fetchMock.mock.calls[call][1]?.body));

// Local reviewer regressions: recovery requests belong to the attempt that started them.
const heldResponse = (id: string, decision: 'BLOCK' | 'NEEDS_APPROVAL') => ({
    json: async () => ({ success: false, error: 'Synthetic hold',
        enforcement: { status: decision, reasons: [], riskGate: { riskLevel: 'R3', status: decision } },
        governanceEvidenceReceipt: { receiptId: id, decision },
    }),
});

describe('ProcessingScreen lifecycle', () => {
    beforeEach(() => {
        language.current = 'en';
        vi.useFakeTimers();
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
        vi.clearAllTimers();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    describe('positive controls', () => {
        it('delivers exact output and receipt once for an uncancelled success without a badge', async () => {
            const onComplete = vi.fn();
            const fetchMock = vi.fn().mockResolvedValue(responseFor('OUTPUT_A'));
            vi.stubGlobal('fetch', fetchMock);

            render(<ProcessingScreen {...taskA()} onComplete={onComplete} onCancel={vi.fn()} />);
            await advance(1000);

            expect(fetchMock).toHaveBeenCalledTimes(1);
            expect(onComplete).toHaveBeenCalledTimes(1);
            expect(onComplete).toHaveBeenCalledWith('OUTPUT_A', receiptFor('OUTPUT_A'));
        });

        it('delivers exact output and receipt once for an uncancelled success with a risk badge', async () => {
            const onComplete = vi.fn();
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseFor('OUTPUT_A', true)));

            render(<ProcessingScreen {...taskA()} onComplete={onComplete} onCancel={vi.fn()} />);
            await advance(1);
            expect(screen.getByTestId('completion-banner')).toBeTruthy();
            expect(onComplete).not.toHaveBeenCalled();

            await advance(2500);
            expect(onComplete).toHaveBeenCalledTimes(1);
            expect(onComplete).toHaveBeenCalledWith('OUTPUT_A', receiptFor('OUTPUT_A'));
        });
    });

    describe('cancel and unmount', () => {
        it('does not deliver a response that arrives after Cancel and calls onCancel once', async () => {
            const onComplete = vi.fn();
            const onCancel = vi.fn();
            const transport = deferredTransport();
            vi.stubGlobal('fetch', transport.fetchMock);

            render(<ProcessingScreen {...taskA()} onComplete={onComplete} onCancel={onCancel} />);
            await advance(1);
            expect(transport.fetchMock).toHaveBeenCalledTimes(1);

            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            expect(onCancel).toHaveBeenCalledTimes(1);

            await act(async () => { transport.release(0, responseFor('OUTPUT_A')); await Promise.resolve(); });
            await advance(3000);

            expect(onComplete).not.toHaveBeenCalled();
            expect(screen.queryByTestId('completion-banner')).toBeNull();
        });

        it('aborts the in-flight request on Cancel', async () => {
            const transport = deferredTransport();
            vi.stubGlobal('fetch', transport.fetchMock);

            render(<ProcessingScreen {...taskA()} onComplete={vi.fn()} onCancel={vi.fn()} />);
            await advance(1);
            const signal = transport.fetchMock.mock.calls[0][1]?.signal as AbortSignal;
            expect(signal.aborted).toBe(false);

            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            expect(signal.aborted).toBe(true);
        });

        it('suppresses the scheduled no-badge completion when Cancel happens before the 300ms timer', async () => {
            const onComplete = vi.fn();
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseFor('OUTPUT_A')));

            render(<ProcessingScreen {...taskA()} onComplete={onComplete} onCancel={vi.fn()} />);
            await advance(10);
            expect(onComplete).not.toHaveBeenCalled();

            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            await advance(3000);

            expect(onComplete).not.toHaveBeenCalled();
        });

        it('suppresses the badge auto-advance when Cancel happens before the 2000ms timer', async () => {
            const onComplete = vi.fn();
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseFor('OUTPUT_A', true)));

            render(<ProcessingScreen {...taskA()} onComplete={onComplete} onCancel={vi.fn()} />);
            await advance(1);
            expect(screen.getByTestId('completion-banner')).toBeTruthy();

            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            await advance(3000);

            expect(onComplete).not.toHaveBeenCalled();
        });

        it('does not deliver a response or scheduled completion after unmount', async () => {
            const onComplete = vi.fn();
            const transport = deferredTransport();
            vi.stubGlobal('fetch', transport.fetchMock);

            const view = render(<ProcessingScreen {...taskA()} onComplete={onComplete} onCancel={vi.fn()} />);
            await advance(1);
            view.unmount();
            await act(async () => { transport.release(0, responseFor('OUTPUT_A')); await Promise.resolve(); });
            await advance(3000);

            expect(onComplete).not.toHaveBeenCalled();
        });

        it('does not deliver the delayed no-badge completion after unmount', async () => {
            const onComplete = vi.fn();
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseFor('OUTPUT_A')));

            const view = render(<ProcessingScreen {...taskA()} onComplete={onComplete} onCancel={vi.fn()} />);
            await advance(10);
            view.unmount();
            await advance(3000);

            expect(onComplete).not.toHaveBeenCalled();
        });
    });

    describe('same logical task', () => {
        it('does not issue another request when only the callbacks change', async () => {
            const fetchMock = vi.fn().mockReturnValue(new Promise(() => { }));
            vi.stubGlobal('fetch', fetchMock);

            const task = taskA();
            const view = render(<ProcessingScreen {...task} onComplete={vi.fn()} onCancel={vi.fn()} />);
            await advance(1);
            view.rerender(<ProcessingScreen {...task} onComplete={vi.fn()} onCancel={vi.fn()} />);
            await advance(1);

            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('does not issue another request for fresh but equivalent input objects', async () => {
            const fetchMock = vi.fn().mockReturnValue(new Promise(() => { }));
            vi.stubGlobal('fetch', fetchMock);

            const first = taskA();
            const view = render(<ProcessingScreen {...first} onComplete={vi.fn()} onCancel={vi.fn()} />);
            await advance(1);
            const equivalent = taskA();
            // Different object identity, same content: distinguishes request content from React identity.
            expect(equivalent.inputs).not.toBe(first.inputs);
            expect(equivalent.inputs).toEqual(first.inputs);
            view.rerender(<ProcessingScreen {...equivalent} onComplete={vi.fn()} onCancel={vi.fn()} />);
            await advance(1);

            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('does not issue another request when the language changes', async () => {
            const fetchMock = vi.fn().mockReturnValue(new Promise(() => { }));
            vi.stubGlobal('fetch', fetchMock);

            const task = taskA();
            const onComplete = vi.fn();
            const onCancel = vi.fn();
            const view = render(<ProcessingScreen {...task} onComplete={onComplete} onCancel={onCancel} />);
            await advance(1);
            language.current = 'vi';
            view.rerender(<ProcessingScreen {...task} onComplete={onComplete} onCancel={onCancel} />);
            await advance(1);

            expect(language.current).toBe('vi');
            expect(fetchMock).toHaveBeenCalledTimes(1);
        });

        it('issues one request under StrictMode', async () => {
            const fetchMock = vi.fn().mockReturnValue(new Promise(() => { }));
            vi.stubGlobal('fetch', fetchMock);

            render(
                <StrictMode>
                    <ProcessingScreen {...taskA()} onComplete={vi.fn()} onCancel={vi.fn()} />
                </StrictMode>,
            );
            await advance(5);

            expect(fetchMock).toHaveBeenCalledTimes(1);
        });
    });

    describe('request replacement', () => {
        it('lets replacement B win and ignores the late response of A', async () => {
            const onComplete = vi.fn();
            const transport = deferredTransport();
            vi.stubGlobal('fetch', transport.fetchMock);

            const view = render(<ProcessingScreen {...taskA()} onComplete={onComplete} onCancel={vi.fn()} />);
            await advance(1);
            view.rerender(<ProcessingScreen {...taskB()} onComplete={onComplete} onCancel={vi.fn()} />);
            await advance(1);

            expect(transport.fetchMock).toHaveBeenCalledTimes(2);
            expect(bodyOf(transport.fetchMock, 0).templateId).toBe('task_a');
            expect(bodyOf(transport.fetchMock, 1).templateId).toBe('task_b');
            expect(bodyOf(transport.fetchMock, 1).inputs).toEqual({ topic: 'synthetic task B' });

            await act(async () => { transport.release(0, responseFor('OUTPUT_A')); await Promise.resolve(); });
            await advance(500);
            expect(onComplete).not.toHaveBeenCalled();

            await act(async () => { transport.release(1, responseFor('OUTPUT_B')); await Promise.resolve(); });
            await advance(500);

            expect(onComplete).toHaveBeenCalledTimes(1);
            expect(onComplete).toHaveBeenCalledWith('OUTPUT_B', receiptFor('OUTPUT_B'));
        });

        it('treats a changed intent as a new request', async () => {
            const fetchMock = vi.fn().mockReturnValue(new Promise(() => { }));
            vi.stubGlobal('fetch', fetchMock);

            const view = render(<ProcessingScreen {...taskA()} onComplete={vi.fn()} onCancel={vi.fn()} />);
            await advance(1);
            view.rerender(<ProcessingScreen {...taskA()} intent="Refined intent" onComplete={vi.fn()} onCancel={vi.fn()} />);
            await advance(1);

            expect(fetchMock).toHaveBeenCalledTimes(2);
            expect(bodyOf(fetchMock, 1).intent).toBe('Refined intent');
        });
    });

    describe('completion delivery', () => {
        it('delivers once when View Results is clicked repeatedly and the timer later expires', async () => {
            const onComplete = vi.fn();
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseFor('OUTPUT_A', true)));

            render(<ProcessingScreen {...taskA()} onComplete={onComplete} onCancel={vi.fn()} />);
            await advance(1);
            const button = screen.getByTestId('view-results-btn');
            fireEvent.click(button);
            fireEvent.click(button);
            await advance(3000);

            expect(onComplete).toHaveBeenCalledTimes(1);
            expect(onComplete).toHaveBeenCalledWith('OUTPUT_A', receiptFor('OUTPUT_A'));
        });

        it('delivers once when the timer fires first and View Results is clicked afterwards', async () => {
            const onComplete = vi.fn();
            vi.stubGlobal('fetch', vi.fn().mockResolvedValue(responseFor('OUTPUT_A', true)));

            render(<ProcessingScreen {...taskA()} onComplete={onComplete} onCancel={vi.fn()} />);
            await advance(2500);
            expect(onComplete).toHaveBeenCalledTimes(1);

            const button = screen.queryByTestId('view-results-btn');
            if (button) fireEvent.click(button);
            await advance(3000);

            expect(onComplete).toHaveBeenCalledTimes(1);
        });
    });

    describe('demo execution', () => {
        beforeEach(() => {
            vi.spyOn(Math, 'random').mockReturnValue(1);
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('stops the demo interval and completion on Cancel', async () => {
            const onComplete = vi.fn();
            const fetchMock = vi.fn();
            vi.stubGlobal('fetch', fetchMock);

            render(<ProcessingScreen templateName="Demo" onComplete={onComplete} onCancel={vi.fn()} />);
            await advance(600);
            expect(vi.getTimerCount()).toBeGreaterThan(0);

            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            expect(vi.getTimerCount()).toBe(0);
            await advance(20000);

            expect(onComplete).not.toHaveBeenCalled();
            expect(fetchMock).not.toHaveBeenCalled();
        });

        it('clears the demo timers on unmount', async () => {
            const onComplete = vi.fn();
            const view = render(<ProcessingScreen templateName="Demo" onComplete={onComplete} onCancel={vi.fn()} />);
            await advance(600);
            view.unmount();
            expect(vi.getTimerCount()).toBe(0);
            await advance(20000);

            expect(onComplete).not.toHaveBeenCalled();
        });

        it('still completes an uncancelled demo run once with generated output', async () => {
            const onComplete = vi.fn();
            const fetchMock = vi.fn();
            vi.stubGlobal('fetch', fetchMock);

            render(<ProcessingScreen templateName="Demo" onComplete={onComplete} onCancel={vi.fn()} />);
            await advance(20000);

            expect(onComplete).toHaveBeenCalledTimes(1);
            expect(String(onComplete.mock.calls[0][0])).toContain('# Demo Analysis');
            expect(fetchMock).not.toHaveBeenCalled();
        });
    });

    describe('recovery attempt isolation (Local reviewer)', () => {
        it('does not import a late approval id into replacement B or keep B busy', async () => {
            let release!: (value: unknown) => void;
            const pending = new Promise(resolve => { release = resolve; });
            vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(heldResponse('A', 'NEEDS_APPROVAL'))
                .mockReturnValueOnce(pending).mockResolvedValueOnce(heldResponse('B', 'NEEDS_APPROVAL')));
            const callbacks = { onComplete: vi.fn(), onCancel: vi.fn() };
            const view = render(<ProcessingScreen {...taskA()} {...callbacks} />);
            await advance(1);
            fireEvent.click(screen.getByTestId('submit-approval-btn'));
            view.rerender(<ProcessingScreen {...taskB()} {...callbacks} />);
            await advance(1);
            expect((screen.getByTestId('submit-approval-btn') as HTMLButtonElement).disabled).toBe(false);
            await act(async () => { release({ json: async () => ({ success: true, id: 'approval_A' }) }); });
            expect(screen.queryByTestId('approval-status-panel')).toBeNull();
            expect(trackEvent).not.toHaveBeenCalledWith('task_recovery_started', expect.objectContaining({ approvalId: 'approval_A' }));
        });

        it('does not mark B reported when the abandoned A report succeeds', async () => {
            let release!: (value: unknown) => void;
            const pending = new Promise(resolve => { release = resolve; });
            vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(heldResponse('A', 'BLOCK'))
                .mockReturnValueOnce(pending).mockResolvedValueOnce(heldResponse('B', 'BLOCK')));
            const callbacks = { onComplete: vi.fn(), onCancel: vi.fn() };
            const view = render(<ProcessingScreen {...taskA()} {...callbacks} />);
            await advance(1);
            fireEvent.click(screen.getByTestId('report-false-positive-btn'));
            view.rerender(<ProcessingScreen {...taskB()} {...callbacks} />);
            await advance(1);
            await act(async () => { release({ ok: true, json: async () => ({ success: true }) }); });
            expect(screen.getByTestId('report-false-positive-btn').textContent).toBe('Report false positive');
            expect(trackEvent).not.toHaveBeenCalledWith('task_recovery_started', expect.objectContaining({ receiptId: 'A' }));
        });

        it.each(['BLOCK', 'NEEDS_APPROVAL'] as const)('ignores late %s JSON after cancel', async decision => {
            let releaseJson!: (value: unknown) => void;
            const pendingJson = new Promise(resolve => { releaseJson = resolve; });
            vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(heldResponse('A', decision))
                .mockResolvedValueOnce({ ok: true, json: () => pendingJson }));
            render(<ProcessingScreen {...taskA()} onComplete={vi.fn()} onCancel={vi.fn()} />);
            await advance(1);
            const buttonId = decision === 'BLOCK' ? 'report-false-positive-btn' : 'submit-approval-btn';
            await act(async () => { fireEvent.click(screen.getByTestId(buttonId)); });
            fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
            await act(async () => { releaseJson({ success: true, id: 'approval_A' }); });
            expect(screen.queryByTestId('approval-status-panel')).toBeNull();
            expect(screen.getByTestId(buttonId).textContent).not.toContain('Report recorded');
            expect(trackEvent).not.toHaveBeenCalledWith('task_recovery_started', expect.anything());
        });

        it.each(['BLOCK', 'NEEDS_APPROVAL'] as const)('ignores late %s rejection and keeps B submission owned by B', async decision => {
            let rejectOld!: (reason: Error) => void;
            const pending = new Promise((_resolve, reject) => { rejectOld = reject; });
            vi.stubGlobal('fetch', vi.fn().mockResolvedValueOnce(heldResponse('A', decision))
                .mockReturnValueOnce(pending).mockResolvedValueOnce(heldResponse('B', decision))
                .mockReturnValueOnce(new Promise(() => {})));
            const callbacks = { onComplete: vi.fn(), onCancel: vi.fn() };
            const view = render(<ProcessingScreen {...taskA()} {...callbacks} />);
            await advance(1);
            const buttonId = decision === 'BLOCK' ? 'report-false-positive-btn' : 'submit-approval-btn';
            fireEvent.click(screen.getByTestId(buttonId));
            view.rerender(<ProcessingScreen {...taskB()} {...callbacks} />);
            await advance(1);
            fireEvent.click(screen.getByTestId(buttonId));
            await act(async () => { rejectOld(new Error('Abandoned A failure')); });
            expect((screen.getByTestId(buttonId) as HTMLButtonElement).disabled).toBe(true);
            expect(screen.queryByRole('alert')?.textContent).not.toContain('The report was not recorded');
            expect(screen.queryByTestId('approval-status-panel')).toBeNull();
        });
    });

    describe('failure and fallback controls', () => {
        it('shows a classified failure for a real request without mock fallback or completion', async () => {
            const onComplete = vi.fn();
            vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network down')));

            render(<ProcessingScreen {...taskA()} onComplete={onComplete} onCancel={vi.fn()} />);
            await advance(3000);

            expect(screen.getByRole('alert').textContent).toContain('No mock output was generated');
            expect(onComplete).not.toHaveBeenCalled();
        });
    });
});
