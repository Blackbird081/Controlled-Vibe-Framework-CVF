import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HtmlJobControls } from './HtmlJobControls';
vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: 'en' }) }));
const sessionView = vi.hoisted(() => ({ userId: 'u1', expires: '2999-01-01T00:00:00.000Z' }));
vi.mock('next-auth/react', () => ({ useSession: () => ({ status: 'authenticated', data: { user: { userId: sessionView.userId, orgId: 'o1', teamId: 't1' }, expires: sessionView.expires } }) }));
afterEach(() => { sessionView.userId = 'u1'; sessionView.expires = '2999-01-01T00:00:00.000Z'; });
vi.mock('./ArtifactExportPanel', () => ({ ArtifactExportPanel: ({ prepareJob, renderRecovery }: {
  prepareJob?: (request: unknown) => Promise<unknown>; renderRecovery: (a: null, b: 'current') => React.ReactNode }) => <div>
  <button onClick={() => { if (prepareJob) void prepareJob({ title: 't', sourcePath: 'p', sourceContent: 's', memoryClass: 'FULL_RECORD', status: 'DRAFT', claimBoundary: 'local', receiptAnchor: 'r' }).catch(() => {}); }}>Mock Build</button>
  {renderRecovery(null, 'current')}</div> }));
vi.mock('./HtmlDraftRecovery', () => ({ HtmlDraftRecovery: ({ onConfirmedSnapshot }: { onConfirmedSnapshot?: (v: unknown, j: string) => void }) =>
  <button onClick={() => onConfirmedSnapshot?.({ versionId: '123e4567-e89b-42d3-a456-426614174002', sourceRecordId: 'ncr-synthetic-ui',
    requestSha256: '1'.repeat(64), htmlSha256: '2'.repeat(64), state: 'CLIENT_SUBMITTED_UNVERIFIED', acceptance: 'DRAFT_UNACCEPTED' },
    '123e4567-e89b-42d3-a456-426614174001')}>Mock confirmed Save</button> }));
