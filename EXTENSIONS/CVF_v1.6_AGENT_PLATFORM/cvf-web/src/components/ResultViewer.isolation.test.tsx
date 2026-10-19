/**
 * @vitest-environment jsdom
 */
// Worker-authored regression for NCR result viewer run isolation (synthetic data only).
// The decisive assertions run the ACTUAL ResultViewer. Disclosed stand-ins, each with an exact
// payload capture: navigator.clipboard.writeText (deferred promises), the docx Packer plus
// file-saver (deferred blob, captured saveAs arguments) and the analytics sink. The Home seam
// mounts the real Home page and real execution store; only unrelated leaves (form, processing
// screen, browse) are stubs. Fixture receipts are presentation data, never AI governance proof.
// No provider, browser, backend or OS-side-effect cancellation is exercised or claimed.
// Each `snap()` prints one JSON line the evidence file reuses.
// Text Encoding Exception: localized UI labels and emoji button text are asserted verbatim.
import { StrictMode } from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ResultViewer } from './ResultViewer';
import HomePage from '../app/(dashboard)/home/page';
import { useExecutionStore } from '@/lib/store';
import type { Execution } from '@/types';

const { lang, track, clip, docx, pdf, saveAs, nav } = vi.hoisted(() => ({
    lang: { value: 'en' },
    track: vi.fn(),
    clip: { calls: [] as Array<{ text: string; resolve: () => void; reject: (e: Error) => void }> },
    docx: { calls: [] as Array<{ resolve: (b: Blob) => void; reject: (e: Error) => void }> },
    pdf: {
        internal: { pageSize: { getWidth: () => 210, getHeight: () => 297 } },
        setFontSize: vi.fn(), setFont: vi.fn(), setDrawColor: vi.fn(),
        splitTextToSize: vi.fn((text: string) => [text]), text: vi.fn(), line: vi.fn(), addPage: vi.fn(),
        save: vi.fn(),
    },
    saveAs: vi.fn(),
    nav: { params: new URLSearchParams() },
}));

vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: lang.value, t: (key: string) => key }) }));
vi.mock('@/lib/analytics', () => ({ trackEvent: (...args: unknown[]) => track(...args) }));
vi.mock('jspdf', () => ({ jsPDF: function JsPDF() { return pdf; } }));
vi.mock('file-saver', () => ({ saveAs: (...args: unknown[]) => saveAs(...args) }));
vi.mock('docx', () => {
    function Ctor(this: Record<string, unknown>, opts: Record<string, unknown>) { Object.assign(this, opts); }
    return {
        Document: Ctor, Paragraph: Ctor, TextRun: Ctor,
        Packer: { toBlob: () => new Promise<Blob>((resolve, reject) => { docx.calls.push({ resolve, reject }); }) },
        HeadingLevel: { TITLE: 'T', HEADING_1: 'H1', HEADING_2: 'H2', HEADING_3: 'H3' },
        AlignmentType: { CENTER: 'C' }, BorderStyle: { SINGLE: 'S' },
    };
});
vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    useSearchParams: () => nav.params,
}));
vi.mock('@/components/Settings', () => ({ useSettings: () => ({ settings: { providers: {} } }) }));
vi.mock('@/lib/hooks/useExecute', () => {
    const providers: never[] = [];
    const fetchProviders = () => undefined;
    return { useProviders: () => ({ providers, anyConfigured: false, fetchProviders }) };
});
vi.mock('@/components', async () => ({
    ResultViewer: (await vi.importActual<typeof import('./ResultViewer')>('./ResultViewer')).ResultViewer,
    ProcessingScreen: () => <div data-testid="processing-screen" />,
    DynamicForm: () => null, TemplatePreviewModal: () => null, OnboardingTour: () => null,
    AppBuilderWizard: () => null, ProductDesignWizard: () => null, MarketingCampaignWizard: () => null,
    BusinessStrategyWizard: () => null, SecurityAssessmentWizard: () => null, ResearchProjectWizard: () => null,
    SystemDesignWizard: () => null, ContentStrategyWizard: () => null, DataAnalysisWizard: () => null,
}));
vi.mock('@/components/home/HomeBrowseExperience', () => ({ HomeBrowseExperience: () => <div data-testid="browse" /> }));

