/**
 * @vitest-environment jsdom
 *
 * Offline composition regressions: a saved job is recovered into the real Home editable draft,
 * edited through the real DynamicForm, and exported through the real visible SpecExport controls
 * (Vietnamese idea confirmation -> current English Working Brief preview / copy / download /
 * cvf:openAgent handoff) over the real persisted execution store.
 *
 * Stubs (all disclosed): ResultViewer (only its Retry/Reject callbacks), the browse experience
 * (template pick), wizard leaves, settings provider, analytics sink, skill map, provider hook, and
 * the jsdom-missing URL.createObjectURL / anchor click / clipboard. NOT stubbed: Home, DynamicForm,
 * ProcessingScreen, SpecExport, the brief builders, the store and the cvf:openAgent event.
 * Event emission is the terminal boundary; it does not show an agent received or executed anything.
 * The only fetch seam is a recording stand-in for /api/execute; the shared provider guard is
 * asserted separately and no provider destination is contacted.
 *
 * Text Encoding Exception: Vietnamese UI labels and option values are asserted verbatim.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import HomePage from './page';
import { useExecutionStore } from '@/lib/store';
import type { Execution } from '@/types';

const guardedFetch = globalThis.fetch; // shared setup provider-denial guard, captured before any spy

const nav = vi.hoisted(() => ({ params: new URLSearchParams() }));
const mockSettings = vi.hoisted(() => ({
    settings: { providers: {}, preferences: { defaultExportMode: 'governance' } },
    isLoaded: true,
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    useSearchParams: () => nav.params,
}));
vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: 'en', t: (key: string) => key }) }));
vi.mock('@/lib/analytics', () => ({ trackEvent: vi.fn() }));
vi.mock('@/components/Settings', () => ({ useSettings: () => mockSettings }));
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
        ResultViewer: (props: { execution: Execution; onReject: () => void; onRetry: () => void }) => (
            <div data-testid="result-viewer">
                <span data-testid="result-id">{props.execution.id}</span>
                <button onClick={props.onReject}>reject</button>
                <button onClick={props.onRetry}>retry</button>
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
    HomeBrowseExperience: (props: { templates: Array<{ id: string }>; handleSelectTemplate: (template: unknown) => void }) => (
        <div data-testid="home-browse-experience">
            <button onClick={() => props.handleSelectTemplate(props.templates.find(t => t.id === 'documentation'))}>
                pick-documentation
            </button>
        </div>
    ),
}));

const STORAGE_KEY = 'cvf-executions-storage';
const A_ID = 'exec_saved_A';
const B_ID = 'exec_saved_B';
// Independent synthetic saved jobs; every free-text value carries a distinct sentinel.
const INPUT_A = {
    subject: 'ALPHA-SUBJECT-7141 customer onboarding runbook',
    currentNotes: 'ALPHA-NOTES-7142 form, call back within two hours, then send the price sheet',
    readerGoal: 'ALPHA-GOAL-7143 new staff handle a lead alone',
    audience: 'Quản lý / approver',
    mustPreserve: 'ALPHA-KEEP-7144 Enterprise Plus plan name',
};
const INPUT_B = {
    subject: 'BRAVO-SUBJECT-9201 returns handling guide',
    currentNotes: 'BRAVO-NOTES-9202 unrelated warehouse steps',
    readerGoal: 'BRAVO-GOAL-9203 unrelated reader outcome',
    audience: 'Khách hàng / end user',
    mustPreserve: 'BRAVO-KEEP-9204 unrelated protected term',
};
const EDIT_SUBJECT = 'EDITED-SUBJECT-3300 onboarding runbook v2';
const EDIT_KEEP = 'EDITED-KEEP-3301 Enterprise Plus plan name and SLA';
const EDIT_NOTES = 'EDITED-NOTES-3302 revised call-back steps';
const INTERIM = 'INTERIM-EDIT-5521';
const FRESH = 'FRESH-SUBJECT-6600 brand new template idea';

const buildSaved = (id: string, input: Record<string, string>, output: string, extra: Partial<Execution> = {}): Execution => ({
    id, templateId: 'documentation', templateName: 'Saved template', input, intent: `${id} intent`, output,
    status: 'completed', createdAt: new Date('2026-10-11T00:00:00Z'), ...extra,
});
const buildA = () => buildSaved(A_ID, INPUT_A, 'OUTPUT_A_SENTINEL');
const buildB = () => buildSaved(B_ID, INPUT_B, 'OUTPUT_B_SENTINEL', { result: 'accepted', threadId: 'thread_B', projectLabel: 'Project B' });

interface Call { signal?: AbortSignal; body: { inputs: Record<string, string> } }
let calls: Call[];
let requestedUrls: string[];
let blobs: Blob[];
let downloadNames: string[];
let handoffs: string[];
let clipboard: ReturnType<typeof vi.fn>;

const executions = () => useExecutionStore.getState().executions;
const byId = (id: string) => executions().find(e => e.id === id);
const serial = (id: string) => JSON.stringify(byId(id));
const persistedSerial = (id: string) => JSON.stringify(
    JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}').state?.executions?.find((e: Execution) => e.id === id));
const click = (name: string | RegExp) => fireEvent.click(screen.getByRole('button', { name }));
const field = (name: string) =>
    document.querySelector(`[name="${name}"]`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
const valueOf = (name: string) => field(name)?.value;
const fill = (values: Record<string, string>) => {
    for (const [name, value] of Object.entries(values)) fireEvent.change(field(name)!, { target: { value } });
};
const openAdvanced = () => { if (!field('mustPreserve')) click(/Advanced Options/); };
const readBlob = (blob: Blob) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(blob);
});

// Visible SpecExport controls.
const status = () => screen.getByRole('status', { name: 'Trạng thái ý tưởng' });
const revision = () => Number(/Phiên bản ý tưởng (\d+)/.exec(status().textContent ?? '')![1]);
const ideaText = () => screen.getByRole('region', { name: 'Brief ý tưởng tiếng Việt' }).textContent ?? '';
const exportButton = () => screen.getByRole('button',
    { name: /^(Xác nhận ý tưởng và xuất cho agent|Xuất Working Brief cho agent \(\.md\))$/ }) as HTMLButtonElement;
const sendButton = () => screen.getByRole('button', { name: 'Gửi Working Brief cho Agent INTAKE' }) as HTMLButtonElement;
const copyButton = () => screen.getByRole('button', { name: /^(Sao chép Working Brief|Đã sao chép!)$/ }) as HTMLButtonElement;
const englishPanel = () => screen.queryByRole('region', { name: 'English Working Brief' });
const openExport = () => { click(/Create Agent Spec/); expect(status()).toBeTruthy(); };
const showEnglish = () => { if (!englishPanel()) click('Xem English Working Brief (tùy chọn)'); };

async function seed(...items: Execution[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ state: { executions: items, currentExecution: null }, version: 0 }));
    await act(async () => { await useExecutionStore.persist.rehydrate(); });
}
// Home restores saved A through the real result route; Retry/Reject then return the real editable draft.
async function recoverA(via: 'retry' | 'reject' = 'retry') {
    await seed(buildB(), buildA());
    nav.params = new URLSearchParams(`result=${A_ID}`);
    render(<HomePage />);
    expect(screen.getByTestId('result-id').textContent).toBe(A_ID);
    click(via);
    expect(screen.queryByTestId('result-viewer')).toBeNull();
}
function expectRestoredDraft() {
    for (const [name, value] of Object.entries(INPUT_A)) expect(valueOf(name)).toBe(value);
}
async function confirmExport(): Promise<string> {
    const before = blobs.length;
    click(exportButton().textContent ?? '');
    expect(blobs).toHaveLength(before + 1);
    return readBlob(blobs[before]);
}
// One identical current artifact across preview, clipboard and the (terminal) handoff event.
async function expectOneArtifact(text: string) {
    showEnglish();
    expect(englishPanel()!.querySelector('pre')!.textContent).toBe(text);
    click(copyButton().textContent ?? '');
    await waitFor(() => expect(clipboard).toHaveBeenLastCalledWith(text));
    const before = handoffs.length;
    expect(sendButton().disabled).toBe(false);
    click('Gửi Working Brief cho Agent INTAKE');
    expect(handoffs).toHaveLength(before + 1);
    expect(handoffs[before]).toBe(text);
}
const expectNoLeak = (text: string, tokens: string[]) => { for (const token of tokens) expect(text).not.toContain(token); };
const expectStaleBlocked = () => {
    expect(status().textContent).toContain('Chưa xác nhận ý tưởng');
    expect(sendButton().disabled).toBe(true);
    expect(copyButton().disabled).toBe(true);
    const before = handoffs.length;
    fireEvent.click(sendButton());
    expect(handoffs).toHaveLength(before);
};

const onAgent = (event: Event) => handoffs.push((event as CustomEvent<{ prompt: string }>).detail.prompt);
beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    nav.params = new URLSearchParams();
    useExecutionStore.setState({ executions: [], currentExecution: null });
    calls = []; requestedUrls = []; blobs = []; downloadNames = []; handoffs = [];
    clipboard = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: clipboard } });
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn((blob: Blob) => { blobs.push(blob); return 'blob:draft-export'; }) });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(function (this: HTMLAnchorElement) { downloadNames.push(this.download); });
    window.addEventListener('cvf:openAgent', onAgent);
    // Recording stand-in for /api/execute; never resolves unless a test asks it to.
    vi.spyOn(globalThis, 'fetch').mockImplementation((input, init) => {
        requestedUrls.push(String(input));
        calls.push({ signal: init?.signal ?? undefined, body: JSON.parse(String(init?.body ?? '{}')) });
        return new Promise<Response>(() => undefined);
    });
});
afterEach(() => {
    window.removeEventListener('cvf:openAgent', onAgent);
    expect(requestedUrls.every(url => url === '/api/execute')).toBe(true);
    vi.restoreAllMocks();
});

describe('REQ-COMPOSE: recovered draft -> edit -> confirm -> English Working Brief', () => {
    it('exports the edited and untouched recovered values and nothing from unrelated saved job B', async () => {
        await recoverA();
        const [aBefore, bBefore] = [serial(A_ID), serial(B_ID)];
        const [aStored, bStored] = [persistedSerial(A_ID), persistedSerial(B_ID)];
        expectRestoredDraft();

        fill({ subject: EDIT_SUBJECT, mustPreserve: EDIT_KEEP }); // one required and one advanced edit
        openExport();

        expect(revision()).toBe(1);
        expect(status().textContent).toContain('Chưa xác nhận ý tưởng');
        expect(sendButton().disabled).toBe(true);
        for (const value of [EDIT_SUBJECT, EDIT_KEEP, INPUT_A.currentNotes, INPUT_A.readerGoal, INPUT_A.audience]) {
            expect(ideaText()).toContain(value);
        }
        expectNoLeak(ideaText(), ['BRAVO-', INPUT_A.subject, INPUT_A.mustPreserve]);
        expect(blobs).toHaveLength(0);

        const text = await confirmExport();

        expect(status().textContent).toContain('Đã xác nhận ý tưởng');
        expect(downloadNames).toEqual(['cvf-intake-documentation-idea-r1-governance.md']);
        expect(text).toContain('# English Working Brief');
        expect(text).toContain('Idea revision: 1');
        expect(text).toContain('Execution authority: NONE inferred');
        for (const value of [EDIT_SUBJECT, EDIT_KEEP, INPUT_A.currentNotes, INPUT_A.readerGoal, INPUT_A.audience]) {
            expect(text).toContain(value);
        }
        expectNoLeak(text, ['BRAVO-', 'OUTPUT_B_SENTINEL', INPUT_A.subject, INPUT_A.mustPreserve]);
        // Draft edits and export never touch the saved jobs, in memory or in persisted storage.
        expect(serial(A_ID)).toBe(aBefore); expect(serial(B_ID)).toBe(bBefore);
        expect(persistedSerial(A_ID)).toBe(aStored); expect(persistedSerial(B_ID)).toBe(bStored);
        expect(executions()).toHaveLength(2);
        expect(requestedUrls).toEqual([]);
    });

    it('recovers through a real local stop (Cancel) and exports that draft without B', async () => {
        await seed(buildB());
        const bBefore = serial(B_ID);
        render(<HomePage />);
        click('pick-documentation');
        fill({ subject: INPUT_A.subject, currentNotes: INPUT_A.currentNotes, readerGoal: INPUT_A.readerGoal });
        openAdvanced();
        fill({ audience: INPUT_A.audience, mustPreserve: INPUT_A.mustPreserve });
        await act(async () => { fireEvent.submit(document.querySelector('form')!); });
        await waitFor(() => expect(screen.getByRole('button', { name: 'Cancel' })).toBeTruthy());
        const savedA = executions()[0].id;
        expect(calls).toHaveLength(1);

        click('Cancel'); // accepted local stop: the bound attempt becomes unsuccessful, draft returns

        expect(byId(savedA)?.status).toBe('failed');
        expect(JSON.parse(persistedSerial(savedA)).status).toBe('failed');
        expect(screen.getByTestId('draft-stop-notice').textContent).toContain('may not have stopped');
        expectRestoredDraft();
        fill({ readerGoal: EDIT_NOTES });
        openExport();
        const text = await confirmExport();

        for (const value of [INPUT_A.subject, INPUT_A.currentNotes, INPUT_A.mustPreserve, EDIT_NOTES]) expect(text).toContain(value);
        expectNoLeak(text, ['BRAVO-', INPUT_A.readerGoal]);
        expect(serial(B_ID)).toBe(bBefore);
        expect(executions()).toHaveLength(2);
        expect(calls).toHaveLength(1); // export/preview never issued an execution request
    });

    it('recovers through Reject, changing only the review result of A, then exports the draft', async () => {
        await recoverA('reject');
        expect(JSON.parse(serial(A_ID)).result).toBe('rejected');
        expectRestoredDraft();
        openExport();
        const text = await confirmExport();

        for (const value of Object.values(INPUT_A)) expect(text).toContain(value);
        expectNoLeak(text, ['BRAVO-']);
        expect(JSON.parse(serial(A_ID))).toEqual({ ...JSON.parse(JSON.stringify(buildA())), result: 'rejected' });
        expect(requestedUrls).toEqual([]);
    });
});

describe('REQ-REVISION: one current artifact; stale confirmation cannot be used', () => {
    it('keeps preview, clipboard, Blob download and the cvf:openAgent prompt identical and executes nothing', async () => {
        await recoverA();
        const [aBefore, bBefore] = [serial(A_ID), serial(B_ID)];
        fill({ currentNotes: EDIT_NOTES });
        openExport();
        const text = await confirmExport();

        await expectOneArtifact(text);

        expect(text).toContain(EDIT_NOTES);
        expect(handoffs).toEqual([text]);
        expect(screen.queryByRole('status', { name: 'Trạng thái ý tưởng' })).toBeNull(); // send closed the panel
        expect(executions()).toHaveLength(2);
        expect(serial(A_ID)).toBe(aBefore); expect(serial(B_ID)).toBe(bBefore);
        expect(requestedUrls).toEqual([]);

        openExport(); // a reopened export does not inherit the earlier confirmation
        expect(status().textContent).toMatch(/Phiên bản ý tưởng 1 · Chưa xác nhận ý tưởng/);
        expectStaleBlocked();
        expect(handoffs).toEqual([text]);
    });

    it('invalidates the old confirmation on an idea edit and exports the updated brief after reconfirmation', async () => {
        await recoverA();
        openExport();
        const first = await confirmExport();
        expect(revision()).toBe(1);
        expect(sendButton().disabled).toBe(false);

        fill({ currentNotes: EDIT_NOTES });

        expect(revision()).toBe(2);
        expectStaleBlocked();
        showEnglish();
        expect(englishPanel()!.querySelector('pre')).toBeNull(); // the old artifact is not shown as current
        expect(ideaText()).toContain(EDIT_NOTES);

        const second = await confirmExport();

        expect(second).not.toBe(first);
        expect(second).toContain('Idea revision: 2');
        expect(second).toContain(EDIT_NOTES);
        expect(second).not.toContain(INPUT_A.currentNotes);
        expect(first).toContain(INPUT_A.currentNotes); // earlier download is history, not current
        expect(downloadNames[1]).toBe('cvf-intake-documentation-idea-r2-governance.md');
        await expectOneArtifact(second);
    });

    it('treats the form audience field as an idea edit, not as a view switch', async () => {
        await recoverA();
        openExport();
        await confirmExport();

        fill({ audience: 'Người mới tiếp nhận' });

        expect(revision()).toBe(2);
        expectStaleBlocked();
        expect(ideaText()).toContain('Người mới tiếp nhận');
    });

    it('invalidates on A -> B -> A within the idea revision and does not revive revision 1', async () => {
        await recoverA();
        openExport();
        const first = await confirmExport();
        expect(sendButton().disabled).toBe(false);

        fill({ subject: INTERIM });
        expect(revision()).toBe(2);
        expectStaleBlocked();
        fill({ subject: INPUT_A.subject }); // back to the exact original value

        expect(revision()).toBe(3);
        expect(ideaText()).toContain(INPUT_A.subject);
        expectStaleBlocked();
        showEnglish();
        expect(englishPanel()!.querySelector('pre')).toBeNull();

        const third = await confirmExport();

        expect(downloadNames[1]).toBe('cvf-intake-documentation-idea-r3-governance.md');
        expect(third).toContain('Idea revision: 3');
        expect(third.replace('Idea revision: 3', 'Idea revision: 1')).toBe(first); // same idea, new revision
        expectNoLeak(third, [INTERIM, 'BRAVO-']);
        await expectOneArtifact(third);
    });

    it('retains a valid confirmation across view and guidance-audience switches, regenerating only the guidance', async () => {
        await recoverA();
        openExport();
        const governance = await confirmExport();
        const confirmedAt = revision();

        showEnglish();
        click('Ẩn English Working Brief'); // human (Vietnamese) <-> agent (English) view switch
        showEnglish();
        fireEvent.click(screen.getByText('Hướng dẫn kèm theo cho agent')); // <summary>, not a button
        click('Brief'); // guidance mode switch, no source change

        expect(revision()).toBe(confirmedAt);
        expect(status().textContent).toContain('Đã xác nhận ý tưởng');
        expect(sendButton().disabled).toBe(true); // artifact belongs to the previous guidance mode
        expect(exportButton().textContent).toBe('Xuất Working Brief cho agent (.md)'); // no new confirmation asked

        const simple = await confirmExport();

        expect(downloadNames[1]).toBe('cvf-intake-documentation-idea-r1-simple.md');
        expect(simple).toContain('Idea revision: 1');
        expect(simple.length).toBeLessThan(governance.length);
        for (const value of Object.values(INPUT_A)) expect(simple).toContain(value);
        await expectOneArtifact(simple);
    });
});

describe('REQ-REVISION: a fresh template choice excludes the recovered draft', () => {
    it('shows and exports only new input after Back, with saved jobs unchanged', async () => {
        await recoverA();
        const [aBefore, bBefore] = [serial(A_ID), serial(B_ID)];
        fill({ subject: EDIT_SUBJECT });
        openExport();
        await confirmExport();

        fireEvent.click(document.querySelector('button')!); // DynamicForm back control
        expect(screen.getByTestId('home-browse-experience')).toBeTruthy();
        click('pick-documentation');

        expect(valueOf('subject')).toBe('');
        expect(valueOf('currentNotes')).toBe('');
        expect(screen.queryByTestId('draft-stop-notice')).toBeNull();
        openExport();
        expect(revision()).toBe(1);
        expect(ideaText()).toContain('Chưa có thông tin ý tưởng.');
        expectNoLeak(ideaText(), ['ALPHA-', 'EDITED-', 'BRAVO-']);
        expect(exportButton().disabled).toBe(true);
        expect(status().textContent).toContain('Chưa xác nhận ý tưởng');

        const before = blobs.length;
        fill({ subject: FRESH });
        const fresh = await confirmExport();

        expect(blobs).toHaveLength(before + 1);
        expect(fresh).toContain(FRESH);
        expect(fresh).toContain(`Idea revision: ${revision()}`);
        expectNoLeak(fresh, ['ALPHA-', 'EDITED-', 'BRAVO-', 'OUTPUT_']);
        expect(serial(A_ID)).toBe(aBefore); expect(serial(B_ID)).toBe(bBefore);
        expect(executions()).toHaveLength(2);
        expect(requestedUrls).toEqual([]);
    });
});

describe('no-provider boundary', () => {
    it('keeps the shared setup guard denying a provider destination', async () => {
        await expect(guardedFetch('https://api.openai.com/v1/chat/completions')).rejects.toThrow(/CVF_PROVIDER_EXECUTION_DENIED/);
        expect(requestedUrls).toEqual([]);
    });
});
