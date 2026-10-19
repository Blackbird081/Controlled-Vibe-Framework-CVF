// Text Encoding Exception: localized Vietnamese user-facing copy assertions follow the existing bilingual UI convention.
// UI-structure proof only (AGENTS pure-UI-structure mock exception): real HtmlJobControls and ArtifactExportPanel render in jsdom
// against deterministic fetch spies. All fixtures are invented ncr-synthetic values; spy POSTs are not real writes. HtmlDraftRecovery
// is a disclosed presentation stub, so no draft-save/recovery correctness claim follows. This is not governance, auth/writer,
// cancellation, browser, keyboard, small-screen or human-comprehension evidence.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactElement } from 'react';
import { ArtifactExportPanel } from './ArtifactExportPanel';
import { HtmlJobControls } from './HtmlJobControls';

const h = vi.hoisted(() => ({
  lang: 'en' as 'en' | 'vi',
  session: null as unknown as { status: string; data: { user: { userId: string; orgId: string; teamId: string }; expires: string } },
}));
vi.mock('next-auth/react', () => ({ useSession: () => h.session }));
vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: h.lang }) }));
// Disclosed presentation fixture: simulated confirmed Save goes through the fetch spy, then reports the snapshot upward.
vi.mock('./HtmlDraftRecovery', () => ({
  HtmlDraftRecovery: ({ displayed, onConfirmedSnapshot }: {
    displayed: { job?: { jobId: string } } | null; onConfirmedSnapshot?: (snapshot: unknown, jobId?: string) => void }) => (
    <button type="button" data-testid="stub-save" disabled={!displayed} onClick={() => {
      void fetch('/api/artifacts/drafts', { method: 'POST', body: JSON.stringify({ action: 'SAVE_DRAFT' }) }).then(() => onConfirmedSnapshot?.({
        versionId: '123e4567-e89b-42d3-a456-426614174002', sourceRecordId: 'ncr-synthetic-ux-proof', requestSha256: '1'.repeat(64),
        htmlSha256: '2'.repeat(64), state: 'CLIENT_SUBMITTED_UNVERIFIED', acceptance: 'DRAFT_UNACCEPTED' }, displayed?.job?.jobId));
    }}>Stub: confirmed Save</button>),
}));

const SRC = 'ncr-synthetic-ux-proof';
const JOB = '123e4567-e89b-42d3-a456-426614174001';
const VERSION = '123e4567-e89b-42d3-a456-426614174002';
const DECISION = '123e4567-e89b-42d3-a456-426614174003';
const OWNER = { userId: 'u1', orgId: 'o1', teamId: 't1' };
const JOURNAL_KEY = 'cvf-html-job-pending-v1';
const REQ = { title: 'ncr-synthetic title', sourcePath: 'docs/reviews/ncr-synthetic.md', sourceContent: '# ncr-synthetic packet\n\nSynthetic only.',
  status: 'DRAFT', claimBoundary: 'ncr-synthetic boundary', receiptAnchor: 'ncr-synthetic-anchor' };
const EXPORT_RESULT = { html: '<!doctype html><html><body><p>ncr-synthetic</p></body></html>', filename: 'ncr-synthetic.html',
  receiptAnchor: 'ncr-synthetic-anchor', verification: [{ label: 'ncr-synthetic check', passed: true }],
  generatedAt: '2026-10-18T00:00:00.000Z', governanceReceiptStatus: 'NOT_CONFIGURED' };
const GENERIC_EN = 'may send a short excerpt';
const GENERIC_VI = 'có thể gửi một đoạn ngắn';
const PROFILE_EN = ['local test profile', 'when you choose Save', 'no review receipt is requested', 'unverified and unaccepted',
  'not trusted evidence or business acceptance', 'Stop only acts on this page', 'does not confirm that a remote task stopped or determine cost'];
const PROFILE_VI = ['chế độ thử nghiệm cục bộ', 'khi bạn chọn Lưu', 'không có yêu cầu lấy biên nhận', 'chưa được xác minh và chưa được chấp nhận',
  'không phải bằng chứng đáng tin cậy hay sự chấp nhận trong nghiệp vụ', 'không xác nhận thao tác từ xa đã dừng', 'chi phí vẫn chưa rõ'];

type Call = { method: string; url: string; action?: string };
type Row = { role: string; fixture: string; language: string; visibleEvidence: string; action: string; observed: string; uncertainty: string };
const calls: Call[] = [];
const denied: string[] = [];
const newSession = (userId = 'u1') => ({ status: 'authenticated', data: { user: { ...OWNER, userId }, expires: '2999-01-01T00:00:00.000Z' } });
const reply = (data: unknown, ok = true, status = 200) => ({ ok, status, json: async () => (ok ? { success: true, data } : { success: false, error: data }) });
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>(r => { resolve = r; }); return { promise, resolve }; }
const flush = () => act(async () => { await new Promise(r => setTimeout(r, 30)); });
const text = (el: Element | null) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim();
const excerpt = (el: Element | null, n = 150) => text(el).slice(0, n);
const walk = (task: { meta: object }, row: Row) => { const meta = task.meta as Record<string, Row[]>; (meta.walkthrough ??= []).push(row); };
const posts = () => calls.filter(c => c.method === 'POST');
const actions = () => posts().map(c => c.action ?? (c.url.endsWith('/export') ? 'export' : c.url.endsWith('/drafts') ? 'save' : c.url));
const switchTo = (view: { rerender: (ui: ReactElement) => void }, lang: 'en' | 'vi', ui: ReactElement) => { h.lang = lang; view.rerender(ui); };