const RECEIPT = {
    receiptId: 'rcpt-isolation-fixture', evidenceMode: 'static' as const, routeId: '/fixture',
    decision: 'ALLOW', riskLevel: 'R1', generatedAt: '2026-10-12T00:00:00.000Z',
};

function exec(id: string, over: Partial<Execution> = {}): Execution {
    return {
        id, templateId: 'documentation', templateName: 'Documentation', input: { subject: id },
        intent: `${id} intent`, output: `OUTPUT_${id}`, status: 'completed', createdAt: new Date('2026-10-12T00:00:00Z'), ...over,
    };
}
/** Fresh props per call so A and B never alias; callbacks are separate spies per run. */
function mk(id: string, over: { output?: string; templateId?: string; followUp?: boolean; receipt?: boolean } = {}) {
    const { output = `OUTPUT_${id}`, templateId, followUp = true, receipt = true } = over;
    return {
        execution: exec(id, { output, ...(templateId ? { templateId } : {}) }),
        output,
        onAccept: vi.fn(), onReject: vi.fn(), onRetry: vi.fn(), onBack: vi.fn(),
        onFollowUp: followUp ? vi.fn() : undefined,
        evidenceReceipt: receipt ? { ...RECEIPT } : undefined,
    };
}

const draftBox = () => screen.getByTestId('followup-input') as HTMLTextAreaElement;
const type = (text: string) => fireEvent.change(draftBox(), { target: { value: text } });
const menuOpen = () => screen.queryByText(/Export Result|Xuất Kết Quả/) !== null;
// Idempotent: a stale open menu must fail at the intended assertion, not at a toggle.
const openMenu = () => { if (!menuOpen()) fireEvent.click(screen.getByRole('button', { name: /Export$/ })); };
const menuEl = () => screen.queryByText(/Export Result|Xuất Kết Quả/)?.closest('.absolute') as HTMLElement | null;
const copyBtn = () => (menuEl() ? within(menuEl()!).queryByRole('button', { name: /Copy to Clipboard|Copied!|Sao chép|Đã sao chép/ }) : null);
const pdfBtn = () => (menuEl() ? within(menuEl()!).queryByRole('button', { name: /Download PDF|Tải PDF/ }) as HTMLButtonElement | null : null);
const wordBtn = () => (menuEl() ? within(menuEl()!).queryByRole('button', { name: /Download Word|Tải Word|Exporting Word|Đang xuất Word/ }) as HTMLButtonElement | null : null);
const receiptSection = () => within(screen.getByTestId('w119-evidence-receipt')).getByRole('button');
const nudge = () => screen.getByTestId('nudge-copy-evidence-btn');
const viewMode = () => (screen.queryByTestId('deliverable-pack-preview') ? 'pack' : 'result');
const sleep0 = () => act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
const advance = (ms: number) => act(async () => { await vi.advanceTimersByTimeAsync(ms); });
const resolveClip = (index: number) => act(async () => { clip.calls[index].resolve(); await Promise.resolve(); });
const ui = () => ({
    draft: screen.queryByTestId('followup-input') ? draftBox().value : null,
    view: viewMode(),
    menuOpen: menuOpen(),
    copyLabel: copyBtn()?.textContent ?? null,
    receiptLabel: screen.queryByTestId('w119-evidence-receipt') ? receiptSection().textContent : null,
    nudgeLabel: screen.queryByTestId('nudge-copy-evidence-btn') ? nudge().textContent : null,
    wordLabel: wordBtn()?.textContent ?? null,
});
const snap = (label: string) => console.log('SNAP ' + JSON.stringify({ label, ui: ui() }));
const trackedFor = (event: string) => track.mock.calls.filter(c => c[0] === event).map(c => (c[1] as { executionId?: string }).executionId);