const jobId = '123e4567-e89b-42d3-a456-426614174001';
const versionId = '123e4567-e89b-42d3-a456-426614174002';
const decisionId = '123e4567-e89b-42d3-a456-426614174003';
describe('integrated job controls', () => {
  it('requires criterion notes and explicit version confirmation before a separate person decision', async () => {
    sessionStorage.clear(); vi.stubGlobal('crypto', { randomUUID: vi.fn().mockReturnValueOnce(jobId).mockReturnValueOnce(decisionId) });
    const calls: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      if (!init?.method) return { ok: true, json: async () => ({ success: true, data: { jobDecisions: true } }) };
      const body = JSON.parse(init.body as string); calls.push(body.action);
      const data = body.action === 'CREATE_JOB' ? { jobId, sourceRecordId: 'ncr-synthetic-ui', owner: { userId: 'u1', orgId: 'o1', teamId: 't1' },
        goal: 'Review', criteria: [{ criterionId: 'c1', text: 'Heading' }], requestSha256: '1'.repeat(64) }
        : body.action === 'LINK_VERSION' ? { jobId, sourceRecordId: 'ncr-synthetic-ui', versionId, requestSha256: '1'.repeat(64), htmlSha256: '2'.repeat(64) }
          : { decisionId, jobId, versionId, requestSha256: '1'.repeat(64), htmlSha256: '2'.repeat(64) };
      return { ok: true, json: async () => ({ success: true, data }) };
    }));
    render(<HtmlJobControls sourceRecordId="ncr-synthetic-ui" initialRequest={{ title: 't' }} />);
    await waitFor(() => expect(screen.getByTestId('html-job-controls')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Goal'), { target: { value: 'Review' } });
    fireEvent.change(screen.getByLabelText('Criterion 1'), { target: { value: 'Heading' } });
    fireEvent.click(screen.getByText('Mock Build'));
    await waitFor(() => expect(screen.getByTestId('current-job-id').textContent).toContain(jobId));
    fireEvent.click(screen.getByText('Mock confirmed Save'));
    await waitFor(() => expect(screen.getByText(/Current displayed job and saved version/)).toBeTruthy());
    // Snapshot copy appears before the async LINK_VERSION readback enables review controls.
    const acceptVersion = await screen.findByTestId('accept-synthetic-version');
    fireEvent.click(acceptVersion);
    expect(calls).toEqual(['CREATE_JOB', 'LINK_VERSION']);
    fireEvent.change(screen.getByLabelText('Review note c1'), { target: { value: 'Observed exact heading' } });
    fireEvent.click(screen.getByLabelText(/I reviewed this exact saved version/));
    fireEvent.click(screen.getByTestId('accept-synthetic-version'));
    await waitFor(() => expect(screen.getByTestId('synthetic-review-decision').textContent).toContain(decisionId));
    expect(calls).toEqual(['CREATE_JOB', 'LINK_VERSION', 'ACCEPT_VERSION']);
    fireEvent.change(screen.getByLabelText('Goal'), { target: { value: 'Edited goal' } });
    expect(screen.getByTestId('review-target-stale')).toBeTruthy();
    expect(screen.queryByTestId('synthetic-review-decision')).toBeNull();
    sessionStorage.clear();
  });
  it.each(['SAVE_DRAFT', 'LINK_VERSION', 'ACCEPT_VERSION'] as const)('reconciles fresh %s journal by joined GET only', async operation => {
    sessionStorage.clear();
    const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
    sessionStorage.setItem('cvf-html-job-pending-v1', JSON.stringify({ schema: 'cvf.htmlJobPending.v1', owner,
      sourceRecordId: 'ncr-synthetic-ui', jobId, versionId, ...(operation === 'ACCEPT_VERSION' ? { decisionId } : {}), operation }));
    const methods: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (requestUrl: string, init?: RequestInit) => {
      methods.push(init?.method ?? 'GET');
      const text = String(requestUrl);
      if (text.includes('kind=capabilities')) return { ok: true, json: async () => ({ success: true, data: { jobDecisions: true } }) };
      if (text.includes('kind=job')) return { ok: true, json: async () => ({ success: true, data: { jobId, sourceRecordId: 'ncr-synthetic-ui',
        owner, goal: 'Original goal', criteria: [{ criterionId: 'c1', text: 'Original criterion' }], requestSha256: '1'.repeat(64) } }) };
      if (text.includes('/drafts?')) return { ok: true, json: async () => ({ success: true, data: { versionId, sourceRecordId: 'ncr-synthetic-ui',
        requestSha256: '1'.repeat(64), htmlSha256: '2'.repeat(64), state: 'CLIENT_SUBMITTED_UNVERIFIED', acceptance: 'DRAFT_UNACCEPTED' } }) };
      if (text.includes('kind=version')) return operation === 'ACCEPT_VERSION'
        ? { ok: true, json: async () => ({ success: true, data: { jobId, sourceRecordId: 'ncr-synthetic-ui', versionId,
          requestSha256: '1'.repeat(64), htmlSha256: '2'.repeat(64) } }) }
        : { ok: false, status: 404, json: async () => ({ success: false, error: 'NOT_FOUND' }) };
      if (text.includes('kind=decision')) return { ok: true, json: async () => ({ success: true, data: { decisionId, jobId, versionId,
        requestSha256: '1'.repeat(64), htmlSha256: '2'.repeat(64) } }) };
      throw new Error('Unexpected request');
    }));
    render(<HtmlJobControls sourceRecordId="ncr-synthetic-ui" initialRequest={{ title: 't' }} />);
    await waitFor(() => expect(screen.getByTestId('html-job-controls')).toBeTruthy());
    fireEvent.click(screen.getByTestId('reconcile-job-operation'));
    await waitFor(() => expect((screen.getByLabelText('Goal') as HTMLTextAreaElement).value).toBe('Original goal'));
    expect(methods.every(method => method === 'GET')).toBe(true);
    expect(sessionStorage.getItem('cvf-html-job-pending-v1')).toBeNull();
    if (operation === 'ACCEPT_VERSION') expect(screen.getByTestId('synthetic-review-decision').textContent).toContain(decisionId);
    else expect(screen.getByTestId('link-confirmed-version')).toBeTruthy();
    sessionStorage.clear();
  });
  it('does not publish a late job create into a different selected record', async () => {
    sessionStorage.clear(); vi.stubGlobal('crypto', { randomUUID: () => jobId });
    let finish!: (value: unknown) => void;
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      if (!init?.method) return { ok: true, json: async () => ({ success: true, data: { jobDecisions: true } }) };
      return new Promise(resolve => { finish = resolve; });
    }));
    const view = render(<HtmlJobControls sourceRecordId="ncr-synthetic-ui" initialRequest={{ title: 't' }} />);
    await waitFor(() => expect(screen.getByTestId('html-job-controls')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Goal'), { target: { value: 'Original goal' } });
    fireEvent.change(screen.getByLabelText('Criterion 1'), { target: { value: 'Original criterion' } });
    fireEvent.click(screen.getByText('Mock Build'));
    view.rerender(<HtmlJobControls sourceRecordId="ncr-synthetic-other" initialRequest={{ title: 'other' }} />);
    finish({ ok: true, json: async () => ({ success: true, data: { jobId, sourceRecordId: 'ncr-synthetic-ui',
      owner: { userId: 'u1', orgId: 'o1', teamId: 't1' }, goal: 'Original goal', criteria: [{ criterionId: 'c1', text: 'Original criterion' }] } }) });
    await waitFor(() => expect(screen.getByTestId('html-job-controls')).toBeTruthy());
    expect(screen.queryByTestId('current-job-id')).toBeNull();
    sessionStorage.clear();
  });
  it('recovers frozen CREATE fields by GET after a fresh remount with no result', async () => {
    sessionStorage.clear();
    const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
    sessionStorage.setItem('cvf-html-job-pending-v1', JSON.stringify({ schema: 'cvf.htmlJobPending.v1', owner,
      sourceRecordId: 'ncr-synthetic-ui', jobId, operation: 'CREATE_JOB' }));
    const methods: string[] = [];
    vi.stubGlobal('fetch', vi.fn(async (url: string, init?: RequestInit) => {
      methods.push(init?.method ?? 'GET');
      return { ok: true, json: async () => ({ success: true, data: String(url).includes('capabilities')
        ? { jobDecisions: true } : { jobId, sourceRecordId: 'ncr-synthetic-ui', owner, goal: 'Frozen goal',
          criteria: [{ criterionId: 'c1', text: 'Frozen criterion' }], requestSha256: '1'.repeat(64) } }) };
    }));
    render(<HtmlJobControls sourceRecordId="ncr-synthetic-ui" initialRequest={{ title: 'edited request' }} />);
    await waitFor(() => expect(screen.getByTestId('reconcile-job-operation')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Goal'), { target: { value: 'Edited goal' } });
    fireEvent.click(screen.getByTestId('reconcile-job-operation'));
    await waitFor(() => expect((screen.getByLabelText('Goal') as HTMLTextAreaElement).value).toBe('Frozen goal'));
    expect((screen.getByLabelText('Criterion 1') as HTMLInputElement).value).toBe('Frozen criterion');
    expect(methods.every(method => method === 'GET')).toBe(true);
    expect(sessionStorage.getItem('cvf-html-job-pending-v1')).toBeNull();
    sessionStorage.clear();
  });
  it('offers only an explicit same-pair link after GET confirms LINK absent', async () => {
    sessionStorage.clear();
    const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
    sessionStorage.setItem('cvf-html-job-pending-v1', JSON.stringify({ schema: 'cvf.htmlJobPending.v1', owner,
      sourceRecordId: 'ncr-synthetic-ui', jobId, versionId, operation: 'LINK_VERSION' }));
    const posts: unknown[] = [];
    vi.stubGlobal('fetch', vi.fn(async (requestUrl: string, init?: RequestInit) => {
      const url = String(requestUrl);
      if (init?.method === 'POST') {
        const body = JSON.parse(init.body as string); posts.push(body);
        return { ok: true, json: async () => ({ success: true, data: { jobId, sourceRecordId: 'ncr-synthetic-ui',
          versionId, requestSha256: '1'.repeat(64), htmlSha256: '2'.repeat(64) } }) };
      }
      if (url.includes('capabilities')) return { ok: true, json: async () => ({ success: true, data: { jobDecisions: true } }) };
      if (url.includes('kind=job')) return { ok: true, json: async () => ({ success: true, data: { jobId,
        sourceRecordId: 'ncr-synthetic-ui', owner, goal: 'Original', criteria: [{ criterionId: 'c1', text: 'One' }], requestSha256: '1'.repeat(64) } }) };
      if (url.includes('/drafts?')) return { ok: true, json: async () => ({ success: true, data: { versionId,
        sourceRecordId: 'ncr-synthetic-ui', requestSha256: '1'.repeat(64), htmlSha256: '2'.repeat(64),
        state: 'CLIENT_SUBMITTED_UNVERIFIED', acceptance: 'DRAFT_UNACCEPTED' } }) };
      return { ok: false, status: 404, json: async () => ({ success: false, error: 'NOT_FOUND' }) };
    }));
    render(<HtmlJobControls sourceRecordId="ncr-synthetic-ui" initialRequest={{ title: 'different' }} />);
    await waitFor(() => expect(screen.getByTestId('reconcile-job-operation')).toBeTruthy());
    fireEvent.click(screen.getByTestId('reconcile-job-operation'));
    await waitFor(() => expect(screen.getByTestId('link-confirmed-version')).toBeTruthy());
    expect(posts).toHaveLength(0);
    fireEvent.click(screen.getByTestId('link-confirmed-version'));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]).toEqual({ action: 'LINK_VERSION', jobId, sourceRecordId: 'ncr-synthetic-ui', versionId });
    sessionStorage.clear();
  });
  it.each(['LINK_VERSION', 'ACCEPT_VERSION'] as const)('suppresses late %s publication after scope loss', async action => {
    sessionStorage.clear(); vi.stubGlobal('crypto', { randomUUID: vi.fn().mockReturnValueOnce(jobId).mockReturnValueOnce(decisionId) });
    const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
    let finish!: (value: unknown) => void;
    vi.stubGlobal('fetch', vi.fn(async (_url: string, init?: RequestInit) => {
      if (!init?.method) return { ok: true, json: async () => ({ success: true, data: { jobDecisions: true } }) };
      const body = JSON.parse(init.body as string);
      if (body.action === action) return new Promise(resolve => { finish = resolve; });
      const data = body.action === 'CREATE_JOB'
        ? { jobId, sourceRecordId: 'ncr-synthetic-ui', owner, goal: 'Original', criteria: [{ criterionId: 'c1', text: 'One' }], requestSha256: '1'.repeat(64) }
        : { jobId, sourceRecordId: 'ncr-synthetic-ui', versionId, requestSha256: '1'.repeat(64), htmlSha256: '2'.repeat(64) };
      return { ok: true, json: async () => ({ success: true, data }) };
    }));
    const view = render(<HtmlJobControls sourceRecordId="ncr-synthetic-ui" initialRequest={{ title: 't' }} />);
    await waitFor(() => expect(screen.getByTestId('html-job-controls')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Goal'), { target: { value: 'Original' } });
    fireEvent.change(screen.getByLabelText('Criterion 1'), { target: { value: 'One' } });
    fireEvent.click(screen.getByText('Mock Build'));
    await waitFor(() => expect(screen.getByTestId('current-job-id')).toBeTruthy());
    fireEvent.click(screen.getByText('Mock confirmed Save'));
    if (action === 'ACCEPT_VERSION') {
      await waitFor(() => expect(screen.getByTestId('accept-synthetic-version')).toBeTruthy());
      fireEvent.change(screen.getByLabelText('Review note c1'), { target: { value: 'Inspected one' } });
      fireEvent.click(screen.getByLabelText(/I reviewed this exact saved version/));
      fireEvent.click(screen.getByTestId('accept-synthetic-version'));
    }
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    if (action === 'LINK_VERSION') view.rerender(<HtmlJobControls sourceRecordId="ncr-synthetic-other" initialRequest={{ title: 'other' }} />);
    else vi.spyOn(Date, 'now').mockReturnValue(Date.parse('2999-01-01T00:00:00.000Z') + 1);
    finish({ ok: true, json: async () => ({ success: true, data: action === 'LINK_VERSION'
      ? { jobId, sourceRecordId: 'ncr-synthetic-ui', versionId, requestSha256: '1'.repeat(64), htmlSha256: '2'.repeat(64) }
      : { decisionId, jobId, versionId, requestSha256: '1'.repeat(64), htmlSha256: '2'.repeat(64) } }) });
    await waitFor(() => expect(screen.queryByTestId('synthetic-review-decision')).toBeNull());
    if (action === 'LINK_VERSION') expect(screen.queryByTestId('current-job-id')).toBeNull();
    vi.restoreAllMocks(); sessionStorage.clear();
  });
  it('does not publish a late reconciliation GET into a changed source scope', async () => {
    sessionStorage.clear();
    const owner = { userId: 'u1', orgId: 'o1', teamId: 't1' };
    sessionStorage.setItem('cvf-html-job-pending-v1', JSON.stringify({ schema: 'cvf.htmlJobPending.v1', owner,
      sourceRecordId: 'ncr-synthetic-ui', jobId, operation: 'CREATE_JOB' }));
    let finish!: (value: unknown) => void;
    vi.stubGlobal('fetch', vi.fn(async (requestUrl: string) => String(requestUrl).includes('capabilities')
      ? { ok: true, json: async () => ({ success: true, data: { jobDecisions: true } }) }
      : new Promise(resolve => { finish = resolve; })));
    const view = render(<HtmlJobControls sourceRecordId="ncr-synthetic-ui" initialRequest={{ title: 't' }} />);
    await waitFor(() => expect(screen.getByTestId('reconcile-job-operation')).toBeTruthy());
    fireEvent.click(screen.getByTestId('reconcile-job-operation'));
    await waitFor(() => expect(finish).toBeTypeOf('function'));
    view.rerender(<HtmlJobControls sourceRecordId="ncr-synthetic-other" initialRequest={{ title: 'other' }} />);
    finish({ ok: true, json: async () => ({ success: true, data: { jobId, sourceRecordId: 'ncr-synthetic-ui',
      owner, goal: 'Old goal', criteria: [{ criterionId: 'c1', text: 'Old criterion' }] } }) });
    await waitFor(() => expect(screen.getByTestId('html-job-controls')).toBeTruthy());
    expect(screen.queryByTestId('current-job-id')).toBeNull();
    expect((screen.getByLabelText('Goal') as HTMLTextAreaElement).value).not.toBe('Old goal');
    sessionStorage.clear();
  });
  it('masks and clears old owner form and review state across a session owner change', async () => {
    sessionStorage.clear();
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: true, json: async () => ({ success: true, data: { jobDecisions: true } }) })));
    const view = render(<HtmlJobControls sourceRecordId="ncr-synthetic-ui" initialRequest={{ title: 't' }} />);
    await waitFor(() => expect(screen.getByTestId('html-job-controls')).toBeTruthy());
    fireEvent.change(screen.getByLabelText('Goal'), { target: { value: 'Private old owner goal' } });
    fireEvent.change(screen.getByLabelText('Criterion 1'), { target: { value: 'Private old criterion' } });
    sessionView.userId = 'u2';
    view.rerender(<HtmlJobControls sourceRecordId="ncr-synthetic-ui" initialRequest={{ title: 't' }} />);
    expect(screen.queryByDisplayValue('Private old owner goal')).toBeNull();
    await waitFor(() => expect(screen.getByTestId('html-job-controls')).toBeTruthy());
    expect((screen.getByLabelText('Goal') as HTMLTextAreaElement).value).toBe('');
    expect((screen.getByLabelText('Criterion 1') as HTMLInputElement).value).toBe('');
    expect(screen.queryByTestId('synthetic-review-decision')).toBeNull();
    sessionStorage.clear();
  });
});