type Opts = { caps?: () => unknown; exportReply?: () => unknown };
function installFetch(o: Opts = {}) {
  calls.length = 0;
  const ids = [JOB, DECISION, '123e4567-e89b-42d3-a456-426614174004'];
  vi.stubGlobal('crypto', { randomUUID: () => ids.shift() ?? JOB });
  const spy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input); const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    calls.push({ method, url, action: body?.action });
    if (method === 'GET' && url.includes('kind=capabilities')) return o.caps ? o.caps() : reply({ jobDecisions: true, effectBoundary: 'LOCAL_SYNTHETIC' });
    if (method === 'POST' && url === '/api/artifacts/jobs' && body.action === 'CREATE_JOB') return reply({ jobId: body.jobId, sourceRecordId: body.sourceRecordId,
      owner: OWNER, goal: body.goal, criteria: body.criteria, requestSha256: '1'.repeat(64) });
    if (method === 'POST' && url === '/api/artifacts/jobs' && body.action === 'LINK_VERSION') return reply({ jobId: body.jobId, sourceRecordId: body.sourceRecordId,
      versionId: body.versionId, requestSha256: '1'.repeat(64), htmlSha256: '2'.repeat(64) });
    if (method === 'POST' && url === '/api/artifacts/jobs' && body.action === 'ACCEPT_VERSION') return reply({ decisionId: body.decisionId, jobId: body.jobId,
      versionId: body.versionId, requestSha256: body.requestSha256, htmlSha256: body.htmlSha256 });
    if (method === 'POST' && url === '/api/artifacts/export') return o.exportReply ? o.exportReply() : reply(EXPORT_RESULT);
    if (method === 'POST' && url === '/api/artifacts/drafts') return reply({ saved: true });
    denied.push(`${method} ${url}`);
    throw new Error(`DENIED_UNEXPECTED_FETCH ${method} ${url}`);
  });
  vi.stubGlobal('fetch', spy);
  return spy;
}
const jobUi = (source = SRC) => <HtmlJobControls sourceRecordId={source} initialRequest={REQ} />;
async function mountJob(o?: Opts) {
  installFetch(o);
  const view = render(jobUi());
  await waitFor(() => expect(screen.queryByTestId('pre-generate-disclosure')).not.toBeNull());
  return view;
}
const fillJob = () => {
  fireEvent.change(screen.getByRole('textbox', { name: h.lang === 'vi' ? 'Mục tiêu' : 'Goal' }), { target: { value: 'ncr-synthetic goal' } });
  fireEvent.change(screen.getByRole('textbox', { name: h.lang === 'vi' ? 'Tiêu chí 1' : 'Criterion 1' }), { target: { value: 'ncr-synthetic criterion' } });
};
const clickBuild = () => fireEvent.click(screen.getByRole('button', { name: h.lang === 'vi' ? 'Tạo HTML' : 'Build HTML' }));
const disclosure = () => text(screen.getByTestId('pre-generate-disclosure'));
const expectAll = (haystack: string, needles: string[]) => needles.forEach(n => expect(haystack).toContain(n));

beforeEach(() => { h.lang = 'en'; h.session = newSession(); calls.length = 0; denied.length = 0; sessionStorage.removeItem(JOURNAL_KEY); });
afterEach(() => { expect(denied).toEqual([]); });