beforeEach(() => {
    lang.value = 'en';
    track.mockReset(); saveAs.mockReset(); pdf.save.mockReset();
    clip.calls.length = 0; docx.calls.length = 0;
    Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: (text: string) => new Promise<void>((resolve, reject) => { clip.calls.push({ text, resolve, reject: reject as (e: Error) => void }); }) },
        configurable: true,
    });
    localStorage.clear(); nav.params = new URLSearchParams();
    useExecutionStore.setState({ executions: [], currentExecution: null });
});
afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });

describe('ResultViewer: same-run state is preserved', () => {
    it('keeps the draft, view preference and open menu across rerenders, a changed object, fresh output and language', () => {
        const a = mk('A');
        const view = render(<ResultViewer {...a} />);
        expect(ui().view).toBe('pack');
        type('A unsent refinement');
        fireEvent.click(screen.getByLabelText('Result view'));
        openMenu();
        snap('same-run-before');
        view.rerender(<ResultViewer {...a} execution={{ ...a.execution }} />);
        view.rerender(<ResultViewer {...a} execution={{ ...a.execution, qualityScore: 9 }} output="OUTPUT_A refreshed" />);
        lang.value = 'vi';
        view.rerender(<ResultViewer {...a} execution={{ ...a.execution }} output="OUTPUT_A refreshed" />);
        expect(draftBox().value).toBe('A unsent refinement');
        expect(viewMode()).toBe('result');
        expect(menuOpen()).toBe(true);
        snap('same-run-after');
    });

    it('keeps the draft under StrictMode with rerenders and sends it once to the current callback', () => {
        const a = mk('A');
        const view = render(<StrictMode><ResultViewer {...a} /></StrictMode>);
        type('strict mode draft');
        view.rerender(<StrictMode><ResultViewer {...a} execution={{ ...a.execution }} /></StrictMode>);
        expect(draftBox().value).toBe('strict mode draft');
        fireEvent.click(screen.getByTestId('followup-submit-btn'));
        expect(a.onFollowUp).toHaveBeenCalledTimes(1);
        expect(a.onFollowUp).toHaveBeenCalledWith('strict mode draft');
        expect(draftBox().value).toBe('');
    });
});

