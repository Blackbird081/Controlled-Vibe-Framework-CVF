// Text Encoding Exception: localized Vietnamese assertions follow the existing UI copy owner.
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { boundDisclosureOf, makeBoundConfig } from '@/lib/artifacts-bound-receipt-contract';
import { HtmlJobControls } from './HtmlJobControls';

const view = vi.hoisted(() => ({ userId: 'u1', expires: '2999-01-01T00:00:00.000Z', language: 'en' as 'en' | 'vi' }));
vi.mock('next-auth/react', () => ({ useSession: () => ({ status: 'authenticated', data: { user: { userId: view.userId, orgId: 'o1', teamId: 't1' }, expires: view.expires } }) }));
vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: view.language }) }));
vi.mock('./ArtifactExportPanel', () => ({ ArtifactExportPanel: ({ prepareJob, renderRecovery, profileDisclosure }: {
  prepareJob?: (request: unknown) => Promise<unknown>; renderRecovery: (a: null, b: 'current') => React.ReactNode; profileDisclosure?: string }) =>
  <div data-testid="mock-panel" data-profile-disclosure={profileDisclosure ?? ''} data-job-mode={prepareJob ? 'yes' : 'no'}>
    <button onClick={() => { if (prepareJob) void prepareJob({ title: 't', sourcePath: 'p', sourceContent: 's', memoryClass: 'FULL_RECORD', status: 'DRAFT', claimBoundary: 'local', receiptAnchor: 'r' }).catch(() => {}); }}>Mock Build</button>
    {renderRecovery(null, 'current')}</div> }));
vi.mock('./HtmlDraftRecovery', () => ({ HtmlDraftRecovery: () => null }));
afterEach(() => { view.userId = 'u1'; view.language = 'en'; sessionStorage.clear(); vi.unstubAllGlobals(); });

const config = makeBoundConfig({ policyRevision: 'policy-r1', transformRevision: 'transform-1', endpointId: 'fixture-endpoint', storeId: 'fixture-store', authReference: 'bundle-1',
  authScope: 'two-hop', webOrigin: 'http://web.invalid:3000', engineOrigin: 'http://engine.invalid:8100', instanceId: '123e4567-e89b-42d3-a456-426614174000',
  storeBindingId: 'ab'.repeat(32), timeoutMs: 4000 })!;
const disclosure = JSON.parse(JSON.stringify(boundDisclosureOf(config))) as Record<string, unknown>;
const bound = { jobDecisions: true, effectBoundary: 'BOUND_ENGINE_RECEIPT', boundDisclosure: disclosure };
const jobId = '123e4567-e89b-42d3-a456-426614174001';
const reply = (data: unknown) => ({ ok: true, json: async () => ({ success: true, data }) });
function capability(data: unknown) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    if (init?.method === 'POST') {
      return reply({ jobId, sourceRecordId: 'ncr-synthetic-ui', owner: { userId: 'u1', orgId: 'o1', teamId: 't1' }, goal: 'Review', criteria: [{ criterionId: 'c1', text: 'Heading' }],
        requestSha256: '1'.repeat(64) });
    }
    return reply(data);
  }));
  return calls;
}
const mount = () => render(<HtmlJobControls sourceRecordId="ncr-synthetic-ui" initialRequest={{ title: 't' }} />);