describe('ArtifactExportPanel standalone (real component)', () => {
  it('shows owned EN/VI labels and accessible names; user text and wire values stay literal across a language rerender', async ({ task }) => {
    installFetch();
    const ui = () => <ArtifactExportPanel initialRequest={REQ} />;
    const view = render(ui());
    const names = {
      en: { heading: 'Review Packet Export', boxes: ['Title', 'Source reference', 'Review status', 'Receipt reference', 'Review boundary', 'Source notes'],
        select: 'Record type', build: 'Build HTML', output: ['Copy HTML', 'Download HTML', 'Print preview'], full: 'Complete record', pointer: 'Reference record' },
      vi: { heading: 'Xuất gói rà soát', boxes: ['Tiêu đề', 'Nguồn tham chiếu', 'Trạng thái rà soát', 'Mã receipt', 'Ranh giới rà soát', 'Ghi chú nguồn'],
        select: 'Loại bản ghi', build: 'Tạo HTML', output: ['Sao chép HTML', 'Tải HTML', 'Xem bản in'], full: 'Bản đầy đủ', pointer: 'Bản tham chiếu' },
    };
    const check = (lang: 'en' | 'vi') => {
      const n = names[lang];
      expect(screen.getByRole('heading', { level: 2, name: n.heading })).toBeTruthy();
      n.boxes.forEach(b => expect(screen.getByRole('textbox', { name: b })).toBeTruthy());
      expect(screen.getByRole('combobox', { name: n.select })).toBeTruthy();
      expect((screen.getByRole('button', { name: n.build }) as HTMLButtonElement).disabled).toBe(false);
      n.output.forEach(b => expect((screen.getByRole('button', { name: b }) as HTMLButtonElement).disabled).toBe(true));
      expect((screen.getByRole('option', { name: n.full }) as HTMLOptionElement).value).toBe('FULL_RECORD');
      expect((screen.getByRole('option', { name: n.pointer }) as HTMLOptionElement).value).toBe('POINTER_RECORD');
    };
    check('en');
    fireEvent.change(screen.getByRole('textbox', { name: 'Title' }), { target: { value: 'ncr-synthetic typed title' } });
    switchTo(view, 'vi', ui());
    check('vi');
    expect((screen.getByRole('textbox', { name: 'Tiêu đề' }) as HTMLInputElement).value).toBe('ncr-synthetic typed title');
    expect((screen.getByRole('textbox', { name: 'Nguồn tham chiếu' }) as HTMLInputElement).value).toBe(REQ.sourcePath);
    expect(posts()).toEqual([]);
    walk(task, { role: 'simulated non-coder reviewer (agent)', fixture: 'standalone panel, invented request, no job props', language: 'en then vi by rerender',
      visibleEvidence: `heading ${names.vi.heading}; build button ${names.vi.build}`, action: 'type title, switch language',
      observed: `title input value kept literal; option values FULL_RECORD/POINTER_RECORD unchanged; zero POST; ${excerpt(screen.getByRole('heading', { level: 2 }))}`,
      uncertainty: 'jsdom DOM names only; no layout, focus or real reader comprehension' });
  });

  it('keeps the standalone disclosure generic in EN and VI', ({ task }) => {
    installFetch();
    const ui = () => <ArtifactExportPanel initialRequest={REQ} />;
    const view = render(ui());
    expect(disclosure()).toContain(GENERIC_EN);
    expect(disclosure()).not.toContain('local test profile');
    switchTo(view, 'vi', ui());
    expect(disclosure()).toContain(GENERIC_VI);
    expect(disclosure()).not.toContain('chế độ thử nghiệm cục bộ');
    walk(task, { role: 'simulated non-coder reviewer (agent)', fixture: 'standalone panel, no profileDisclosure prop', language: 'vi',
      visibleEvidence: excerpt(screen.getByTestId('pre-generate-disclosure')), action: 'read disclosure only', observed: 'generic review-checking-service wording; no local-test-profile wording',
      uncertainty: 'does not show what a deployment actually does' });
  });

  it('translates an already-created error while the raw backend text stays literal under collapsed technical detail', async ({ task }) => {
    installFetch({ exportReply: () => reply('Missing required artifact export fields.', false, 400) });
    const ui = () => <ArtifactExportPanel initialRequest={REQ} />;
    const view = render(ui());
    fireEvent.click(screen.getByRole('button', { name: 'Build HTML' }));
    await screen.findByTestId('export-error-recovery');
    expect(text(screen.getByTestId('export-error-recovery'))).toContain('Some required fields are empty');
    expect(text(screen.getByTestId('export-error-build'))).toBe('Build #1');
    switchTo(view, 'vi', ui());
    expect(text(screen.getByTestId('export-error-recovery'))).toContain('Một số trường bắt buộc còn trống');
    expect(text(screen.getByTestId('export-error-build'))).toBe('Lần tạo #1');
    expect(text(screen.getByText('Chi tiết kỹ thuật'))).toBe('Chi tiết kỹ thuật');
    const detail = screen.getByTestId('export-error-detail');
    expect(text(detail)).toBe('Missing required artifact export fields.');
    expect((detail.closest('details') as HTMLDetailsElement).open).toBe(false);
    expect(actions()).toEqual(['export']);
    walk(task, { role: 'simulated non-coder reviewer (agent)', fixture: 'standalone panel; mocked export 400 with an owned backend message', language: 'en then vi by rerender',
      visibleEvidence: excerpt(screen.getByTestId('export-error-recovery')), action: 'click Build, then switch language', observed: `message and "${text(screen.getByTestId('export-error-build'))}" re-rendered in vi; detail literal and <details> closed; 1 export POST spy call`,
      uncertainty: 'DOM open flag is not a visual collapse check' });
  });

  it.each([
    ['Potential secret-like value detected in artifact export fields.', 'may contain a private key or token', 'khóa riêng tư hoặc mã token'],
    ['Potential secret-like value detected in source content.', 'may contain a private key or token', 'khóa riêng tư hoặc mã token'],
    ['Upstream exploded: ncr-synthetic-trace-42', 'This build could not be confirmed', 'Chưa xác nhận được kết quả tạo'],
  ])('gives localized primary guidance for backend message %j and keeps raw text under technical detail', async (raw, enText, viText) => {
    installFetch({ exportReply: () => reply(raw, false, 400) });
    const ui = () => <ArtifactExportPanel initialRequest={REQ} />;
    const view = render(ui());
    fireEvent.click(screen.getByRole('button', { name: 'Build HTML' }));
    await screen.findByTestId('export-error-recovery');
    expect(text(screen.getByTestId('export-error-recovery'))).toContain(enText);
    expect(text(screen.getByTestId('export-error-recovery'))).not.toContain(raw);
    switchTo(view, 'vi', ui());
    expect(text(screen.getByTestId('export-error-recovery'))).toContain(viText);
    expect(text(screen.getByTestId('export-error-recovery'))).not.toContain(raw);
    expect(text(screen.getByTestId('export-error-detail'))).toBe(raw);
    expect((screen.getByTestId('export-error-detail').closest('details') as HTMLDetailsElement).open).toBe(false);
  });

  it.each([
    ['Complete the goal and criteria first.', 'Enter the goal and all criteria before building.', 'Hãy nhập mục tiêu và đầy đủ tiêu chí trước khi tạo HTML.'],
    ['Resolve the pending operation before another write.', 'A pending operation could not be recorded. Reconcile it before another write.',
      'Chưa ghi nhận được thao tác đang chờ. Hãy đối soát thao tác đó trước khi ghi thêm.'],
  ])('shows actionable EN/VI guidance for owned pre-Build message %j with no export call', async (raw, enText, viText) => {
    installFetch();
    const prepareJob = rejecting(raw);
    const ui = () => <ArtifactExportPanel initialRequest={REQ} prepareJob={prepareJob} />;
    const view = render(ui());
    fireEvent.click(screen.getByRole('button', { name: 'Build HTML' }));
    await screen.findByTestId('export-error-recovery');
    expect(text(screen.getByTestId('export-error-recovery'))).toBe(enText);
    switchTo(view, 'vi', ui());
    expect(text(screen.getByTestId('export-error-recovery'))).toBe(viText);
    expect(text(screen.getByTestId('export-error-detail'))).toBe(raw);
    expect(posts()).toEqual([]);
    expect(prepareJob).toHaveBeenCalledTimes(1);
  });
});
function rejecting(message: string) { return vi.fn(async () => { throw new Error(message); }); }