describe('ResultViewer: a different run id resets transient state', () => {
    it('clears draft, view, menu, copy feedback and busy state for B even with identical output and template', async () => {
        const a = mk('A', { output: 'SAME_OUTPUT' });
        const view = render(<ResultViewer {...a} />);
        type('A unsent refinement');
        fireEvent.click(screen.getByLabelText('Result view'));
        openMenu();
        fireEvent.click(copyBtn()!);
        await resolveClip(0);
        fireEvent.click(receiptSection());
        await resolveClip(1);
        fireEvent.click(wordBtn()!);
        await waitFor(() => expect(docx.calls).toHaveLength(1));
        expect(ui()).toMatchObject({ draft: 'A unsent refinement', view: 'result', menuOpen: true, copyLabel: expect.stringContaining('Copied'), receiptLabel: 'Receipt copied' });
        expect(wordBtn()!.disabled).toBe(true);
        snap('different-run-before');

        view.rerender(<ResultViewer {...mk('B', { output: 'SAME_OUTPUT' })} />);
        expect(ui()).toMatchObject({ draft: '', view: 'pack', menuOpen: false, receiptLabel: 'Copy evidence receipt', nudgeLabel: '📋 Copy Evidence Receipt' });
        openMenu();
        expect(copyBtn()!.textContent).toContain('Copy to Clipboard');
        expect(wordBtn()!.textContent).toContain('Download Word');
        expect(wordBtn()!.disabled).toBe(false);
        expect((screen.getByTestId('followup-submit-btn') as HTMLButtonElement).disabled).toBe(true);
        snap('different-run-after');
    });

    it('defaults to the result view without a follow-up handler and keeps the export language preference', () => {
        const view = render(<ResultViewer {...mk('A', { followUp: false })} />);
        openMenu();
        fireEvent.click(screen.getByText(/Tiếng Việt/));
        expect(screen.getByText(/Tải Word/)).toBeTruthy();
        fireEvent.click(screen.getByLabelText('Deliverable pack preview'));
        expect(viewMode()).toBe('pack');
        view.rerender(<ResultViewer {...mk('B', { followUp: false })} />);
        expect(viewMode()).toBe('result');
        expect(menuOpen()).toBe(false);
        openMenu();
        expect(screen.getByText(/Tải Word/)).toBeTruthy(); // user preference, not run identity
    });

    it('treats A to B to A as a new lifetime for A', () => {
        const view = render(<ResultViewer {...mk('A')} />);
        type('A first lifetime draft');
        view.rerender(<ResultViewer {...mk('B')} />);
        type('B draft kept while B is shown');
        expect(draftBox().value).toBe('B draft kept while B is shown');
        view.rerender(<ResultViewer {...mk('A')} />);
        expect(draftBox().value).toBe('');
        snap('a-b-a');
    });

    it('binds the follow-up to B and never submits the A draft', () => {
        const a = mk('A');
        const b = mk('B');
        const view = render(<ResultViewer {...a} />);
        type('A refinement that must not leak');
        view.rerender(<ResultViewer {...b} />);
        const submit = screen.getByTestId('followup-submit-btn') as HTMLButtonElement;
        expect(submit.disabled).toBe(true);
        fireEvent.click(submit);
        expect(a.onFollowUp).not.toHaveBeenCalled();
        expect(b.onFollowUp).not.toHaveBeenCalled();
        type('B refinement text');
        fireEvent.click(submit);
        expect(b.onFollowUp).toHaveBeenCalledTimes(1);
        expect(b.onFollowUp).toHaveBeenCalledWith('B refinement text');
        expect(a.onFollowUp).not.toHaveBeenCalled();
        expect(trackedFor('followup_started')).toEqual(['B']);
    });
});