describe('bound capability reaches the existing controls (BC10)', () => {
  it('renders the exact disclosure before the Build control and keeps the generic panel label', async () => {
    capability(bound);
    mount();
    await waitFor(() => expect(screen.getByTestId('bound-receipt-disclosure')).toBeTruthy());
    const panel = screen.getByTestId('mock-panel');
    const section = screen.getByTestId('bound-receipt-disclosure');
    expect(section.compareDocumentPosition(panel) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByTestId('html-job-controls').contains(section)).toBe(true);
    expect(panel.getAttribute('data-profile-disclosure')).toBe('');
    expect(panel.getAttribute('data-job-mode')).toBe('yes');
    expect(screen.getByTestId('bound-disclosure-destination').textContent).toContain('fixture-endpoint - http://engine.invalid:8100 - fixture-store');
    expect(screen.getByTestId('bound-disclosure-cost').textContent).toContain('Unknown and not authorized');
    expect(screen.getByTestId('bound-disclosure-attempts').textContent).toContain('1 - One attempt per operation');
    expect(screen.getByTestId('bound-disclosure-risk').textContent).toContain('R1 - Requested class R1');
  });
  it('shows the Vietnamese disclosure when the interface language is Vietnamese', async () => {
    view.language = 'vi';
    capability(bound);
    mount();
    await waitFor(() => expect(screen.getByTestId('bound-receipt-disclosure')).toBeTruthy());
    expect(screen.getByTestId('bound-receipt-disclosure').getAttribute('aria-label')).toBe('Biên nhận quản trị ràng buộc ngoại tuyến (chưa kích hoạt)');
    expect(screen.getByTestId('bound-disclosure-cost').textContent).toContain('Chưa rõ và chưa được cho phép');
  });
  it('keeps the local synthetic label and no bound disclosure for the local capability', async () => {
    capability({ jobDecisions: true, effectBoundary: 'LOCAL_SYNTHETIC' });
    mount();
    await waitFor(() => expect(screen.getByTestId('html-job-controls')).toBeTruthy());
    expect(screen.getByTestId('mock-panel').getAttribute('data-profile-disclosure')).toBe('LOCAL_SYNTHETIC');
    expect(screen.queryByTestId('bound-receipt-disclosure')).toBeNull();
  });
  it('gives a missing boundary neither the local label nor a disclosure', async () => {
    capability({ jobDecisions: true });
    mount();
    await waitFor(() => expect(screen.getByTestId('html-job-controls')).toBeTruthy());
    expect(screen.getByTestId('mock-panel').getAttribute('data-profile-disclosure')).toBe('');
    expect(screen.queryByTestId('bound-receipt-disclosure')).toBeNull();
  });
  const malformed: Array<[string, unknown]> = [
    ['missing disclosure', { jobDecisions: true, effectBoundary: 'BOUND_ENGINE_RECEIPT' }],
    ['extra field', { ...bound, boundDisclosure: { ...disclosure, extra: 1 } }],
    ['wrong cost', { ...bound, boundDisclosure: { ...disclosure, cost: 'FREE' } }],
    ['wrong mode', { ...bound, boundDisclosure: { ...disclosure, mode: 'ACTIVATED' } }],
    ['jobDecisions false', { ...bound, jobDecisions: false }],
    ['jobDecisions string', { ...bound, jobDecisions: 'true' }],
  ];
  it.each(malformed)('disables the job controls for a %s capability and never labels it local synthetic', async (_name, data) => {
    capability(data);
    mount();
    await waitFor(() => expect(screen.getByTestId('mock-panel')).toBeTruthy());
    expect(screen.queryByTestId('html-job-controls')).toBeNull();
    expect(screen.queryByTestId('bound-receipt-disclosure')).toBeNull();
    expect(screen.getByTestId('mock-panel').getAttribute('data-profile-disclosure')).toBe('');
    expect(screen.getByTestId('mock-panel').getAttribute('data-job-mode')).toBe('no');
  });
  it('shows nothing from a capability that resolves late for a different owner scope', async () => {
    let releaseFirst!: (value: unknown) => void;
    const first = new Promise(resolve => { releaseFirst = resolve; });
    let call = 0;
    vi.stubGlobal('fetch', vi.fn(async () => { call += 1; return call === 1 ? first : reply({ jobDecisions: true, effectBoundary: 'LOCAL_SYNTHETIC' }); }));
    const rendered = mount();
    await waitFor(() => expect(call).toBe(1));
    view.userId = 'u2';
    rendered.rerender(<HtmlJobControls sourceRecordId="ncr-synthetic-ui" initialRequest={{ title: 't' }} />);
    await waitFor(() => expect(screen.getByTestId('html-job-controls')).toBeTruthy());
    await act(async () => { releaseFirst(reply(bound)); await Promise.resolve(); });
    expect(screen.queryByTestId('bound-receipt-disclosure')).toBeNull();
    expect(screen.getByTestId('mock-panel').getAttribute('data-profile-disclosure')).toBe('LOCAL_SYNTHETIC');
  });
  it('does not change the job write path: only job calls, an unchanged body, and the disclosure grants nothing', async () => {
    vi.stubGlobal('crypto', { randomUUID: () => jobId });
    const calls = capability(bound);
    mount();
    await waitFor(() => expect(screen.getByTestId('bound-receipt-disclosure')).toBeTruthy());
    expect(screen.getByTestId('bound-receipt-disclosure').querySelectorAll('button, input, a, select, textarea')).toHaveLength(0);
    fireEvent.change(screen.getByLabelText('Goal'), { target: { value: 'Review' } });
    fireEvent.change(screen.getByLabelText('Criterion 1'), { target: { value: 'Heading' } });
    fireEvent.click(screen.getByText('Mock Build'));
    await waitFor(() => expect(screen.getByTestId('current-job-id').textContent).toContain(jobId));
    const post = calls.find(call => call.init?.method === 'POST')!;
    expect(Object.keys(JSON.parse(post.init!.body as string)).sort()).toEqual(['action', 'allowedEffects', 'criteria', 'expectedOutput', 'goal', 'jobId', 'request', 'sourceRecordId']);
    expect(calls.every(call => call.url.startsWith('/api/artifacts/jobs'))).toBe(true);
    expect(JSON.stringify(calls.map(call => call.init?.body ?? ''))).not.toMatch(/BOUND_ENGINE_RECEIPT|boundDisclosure|OFFLINE_BOUND/);
  });
});
