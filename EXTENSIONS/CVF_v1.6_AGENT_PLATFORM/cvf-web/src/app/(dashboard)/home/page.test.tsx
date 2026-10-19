/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { webcrypto } from 'node:crypto';
import HomePage from './page';
import { templates } from '@/lib/templates';
import { useExecutionStore } from '@/lib/store';
import type { Execution } from '@/types';
import { createReceiptArchive } from '@/lib/execution-receipt-archive';

const navigation = vi.hoisted(() => ({ params: new URLSearchParams() }));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    useSearchParams: () => navigation.params,
}));

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

vi.mock('@/lib/analytics', () => ({
    trackEvent: vi.fn(),
}));

vi.mock('@/components/Settings', () => ({
    useSettings: () => ({ settings: { providers: {} } }),
}));

vi.mock('@/lib/hooks/useExecute', () => {
    const providers: never[] = [];
    const fetchProviders = () => undefined;
    return {
        useProviders: () => ({ providers, anyConfigured: false, fetchProviders }),
    };
});

// Leaf controls are replaced by stubs that expose their callbacks as buttons.
// The Home page and the execution store stay real.
vi.mock('@/components', () => ({
    DynamicForm: (props: { onSubmit: (values: Record<string, string>, intent: string) => void }) => (
        <div data-testid="dynamic-form">
            <button onClick={() => props.onSubmit({ topic: 'fresh topic' }, 'fresh intent')}>submit-form</button>
        </div>
    ),
    ProcessingScreen: (props: { onComplete: (output: string, receipt?: unknown) => void }) => (
        <div data-testid="processing-screen">
            <button onClick={() => props.onComplete('OUTPUT_NEW')}>complete-processing</button>
            <button onClick={() => props.onComplete('OUTPUT_RECEIPT', {
                receiptId: 'route-receipt-1', evidenceMode: 'live', routeId: '/api/execute',
                generatedAt: '2026-10-14T00:00:00Z', provider: 'alibaba', model: 'qwen-flash',
            })}>complete-with-receipt</button>
        </div>
    ),
    ResultViewer: (props: {
        execution: Execution;
        output: string;
        evidenceReceipt?: { receiptId: string };
        savedLocalHistory?: boolean;
        onAccept: () => void;
        onReject: () => void;
        onBack: () => void;
        onRetry: () => void;
        onFollowUp?: (refinement: string) => void;
    }) => (
        <div data-testid="result-viewer">
            <span data-testid="result-id">{props.execution.id}</span>
            <span data-testid="result-template">{props.execution.templateId}</span>
            <span data-testid="result-output">{props.output}</span>
            <span data-testid="result-receipt">{props.evidenceReceipt?.receiptId ?? ''}</span>
            <span data-testid="result-origin">{props.savedLocalHistory ? 'saved' : 'current'}</span>
            <button onClick={props.onBack}>back</button>
            <button onClick={props.onRetry}>retry-result</button>
            <button onClick={props.onAccept}>accept</button>
            <button onClick={props.onReject}>reject</button>
            <button onClick={() => props.onFollowUp?.('refine it')}>follow-up</button>
        </div>
    ),
    TemplatePreviewModal: () => null,
    OnboardingTour: () => null,
    AppBuilderWizard: () => null,
    ProductDesignWizard: () => null,
    MarketingCampaignWizard: () => null,
    BusinessStrategyWizard: () => null,
    SecurityAssessmentWizard: () => null,
    ResearchProjectWizard: () => null,
    SystemDesignWizard: () => null,
    ContentStrategyWizard: () => null,
    DataAnalysisWizard: () => null,
}));

vi.mock('@/components/home/HomeBrowseExperience', () => ({
    HomeBrowseExperience: (props: {
        templates: Array<{ id: string }>;
        handleSelectTemplate: (template: unknown) => void;
    }) => (
        <div data-testid="home-browse-experience">
            <button onClick={() => props.handleSelectTemplate(props.templates.find(t => t.id === 'documentation'))}>
                pick-documentation
            </button>
        </div>
    ),
}));

const documentation = templates.find(t => !t.isFolder && t.id === 'documentation')!;
const otherTemplate = templates.find(t => !t.isFolder && t.id !== documentation.id)!;