describe('ResultViewer: stale async work cannot touch the replacement run', () => {
    beforeEach(() => { vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] }); });

    it('a late clipboard completion for A leaves B uncopied and keeps A payload', async () => {
        const view = render(<ResultViewer {...mk('A')} />);
        openMenu();
        fireEvent.click(copyBtn()!);
        expect(clip.calls).toHaveLength(1);
        expect(clip.calls[0].text).toContain('OUTPUT_A');
        view.rerender(<ResultViewer {...mk('B')} />);
        openMenu();
        await resolveClip(0);
        expect(copyBtn()!.textContent).toContain('Copy to Clipboard');
        await advance(2000);
        expect(copyBtn()!.textContent).toContain('Copy to Clipboard');
        expect(vi.getTimerCount()).toBe(0);
        snap('late-clipboard');
    });

    it('a late completion also cannot mark a reopened A (A to B to A)', async () => {
        const view = render(<ResultViewer {...mk('A')} />);
        openMenu();
        fireEvent.click(copyBtn()!);
        view.rerender(<ResultViewer {...mk('B')} />);
        view.rerender(<ResultViewer {...mk('A')} />);
        openMenu();
        await resolveClip(0);
        expect(copyBtn()!.textContent).toContain('Copy to Clipboard');
        expect(vi.getTimerCount()).toBe(0);
    });

    it('an old feedback timer cannot shorten the success feedback of B', async () => {
        const view = render(<ResultViewer {...mk('A')} />);
        openMenu();
        fireEvent.click(copyBtn()!);
        await resolveClip(0); // A feedback timer fires at t=1500
        expect(copyBtn()!.textContent).toContain('Copied');
        await advance(1000);
        view.rerender(<ResultViewer {...mk('B')} />);
        openMenu();
        fireEvent.click(copyBtn()!);
        await resolveClip(1); // B feedback timer fires at t=2500
        expect(copyBtn()!.textContent).toContain('Copied');
        await advance(700); // t=1700, past the old A timer
        expect(copyBtn()!.textContent).toContain('Copied');
        await advance(1000); // t=2700, past B's own timer
        expect(copyBtn()!.textContent).toContain('Copy to Clipboard');
        snap('timer-not-shortened');
    });

    it('a repeated copy in the same run is not shortened by its first timer', async () => {
        render(<ResultViewer {...mk('A')} />);
        openMenu();
        fireEvent.click(copyBtn()!);
        await resolveClip(0);
        await advance(1000);
        fireEvent.click(copyBtn()!);
        await resolveClip(1);
        await advance(600); // t=1600, past the first timer (1500)
        expect(copyBtn()!.textContent).toContain('Copied');
        await advance(1000);
        expect(copyBtn()!.textContent).toContain('Copy to Clipboard');
    });

    it('a late receipt copy for A marks neither receipt control of B, but A analytics stay on A', async () => {
        const view = render(<ResultViewer {...mk('A')} />);
        fireEvent.click(nudge());
        expect(clip.calls[0].text).toContain('rcpt-isolation-fixture');
        view.rerender(<ResultViewer {...mk('B')} />);
        await resolveClip(0);
        expect(ui()).toMatchObject({ receiptLabel: 'Copy evidence receipt', nudgeLabel: '📋 Copy Evidence Receipt' });
        await advance(2000);
        expect(vi.getTimerCount()).toBe(0);
        expect(trackedFor('evidence_exported')).toEqual(['A']);
        // current run: both receipt controls follow the one flag
        fireEvent.click(receiptSection());
        await resolveClip(1);
        expect(ui()).toMatchObject({ receiptLabel: 'Receipt copied', nudgeLabel: '✅ Copied!' });
        snap('late-receipt');
    });

    it('unmount invalidates pending copy work: no state change and no timer', async () => {
        const view = render(<ResultViewer {...mk('A')} />);
        openMenu();
        fireEvent.click(copyBtn()!);
        view.unmount();
        await resolveClip(0);
        expect(vi.getTimerCount()).toBe(0);
    });

    it('a failed clipboard write for A after the switch does not touch B', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const view = render(<ResultViewer {...mk('A')} />);
        fireEvent.click(nudge());
        view.rerender(<ResultViewer {...mk('B')} />);
        fireEvent.click(nudge());
        await act(async () => { clip.calls[0].reject(new Error('A clipboard denied')); await Promise.resolve(); });
        await resolveClip(1);
        expect(nudge().textContent).toBe('✅ Copied!'); // B's own success survives A's failure
        expect(consoleSpy).toHaveBeenCalled();
    });
});