describe('HtmlJobControls with real ArtifactExportPanel (composition)', () => {
  it('discloses the observed local-test profile before Build in EN and VI, in DOM order, and switches owned labels by rerender', async ({ task }) => {
    const view = await mountJob();
    const build = screen.getByRole('button', { name: 'Build HTML' });
    expectAll(disclosure(), PROFILE_EN);
    expect(disclosure()).not.toContain(GENERIC_EN);
    expect(screen.getByTestId('pre-generate-disclosure').compareDocumentPosition(build) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByLabelText('Local test HTML job')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Add criterion' })).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox', { name: 'Goal' }), { target: { value: 'ncr-synthetic typed goal' } });
    switchTo(view, 'vi', jobUi());
    expectAll(disclosure(), PROFILE_VI);
    expect(disclosure()).not.toContain(GENERIC_VI);
    expect(screen.getByTestId('pre-generate-disclosure').compareDocumentPosition(screen.getByRole('button', { name: 'Tạo HTML' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByLabelText('Tác vụ HTML thử nghiệm cục bộ')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Thêm tiêu chí' })).toBeTruthy();
    expect(screen.getByRole('textbox', { name: 'Tiêu chí 1' })).toBeTruthy();
    expect((screen.getByRole('textbox', { name: 'Mục tiêu' }) as HTMLTextAreaElement).value).toBe('ncr-synthetic typed goal');
    expect(posts()).toEqual([]);
    walk(task, { role: 'simulated non-coder reviewer (agent)', fixture: 'caps {jobDecisions:true, effectBoundary:"LOCAL_SYNTHETIC"}; invented session u1/o1/t1', language: 'en then vi by rerender',
      visibleEvidence: excerpt(screen.getByTestId('pre-generate-disclosure'), 200), action: 'read disclosure before Build; switch language', observed: 'all 7 profile fragments present in both languages; disclosure precedes the Build button in DOM order; typed goal literal; zero POST',
      uncertainty: 'DOM order is not visual order; wording comprehension unevaluated' });
  });

  it.each([
    ['missing boundary', { jobDecisions: true }, true],
    ['lowercase boundary', { jobDecisions: true, effectBoundary: 'local_synthetic' }, true],
    ['numeric boundary', { jobDecisions: true, effectBoundary: 42 }, true],
    ['other string boundary', { jobDecisions: true, effectBoundary: 'PROVIDER_LIVE' }, true],
    ['jobDecisions false with exact boundary', { jobDecisions: false, effectBoundary: 'LOCAL_SYNTHETIC' }, false],
    ['jobDecisions non-boolean with exact boundary', { jobDecisions: 'true', effectBoundary: 'LOCAL_SYNTHETIC' }, false],
  ])('keeps the generic disclosure for %s and preserves job controls only when jobDecisions is true', async (_name, caps, controls) => {
    const view = await mountJob({ caps: () => reply(caps) });
    expect(disclosure()).toContain(GENERIC_EN);
    expect(disclosure()).not.toContain('local test profile');
    expect(!!screen.queryByTestId('html-job-controls')).toBe(controls);
    expect(!!screen.queryByRole('textbox', { name: 'Goal' })).toBe(controls);
    switchTo(view, 'vi', jobUi());
    expect(disclosure()).toContain(GENERIC_VI);
    expect(posts()).toEqual([]);
  });

  it.each(['owner', 'sourceRecordId'] as const)('ignores a late exact-boundary capability reply after the %s changed (UI negative only)', async (change) => {
    const first = deferred<unknown>(); const second = deferred<unknown>(); let n = 0;
    installFetch({ caps: () => (++n === 1 ? first.promise : second.promise) });
    const view = render(jobUi());
    await waitFor(() => expect(n).toBe(1));
    if (change === 'owner') { h.session = newSession('u2'); view.rerender(jobUi()); } else view.rerender(jobUi('ncr-synthetic-ux-proof-other'));
    await waitFor(() => expect(n).toBe(2));
    second.resolve(reply({ jobDecisions: true }));
    await screen.findByTestId('html-job-controls');
    expect(disclosure()).toContain(GENERIC_EN);
    first.resolve(reply({ jobDecisions: true, effectBoundary: 'LOCAL_SYNTHETIC' }));
    await flush();
    expect(disclosure()).toContain(GENERIC_EN);
    expect(disclosure()).not.toContain('local test profile');
    expect(posts()).toEqual([]);
  });

  it('lets the reader read the disclosure and decline: zero mocked write invocations without a Build click', async ({ task }) => {
    const view = await mountJob();
    fillJob();
    expectAll(disclosure(), PROFILE_EN);
    expect((screen.getByRole('button', { name: 'Build HTML' }) as HTMLButtonElement).disabled).toBe(false);
    const readText = excerpt(screen.getByTestId('pre-generate-disclosure'));
    view.unmount();
    expect(calls.map(c => `${c.method} ${c.url.split('?')[0]}`)).toEqual(['GET /api/artifacts/jobs']);
    expect(posts()).toEqual([]);
    expect(sessionStorage.getItem(JOURNAL_KEY)).toBeNull();
    walk(task, { role: 'simulated non-coder reviewer (agent)', fixture: 'selected profile; goal and criterion typed', language: 'en',
      visibleEvidence: readText, action: 'read disclosure, do not click Build, unmount',
      observed: 'only the capabilities GET was recorded; 0 POST; no pending journal', uncertainty: 'proves wiring/UI availability, not informed consent' });
  });

  it('localizes pending-operation presentation and owned pre-Build guidance; operation values stay literal in the journal; no write is sent', async ({ task }) => {
    sessionStorage.setItem(JOURNAL_KEY, JSON.stringify({ schema: 'cvf.htmlJobPending.v1', owner: OWNER, sourceRecordId: SRC, jobId: JOB, operation: 'CREATE_JOB' }));
    const view = await mountJob();
    const reconcile = screen.getByTestId('reconcile-job-operation');
    expect(text(reconcile)).toContain('Reconcile job creation');
    expect(text(reconcile)).toContain(JOB);
    clickBuild();
    await screen.findByTestId('export-error-recovery');
    expect(text(screen.getByTestId('export-error-recovery'))).toBe('Enter the goal and all criteria before building.');
    switchTo(view, 'vi', jobUi());
    expect(text(screen.getByTestId('reconcile-job-operation'))).toContain('Đối soát tạo tác vụ');
    expect(text(screen.getByTestId('reconcile-job-operation'))).toContain(JOB);
    expect(text(screen.getByTestId('export-error-recovery'))).toBe('Hãy nhập mục tiêu và đầy đủ tiêu chí trước khi tạo HTML.');
    fillJob();
    clickBuild();
    await waitFor(() => expect(text(screen.getByTestId('export-error-detail'))).toBe('Resolve the pending operation before another write.'));
    expect(text(screen.getByTestId('export-error-recovery'))).toBe('Chưa ghi nhận được thao tác đang chờ. Hãy đối soát thao tác đó trước khi ghi thêm.');
    switchTo(view, 'en', jobUi());
    expect(text(screen.getByTestId('export-error-recovery'))).toBe('A pending operation could not be recorded. Reconcile it before another write.');
    expect(sessionStorage.getItem(JOURNAL_KEY)).toContain('"operation":"CREATE_JOB"');
    expect(posts()).toEqual([]);
    walk(task, { role: 'simulated non-coder reviewer (agent)', fixture: 'pre-seeded invented pending CREATE_JOB journal for the same owner and record', language: 'en, vi, en by rerender',
      visibleEvidence: excerpt(screen.getByTestId('reconcile-job-operation')), action: 'click Build with empty goal, then with goal filled', observed: 'reconcile label "job creation"/"tạo tác vụ" with literal job ID; both owned messages localized; journal still holds CREATE_JOB; 0 POST',
      uncertainty: 'no reconciliation was exercised here; Reconcile button not clicked' });
  });

  it('shows Stop and status while an export is in flight, suppresses the late result after a local stop, and sends no stop request', async ({ task }) => {
    const gate = deferred<unknown>();
    const view = await mountJob({ exportReply: () => gate.promise });
    fillJob();
    clickBuild();
    await screen.findByTestId('stop-html-build');
    await waitFor(() => expect(actions()).toEqual(['CREATE_JOB', 'export']));
    expect(text(screen.getByTestId('stop-html-build'))).toBe('Stop locally');
    expect(screen.getByRole('button', { name: 'Generating' }).getAttribute('aria-busy')).toBe('true');
    switchTo(view, 'vi', jobUi());
    expect(text(screen.getByTestId('stop-html-build'))).toBe('Dừng tại đây');
    expect(screen.getByRole('button', { name: 'Đang tạo' }).getAttribute('aria-busy')).toBe('true');
    fireEvent.click(screen.getByTestId('stop-html-build'));
    expect(screen.queryByTestId('stop-html-build')).toBeNull();
    expect(text(screen.getByTestId('stopped-unknown'))).toContain('Đã dừng tại đây. Thao tác từ xa có thể vẫn tiếp tục và chi phí chưa rõ.');
    switchTo(view, 'en', jobUi());
    expect(text(screen.getByTestId('stopped-unknown'))).toContain('Stopped locally. Remote completion and cost are unknown.');
    gate.resolve(reply(EXPORT_RESULT));
    await flush();
    expect(screen.queryByTestId('artifact-draft-state')).toBeNull();
    expect(screen.getAllByText('Build an HTML review packet to preview it here.').length).toBeGreaterThan(0);
    expect(actions()).toEqual(['CREATE_JOB', 'export']);
    clickBuild();
    await flush();
    expect(actions()).toEqual(['CREATE_JOB', 'export']);
    walk(task, { role: 'simulated non-coder reviewer (agent)', fixture: 'export POST held open by a deferred mock; selected profile', language: 'en, vi, en by rerender',
      visibleEvidence: `${excerpt(screen.getByTestId('stopped-unknown'), 110)}`, action: 'Build, read Stop/status, click Stop, release the late mocked response, click Build again',
      observed: 'Stop and aria-busy Build shown in both languages; after Stop the late success is not displayed (no draft state), preview stays empty; spy ledger CREATE_JOB, export only; same request not re-sent',
      uncertainty: 'client-side fence only; no abort-signal, remote-stop or cost behavior is claimed' });
  });

  it('records separate simulated Build, Save, link and review spy calls; notices and the review record translate on rerender', async ({ task }) => {
    const view = await mountJob();
    fillJob();
    clickBuild();
    await screen.findByTestId('artifact-draft-state');
    expect(text(screen.getByTestId('artifact-draft-state'))).toContain('DRAFT / UNACCEPTED');
    expect(text(screen.getByTestId('current-job-id'))).toContain(JOB);
    fireEvent.click(screen.getByTestId('stub-save'));
    await screen.findByText('Exact saved version linked.');
    const review = screen.getByLabelText('Review saved HTML version');
    expect(text(review)).toContain(`Saved draft ${VERSION}: sent from this device, not verified, not accepted.`);
    expect(text(review)).toContain('Current displayed job and saved version.');
    switchTo(view, 'vi', jobUi());
    expect(text(screen.getByText('Đã liên kết đúng phiên bản đã lưu.'))).toBe('Đã liên kết đúng phiên bản đã lưu.');
    expect(text(screen.getByLabelText('Rà soát phiên bản HTML đã lưu'))).toContain(`Bản nháp đã lưu ${VERSION}: đã gửi từ thiết bị này, chưa xác minh, chưa được chấp nhận.`);
    fireEvent.click(screen.getByRole('checkbox', { name: /Tôi đã rà soát đúng phiên bản đã lưu này/ }));
    fireEvent.click(screen.getByTestId('accept-synthetic-version'));
    await screen.findByText('Hãy thêm ghi chú có thể kiểm tra cho từng tiêu chí.');
    expect(actions()).toEqual(['CREATE_JOB', 'export', 'SAVE_DRAFT', 'LINK_VERSION']);
    switchTo(view, 'en', jobUi());
    expect(screen.getByText('Add an inspectable note for every criterion.')).toBeTruthy();
    fireEvent.change(screen.getByRole('textbox', { name: 'Review note c1' }), { target: { value: 'ncr-synthetic observed note' } });
    fireEvent.click(screen.getByTestId('accept-synthetic-version'));
    await screen.findByTestId('synthetic-review-decision');
    expectAll(text(screen.getByTestId('synthetic-review-decision')), ['A local test review by the same user was recorded for this original version:', DECISION, 'Draft provenance remains unverified.']);
    switchTo(view, 'vi', jobUi());
    expectAll(text(screen.getByTestId('synthetic-review-decision')), ['Đã ghi nhận lượt rà soát thử nghiệm cục bộ của cùng người dùng', DECISION, 'Nguồn gốc bản nháp vẫn chưa được xác minh.']);
    expect(actions()).toEqual(['CREATE_JOB', 'export', 'SAVE_DRAFT', 'LINK_VERSION', 'ACCEPT_VERSION']);
    expect((screen.getByRole('textbox', { name: 'Ghi chú rà soát c1' }) as HTMLTextAreaElement).value).toBe('ncr-synthetic observed note');
    walk(task, { role: 'simulated non-coder reviewer (agent)', fixture: 'selected profile; mocked CREATE_JOB/export/LINK_VERSION/ACCEPT_VERSION; Save via disclosed stub', language: 'en and vi by rerender',
      visibleEvidence: excerpt(screen.getByTestId('synthetic-review-decision'), 160), action: 'Build, stub Save, tick confirmation without note, add note, record review',
      observed: 'spy order CREATE_JOB, export, SAVE_DRAFT, LINK_VERSION, ACCEPT_VERSION; empty-note notice shown in vi then en; decision text and literal decision ID present; typed note literal',
      uncertainty: 'Save is a stub and these POSTs are mocked; no draft-save, link, review, writer or auth correctness is claimed' });
  });
});

// Clarity repair (F3, F4, F7): grouped pre-Build disclosure and Goal/criterion help. UI-structure assertions on real components only.
const KEYS = ['output', 'destination', 'cost', 'save', 'decline'] as const;
type Lang = 'en' | 'vi';
type Variant = 'selected' | 'generic';
const GROUP_TITLES: Record<Lang, string[]> = {
  en: ['Output and inputs', 'Data destination and access', 'Cost', 'Save and review status', 'Decline and Stop limits'],
  vi: ['Kết quả và đầu vào', 'Nơi dữ liệu đi và quyền truy cập', 'Chi phí', 'Trạng thái lưu và rà soát', 'Từ chối và giới hạn của Dừng'],
};
const GROUP_FRAGMENTS: Record<Variant, Record<Lang, Record<(typeof KEYS)[number], string[]>>> = {
  selected: {
    en: {
      output: ['local test profile', 'HTML is rendered on this device'],
      destination: ['does not show where data goes or who can access it', 'does not grant any access or permission',
        'HTML export configuration is resolved separately, so a later export may use a different profile'],
      cost: ['does not establish a price', 'do not assume it is zero'],
      save: ['only when you choose Save', 'no review receipt is requested', 'unverified and unaccepted', 'not trusted evidence or business acceptance'],
      decline: ['decline before Build', 'Opening or closing the panel does not start a build', 'Stop only acts on this page',
        'does not confirm that a remote task stopped or determine cost'],
    },
    vi: {
      output: ['chế độ thử nghiệm cục bộ', 'HTML được tạo trên máy này'],
      destination: ['không cho biết dữ liệu đi đâu hay ai được truy cập', 'không cấp quyền truy cập nào', 'lần tạo sau có thể dùng chế độ khác'],
      cost: ['không xác lập giá', 'đừng mặc định là bằng không'],
      save: ['khi bạn chọn Lưu', 'không có yêu cầu lấy biên nhận', 'chưa được xác minh và chưa được chấp nhận',
        'không phải bằng chứng đáng tin cậy hay sự chấp nhận trong nghiệp vụ'],
      decline: ['từ chối trước khi tạo', 'Mở hay đóng bảng không bắt đầu lượt tạo', 'Dừng chỉ tác động trên trang này',
        'không xác nhận thao tác từ xa đã dừng', 'chi phí vẫn chưa rõ'],
    },
  },
  generic: {
    en: {
      output: ['one HTML review packet'],
      destination: ['may send a short excerpt', 'depends on this deployment', 'Who can access that data is also unknown'],
      cost: ['Cost is unknown here', 'Do not assume it is free'],
      save: ['unverified and unaccepted', 'separate step'],
      decline: ['decline before Build', 'ask an operator', 'cannot prove that a remote task stopped or what it cost'],
    },
    vi: {
      output: ['gói HTML rà soát'],
      destination: ['có thể gửi một đoạn ngắn', 'phụ thuộc vào cấu hình triển khai', 'Ai được truy cập dữ liệu đó cũng chưa rõ'],
      cost: ['Chi phí chưa rõ ở đây', 'Đừng mặc định là miễn phí'],
      save: ['chưa được xác minh và chưa được chấp nhận', 'một bước riêng'],
      decline: ['từ chối trước khi tạo', 'hỏi người vận hành', 'không chứng minh được thao tác từ xa đã dừng hay chi phí là bao nhiêu'],
    },
  },
};
const HELP_FRAGMENTS: Record<Lang, { goal: string[]; criteria: string[]; lifetime: string[] }> = {
  en: { goal: ['does not write or change the page'],
    criteria: ['not applied to the HTML automatically', 'built from the review source fields below'],
    lifetime: ['Nothing typed here is saved until you click Build HTML', 'clears edits you have not submitted', 'checked with Reconcile'] },
  vi: { goal: ['không tự viết hay sửa trang'],
    criteria: ['không tự áp vào HTML', 'tạo từ các trường nguồn rà soát bên dưới'],
    lifetime: ['Chưa có gì được lưu cho đến khi bạn bấm Tạo HTML', 'xóa các chỉnh sửa chưa gửi', 'kiểm tra bằng Đối soát'] },
};
const box = () => screen.getByTestId('pre-generate-disclosure');
const groupOf = (key: string) => box().querySelector(`[data-disclosure-group="${key}"]`);
function expectGroups(variant: Variant, lang: Lang) {
  expect(box().getAttribute('data-disclosure')).toBe(variant === 'selected' ? 'selected-profile' : 'generic');
  expect(box().closest('details')).toBeNull();
  expect(Array.from(box().querySelectorAll('[data-disclosure-group]')).map(g => g.getAttribute('data-disclosure-group'))).toEqual([...KEYS]);
  expect(Array.from(box().querySelectorAll('h4')).map(h => text(h))).toEqual(GROUP_TITLES[lang]);
  KEYS.forEach(key => expectAll(text(groupOf(key)), GROUP_FRAGMENTS[variant][lang][key]));
  expect(screen.getByRole('group', { name: lang === 'vi' ? 'Trước khi tạo' : 'Before you build' })).toBe(box());
}

describe('grouped pre-Build disclosure and input help (real components, clarity repair)', () => {
  it('shows five always-visible labelled groups for the observed local-test profile in EN and VI, each qualification inside its own group, before Build', async () => {
    const view = await mountJob();
    expectGroups('selected', 'en');
    expect(text(box())).not.toContain(GENERIC_EN);
    expect(box().compareDocumentPosition(screen.getByRole('button', { name: 'Build HTML' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    switchTo(view, 'vi', jobUi());
    expectGroups('selected', 'vi');
    expect(text(box())).not.toContain(GENERIC_VI);
    expect(box().compareDocumentPosition(screen.getByRole('button', { name: 'Tạo HTML' })) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(posts()).toEqual([]);
  });

  it.each([
    ['standalone panel', undefined],
    ['job controls with a missing boundary', { jobDecisions: true }],
    ['job controls with jobDecisions false', { jobDecisions: false, effectBoundary: 'LOCAL_SYNTHETIC' }],
  ])('renders the grouped generic fallback for %s: access and cost unknown, Stop limit, a decline path and no invented numbers', async (_name, caps) => {
    let view: ReturnType<typeof render>;
    const standalone = () => <ArtifactExportPanel initialRequest={REQ} />;
    if (caps === undefined) { installFetch(); view = render(standalone()); } else view = await mountJob({ caps: () => reply(caps) });
    const ui = () => (caps === undefined ? standalone() : jobUi());
    expectGroups('generic', 'en');
    expect(text(box())).not.toMatch(/[$€₫]|\d/);
    expect(text(box())).not.toContain('local test profile');
    switchTo(view, 'vi', ui());
    expectGroups('generic', 'vi');
    expect(text(box())).not.toMatch(/[$€₫]|\d/);
    expect(text(box())).not.toContain('chế độ thử nghiệm cục bộ');
    expect(posts()).toEqual([]);
  });

  it.each(['owner', 'sourceRecordId'] as const)('keeps the grouped generic fallback after a late exact-boundary reply once the %s changed (UI negative only)', async (change) => {
    const first = deferred<unknown>(); const second = deferred<unknown>(); let n = 0;
    installFetch({ caps: () => (++n === 1 ? first.promise : second.promise) });
    const view = render(jobUi());
    await waitFor(() => expect(n).toBe(1));
    if (change === 'owner') { h.session = newSession('u2'); view.rerender(jobUi()); } else view.rerender(jobUi('ncr-synthetic-ux-proof-other'));
    await waitFor(() => expect(n).toBe(2));
    second.resolve(reply({ jobDecisions: true }));
    await screen.findByTestId('html-job-controls');
    expectGroups('generic', 'en');
    first.resolve(reply({ jobDecisions: true, effectBoundary: 'LOCAL_SYNTHETIC' }));
    await flush();
    expectGroups('generic', 'en');
    expect(box().getAttribute('data-disclosure')).toBe('generic');
    expect(posts()).toEqual([]);
  });

  it('binds the Goal and criterion help by aria-describedby in EN and VI, outside the accessible names, and editing then leaving sends no write', async () => {
    const view = await mountJob();
    const described = (name: string) => (screen.getByRole('textbox', { name }).getAttribute('aria-describedby') ?? '')
      .split(' ').filter(Boolean).map(id => text(document.getElementById(id)));
    const check = (lang: Lang) => {
      const goalName = lang === 'vi' ? 'Mục tiêu' : 'Goal'; const criterionName = lang === 'vi' ? 'Tiêu chí 1' : 'Criterion 1';
      const goal = described(goalName); const criterion = described(criterionName);
      expect(goal).toHaveLength(2); expect(criterion).toHaveLength(2);
      expectAll(goal[0], HELP_FRAGMENTS[lang].goal); expectAll(goal[1], HELP_FRAGMENTS[lang].lifetime);
      expectAll(criterion[0], HELP_FRAGMENTS[lang].criteria); expectAll(criterion[1], HELP_FRAGMENTS[lang].lifetime);
      expect(text(screen.getByRole('textbox', { name: goalName }).closest('label'))).toBe(goalName);
    };
    check('en');
    switchTo(view, 'vi', jobUi());
    check('vi');
    fillJob();
    expect(posts()).toEqual([]);
    view.unmount();
    expect(posts()).toEqual([]);
    expect(sessionStorage.getItem(JOURNAL_KEY)).toBeNull();
  });

  // Goal focus presentation (real onFocus handler). requestAnimationFrame and scrollIntoView are controlled in jsdom only and restored per case.
  describe.each([
    ['en', 'Goal', 'does not write or change the page'],
    ['vi', 'Mục tiêu', 'không tự viết hay sửa trang'],
  ] as const)('Goal focus handler (%s)', (lang, goalName, helpFragment) => {
    const frames: FrameRequestCallback[] = [];
    const scrolls: { target: Element; options: unknown }[] = [];
    const originalRaf = window.requestAnimationFrame;
    const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
    beforeEach(() => {
      frames.length = 0; scrolls.length = 0;
      window.requestAnimationFrame = (cb: FrameRequestCallback) => frames.push(cb);
      Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, writable: true,
        value(this: Element, options?: unknown) { scrolls.push({ target: this, options }); } });
    });
    afterEach(() => {
      window.requestAnimationFrame = originalRaf;
      if (originalScroll) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScroll);
      else delete (HTMLElement.prototype as { scrollIntoView?: unknown }).scrollIntoView;
    });
    const runFrames = () => { frames.splice(0).forEach(cb => cb(0)); };

    it('center-scrolls the focused Goal once when it fits the viewport, keeps its name and help association, and sends no write', async () => {
      h.lang = lang;
      await mountJob();
      const goal = screen.getByRole('textbox', { name: goalName }) as HTMLTextAreaElement;
      const fits = vi.spyOn(goal, 'getBoundingClientRect').mockReturnValue({ height: 58, width: 300, top: 0, left: 0, right: 300, bottom: 58, x: 0, y: 0, toJSON: () => ({}) });
      expect(scrolls).toEqual([]);
      fireEvent.focus(goal);
      expect(scrolls).toEqual([]);
      expect(frames).toHaveLength(1);
      runFrames();
      expect(scrolls).toEqual([{ target: goal, options: { block: 'center', inline: 'nearest' } }]);
      expect(fits).toHaveBeenCalled();
      expect(screen.getByRole('textbox', { name: goalName })).toBe(goal);
      const described = (goal.getAttribute('aria-describedby') ?? '').split(' ').filter(Boolean);
      expect(described).toHaveLength(2);
      expect(text(document.getElementById(described[0]))).toContain(helpFragment);
      expect(goal.maxLength).toBe(2000);
      expect(posts()).toEqual([]);
      expect(sessionStorage.getItem(JOURNAL_KEY)).toBeNull();
    });

    it('does not scroll when the field is taller than the viewport or has left the document before the frame runs', async () => {
      h.lang = lang;
      const view = await mountJob();
      const goal = screen.getByRole('textbox', { name: goalName }) as HTMLTextAreaElement;
      vi.spyOn(goal, 'getBoundingClientRect').mockReturnValue({ height: window.innerHeight, width: 300, top: 0, left: 0, right: 300, bottom: window.innerHeight, x: 0, y: 0, toJSON: () => ({}) });
      fireEvent.focus(goal);
      runFrames();
      expect(scrolls).toEqual([]);
      vi.spyOn(goal, 'getBoundingClientRect').mockReturnValue({ height: 58, width: 300, top: 0, left: 0, right: 300, bottom: 58, x: 0, y: 0, toJSON: () => ({}) });
      fireEvent.focus(goal);
      view.unmount();
      runFrames();
      expect(scrolls).toEqual([]);
      expect(posts()).toEqual([]);
    });
  });

  it('starts a reopened panel empty: edits that were not submitted are discarded and nothing was written', async () => {
    const first = await mountJob();
    fillJob();
    expect((screen.getByRole('textbox', { name: 'Goal' }) as HTMLTextAreaElement).value).toBe('ncr-synthetic goal');
    first.unmount();
    await mountJob();
    expect((screen.getByRole('textbox', { name: 'Goal' }) as HTMLTextAreaElement).value).toBe('');
    expect((screen.getByRole('textbox', { name: 'Criterion 1' }) as HTMLInputElement).value).toBe('');
    expect(posts()).toEqual([]);
    expect(sessionStorage.getItem(JOURNAL_KEY)).toBeNull();
  });
});
