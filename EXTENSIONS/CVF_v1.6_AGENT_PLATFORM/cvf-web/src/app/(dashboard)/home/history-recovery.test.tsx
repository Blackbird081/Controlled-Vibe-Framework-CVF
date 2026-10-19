/**
 * @vitest-environment jsdom
 *
 * Offline composition regressions for the saved-result journey:
 * real History page -> real Home page -> real ResultViewer over the real
 * persisted execution store. Only unrelated leaf controls are stubbed and no
 * provider call can happen (the shared setup fetch guard stays enabled).
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useSyncExternalStore } from 'react';
import { render, screen, fireEvent, act, within } from '@testing-library/react';
import HomePage from './page';
import HistoryPage from '../history/page';
import { templates } from '@/lib/templates';
import { useExecutionStore } from '@/lib/store';
import type { Execution } from '@/types';

// Minimal in-test router: push() records the real URL and re-renders the shell,
// useSearchParams() is stable per query string like the Next.js hook.
const nav = vi.hoisted(() => {
    process.env.NEXT_PUBLIC_CVF_NONCODER_ITERATION_MEMORY = 'true';
    const listeners = new Set<() => void>();
    const cache = new Map<string, URLSearchParams>();
    const s = {
        url: '/history',
        pushed: [] as string[],
        reset(url: string) {
            s.url = url;
            s.pushed = [];
            cache.clear();
        },
        go(url: string) {
            s.url = url;
            listeners.forEach((listener) => listener());
        },
        push(url: string) {
            s.pushed.push(url);
            s.go(url);
        },
        subscribe(listener: () => void) {
            listeners.add(listener);
            return () => { listeners.delete(listener); };
        },
        params(): URLSearchParams {
            const query = s.url.split('?')[1] ?? '';
            if (!cache.has(query)) cache.set(query, new URLSearchParams(query));
            return cache.get(query)!;
        },
    };
    return s;
});

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: nav.push, replace: nav.push }),
    useSearchParams: () => nav.params(),
}));

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));

vi.mock('@/components/Settings', () => ({
    useSettings: () => ({ settings: { providers: {} } }),
}));

vi.mock('@/lib/hooks/useExecute', () => {
    const providers: never[] = [];
    const fetchProviders = () => undefined;
    return { useProviders: () => ({ providers, anyConfigured: false, fetchProviders }) };
});

// HistoryList and ResultViewer are the real components; unrelated leaves are stubs.
vi.mock('@/components', async () => {
    const { ResultViewer } = await vi.importActual<typeof import('@/components/ResultViewer')>('@/components/ResultViewer');
    const { HistoryList } = await vi.importActual<typeof import('@/components/HistoryList')>('@/components/HistoryList');
    return {
        ResultViewer,
        HistoryList,
        DynamicForm: (props: { onSubmit: (values: Record<string, string>, intent: string) => void }) => (
            <div data-testid="dynamic-form">
                <button onClick={() => props.onSubmit({ topic: 'fresh topic' }, 'fresh intent')}>submit-form</button>
            </div>
        ),
        ProcessingScreen: (props: { onComplete: (output: string) => void }) => (
            <div data-testid="processing-screen">
                <button onClick={() => props.onComplete('OUT_FRESH_4Z')}>complete-processing</button>
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
    }) => (
        <div data-testid="home-browse-experience">
            <button onClick={() => props.handleSelectTemplate(props.templates.find((t) => t.id === 'documentation'))}>
                pick-documentation
            </button>
        </div>
    ),
}));

const STORAGE_KEY = 'cvf-executions-storage';
const doc = templates.find((t) => !t.isFolder && t.id === 'documentation')!;

const OUT = { A: 'OUT_ALPHA_7Q', B: 'OUT_BRAVO_3K', C: 'OUT_CHARLIE_9M', R: 'OUT_ROSE_2P', U: 'OUT_UNREVIEWED_5T' };

// Every call builds an independent object, so fixtures never alias one another.
function run(id: string, output: string, overrides: Partial<Execution> = {}): Execution {
    return {
        id,
        templateId: doc.id,
        templateName: doc.name,
        category: doc.category,
        input: { topic: `topic for ${id}` },
        intent: `intent for ${id}`,
        output,
        status: 'completed',
        createdAt: new Date('2026-10-11T00:00:00Z'),
        ...overrides,
    };
}

const buildA = (id = 'exec_saved_A') => run(id, OUT.A, {
    result: 'accepted', threadId: 'thread_A', rootExecutionId: 'root_A',
    projectLabel: 'Project A', knowledgeCollectionId: 'kc_A',
});
const buildB = () => run('exec_saved_B', OUT.B, {
    result: 'accepted', threadId: 'thread_B', rootExecutionId: 'root_B',
    projectLabel: 'Project B', knowledgeCollectionId: 'kc_B',
});
const buildC = () => run('exec_saved_C', OUT.C, { threadId: 'thread_C', rootExecutionId: 'root_C' });
const buildRejected = () => run('exec_saved_R', OUT.R, { result: 'rejected' });
const buildUnreviewed = () => run('exec_saved_U', OUT.U);
const buildInvalid = () => [
    run('exec_processing', 'OUT_PROCESSING', { status: 'processing' }),
    run('exec_failed', 'OUT_FAILED', { status: 'failed' }),
    run('exec_empty', '', { result: 'accepted' }),
    run('exec_no_template', 'OUT_NO_TEMPLATE', { result: 'accepted', templateId: 'template_missing_fixture' }),
];

const snapshot = () => JSON.stringify(useExecutionStore.getState().executions);
// The History row click still moves the ambient pointer (existing behavior), so
// persisted stability is asserted on the saved executions, not the whole payload.
const storedExecutions = () => JSON.stringify(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').state?.executions);
const byId = (id: string) => useExecutionStore.getState().executions.find((e) => e.id === id);

// Simulates a cold start: only the persisted localStorage value feeds the store.
async function coldStart(executions: Execution[], ambient: Execution | null) {
    useExecutionStore.setState({ executions: [], currentExecution: null });
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { executions, currentExecution: ambient }, version: 0 }));
    await useExecutionStore.persist.rehydrate();
}

function Shell() {
    const url = useSyncExternalStore(nav.subscribe, () => nav.url);
    return url.startsWith('/home') ? <HomePage /> : <HistoryPage />;
}

function historyRow(execution: Execution) {
    return screen.getByText(execution.input.topic).closest('[class*="cursor-pointer"]') as HTMLElement;
}

const clickRow = (execution: Execution) => fireEvent.click(screen.getByText(execution.input.topic));
const clickButton = (name: RegExp | string) => fireEvent.click(screen.getByRole('button', { name }));
const page = () => document.body.textContent ?? '';

function readBlob(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
    });
}

let writeText: ReturnType<typeof vi.fn>;
let blobs: Map<string, Blob>;
let downloads: Array<{ name: string; href: string }>;
let fetchSpy: ReturnType<typeof vi.spyOn>;
let clickSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    nav.reset('/history');
    useExecutionStore.setState({ executions: [], currentExecution: null });

    writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    blobs = new Map();
    downloads = [];
    let counter = 0;
    URL.createObjectURL = vi.fn((blob: Blob) => {
        const href = `blob:history-recovery/${counter++}`;
        blobs.set(href, blob);
        return href;
    });
    URL.revokeObjectURL = vi.fn();
    clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) {
        downloads.push({ name: this.download, href: this.href });
    });
    // Pass-through spy: the shared provider fetch guard stays in force.
    fetchSpy = vi.spyOn(globalThis, 'fetch');
});

afterEach(() => {
    expect(fetchSpy).not.toHaveBeenCalled();
    fetchSpy.mockRestore();
    clickSpy.mockRestore();
});

describe('accepted continue control', () => {
    it('restores exact A from the continue query while the ambient run is B', async () => {
        const a = buildA();
        const b = buildB();
        await coldStart([b, a], b);
        nav.reset(`/home?continue=${a.id}`);
        render(<Shell />);

        expect(page()).toContain(OUT.A);
        expect(page()).not.toContain(OUT.B);
    });

    it('keeps the accepted-only Continue button distinct from basic row selection', async () => {
        const a = buildA();
        const u = buildUnreviewed();
        await coldStart([u, a], u);
        render(<Shell />);

        expect(within(historyRow(a)).getByTestId('continue-work-btn')).toBeTruthy();
        expect(within(historyRow(u)).queryByTestId('continue-work-btn')).toBeNull();

        fireEvent.click(within(historyRow(a)).getByTestId('continue-work-btn'));
        expect(nav.pushed).toEqual([`/home?continue=${a.id}`]);
        expect(page()).toContain(OUT.A);
    });
});

describe('History click reopens the selected saved result', () => {
    it.each([
        ['accepted', buildA, OUT.A],
        ['rejected', buildRejected, OUT.R],
        ['not yet reviewed', buildUnreviewed, OUT.U],
    ])('opens a %s completed result after a persisted cold start with ambient B', async (_label, build, marker) => {
        const target = build();
        const b = buildB();
        await coldStart([b, target], b);
        const before = snapshot();
        const storedBefore = storedExecutions();
        render(<Shell />);

        clickRow(target);

        expect(nav.pushed).toEqual([`/home?result=${encodeURIComponent(target.id)}`]);
        expect(page()).toContain(marker);
        expect(page()).not.toContain(OUT.B);
        expect(snapshot()).toBe(before);
        expect(storedExecutions()).toBe(storedBefore);
    });

    it('encodes an id with reserved characters and restores that exact record', async () => {
        const awkward = buildA('exec/saved A&1#x?y=z');
        const decoy = buildA('exec/saved A');
        await coldStart([decoy, awkward], decoy);
        render(<Shell />);

        clickRow(awkward);

        expect(nav.pushed).toEqual([`/home?result=${encodeURIComponent(awkward.id)}`]);
        expect(nav.params().get('result')).toBe(awkward.id);
        expect(page()).toContain(OUT.A);
    });

    it('opens the selected record from the URL alone, with or without an ambient run', async () => {
        const a = buildA();
        const b = buildB();
        await coldStart([b, a], null);
        nav.reset(`/home?result=${a.id}`);
        const view = render(<Shell />);
        expect(page()).toContain(OUT.A);
        view.unmount();

        await coldStart([a, b], b);
        nav.reset(`/home?result=${a.id}`);
        render(<Shell />);
        expect(page()).toContain(OUT.A);
        expect(page()).not.toContain(OUT.B);
    });
});

describe('identity and review actions bind to the selected record', () => {
    it('keeps A displayed and reviewed when the ambient run changes to B and a new run C', async () => {
        const a = buildA();
        const b = buildB();
        await coldStart([b, a], b);
        render(<Shell />);
        clickRow(a);

        act(() => {
            useExecutionStore.getState().setCurrentExecution(b);
            useExecutionStore.getState().addExecution(buildC());
        });
        const bBefore = JSON.stringify(byId(b.id));
        const cBefore = JSON.stringify(byId('exec_saved_C'));

        expect(page()).toContain(OUT.A);
        expect(page()).not.toContain(OUT.C);

        clickButton(/Reject/);

        expect(byId(a.id)?.result).toBe('rejected');
        expect(JSON.stringify(byId(b.id))).toBe(bBefore);
        expect(JSON.stringify(byId('exec_saved_C'))).toBe(cBefore);
    });

    it('accepts an unreviewed result opened from History, leaving other records unchanged', async () => {
        const u = buildUnreviewed();
        const b = buildB();
        await coldStart([b, u], b);
        const bBefore = JSON.stringify(byId(b.id));
        render(<Shell />);
        clickRow(u);

        clickButton(/Accept/);

        expect(byId(u.id)?.result).toBe('accepted');
        expect(JSON.stringify(byId(b.id))).toBe(bBefore);
    });

    it('starts a bound follow-up from A without rerunning it and keeps A and B unchanged', async () => {
        const a = buildA();
        const b = buildB();
        await coldStart([b, a], b);
        const aBefore = JSON.stringify(byId(a.id));
        const bBefore = JSON.stringify(byId(b.id));
        const countBefore = useExecutionStore.getState().executions.length;
        render(<Shell />);
        clickRow(a);

        fireEvent.change(screen.getByTestId('followup-input'), { target: { value: 'refine the saved result' } });
        fireEvent.click(screen.getByTestId('followup-submit-btn'));

        const executions = useExecutionStore.getState().executions;
        expect(executions).toHaveLength(countBefore + 1);
        const child = executions[0];
        expect(child.id).not.toBe(a.id);
        expect(child.parentExecutionId).toBe(a.id);
        expect(child.threadId).toBe('thread_A');
        expect(child.rootExecutionId).toBe('root_A');
        expect(child.projectLabel).toBe('Project A');
        expect(child.knowledgeCollectionId).toBe('kc_A');
        expect(child.input._previousOutput).toBe(OUT.A);
        expect(child.intent).toBe('refine the saved result');
        expect(screen.getByTestId('processing-screen')).toBeTruthy();
        expect(JSON.stringify(byId(a.id))).toBe(aBefore);
        expect(JSON.stringify(byId(b.id))).toBe(bBefore);
    });
});

describe('real ResultViewer export of a restored result', () => {
    async function openA() {
        const a = buildA();
        const b = buildB();
        await coldStart([b, a], b);
        render(<Shell />);
        clickRow(a);
        return { a, b };
    }

    it('copies A to the clipboard without an execute request or a fabricated receipt', async () => {
        const { a } = await openA();
        const before = snapshot();

        clickButton(/Export/);
        await act(async () => { clickButton(/Copy to Clipboard/); });

        expect(writeText).toHaveBeenCalledTimes(1);
        const copied = String(writeText.mock.calls[0][0]);
        expect(copied).toContain(OUT.A);
        expect(copied).toContain(doc.name);
        expect(copied).not.toContain(OUT.B);
        expect(copied).not.toContain('CVF Evidence Receipt');
        expect(snapshot()).toBe(before);
        expect(byId(a.id)?.output).toBe(OUT.A);
    });

    it('downloads the Markdown result and the deliverable pack from A only', async () => {
        const { a } = await openA();

        clickButton(/Export/);
        clickButton(/Download \.md/);
        clickButton(/Export/);
        fireEvent.click(screen.getByTestId('download-pack-btn'));

        expect(downloads).toHaveLength(2);
        expect(downloads[0].name).toMatch(new RegExp(`^cvf-result-${doc.id}-`));
        expect(downloads[1].name).toMatch(new RegExp(`^cvf-pack-${doc.id}-`));
        const markdown = await readBlob(blobs.get(downloads[0].href)!);
        const pack = await readBlob(blobs.get(downloads[1].href)!);

        for (const content of [markdown, pack]) {
            expect(content).toContain(OUT.A);
            expect(content).not.toContain(OUT.B);
            expect(content).not.toContain('CVF Evidence Receipt');
        }
        expect(pack).toContain(`**Source execution**: ${a.id}`);
        expect(pack).toContain('**Receipt available**: no');
        expect(pack).not.toContain('**Receipt id**');
    });
});

describe('invalid saved-result queries return to browse', () => {
    it.each([
        ['unknown id', 'exec_missing'],
        ['processing record', 'exec_processing'],
        ['failed record', 'exec_failed'],
        ['empty output', 'exec_empty'],
        ['unavailable template', 'exec_no_template'],
    ])('drops prior bound output for %s without creating or changing a run', async (_label, targetId) => {
        const a = buildA();
        const b = buildB();
        await coldStart([b, a, ...buildInvalid()], b);
        nav.reset(`/home?result=${a.id}`);
        render(<Shell />);
        expect(page()).toContain(OUT.A);
        const before = snapshot();

        act(() => nav.go(`/home?result=${targetId}`));

        expect(screen.getByTestId('home-browse-experience')).toBeTruthy();
        expect(page()).not.toContain(OUT.A);
        expect(screen.queryByRole('button', { name: /Accept/ })).toBeNull();
        expect(snapshot()).toBe(before);
    });

    it('shows browse for an invalid query on a cold start', async () => {
        await coldStart([buildB(), ...buildInvalid()], buildB());
        nav.reset('/home?result=exec_processing');
        render(<Shell />);

        expect(screen.getByTestId('home-browse-experience')).toBeTruthy();
        expect(page()).not.toContain('OUT_PROCESSING');
    });
});

describe('continue precedence and eligibility', () => {
    // Local review regression: presence controls precedence, even with a blank id.
    it.each(['result=', 'result=%20%20', 'continue=&result=exec_saved_B', 'continue=%20&result=exec_saved_B'])(
        'clears the prior result instead of falling back for %s', async (query) => {
            const a = buildA();
            const b = buildB();
            await coldStart([b, a], b);
            nav.reset(`/home?result=${a.id}`);
            render(<Shell />);
            expect(page()).toContain(OUT.A);
            const before = snapshot();

            act(() => nav.go(`/home?${query}`));

            expect(screen.getByTestId('home-browse-experience')).toBeTruthy();
            expect(page()).not.toContain(OUT.A);
            expect(page()).not.toContain(OUT.B);
            expect(screen.queryByRole('button', { name: /Accept/ })).toBeNull();
            expect(snapshot()).toBe(before);
        },
    );

    it.each(['pending', 'processing', 'failed'] as const)(
        'rejects an accepted but non-completed %s record on continue', async (status) => {
            const a = buildA();
            const invalid = run('exec_status_invalid', 'OUT_STATUS_INVALID', { result: 'accepted', status });
            await coldStart([a, invalid], invalid);
            nav.reset(`/home?continue=${a.id}`);
            render(<Shell />);
            expect(page()).toContain(OUT.A);
            const before = snapshot();

            act(() => nav.go(`/home?continue=${invalid.id}&result=${a.id}`));

            expect(screen.getByTestId('home-browse-experience')).toBeTruthy();
            expect(page()).not.toContain(OUT.A);
            expect(page()).not.toContain('OUT_STATUS_INVALID');
            expect(snapshot()).toBe(before);
        },
    );

    it('lets an ineligible continue govern even when result names a valid record', async () => {
        const a = buildA();
        const r = buildRejected();
        await coldStart([r, a], a);
        nav.reset(`/home?continue=${r.id}&result=${a.id}`);
        render(<Shell />);

        expect(screen.getByTestId('home-browse-experience')).toBeTruthy();
        expect(page()).not.toContain(OUT.A);
        expect(page()).not.toContain(OUT.R);
    });

    it('lets an eligible continue win over a different result record', async () => {
        const a = buildA();
        const b = buildB();
        await coldStart([b, a], b);
        nav.reset(`/home?continue=${a.id}&result=${b.id}`);
        render(<Shell />);

        expect(page()).toContain(OUT.A);
        expect(page()).not.toContain(OUT.B);
    });

    it('keeps continue accepted-only while the same unreviewed record opens through result', async () => {
        const u = buildUnreviewed();
        await coldStart([u], u);
        nav.reset(`/home?continue=${u.id}`);
        const view = render(<Shell />);
        expect(screen.getByTestId('home-browse-experience')).toBeTruthy();
        view.unmount();

        nav.reset(`/home?result=${u.id}`);
        render(<Shell />);
        expect(page()).toContain(OUT.U);
    });
});

describe('fresh submission is unaffected', () => {
    it('binds a fresh run to its own execution while the ambient run is B', async () => {
        const b = buildB();
        await coldStart([b], b);
        const bBefore = JSON.stringify(byId(b.id));
        nav.reset('/home');
        render(<Shell />);

        clickButton('pick-documentation');
        clickButton('submit-form');
        const created = useExecutionStore.getState().executions[0];
        expect(created.id).not.toBe(b.id);
        clickButton('complete-processing');

        expect(page()).toContain('OUT_FRESH_4Z');
        expect(byId(created.id)?.output).toBe('OUT_FRESH_4Z');
        clickButton(/Accept/);
        expect(byId(created.id)?.result).toBe('accepted');
        expect(JSON.stringify(byId(b.id))).toBe(bBefore);
    });
});