describe('ResultViewer: deferred Word export', () => {
    const word = () => { fireEvent.click(wordBtn()!); return waitFor(() => expect(docx.calls.length).toBeGreaterThan(0)); };

    it('A finishing while B export is pending keeps B busy and the menu open; payloads stay per run', async () => {
        const view = render(<ResultViewer {...mk('A', { templateId: 'business_plan' })} />);
        openMenu();
        await word();
        expect(docx.calls).toHaveLength(1);
        view.rerender(<ResultViewer {...mk('B', { templateId: 'documentation' })} />);
        openMenu();
        fireEvent.click(wordBtn()!);
        await waitFor(() => expect(docx.calls).toHaveLength(2));
        expect(wordBtn()!.textContent).toContain('Exporting');
        expect(wordBtn()!.disabled).toBe(true);

        const blobA = new Blob(['DOCX_A']);
        await act(async () => { docx.calls[0].resolve(blobA); });
        await waitFor(() => expect(saveAs).toHaveBeenCalledTimes(1));
        expect(saveAs.mock.calls[0][0]).toBe(blobA);
        expect(saveAs.mock.calls[0][1]).toMatch(/^cvf-result-business_plan-\d+\.docx$/);
        expect(trackedFor('evidence_exported')).toEqual(['A']);
        expect(wordBtn()!.textContent).toContain('Exporting');
        expect(wordBtn()!.disabled).toBe(true);
        expect(menuOpen()).toBe(true);
        snap('word-a-done-b-pending');

        const blobB = new Blob(['DOCX_B']);
        await act(async () => { docx.calls[1].resolve(blobB); });
        await waitFor(() => expect(saveAs).toHaveBeenCalledTimes(2));
        expect(saveAs.mock.calls[1][0]).toBe(blobB);
        expect(saveAs.mock.calls[1][1]).toMatch(/^cvf-result-documentation-\d+\.docx$/);
        expect(trackedFor('evidence_exported')).toEqual(['A', 'B']);
        await waitFor(() => expect(menuOpen()).toBe(false));
        openMenu();
        expect(wordBtn()!.textContent).toContain('Download Word');
        expect(wordBtn()!.disabled).toBe(false);
    });

    it('A failing while B export is pending does not clear B busy state', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        const view = render(<ResultViewer {...mk('A')} />);
        openMenu();
        await word();
        view.rerender(<ResultViewer {...mk('B')} />);
        openMenu();
        fireEvent.click(wordBtn()!);
        await waitFor(() => expect(docx.calls).toHaveLength(2));
        await act(async () => { docx.calls[0].reject(new Error('A word failed')); });
        await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith('Word export failed:', expect.any(Error)));
        expect(wordBtn()!.textContent).toContain('Exporting');
        expect(menuOpen()).toBe(true);
        expect(saveAs).not.toHaveBeenCalled();
        expect(screen.queryByRole('alert')).toBeNull();
        await act(async () => { docx.calls[1].resolve(new Blob(['DOCX_B'])); });
        await waitFor(() => expect(saveAs).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(menuOpen()).toBe(false));
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('A finishing after A to B to A leaves the reopened A menu and busy state alone', async () => {
        const view = render(<ResultViewer {...mk('A')} />);
        openMenu();
        await word();
        view.rerender(<ResultViewer {...mk('B')} />);
        view.rerender(<ResultViewer {...mk('A')} />);
        openMenu();
        expect(wordBtn()!.textContent).toContain('Download Word');
        await act(async () => { docx.calls[0].resolve(new Blob(['DOCX_OLD_A'])); });
        await waitFor(() => expect(saveAs).toHaveBeenCalledTimes(1)); // explicit old download still completes
        await sleep0();
        expect(menuOpen()).toBe(true);
        expect(wordBtn()!.textContent).toContain('Download Word');
    });

    it('an older PDF failure cannot replace the newer same-run Word busy state', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        pdf.save.mockImplementationOnce(() => { throw new Error('old PDF failure'); });
        render(<ResultViewer {...mk('A')} />);
        openMenu();

        fireEvent.click(pdfBtn()!);
        fireEvent.click(wordBtn()!);
        await waitFor(() => expect(docx.calls).toHaveLength(1));
        await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith('PDF export failed:', expect.any(Error)));

        expect(wordBtn()!.textContent).toContain('Exporting');
        expect(wordBtn()!.disabled).toBe(true);
        expect(menuOpen()).toBe(true);
        expect(screen.queryByRole('alert')).toBeNull();
        await act(async () => { docx.calls[0].resolve(new Blob(['DOCX_A'])); });
        await waitFor(() => expect(saveAs).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(menuOpen()).toBe(false));
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('an older same-run Word success cannot clear newer PDF failure feedback', async () => {
        render(<ResultViewer {...mk('A')} />);
        openMenu();
        fireEvent.click(wordBtn()!);
        await waitFor(() => expect(docx.calls).toHaveLength(1));

        pdf.save.mockImplementationOnce(() => { throw new Error('new PDF failure'); });
        fireEvent.click(pdfBtn()!);
        expect((await screen.findByRole('alert')).textContent).toMatch(/PDF export failed/);
        expect(menuOpen()).toBe(false);

        await act(async () => { docx.calls[0].resolve(new Blob(['DOCX_OLD'])); });
        await waitFor(() => expect(saveAs).toHaveBeenCalledTimes(1));
        expect(screen.getByRole('alert').textContent).toMatch(/PDF export failed/);
        expect(screen.getByRole('alert').textContent).not.toMatch(/Word export failed/);
        openMenu();
        expect(wordBtn()!.textContent).toContain('Download Word');
        expect(wordBtn()!.disabled).toBe(false);
    });

    it('an older same-run Word failure cannot replace newer PDF success', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        render(<ResultViewer {...mk('A')} />);
        openMenu();
        fireEvent.click(wordBtn()!);
        await waitFor(() => expect(docx.calls).toHaveLength(1));

        fireEvent.click(pdfBtn()!);
        await waitFor(() => expect(pdf.save).toHaveBeenCalledTimes(1));
        await waitFor(() => expect(menuOpen()).toBe(false));
        expect(track.mock.calls.filter(c => c[0] === 'evidence_exported')).toHaveLength(1);

        await act(async () => { docx.calls[0].reject(new Error('old Word failure')); });
        await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith('Word export failed:', expect.any(Error)));
        expect(screen.queryByRole('alert')).toBeNull();
        openMenu();
        expect(wordBtn()!.textContent).toContain('Download Word');
        expect(wordBtn()!.disabled).toBe(false);
        expect(menuOpen()).toBe(true);
    });
});

