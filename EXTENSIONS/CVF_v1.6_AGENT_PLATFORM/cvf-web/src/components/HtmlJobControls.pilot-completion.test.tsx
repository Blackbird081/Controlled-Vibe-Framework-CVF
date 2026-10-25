// Text Encoding Exception: Vietnamese pilot copy and invented Vietnamese fixture text are intentional.
/**
 * Pure/UI fixture checks of the signed HTML pilot controls in EN and VI. Every network call is a local fixture;
 * no provider, storage writer or product decision is exercised, so passing proves rendering and state wiring only.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import { PilotArtifactSourceSummary } from './ReceiptEffectDisclosure';
import { PilotSavedVersionBadge } from './HtmlDraftRecovery';
import { PilotHtmlJobControls } from './PilotHtmlJobControls';
import { PilotHtmlJobControls as ReExported } from './HtmlJobControls';
import { pilotCopy, renderPilotStatus, type PilotCopy } from './html-pilot-copy';

const state = vi.hoisted(() => ({ language: 'en', updateExecution: vi.fn() }));
vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: state.language }) }));
vi.mock('@/lib/store', () => ({
  useExecutionStore: (selector: (value: { updateExecution: typeof state.updateExecution }) => unknown) => selector({ updateExecution: state.updateExecution }),
}));

const JOB = '11111111-1111-4111-8111-111111111111';
const V1 = '22222222-2222-4222-8222-222222222222';
const DECISION = '33333333-3333-4333-8333-333333333333';
const RUN = 'a1'.repeat(16);
const HTML_SHA = 'b2'.repeat(32);
const EVIDENCE_SHA = 'c3'.repeat(32);
const OUTPUT = '# Không gian đọc Ánh Sao\n## Giới thiệu\nThư viện hư cấu.\n## Hoạt động\nĐọc sách cùng nhau.\n## Liên hệ\nGặp tại khu sinh hoạt.\nCTA: Đăng ký tham gia -> Liên hệ';
const html = '<h1>Không gian đọc Ánh Sao</h1><h2>Giới thiệu</h2><a href="#lien-he">Đăng ký tham gia</a>';
const receipt = { receiptId: 'rcpt-fixture-1', htmlPilotEvidence: { operationKey: 'op-key-1', runId: RUN, rootRunId: RUN, parentRunId: null,
  outputSha256: 'd4'.repeat(32), receiptId: 'rcpt-fixture-1', profileDigest: 'e5'.repeat(32) } } as unknown as GovernanceEvidenceReceipt;
const job = { jobId: JOB, pilotRootRunId: RUN };
const snapshot = { versionId: V1, sourceRecordId: RUN, request: { receiptAnchor: 'rcpt-fixture-1' }, html, filename: 'trang.html',
  generatedAt: '2026-10-21T00:00:00.000Z', htmlSha256: HTML_SHA, requestSha256: 'f6'.repeat(32), pilotSource: { receipt } };
const linkRow = { jobId: JOB, versionId: V1, htmlSha256: HTML_SHA, pilotSourceRunId: RUN, pilotEvidenceSha256: EVIDENCE_SHA };
const decisionRow = (decision: 'ACCEPTED' | 'REJECTED') => ({ jobId: JOB, sourceRecordId: RUN, versionId: V1, decisionId: DECISION,
  htmlSha256: HTML_SHA, sourceEvidenceSha256: EVIDENCE_SHA, decision, reviewedVersionConfirmed: true });

interface Call { method: string; path: string; query: URLSearchParams; body?: Record<string, unknown> }
let calls: Call[];
let uuids: string[];
let heldExport: { release: () => void } | null;
let failCreate: boolean;
let storedDecision: ReturnType<typeof decisionRow> | null;

const json = (data: unknown, status = 200) => new Response(JSON.stringify({ success: status < 400, data }), { status, headers: { 'Content-Type': 'application/json' } });
const fixtureFetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  const url = new URL(String(input), 'http://localhost');
  const call: Call = { method: init?.method ?? 'GET', path: url.pathname, query: url.searchParams,
    ...(typeof init?.body === 'string' ? { body: JSON.parse(init.body) as Record<string, unknown> } : {}) };
  calls.push(call);
  const kind = url.searchParams.get('kind');
  if (call.path === '/api/artifacts/jobs' && call.method === 'POST') {
    if (call.body?.action === 'CREATE_JOB') { if (failCreate) throw new Error('NETWORK_DOWN'); return json(job); }
    if (call.body?.action === 'LINK_VERSION') return json(linkRow);
    if (call.body?.action === 'DECIDE_PRODUCT_VERSION') { storedDecision = decisionRow(call.body.decision as 'ACCEPTED' | 'REJECTED'); return json(storedDecision); }
  }
  if (call.path === '/api/artifacts/jobs' && kind === 'job') return json(job);
  if (call.path === '/api/artifacts/jobs' && kind === 'version') return json(linkRow);
  if (call.path === '/api/artifacts/jobs' && kind === 'product-decision') return storedDecision ? json(storedDecision) : json(null, 404);
  if (call.path === '/api/artifacts/export' && call.method === 'POST') {
    const result = { html, filename: 'trang.html', generatedAt: snapshot.generatedAt, receiptAnchor: 'rcpt-fixture-1', verification: [] };
    if (heldExport) { await new Promise<void>(resolve => { heldExport!.release = resolve; }); }
    return json(result);
  }
  if (call.path === '/api/artifacts/drafts' && call.method === 'POST') return json({});
  if (call.path === '/api/artifacts/drafts' && url.searchParams.get('list')) return json([{ versionId: V1, createdAt: snapshot.generatedAt }]);
  if (call.path === '/api/artifacts/drafts') return json(snapshot);
  throw new Error(`UNEXPECTED_FIXTURE_FETCH:${call.method}:${call.path}`);
};

beforeEach(() => {
  calls = []; uuids = [JOB, V1, DECISION]; heldExport = null; failCreate = false; storedDecision = null;
  state.updateExecution.mockClear();
  vi.stubGlobal('fetch', vi.fn(fixtureFetch));
  vi.stubGlobal('crypto', { randomUUID: () => uuids.shift() ?? '99999999-9999-4999-8999-999999999999' });
});
afterEach(() => { cleanup(); });

const posts = (action: string) => calls.filter(call => call.method === 'POST' && call.body?.action === action);
const click = async (element: HTMLElement) => { await act(async () => { fireEvent.click(element); }); };
const status = () => screen.getByTestId('pilot-status');
const button = (name: string) => screen.getByRole('button', { name });
const mount = (language: 'en' | 'vi', output = OUTPUT) => { state.language = language; return render(<PilotHtmlJobControls sourceExecutionId="exec-1" output={output} receipt={receipt} />); };
async function reachLinked(copy: PilotCopy) {
  await click(button(copy.controls.createDraft));
  await waitFor(() => expect(status().dataset.statusCode).toBe('JOB_CREATED'));
  await click(button(copy.controls.buildPreview));
  await waitFor(() => expect(status().dataset.statusCode).toBe('RENDERED'));
  await click(button(copy.controls.saveVersion));
  await waitFor(() => expect(status().dataset.statusCode).toBe('SAVED'));
  await click(button(copy.controls.useSaved));
  await waitFor(() => expect(status().dataset.statusCode).toBe('LINKED'));
}

describe.each(['en', 'vi'] as const)('pilot controls (%s)', language => {
  const copy = pilotCopy(language);

  it('posts the canonical title while preserving signed source bytes with heading whitespace', async () => {
    const output = OUTPUT.replace('# Không gian đọc Ánh Sao', '  # Không gian đọc Ánh Sao  ');
    mount(language, output);
    await click(button(copy.controls.createDraft));
    await waitFor(() => expect(status().dataset.statusCode).toBe('JOB_CREATED'));
    expect(posts('CREATE_JOB')).toHaveLength(1);
    expect(posts('CREATE_JOB')[0].body?.request).toMatchObject({ title: 'Không gian đọc Ánh Sao', sourceContent: output });
  });

  it('shows localized labels and keeps IDs, hashes and decision tokens verbatim', () => {
    mount(language);
    expect(screen.getByRole('heading', { name: copy.controls.heading })).toBeTruthy();
    expect(screen.getByTestId('html-pilot-source-summary').textContent).toContain(RUN);
    expect(screen.getByTestId('html-pilot-source-summary').textContent).toContain('rcpt-fixture-1');
    const decision = screen.getByTestId('pilot-decision-state');
    expect(decision.dataset.decision).toBe('PENDING_OPERATOR_ACCEPTANCE');
    expect(decision.textContent).toContain(RUN);
    expect(decision.textContent).toContain('PENDING_OPERATOR_ACCEPTANCE');
    expect(button(copy.controls.createDraft)).toBeTruthy();
    expect(screen.queryByRole('button', { name: copy.controls.buildPreview })).toBeNull();
    if (language === 'vi') expect(screen.getByRole('heading').textContent).toBe('Tạo trang HTML của bạn');
  });

  it('runs create, build, save, link and a user-initiated decision on the exact version with no execute call', async () => {
    mount(language);
    await reachLinked(copy);
    expect(screen.getByTestId('pilot-job-id').dataset.jobId).toBe(JOB);
    expect(posts('CREATE_JOB')).toHaveLength(1);
    expect(posts('CREATE_JOB')[0].body).toMatchObject({ jobId: JOB, sourceRecordId: RUN, expectedOutput: 'HTML' });
    const badge = screen.getByTestId('html-pilot-saved-version');
    expect(badge.dataset).toMatchObject({ versionId: V1, htmlSha256: HTML_SHA, runId: RUN });
    expect(badge.textContent).toContain(V1);
    expect(badge.textContent).toContain(HTML_SHA);
    const download = screen.getByRole('link', { name: copy.controls.download });
    expect(download.getAttribute('download')).toBe('trang.html');
    expect(decodeURIComponent(download.getAttribute('href') ?? '')).toContain(html);
    expect(screen.getByTitle(copy.controls.previewTitle).getAttribute('sandbox')).toBe('');

    // Nothing is decided until the user acts, and reviewing is a separate prior step.
    expect(posts('DECIDE_PRODUCT_VERSION')).toHaveLength(0);
    expect((button(copy.controls.accept) as HTMLButtonElement).disabled).toBe(true);
    await click(button(copy.controls.accept));
    expect(posts('DECIDE_PRODUCT_VERSION')).toHaveLength(0);
    await click(screen.getByLabelText(copy.controls.reviewedCheckbox));
    await click(button(copy.controls.accept));
    await waitFor(() => expect(status().dataset.statusCode).toBe('DECIDED'));
    expect(posts('DECIDE_PRODUCT_VERSION')).toHaveLength(1);
    expect(posts('DECIDE_PRODUCT_VERSION')[0].body).toMatchObject({ jobId: JOB, versionId: V1, htmlSha256: HTML_SHA,
      sourceEvidenceSha256: EVIDENCE_SHA, decision: 'ACCEPTED', reviewedVersionConfirmed: true });
    expect(status().textContent).toBe(renderPilotStatus(copy, { code: 'DECIDED', versionId: V1, token: 'ACCEPTED' }));
    expect(status().textContent).toContain(V1);
    expect(screen.getByTestId('pilot-decision-state').dataset.decision).toBe('ACCEPTED');
    expect((button(copy.controls.accept) as HTMLButtonElement).disabled).toBe(true);
    expect((button(copy.controls.reject) as HTMLButtonElement).disabled).toBe(true);
    expect(calls.some(call => call.path === '/api/execute')).toBe(false);
  });

  it('stops waiting locally, fences the late render and starts no request', async () => {
    mount(language);
    await click(button(copy.controls.createDraft));
    await waitFor(() => expect(status().dataset.statusCode).toBe('JOB_CREATED'));
    heldExport = { release: () => undefined };
    await click(button(copy.controls.buildPreview));
    await waitFor(() => expect(screen.getByTestId('pilot-stop-render')).toBeTruthy());
    expect(button(copy.controls.stopWait)).toBeTruthy();
    const before = calls.length;
    await click(screen.getByTestId('pilot-stop-render'));
    expect(status().dataset.statusCode).toBe('RENDER_STOPPED');
    expect(status().textContent).toBe(copy.status.RENDER_STOPPED);
    await act(async () => { heldExport!.release(); await Promise.resolve(); });
    await act(async () => { await new Promise(resolve => setTimeout(resolve, 0)); });
    expect(status().dataset.statusCode).toBe('RENDER_STOPPED');
    expect(screen.queryByTestId('pilot-save-version')).toBeNull();
    expect(screen.queryByTestId('pilot-stop-render')).toBeNull();
    expect(calls.length).toBe(before);
    expect(calls.filter(call => call.path === '/api/artifacts/drafts' && call.method === 'POST')).toHaveLength(0);
    expect((button(copy.controls.buildPreview) as HTMLButtonElement).disabled).toBe(false);
  });

  it('keeps the original job id after an unclear create and recovers it without a second write', async () => {
    failCreate = true;
    mount(language);
    await click(button(copy.controls.createDraft));
    await waitFor(() => expect(status().dataset.statusCode).toBe('JOB_UNKNOWN'));
    expect(status().textContent).toContain('NETWORK_DOWN');
    expect((button(copy.controls.createDraft) as HTMLButtonElement).disabled).toBe(true);
    failCreate = false;
    await click(button(copy.controls.checkPreviousCreate));
    await waitFor(() => expect(status().dataset.statusCode).toBe('JOB_RECOVERED'));
    expect(posts('CREATE_JOB')).toHaveLength(1);
    const lookup = calls.find(call => call.query.get('kind') === 'job');
    expect(lookup?.query.get('jobId')).toBe(JOB);
    expect(screen.getByTestId('pilot-job-id').dataset.jobId).toBe(JOB);
    expect(state.updateExecution).toHaveBeenCalledWith('exec-1', expect.objectContaining({ htmlPilot: expect.objectContaining({ jobId: JOB }) }));
  });

  it('restores an exact saved version and reads back its stored decision', async () => {
    storedDecision = decisionRow('REJECTED');
    mount(language);
    await click(button(copy.controls.createDraft));
    await waitFor(() => expect(status().dataset.statusCode).toBe('JOB_CREATED'));
    await click(button(copy.controls.showVersions));
    await click(await screen.findByRole('button', { name: copy.controls.restore(V1) }));
    await waitFor(() => expect(status().dataset.statusCode).toBe('VERSION_RESTORED'));
    expect(screen.getByTestId('html-pilot-saved-version').dataset.htmlSha256).toBe(HTML_SHA);
    expect(screen.getByTestId('pilot-decision-state').dataset.decision).toBe('REJECTED');
    expect(screen.getByTestId('pilot-decision-state').textContent).toContain('REJECTED');
    expect(posts('DECIDE_PRODUCT_VERSION')).toHaveLength(0);
    expect(posts('CREATE_JOB')).toHaveLength(1);
  });

  it('uses only native focusable controls in reading order with visible focus and mobile-size targets', async () => {
    mount(language);
    await reachLinked(copy);
    const section = screen.getByTestId('html-pilot-job-controls');
    const order = within(section).getAllByRole('button').map(element => element.textContent);
    expect(order).toEqual([copy.controls.buildPreview, copy.controls.saveVersion, copy.controls.checkSaved(V1),
      copy.controls.showVersions, copy.controls.accept, copy.controls.reject]);
    for (const element of section.querySelectorAll<HTMLElement>('button, a[href], input')) {
      expect(element.tabIndex).toBeLessThanOrEqual(0);
      expect(['BUTTON', 'A', 'INPUT']).toContain(element.tagName);
    }
    for (const element of within(section).getAllByRole('button')) {
      expect(element.className).toContain('min-h-11');
      expect(element.className).toContain('focus-visible:outline-2');
    }
    const first = within(section).getAllByRole('button')[0];
    first.focus();
    expect(document.activeElement).toBe(first);
    expect(section.getAttribute('aria-labelledby')).toBe(screen.getByRole('heading').id);
    expect(screen.getByRole('group', { name: copy.controls.actions })).toBeTruthy();
  });
});

describe('pilot copy', () => {
  const en = pilotCopy('en');
  const vi = pilotCopy('vi');
  const flatten = (value: unknown, prefix = ''): Array<[string, unknown]> => typeof value === 'object' && value !== null
    ? Object.entries(value).flatMap(([key, item]) => flatten(item, `${prefix}${key}.`)) : [[prefix.slice(0, -1), value]];

  it('has the same keys in both languages and a distinct Vietnamese sentence for every label', () => {
    const enEntries = flatten(en); const viEntries = flatten(vi);
    expect(viEntries.map(([key]) => key)).toEqual(enEntries.map(([key]) => key));
    for (const [index, [key, value]] of enEntries.entries()) {
      const other = viEntries[index][1];
      expect(typeof other).toBe(typeof value);
      if (typeof value === 'string') expect(other, key).not.toBe(value);
      else if (typeof value === 'function') {
        const sample = (language: PilotCopy) => (key.split('.').reduce<unknown>((node, part) => (node as Record<string, unknown>)[part], language) as (...args: string[]) => string)('ID-1', 'ID-2', 'ID-3');
        expect(sample(vi), key).not.toBe(sample(en));
        for (const id of ['ID-1']) expect(sample(vi), key).toContain(id);
      }
    }
  });
  it('localizes the source summary and saved badge while keeping run, receipt, version and hash tokens', () => {
    const { unmount } = render(<PilotArtifactSourceSummary receipt={receipt} language="vi" />);
    expect(screen.getByTestId('html-pilot-source-summary').textContent).toContain(`lượt ${RUN}`);
    expect(screen.getByTestId('html-pilot-source-summary').textContent).toContain('rcpt-fixture-1');
    unmount();
    render(<PilotSavedVersionBadge snapshot={snapshot as never} language="vi" />);
    expect(screen.getByTestId('html-pilot-saved-version').textContent).toBe(vi.badge(V1, RUN, HTML_SHA));
    expect(screen.getByTestId('html-pilot-saved-version').textContent).toContain('Phiên bản');
  });
  it('defaults to English and keeps the pilot controls available from the original module path', () => {
    render(<PilotArtifactSourceSummary receipt={receipt} />);
    expect(screen.getByTestId('html-pilot-source-summary').textContent).toContain('separate actions');
    expect(ReExported).toBe(PilotHtmlJobControls);
    expect(pilotCopy(undefined)).toBe(en);
    expect(pilotCopy('fr')).toBe(en);
  });
});