// Each call builds an independent object so that A, B and the other fixtures
// can never alias one another.
function fixture(id: string, output: string, overrides: Partial<Execution> = {}): Execution {
    return {
        id,
        templateId: documentation.id,
        templateName: documentation.name,
        category: documentation.category,
        input: { topic: `${id} topic` },
        intent: `${id} intent`,
        output,
        status: 'completed',
        createdAt: new Date('2026-10-11T00:00:00Z'),
        ...overrides,
    };
}

const buildA = () => fixture('exec_fixture_A', 'OUTPUT_A', {
    result: 'accepted',
    threadId: 'thread_A',
    rootExecutionId: 'root_A',
    projectLabel: 'Project A',
    knowledgeCollectionId: 'kc_A',
});

const buildB = () => fixture('exec_fixture_B', 'OUTPUT_B', {
    threadId: 'thread_B',
    rootExecutionId: 'root_B',
    projectLabel: 'Project B',
    knowledgeCollectionId: 'kc_B',
});

const buildC = () => fixture('exec_fixture_C', 'OUTPUT_C', {
    templateId: otherTemplate.id,
    templateName: otherTemplate.name,
    category: otherTemplate.category,
    result: 'accepted',
    threadId: 'thread_C',
    rootExecutionId: 'root_C',
});

const buildUnaccepted = () => fixture('exec_fixture_R', 'OUTPUT_R', { result: 'rejected' });
const buildEmptyOutput = () => fixture('exec_fixture_E', '', { result: 'accepted' });
const buildMissingTemplate = () => fixture('exec_fixture_T', 'OUTPUT_T', {
    result: 'accepted',
    templateId: 'template_missing_fixture',
});

function seed(executions: Execution[], current: Execution | null) {
    useExecutionStore.setState({ executions, currentExecution: current });
}

function openHistory(id: string) {
    navigation.params = new URLSearchParams(`continue=${id}`);
}

function byId(id: string) {
    return useExecutionStore.getState().executions.find(e => e.id === id);
}

function click(name: string) {
    fireEvent.click(screen.getByRole('button', { name }));
}

function startFreshRun() {
    click('pick-documentation');
    click('submit-form');
}

beforeEach(() => {
    vi.stubGlobal('crypto', webcrypto);
    localStorage.clear();
    sessionStorage.clear();
    navigation.params = new URLSearchParams();
    useExecutionStore.setState({ executions: [], currentExecution: null });
});
afterEach(() => vi.unstubAllGlobals());