describe('Home to ResultViewer history seam (real Home, store and ResultViewer)', () => {
    const seed = () => useExecutionStore.setState({ executions: [exec('exec_B', { output: 'OUTPUT_B' }), exec('exec_A', { output: 'OUTPUT_A' })], currentExecution: null });
    const open = (id: string, view?: ReturnType<typeof render>) => {
        nav.params = new URLSearchParams(`result=${id}`);
        if (view) view.rerender(<HomePage />);
    };
    const text = () => screen.getByTestId('deliverable-pack-preview').textContent ?? '';
    const stored = (id: string) => useExecutionStore.getState().executions.find(e => e.id === id)!;

    it('moving history A to B drops A draft, menu and late copy feedback; follow-up continues from B', async () => {
        seed();
        const aBefore = structuredClone(stored('exec_A'));
        const bBefore = structuredClone(stored('exec_B'));
        open('exec_A');
        const view = render(<HomePage />);
        expect(text()).toContain('OUTPUT_A');
        type('A draft from history');
        openMenu();
        fireEvent.click(copyBtn()!);
        expect(clip.calls[0].text).toContain('OUTPUT_A');
        snap('home-a-before');

        open('exec_B', view);
        expect(text()).toContain('OUTPUT_B');
        expect(text()).not.toContain('OUTPUT_A');
        expect(ui()).toMatchObject({ draft: '', menuOpen: false, view: 'pack' });
        await resolveClip(0);
        openMenu();
        expect(copyBtn()!.textContent).toContain('Copy to Clipboard');
        snap('home-b-after-late-copy');

        type('B follow-up from history');
        fireEvent.click(screen.getByTestId('followup-submit-btn'));
        const created = useExecutionStore.getState().executions[0];
        expect(created.parentExecutionId).toBe('exec_B');
        expect(created.intent).toBe('B follow-up from history');
        expect(created.input._previousOutput).toBe('OUTPUT_B');
        expect(screen.getByTestId('processing-screen')).toBeTruthy();
        expect(trackedFor('followup_started')).toEqual(['exec_B']);
        expect(stored('exec_A')).toEqual(aBefore);
        expect(stored('exec_B')).toEqual(bBefore);
        snap('home-b-follow-up');
    });

    it('history A to B to A starts a new lifetime for A', () => {
        seed();
        open('exec_A');
        const view = render(<HomePage />);
        type('A draft from history');
        open('exec_B', view);
        open('exec_A', view);
        expect(text()).toContain('OUTPUT_A');
        expect(draftBox().value).toBe('');
        snap('home-a-b-a');
    });
});
