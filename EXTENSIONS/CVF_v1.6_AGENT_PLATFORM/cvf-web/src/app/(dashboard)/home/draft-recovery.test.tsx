/**
 * @vitest-environment jsdom
 *
 * Offline composition regressions for local stop / editable draft / explicit resubmit:
 * the real Home page, real DynamicForm and real ProcessingScreen over the real persisted
 * execution store. Only unrelated leaves are stubbed: ResultViewer (retry/reject/follow-up
 * callbacks), SpecExport (the visible Create Agent Spec flow is NOT proven here; the real
 * form submit event is used) and the browse experience. The only network seam is a
 * controlled synthetic /api/execute response; the shared provider fetch guard is
 * asserted separately and no provider destination is ever contacted.
 *
 * Text Encoding Exception: two Vietnamese documentation-template option values are
 * asserted verbatim; all other authored text is ASCII.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import HomePage from './page';
import { templates } from '@/lib/templates';
import { useExecutionStore } from '@/lib/store';
import type { Execution } from '@/types';

// Captured before any spy: this is the shared setup provider-denial guard.
const guardedFetch = globalThis.fetch;

const nav = vi.hoisted(() => ({ params: new URLSearchParams() }));
const mockSettings = vi.hoisted(() => ({
    settings: { providers: {}, preferences: { defaultExportMode: 'governance' } },
    isLoaded: true,
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    useSearchParams: () => nav.params,
}));
vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/components/Settings', () => ({ useSettings: () => mockSettings }));
vi.mock('@/components/SpecExport', () => ({ SpecExport: () => null }));
vi.mock('@/lib/skill-template-map', () => ({ getSkillForTemplate: () => null }));
vi.mock('@/lib/hooks/useExecute', () => {
    const providers: never[] = [];
    const fetchProviders = () => undefined;
    return { useProviders: () => ({ providers, anyConfigured: false, fetchProviders }) };
});

vi.mock('@/components', async () => {
    const { DynamicForm } = await vi.importActual<typeof import('@/components/DynamicForm')>('@/components/DynamicForm');
    const { ProcessingScreen } = await vi.importActual<typeof import('@/components/ProcessingScreen')>('@/components/ProcessingScreen');
    return {
        DynamicForm,
        ProcessingScreen,
        ResultViewer: (props: {
            execution: Execution;
            output: string;
            onAccept: () => void;
            onReject: () => void;
            onRetry: () => void;
            onFollowUp?: (refinement: string) => void;
        }) => (
            <div data-testid="result-viewer">
                <span data-testid="result-id">{props.execution.id}</span>
                <span data-testid="result-output">{props.output}</span>
                <button onClick={props.onAccept}>accept</button>
                <button onClick={props.onReject}>reject</button>
                <button onClick={props.onRetry}>retry</button>
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
    };
});

vi.mock('@/components/home/HomeBrowseExperience', () => ({
    HomeBrowseExperience: (props: {
        templates: Array<{ id: string }>;
        handleSelectTemplate: (template: unknown) => void;
        handleDemoRun: () => void;
    }) => (
        <div data-testid="home-browse-experience">
            <button onClick={() => props.handleSelectTemplate(props.templates.find(t => t.id === 'documentation'))}>
                pick-documentation
            </button>
            <button onClick={() => props.handleSelectTemplate(props.templates.find(t => t.id === 'strategy_analysis'))}>
                pick-strategy
            </button>
            <button onClick={props.handleDemoRun}>run-demo</button>
        </div>
    ),
}));

const STORAGE_KEY = 'cvf-executions-storage';
const FROZEN_NOW = 1791763200000;
const strategy = templates.find(t => t.id === 'strategy_analysis')!;

// Independent drafts: required fields plus both advanced fields of the documentation template.
const DRAFT_A = {
    subject: 'Selected draft A subject',
    currentNotes: 'Notes that only belong to draft A',
    readerGoal: 'Recover without typing again',
    audience: 'Quản lý / approver',
    mustPreserve: 'Keep the Enterprise Plus name',
};

interface Call {
    body: { templateId: string; inputs: Record<string, string>; intent: string };
    signal?: AbortSignal;
    respond: (payload: Record<string, unknown>) => void;
}
let calls: Call[];
let requestedUrls: string[];
let fetchSpy: ReturnType<typeof vi.spyOn>;

function buildSaved(id: string, output: string, overrides: Partial<Execution> = {}): Execution {
    return {
        id,
        templateId: 'documentation',
        templateName: 'Saved template',
        input: { subject: `${id} subject` },
        intent: `${id} intent`,
        output,
        status: 'completed',
        createdAt: new Date('2026-10-11T00:00:00Z'),
        ...overrides,
    };
}
const buildB = () => buildSaved('exec_saved_B', 'OUTPUT_B', {
    result: 'accepted', threadId: 'thread_B', rootExecutionId: 'root_B', projectLabel: 'Project B', knowledgeCollectionId: 'kc_B',
});

const executions = () => useExecutionStore.getState().executions;
const byId = (id: string) => executions().find(e => e.id === id);
const serial = (id: string) => JSON.stringify(byId(id));
const persisted = (id: string): Execution | undefined =>
    JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').state?.executions?.find((e: Execution) => e.id === id);
const newestId = () => executions()[0].id;
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const field = (name: string) =>
    document.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
const valueOf = (name: string) => field(name)?.value;
const formValues = () => Array.from(document.querySelectorAll<HTMLInputElement>('input,textarea,select')).map(e => e.value);

function fill(values: Record<string, string>) {
    for (const [name, value] of Object.entries(values)) fireEvent.change(field(name)!, { target: { value } });
}
function openAdvanced() {
    if (!field('mustPreserve')) click(/Advanced Options/);
}
async function submitForm() {
    await act(async () => { fireEvent.submit(document.querySelector('form')!); });
    await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy());
}
async function fetchStarted(count: number) {
    await waitFor(() => expect(calls.length).toBe(count));
}
async function startA() {
    render(<HomePage />);
    click('pick-documentation');
    fill({ subject: DRAFT_A.subject, currentNotes: DRAFT_A.currentNotes, readerGoal: DRAFT_A.readerGoal });
    openAdvanced();
    fill({ audience: DRAFT_A.audience, mustPreserve: DRAFT_A.mustPreserve });
    await submitForm();
    await fetchStarted(1);
    return newestId();
}
async function completeCurrent(call: Call, output: string) {
    await act(async () => { call.respond({ success: true, output }); });
    await waitFor(() => expect(screen.getByTestId('result-viewer')).toBeTruthy(), { timeout: 3000 });
}

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    nav.params = new URLSearchParams();
    useExecutionStore.setState({ executions: [], currentExecution: null });
    calls = [];
    requestedUrls = [];
    // Transport is deliberately NOT abort-aware, so late delivery after Cancel is exercised.
    fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        requestedUrls.push(String(input));
        return new Promise<Response>((resolve) => {
            calls.push({
                body: JSON.parse(String(init?.body)),
                signal: init?.signal ?? undefined,
                respond: (payload) => resolve(new Response(JSON.stringify(payload), { status: 200 })),
            });
        });
    });
});

afterEach(() => {
    expect(requestedUrls.every(url => url === '/api/execute')).toBe(true);
    fetchSpy.mockRestore();
    vi.restoreAllMocks();
});

describe('control: a fresh submit still completes on the selected attempt', () => {
    it('binds the fresh attempt, ignores ambient B and keeps the saved result viewable', async () => {
        const b = buildB();
        const bBefore = JSON.stringify(b);
        const id = await startA();
        act(() => { useExecutionStore.getState().addExecution(b); });
        expect(byId(id)?.input).toEqual(DRAFT_A);
        expect(calls[0].body.inputs).toEqual(DRAFT_A);

        await completeCurrent(calls[0], 'OUT_FRESH');

        expect(screen.getByTestId('result-id').textContent).toBe(id);
        expect(byId(id)?.status).toBe('completed');
        expect(byId(id)?.output).toBe('OUT_FRESH');
        expect(JSON.stringify(byId(b.id))).toBe(bBefore);
    });
});

describe('REQ-STOP: cancel marks only the bound attempt unsuccessful locally', () => {
    it('fails only A in memory and in persisted storage, aborts the client request and starts nothing new', async () => {
        const b = buildB();
        const id = await startA();
        act(() => { useExecutionStore.getState().addExecution(b); });
        const bBefore = serial(b.id);
        const before = byId(id)!;

        click('Cancel');

        expect(byId(id)?.status).toBe('failed');
        expect(byId(id)?.input).toEqual(before.input);
        expect(byId(id)?.intent).toBe(before.intent);
        expect(byId(id)?.output).toBeUndefined();
        expect(persisted(id)?.status).toBe('failed');
        expect(persisted(id)?.input).toEqual(DRAFT_A);
        expect(serial(b.id)).toBe(bBefore);
        expect(executions()).toHaveLength(2);
        expect(calls).toHaveLength(1);
        expect(calls[0].signal?.aborted).toBe(true);
        expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
        const notice = screen.getByTestId('draft-stop-notice').textContent ?? '';
        expect(notice).toContain('on this device');
        expect(notice).toContain('may not have stopped');
    });

    it('uses the same exit after a displayed local failure', async () => {
        const id = await startA();
        await act(async () => { calls[0].respond({ success: false, error: 'Provider offline' }); });
        await waitFor(() => expect(screen.getByRole('alert').textContent).toContain('Provider offline'));
        expect(byId(id)?.status).toBe('processing');

        click('Cancel');

        expect(byId(id)?.status).toBe('failed');
        expect(persisted(id)?.status).toBe('failed');
        expect(valueOf('subject')).toBe(DRAFT_A.subject);
        expect(executions()).toHaveLength(1);
        expect(calls).toHaveLength(1);
    });

    it('does not downgrade a record that completed elsewhere while processing', async () => {
        const id = await startA();
        act(() => { useExecutionStore.getState().updateExecution(id, { status: 'completed', output: 'OUT_ELSEWHERE' }); });

        click('Cancel');

        expect(byId(id)?.status).toBe('completed');
        expect(byId(id)?.output).toBe('OUT_ELSEWHERE');
        expect(persisted(id)?.status).toBe('completed');
        expect(valueOf('subject')).toBe(DRAFT_A.subject);
    });

    it('creates nothing and leaves other records alone when the bound record is missing', async () => {
        const b = buildB();
        const id = await startA();
        act(() => {
            useExecutionStore.setState({ executions: [b], currentExecution: b });
        });
        const bBefore = serial(b.id);

        click('Cancel');

        expect(executions().map(e => e.id)).toEqual([b.id]);
        expect(serial(b.id)).toBe(bBefore);
        expect(byId(id)).toBeUndefined();
        expect(valueOf('subject')).toBe(DRAFT_A.subject);
    });

    it('ignores a late response after the stop and never shows output for it', async () => {
        const id = await startA();
        click('Cancel');

        await act(async () => {
            calls[0].respond({ success: true, output: 'OUT_LATE' });
            await new Promise(resolve => setTimeout(resolve, 450));
        });

        expect(screen.queryByTestId('result-viewer')).toBeNull();
        expect(byId(id)?.status).toBe('failed');
        expect(byId(id)?.output).toBeUndefined();
        expect(valueOf('subject')).toBe(DRAFT_A.subject);
        expect(document.body.textContent).not.toContain('OUT_LATE');
    });
});

describe('REQ-DRAFT: the exact editable draft is restored', () => {
    it('returns required and advanced values after cancel and recomputes intent from edited values', async () => {
        const id = await startA();
        const oldIntent = byId(id)!.intent;
        click('Cancel');

        expect(valueOf('subject')).toBe(DRAFT_A.subject);
        expect(valueOf('currentNotes')).toBe(DRAFT_A.currentNotes);
        expect(valueOf('readerGoal')).toBe(DRAFT_A.readerGoal);
        expect(valueOf('audience')).toBe(DRAFT_A.audience);
        expect(valueOf('mustPreserve')).toBe(DRAFT_A.mustPreserve);

        fill({ subject: 'Edited subject C' });
        await submitForm();
        await fetchStarted(2);

        expect(calls[1].body.inputs).toEqual({ ...DRAFT_A, subject: 'Edited subject C' });
        expect(calls[1].body.intent).toContain('Edited subject C');
        expect(calls[1].body.intent).not.toContain(DRAFT_A.subject);
        expect(calls[1].body.intent).not.toBe(oldIntent);
        expect(byId(newestId())?.intent).toBe(calls[1].body.intent);
        expect(byId(id)?.status).toBe('failed');
    });

    it('keeps required validation and defaults on the restored form', async () => {
        await startA();
        click('Cancel');

        fill({ subject: '' });
        await act(async () => { fireEvent.submit(document.querySelector('form')!); });

        expect(await screen.findByText('This field is required')).toBeTruthy();
        expect(calls).toHaveLength(1);
        expect(executions()).toHaveLength(1);
    });

    it('shows the unchanged documentation defaults when no draft is supplied', () => {
        render(<HomePage />);
        click('pick-documentation');

        expect(valueOf('subject')).toBe('');
        expect(screen.queryByTestId('draft-stop-notice')).toBeNull();
        openAdvanced();
        expect(valueOf('audience')).toBe('Người vận hành nội bộ');
        expect(valueOf('mustPreserve')).toBe('');
    });

    it('restores the filled fields on Retry without executing or altering saved A', async () => {
        const id = await startA();
        await completeCurrent(calls[0], 'OUT_A');
        const aBefore = serial(id);

        click('retry');

        expect(screen.queryByTestId('result-viewer')).toBeNull();
        expect(valueOf('subject')).toBe(DRAFT_A.subject);
        expect(valueOf('currentNotes')).toBe(DRAFT_A.currentNotes);
        expect(valueOf('audience')).toBe(DRAFT_A.audience);
        expect(valueOf('mustPreserve')).toBe(DRAFT_A.mustPreserve);
        expect(screen.queryByTestId('draft-stop-notice')).toBeNull();
        expect(serial(id)).toBe(aBefore);
        expect(executions()).toHaveLength(1);
        expect(calls).toHaveLength(1);
    });

    it('restores the draft on Reject and changes only the review result of bound A', async () => {
        const b = buildB();
        const id = await startA();
        await completeCurrent(calls[0], 'OUT_A');
        act(() => { useExecutionStore.getState().addExecution(b); });
        const bBefore = serial(b.id);
        const aBefore = JSON.parse(serial(id));

        click('reject');

        expect(serial(id)).toBe(JSON.stringify({ ...aBefore, result: 'rejected' }));
        expect(serial(b.id)).toBe(bBefore);
        expect(valueOf('subject')).toBe(DRAFT_A.subject);
        expect(valueOf('mustPreserve')).toBe(DRAFT_A.mustPreserve);
        expect(executions()).toHaveLength(2);
        expect(calls).toHaveLength(1);
    });

    it('clears the prior draft and notice on Back and for a different template', async () => {
        await startA();
        click('Cancel');
        expect(screen.getByTestId('draft-stop-notice')).toBeTruthy();

        fireEvent.click(document.querySelector('button')!);
        expect(screen.getByTestId('home-browse-experience')).toBeTruthy();
        click('pick-documentation');
        expect(valueOf('subject')).toBe('');
        expect(valueOf('currentNotes')).toBe('');
        expect(screen.queryByTestId('draft-stop-notice')).toBeNull();

        fireEvent.click(document.querySelector('button')!);
        click('pick-strategy');
        const leaked = formValues().filter(value => Object.values(DRAFT_A).includes(value));
        expect(leaked).toEqual([]);
        expect(field(strategy.fields[0].id)?.value ?? '').toBe('');
        expect(screen.queryByTestId('draft-stop-notice')).toBeNull();
    });
});

describe('REQ-DRAFT: a fresh launch query resets the mounted recovered form', () => {
    it('clears required/advanced fields on a fresh choice of the same template', async () => {
        const view = render(<HomePage />);
        click('pick-documentation'); openAdvanced(); fill(DRAFT_A); await submitForm(); await fetchStarted(1);
        const id = newestId(); click('Cancel'); const saved = serial(id);
        nav.params = new URLSearchParams('template=documentation'); view.rerender(<HomePage />);
        await waitFor(() => expect(valueOf('subject')).toBe(''));
        expect(valueOf('currentNotes')).toBe(''); openAdvanced();
        expect(valueOf('audience')).toBe('Người vận hành nội bộ'); expect(valueOf('mustPreserve')).toBe('');
        expect(screen.queryByTestId('draft-stop-notice')).toBeNull();
        expect(serial(id)).toBe(saved); expect(calls).toHaveLength(1);
    });

    it('never submits the previous template fields after a different fresh launch', async () => {
        const view = render(<HomePage />);
        click('pick-documentation'); openAdvanced(); fill(DRAFT_A); await submitForm(); await fetchStarted(1);
        const id = newestId(); click('Cancel'); const saved = serial(id);
        nav.params = new URLSearchParams('template=strategy_analysis'); view.rerender(<HomePage />);
        await waitFor(() => expect(field('topic')).not.toBeNull());
        fill({ topic: 'Fresh strategy topic', context: 'Fresh strategy context' }); await submitForm(); await fetchStarted(2);
        expect(calls[1].body.templateId).toBe('strategy_analysis');
        for (const key of Object.keys(DRAFT_A)) expect(calls[1].body.inputs).not.toHaveProperty(key);
        expect(calls[1].body.inputs.topic).toBe('Fresh strategy topic');
        expect(calls[1].body.intent).not.toContain(DRAFT_A.subject);
        expect(serial(id)).toBe(saved); expect(screen.queryByTestId('draft-stop-notice')).toBeNull();
    });
});

describe('REQ-IDENTITY: an explicit resubmit is a distinct attempt', () => {
    it('creates C with a new id under a frozen clock and prior colliding ids, keeping A and B', async () => {
        vi.spyOn(Date, 'now').mockReturnValue(FROZEN_NOW);
        const b = buildB();
        const legacy = buildSaved(`exec_${FROZEN_NOW}`, 'OUTPUT_LEGACY');
        const legacyBefore = JSON.stringify(legacy);
        act(() => { useExecutionStore.setState({ executions: [b, legacy], currentExecution: b }); });
        const bBefore = serial(b.id);

        const a = await startA();
        await completeCurrent(calls[0], 'OUT_A');
        const aBefore = serial(a);
        click('retry');
        await submitForm();
        await fetchStarted(2);
        const c = newestId();

        expect(new Set(executions().map(e => e.id)).size).toBe(4);
        expect(a).not.toBe(`exec_${FROZEN_NOW}`);
        expect(c).not.toBe(a);
        expect(byId(c)?.status).toBe('processing');
        expect(byId(c)?.input).toEqual(DRAFT_A);
        expect(byId(c)?.output).toBeUndefined();
        expect(byId(c)?.result).toBeUndefined();
        expect(byId(c)?.evidenceReceiptSnapshot).toBeUndefined();
        expect(byId(c)?.parentExecutionId).toBeUndefined();
        expect(byId(c)?.threadId).toBeUndefined();
        expect(serial(a)).toBe(aBefore);
        expect(serial(b.id)).toBe(bBefore);
        expect(JSON.stringify(byId(legacy.id))).toBe(legacyBefore);
        expect(screen.queryByTestId('result-viewer')).toBeNull();
    });

    it('completes C on its own record and leaves saved A untouched', async () => {
        vi.spyOn(Date, 'now').mockReturnValue(FROZEN_NOW);
        const a = await startA();
        await completeCurrent(calls[0], 'OUT_A');
        const aBefore = serial(a);
        click('retry');
        await submitForm();
        await fetchStarted(2);
        const c = newestId();

        await completeCurrent(calls[1], 'OUT_C');

        expect(screen.getByTestId('result-id').textContent).toBe(c);
        expect(screen.getByTestId('result-output').textContent).toBe('OUT_C');
        expect(byId(c)?.output).toBe('OUT_C');
        expect(serial(a)).toBe(aBefore);
    });

    it('gives each same-clock demo attempt its own id', async () => {
        vi.spyOn(Date, 'now').mockReturnValue(FROZEN_NOW);
        render(<HomePage />);
        click('run-demo');
        await fetchStarted(1);
        const first = newestId();
        click('Cancel');
        fireEvent.click(document.querySelector('button')!);
        click('run-demo');
        await fetchStarted(2);
        const second = newestId();

        expect(second).not.toBe(first);
        expect(byId(first)?.status).toBe('failed');
        expect(byId(second)?.status).toBe('processing');
        expect(first).not.toBe(`exec_demo_${FROZEN_NOW}`);
    });
});

describe('follow-up and continuation boundaries', () => {
    it('stops a follow-up on its own record and resubmits fresh without continuation metadata', async () => {
        const a = await startA();
        await completeCurrent(calls[0], 'OUT_A');
        const aBefore = serial(a);

        click('follow-up');
        await fetchStarted(2);
        const followUp = newestId();
        expect(byId(followUp)?.parentExecutionId).toBe(a);
        expect(calls[1].body.inputs._previousOutput).toBe('OUT_A');

        click('Cancel');

        expect(byId(followUp)?.status).toBe('failed');
        expect(serial(a)).toBe(aBefore);
        expect(valueOf('subject')).toBe(DRAFT_A.subject);
        expect(valueOf('mustPreserve')).toBe(DRAFT_A.mustPreserve);

        await submitForm();
        await fetchStarted(3);
        const fresh = newestId();

        expect(calls[2].body.inputs).toEqual(DRAFT_A);
        expect(calls[2].body.inputs._previousOutput).toBeUndefined();
        expect(fresh).not.toBe(followUp);
        expect(byId(fresh)?.parentExecutionId).toBeUndefined();
        expect(byId(fresh)?.threadId).toBeUndefined();
        expect(byId(fresh)?.input._previousOutput).toBeUndefined();
        expect(serial(a)).toBe(aBefore);
    });

    it('does not carry a completed follow-up context into a resubmit after Retry', async () => {
        const a = await startA();
        await completeCurrent(calls[0], 'OUT_A');
        click('follow-up');
        await fetchStarted(2);
        await completeCurrent(calls[1], 'OUT_FOLLOW');
        click('retry');

        await submitForm();
        await fetchStarted(3);

        expect(calls[2].body.inputs._previousOutput).toBeUndefined();
        expect(byId(newestId())?.input).toEqual(DRAFT_A);
        expect(byId(a)?.output).toBe('OUT_A');
    });

    it('keeps accepted+completed history Continue eligibility and rejects ineligible records', () => {
        const accepted = buildSaved('exec_hist_ok', 'OUT_HIST', { templateId: 'documentation', result: 'accepted' });
        const unaccepted = buildSaved('exec_hist_no', 'OUT_NO');
        act(() => { useExecutionStore.setState({ executions: [unaccepted, accepted], currentExecution: unaccepted }); });
        nav.params = new URLSearchParams('continue=exec_hist_ok');
        const view = render(<HomePage />);
        expect(screen.getByTestId('result-id').textContent).toBe('exec_hist_ok');
        view.unmount();

        nav.params = new URLSearchParams('continue=exec_hist_no');
        render(<HomePage />);
        expect(screen.getByTestId('home-browse-experience')).toBeTruthy();
        expect(screen.queryByTestId('result-viewer')).toBeNull();
    });
});

describe('no-provider boundary', () => {
    it('keeps the shared setup guard denying a provider destination', async () => {
        await expect(guardedFetch('https://api.openai.com/v1/chat/completions')).rejects.toThrow(/CVF_PROVIDER_EXECUTION_DENIED/);
        expect(requestedUrls).toEqual([]);
    });
});