describe('HomePage', () => {
    it('captures route receipt without delaying the completed result', async () => {
        render(<HomePage />);
        startFreshRun();
        click('complete-with-receipt');
        expect(screen.getByTestId('result-output').textContent).toBe('OUTPUT_RECEIPT');
        expect(screen.getByTestId('result-receipt').textContent).toBe('route-receipt-1');
        expect(screen.getByTestId('result-origin').textContent).toBe('current');
        const id = screen.getByTestId('result-id').textContent!;
        await waitFor(() => expect(byId(id)?.savedReceiptArchive?.receipt.receiptId).toBe('route-receipt-1'));
    });

    it('restores only the exact selected saved archive and omits a mismatched one', async () => {
        const archive = (await createReceiptArchive('exec_fixture_A', 'OUTPUT_A', {
            receiptId: 'saved-A', evidenceMode: 'mock', routeId: '/api/execute',
            generatedAt: '2026-10-14T00:00:00Z', provider: 'alibaba', model: 'qwen-flash',
        }))!;
        const a = buildA();
        a.savedReceiptArchive = archive;
        a.evidenceReceiptSnapshot = { receiptId: 'saved-A', provider: 'alibaba', model: 'qwen-flash' };
        seed([a], null);
        navigation.params = new URLSearchParams('result=exec_fixture_A');
        const view = render(<HomePage />);
        await waitFor(() => expect(screen.getByTestId('result-receipt').textContent).toBe('saved-A'));
        expect(screen.getByTestId('result-origin').textContent).toBe('saved');
        view.unmount();
        seed([{ ...a, output: 'TAMPERED' }], null);
        render(<HomePage />);
        await waitFor(() => expect(screen.getByTestId('result-output').textContent).toBe('TAMPERED'));
        expect(screen.getByTestId('result-receipt').textContent).toBe('');
    });

    it.each(['back', 'retry-result'] as const)(
        'archives the unchanged completed row after %s without publishing a stale UI receipt', async action => {
            let resolveDigest: ((digest: ArrayBuffer) => void) | undefined;
            vi.stubGlobal('crypto', { subtle: { digest: () => new Promise<ArrayBuffer>(resolve => { resolveDigest = resolve; }) } });
            render(<HomePage />);
            startFreshRun();
            click('complete-with-receipt');
            const id = screen.getByTestId('result-id').textContent!;
            expect(screen.getByTestId('result-output').textContent).toBe('OUTPUT_RECEIPT');
            click(action);
            await act(async () => {
                resolveDigest!(await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode('OUTPUT_RECEIPT')));
            });
            await waitFor(() => expect(byId(id)?.savedReceiptArchive?.receipt.receiptId).toBe('route-receipt-1'));
            expect(screen.queryByTestId('result-viewer')).toBeNull();
        },
    );

    it.each(['output', 'deleted', 'snapshot', 'provider', 'model'] as const)(
        'rejects a delayed captured receipt when the original row has changed: %s',
        async change => {
            let resolveDigest: ((digest: ArrayBuffer) => void) | undefined;
            vi.stubGlobal('crypto', { subtle: { digest: () => new Promise<ArrayBuffer>(resolve => { resolveDigest = resolve; }) } });
            render(<HomePage />);
            startFreshRun();
            click('complete-with-receipt');
            const id = screen.getByTestId('result-id').textContent!;
            click('back');
            if (change === 'output') useExecutionStore.getState().updateExecution(id, { output: 'CHANGED' });
            if (change === 'snapshot') useExecutionStore.getState().updateExecution(id, { evidenceReceiptSnapshot: { receiptId: 'other' } });
            if (change === 'provider') useExecutionStore.getState().updateExecution(id, { evidenceReceiptSnapshot: { receiptId: 'route-receipt-1', provider: 'openai', model: 'qwen-flash' } });
            if (change === 'model') useExecutionStore.getState().updateExecution(id, { evidenceReceiptSnapshot: { receiptId: 'route-receipt-1', provider: 'alibaba', model: 'other-model' } });
            if (change === 'deleted') useExecutionStore.setState({ executions: [], currentExecution: null });
            await act(async () => {
                resolveDigest!(await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode('OUTPUT_RECEIPT')));
            });
            expect(byId(id)?.savedReceiptArchive).toBeUndefined();
            expect(screen.queryByTestId('result-viewer')).toBeNull();
        },
    );

    it('does not publish a delayed restored receipt after leaving history', async () => {
        const archive = (await createReceiptArchive('exec_fixture_A', 'OUTPUT_A', {
            receiptId: 'saved-A', evidenceMode: 'static', routeId: '/api/execute',
            generatedAt: '2026-10-14T00:00:00Z',
        }))!;
        const a = buildA();
        a.savedReceiptArchive = archive;
        a.evidenceReceiptSnapshot = { receiptId: 'saved-A' };
        seed([a], null);
        navigation.params = new URLSearchParams('result=exec_fixture_A');
        let resolveDigest: ((digest: ArrayBuffer) => void) | undefined;
        vi.stubGlobal('crypto', { subtle: { digest: () => new Promise<ArrayBuffer>(resolve => { resolveDigest = resolve; }) } });
        render(<HomePage />);
        expect(screen.getByTestId('result-id').textContent).toBe(a.id);
        click('back');
        await act(async () => {
            resolveDigest!(await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode('OUTPUT_A')));
        });
        expect(screen.queryByTestId('result-viewer')).toBeNull();
    });

    it.each(['provider', 'model'] as const)(
        'does not publish a delayed restored receipt after the selected snapshot changes: %s',
        async change => {
            const archive = (await createReceiptArchive('exec_fixture_A', 'OUTPUT_A', {
                receiptId: 'saved-A', evidenceMode: 'live', routeId: '/api/execute',
                generatedAt: '2026-10-14T00:00:00Z', provider: 'alibaba', model: 'qwen-flash',
            }))!;
            const a = buildA();
            a.savedReceiptArchive = archive;
            a.evidenceReceiptSnapshot = { receiptId: 'saved-A', provider: 'alibaba', model: 'qwen-flash' };
            seed([a], null);
            navigation.params = new URLSearchParams('result=exec_fixture_A');
            let resolveDigest: ((digest: ArrayBuffer) => void) | undefined;
            vi.stubGlobal('crypto', { subtle: { digest: () => new Promise<ArrayBuffer>(resolve => { resolveDigest = resolve; }) } });
            render(<HomePage />);
            expect(screen.getByTestId('result-id').textContent).toBe(a.id);
            useExecutionStore.getState().updateExecution(a.id, {
                evidenceReceiptSnapshot: change === 'provider'
                    ? { receiptId: 'saved-A', provider: 'openai', model: 'qwen-flash' }
                    : { receiptId: 'saved-A', provider: 'alibaba', model: 'other-model' },
            });
            await act(async () => {
                resolveDigest!(await webcrypto.subtle.digest('SHA-256', new TextEncoder().encode('OUTPUT_A')));
            });
            expect(screen.getByTestId('result-receipt').textContent).toBe('');
            expect(screen.getByTestId('result-origin').textContent).toBe('current');
        },
    );

    it('keeps ordinary completed output when WebCrypto is unavailable', async () => {
        vi.stubGlobal('crypto', {});
        render(<HomePage />);
        startFreshRun();
        click('complete-with-receipt');
        const id = screen.getByTestId('result-id').textContent!;
        expect(screen.getByTestId('result-output').textContent).toBe('OUTPUT_RECEIPT');
        expect(screen.getByTestId('result-receipt').textContent).toBe('route-receipt-1');
        await act(async () => { await Promise.resolve(); });
        expect(byId(id)?.savedReceiptArchive).toBeUndefined();
    });
    it('renders the browse experience by default', () => {
        render(<HomePage />);
        expect(screen.getByTestId('home-browse-experience')).toBeTruthy();
    });

    describe('restored history identity', () => {
        it('shows restored A when the ambient current execution is B', () => {
            const a = buildA();
            const b = buildB();
            seed([b, a], b);
            openHistory(a.id);
            render(<HomePage />);

            expect(screen.getByTestId('result-id').textContent).toBe('exec_fixture_A');
            expect(screen.getByTestId('result-template').textContent).toBe(documentation.id);
            expect(screen.getByTestId('result-output').textContent).toBe('OUTPUT_A');
        });

        it('shows restored A when there is no ambient current execution', () => {
            const a = buildA();
            const b = buildB();
            seed([a, b], null);
            openHistory(a.id);
            render(<HomePage />);

            expect(screen.getByTestId('result-id').textContent).toBe('exec_fixture_A');
            expect(screen.getByTestId('result-output').textContent).toBe('OUTPUT_A');
        });

        it('keeps A displayed when the ambient current execution changes to another execution', () => {
            const a = buildA();
            const b = buildB();
            const c = buildC();
            seed([b, a], b);
            openHistory(a.id);
            render(<HomePage />);

            act(() => {
                useExecutionStore.getState().addExecution(c);
            });

            expect(useExecutionStore.getState().currentExecution?.id).toBe('exec_fixture_C');
            expect(screen.getByTestId('result-id').textContent).toBe('exec_fixture_A');
            expect(screen.getByTestId('result-output').textContent).toBe('OUTPUT_A');
        });
    });

    describe('actions bind to the displayed execution', () => {
        it('rejects restored A and leaves ambient B unchanged', () => {
            const a = buildA();
            const b = buildB();
            const bBefore = structuredClone(b);
            seed([b, a], b);
            openHistory(a.id);
            render(<HomePage />);

            click('reject');

            expect(byId(a.id)?.result).toBe('rejected');
            expect(byId(b.id)).toEqual(bBefore);
        });

        it('follow-up from restored A uses A as the parent and leaves A and B unchanged', () => {
            const a = buildA();
            const b = buildB();
            const aBefore = structuredClone(a);
            const bBefore = structuredClone(b);
            seed([b, a], b);
            openHistory(a.id);
            render(<HomePage />);

            click('follow-up');

            const created = useExecutionStore.getState().executions[0];
            expect(created.id).not.toBe(a.id);
            expect(created.parentExecutionId).toBe('exec_fixture_A');
            expect(created.threadId).toBe('thread_A');
            expect(created.rootExecutionId).toBe('root_A');
            expect(created.projectLabel).toBe('Project A');
            expect(created.knowledgeCollectionId).toBe('kc_A');
            expect(created.input._previousOutput).toBe('OUTPUT_A');
            expect(created.intent).toBe('refine it');
            expect(screen.getByTestId('processing-screen')).toBeTruthy();
            expect(byId(a.id)).toEqual(aBefore);
            expect(byId(b.id)).toEqual(bBefore);
        });

        it('accepts a fresh execution after the ambient current execution moves to B', () => {
            const b = buildB();
            const bBefore = structuredClone(b);
            seed([], null);
            render(<HomePage />);

            startFreshRun();
            const created = useExecutionStore.getState().executions[0];
            click('complete-processing');
            expect(screen.getByTestId('result-id').textContent).toBe(created.id);

            act(() => {
                useExecutionStore.getState().addExecution(b);
            });
            click('accept');

            expect(byId(created.id)?.result).toBe('accepted');
            expect(byId(b.id)).toEqual(bBefore);
        });
    });

    describe('history controls', () => {
        it('switches identity and actions from A to C together', () => {
            const a = buildA();
            const b = buildB();
            const c = buildC();
            const aBefore = structuredClone(a);
            const bBefore = structuredClone(b);
            seed([c, b, a], b);
            openHistory(a.id);
            const view = render(<HomePage />);

            openHistory(c.id);
            view.rerender(<HomePage />);

            expect(screen.getByTestId('result-id').textContent).toBe('exec_fixture_C');
            expect(screen.getByTestId('result-template').textContent).toBe(otherTemplate.id);
            expect(screen.getByTestId('result-output').textContent).toBe('OUTPUT_C');

            click('reject');

            expect(byId(c.id)?.result).toBe('rejected');
            expect(byId(a.id)).toEqual(aBefore);
            expect(byId(b.id)).toEqual(bBefore);
        });

        it.each([
            ['unknown id', 'exec_missing'],
            ['unaccepted', 'exec_fixture_R'],
            ['empty output', 'exec_fixture_E'],
            ['unavailable template', 'exec_fixture_T'],
        ])('returns an invalid history query (%s) to browse without showing prior output', (_label, targetId) => {
            const a = buildA();
            const b = buildB();
            const invalidFixtures = [buildUnaccepted(), buildEmptyOutput(), buildMissingTemplate()];
            const bBefore = structuredClone(b);
            // Ambient A matches the History warm-click state, so the valid precondition
            // is established on both old and new code and the invalid transition is isolated.
            seed([b, a, ...invalidFixtures], a);
            openHistory(a.id);
            const view = render(<HomePage />);
            expect(screen.getByTestId('result-id').textContent).toBe('exec_fixture_A');

            navigation.params = new URLSearchParams(`continue=${targetId}`);
            view.rerender(<HomePage />);

            expect(screen.getByTestId('home-browse-experience')).toBeTruthy();
            expect(screen.queryByTestId('result-viewer')).toBeNull();
            expect(screen.queryByText('OUTPUT_A')).toBeNull();
            expect(useExecutionStore.getState().executions).toHaveLength(2 + invalidFixtures.length);
            expect(byId(b.id)).toEqual(bBefore);
        });

        it('keeps a fresh submission bound to the created execution when no continue parameter is present', () => {
            const b = buildB();
            const bBefore = structuredClone(b);
            seed([b], b);
            render(<HomePage />);

            startFreshRun();
            const created = useExecutionStore.getState().executions[0];
            expect(created.id).not.toBe(b.id);
            click('complete-processing');

            expect(screen.getByTestId('result-id').textContent).toBe(created.id);
            expect(screen.getByTestId('result-output').textContent).toBe('OUTPUT_NEW');
            expect(byId(created.id)?.output).toBe('OUTPUT_NEW');
            expect(byId(b.id)).toEqual(bBefore);
        });

        it('binds processing completion to the created execution when the ambient current execution changes during processing', () => {
            const b = buildB();
            const d = fixture('exec_fixture_D', 'OUTPUT_D');
            const bBefore = structuredClone(b);
            const dBefore = structuredClone(d);
            seed([b], b);
            render(<HomePage />);

            startFreshRun();
            const created = useExecutionStore.getState().executions[0];
            act(() => {
                useExecutionStore.getState().addExecution(d);
            });
            click('complete-processing');

            expect(screen.getByTestId('result-id').textContent).toBe(created.id);
            expect(byId(created.id)?.output).toBe('OUTPUT_NEW');
            expect(byId(d.id)).toEqual(dBefore);
            expect(byId(b.id)).toEqual(bBefore);
        });
    });
});
