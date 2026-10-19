// Text Encoding Exception: Vietnamese localization assertion for user-facing copy.
/** @vitest-environment jsdom */
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
const auth = vi.hoisted(() => ({
    session: { status: 'authenticated', data: { user: { userId: 'user_a', orgId: 'org_a', teamId: 'team_a' }, expires: '2999-01-01T00:00:00.000Z' } } as
        { status: string; data: { user: { userId: string; orgId: string; teamId: string }; expires: string } | null },
}));
vi.mock('next-auth/react', () => ({ useSession: () => auth.session }));
import { IntentSpecConfirmation } from './IntentSpecConfirmation';
import { acknowledgeIntentSpecReview, createIntentSpecReview, updateReviewDecision } from '@/lib/intent-spec-review';

const ID = 'a'.repeat(64);
const fetcher = vi.fn();
const SESSION_A = { status: 'authenticated', data: { user: { userId: 'user_a', orgId: 'org_a', teamId: 'team_a' }, expires: '2999-01-01T00:00:00.000Z' } };
const SESSION_B = { status: 'authenticated', data: { user: { userId: 'user_b', orgId: 'org_a', teamId: 'team_a' }, expires: '2999-01-01T00:00:00.000Z' } };
beforeEach(() => { vi.stubGlobal('crypto', webcrypto); fetcher.mockReset(); vi.stubGlobal('fetch', fetcher); auth.session = SESSION_A; });
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

function reviewed() {
    let state = createIntentSpecReview({}, 'Synthetic current packet');
    for (const decision of state.decisions) state = updateReviewDecision(state, decision.id, { answer: `Decision ${decision.id}` });
    return acknowledgeIntentSpecReview(state);
}
function open() {
    fireEvent.click(screen.getByRole('button', { name: 'Keep a review copy for comparison' }));
    fireEvent.change(screen.getByLabelText('Reviewer name (self-declared)'), { target: { value: 'Reviewer' } });
}
async function create() {
    fireEvent.click(screen.getByRole('button', { name: 'Create file for reviewed revision' }));
    await screen.findByRole('button', { name: 'Download review file' });
}
const json = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });
const receipt = (sourceFileSha256: string, revision: number, extra: Record<string, unknown> = {}) => json(201, {
    ok: true, id: ID, state: 'STORE_PORT_READBACK_VERIFIED', claimBoundary: 'NO_DURABILITY_OR_BUILD_AUTHORITY',
    scope: 'SPEC_REVIEW_ONLY_NO_BUILD_AUTHORITY', sourceFileSha256, revision, assurance: 'LOCAL_TEST_SESSION', ...extra,
});
const record = (extra: Record<string, unknown> = {}) => json(200, {
    ok: true, id: ID, claimBoundary: 'SPEC_REVIEW_ONLY_NO_BUILD_AUTHORITY', revision: 7, language: 'en',
    reviewer: { name: 'Saved Reviewer', verification: 'SELF_DECLARED' }, createdAt: '2026-10-05T00:00:00.000Z',
    assurance: 'LOCAL_TEST_SESSION', draft: 'SAVED DRAFT CONTENT', ...extra,
});
const saveButton = () => screen.getByRole('button', { name: 'Save confirmed content to server' });
const saveStatus = () => screen.queryByRole('status', { name: 'Server save status' });
const sentDigest = (call = 0) => JSON.parse(fetcher.mock.calls[call][1].body).expectedSha256 as string;
function openSaved(id = ID) {
    fireEvent.change(screen.getByLabelText('Saved review ID'), { target: { value: id } });
    fireEvent.click(screen.getByRole('button', { name: 'Open saved copy (read-only)' }));
}

describe('request-owned server save', () => {
    it('does not claim a save before the server receipt and sends only candidate bytes plus digest', async () => {
        let resolveFetch!: (value: Response) => void;
        fetcher.mockImplementation(() => new Promise(resolve => { resolveFetch = resolve; }));
        const state = reviewed();
        render(<IntentSpecConfirmation review={state} language="en" />); open(); await create();
        expect(screen.queryByText(/Saved on the server/)).toBeNull();
        fireEvent.click(saveButton());
        expect(saveStatus()!.textContent).toContain('Not confirmed until the server reads the exact content back');
        const [url, init] = fetcher.mock.calls[0];
        const body = JSON.parse(init.body);
        expect(url).toBe('/api/intent-spec/reviews');
        expect(Object.keys(body).sort()).toEqual(['candidate', 'expectedSha256']);
        expect(init).toMatchObject({ method: 'POST', credentials: 'same-origin', cache: 'no-store' });
        expect(body.candidate).toContain('"reviewer":{"name":"Reviewer","verification":"SELF_DECLARED"}');
        await act(async () => resolveFetch(receipt(body.expectedSha256, state.revision)));
        await waitFor(() => expect(saveStatus()!.textContent).toContain('Saved on the server and read back exactly'));
        expect(saveStatus()!.textContent).toContain(ID);
        expect(saveStatus()!.textContent).toContain('not a build approval');
    });
    it.each([
        ['mismatched digest', () => receipt('b'.repeat(64), 1), 'Save is unconfirmed'],
        ['wrong revision', (sha: string) => receipt(sha, 99), 'Save is unconfirmed'],
        ['missing readback state', (sha: string) => receipt(sha, 1, { state: 'PENDING' }), 'Save is unconfirmed'],
        ['scope that grants authority', (sha: string) => receipt(sha, 1, { scope: 'BUILD_APPROVED' }), 'Save is unconfirmed'],
        ['unconfirmed server error', () => json(500, { ok: false, error: 'STORE_COMMIT_UNCONFIRMED' }), 'Save is unconfirmed'],
        ['unconfigured store', () => json(503, { ok: false, error: 'STORE_UNAVAILABLE' }), 'Server saving is not available here'],
        ['expired session', () => json(401, { ok: false }), 'Sign in again to save'],
        ['refused file', () => json(422, { ok: false }), 'The server refused this file'],
        ['malformed body', () => new Response('<html>', { status: 201 }), 'Save is unconfirmed'],
    ])('reports %s truthfully', async (_name, make, expected) => {
        const state = reviewed();
        render(<IntentSpecConfirmation review={state} language="en" />); open(); await create();
        fetcher.mockImplementation(async (_url: string, init: { body: string }) => (make as (sha: string) => Response)(JSON.parse(init.body).expectedSha256));
        fireEvent.click(saveButton());
        await waitFor(() => expect(saveStatus()!.textContent).toContain(expected));
        expect(saveStatus()!.textContent).not.toContain('Saved on the server');
    });
    it('treats a network failure as unconfirmed rather than failed or saved', async () => {
        fetcher.mockRejectedValue(new TypeError('network'));
        render(<IntentSpecConfirmation review={reviewed()} language="en" />); open(); await create();
        fireEvent.click(saveButton());
        await waitFor(() => expect(saveStatus()!.textContent).toContain('may or may not hold this content'));
    });
    it('cannot carry a save receipt across a reviewer edit (including ABA) or a language change', async () => {
        const state = reviewed();
        let resolveFetch!: (value: Response) => void;
        fetcher.mockImplementation(() => new Promise(resolve => { resolveFetch = resolve; }));
        const { rerender } = render(<IntentSpecConfirmation review={state} language="en" />); open(); await create();
        fireEvent.click(saveButton());
        const sha = sentDigest();
        fireEvent.change(screen.getByLabelText('Reviewer name (self-declared)'), { target: { value: 'Other' } });
        fireEvent.change(screen.getByLabelText('Reviewer name (self-declared)'), { target: { value: 'Reviewer' } });
        await act(async () => resolveFetch(receipt(sha, state.revision)));
        expect(saveStatus()).toBeNull();
        expect(screen.queryByText(/Saved on the server/)).toBeNull();
        rerender(<IntentSpecConfirmation review={state} language="vi" />);
        expect(screen.queryByText(/Saved on the server/)).toBeNull();
    });
    it('does not let a save receipt mark a changed revision as saved', async () => {
        const state = reviewed();
        let resolveFetch!: (value: Response) => void;
        fetcher.mockImplementation(() => new Promise(resolve => { resolveFetch = resolve; }));
        const { rerender } = render(<IntentSpecConfirmation review={state} language="en" />); open(); await create();
        fireEvent.click(saveButton());
        const sha = sentDigest();
        rerender(<IntentSpecConfirmation review={updateReviewDecision(state, 'data', { answer: 'Changed' })} language="en" />);
        await act(async () => resolveFetch(receipt(sha, state.revision)));
        expect(saveStatus()).toBeNull();
        expect(screen.queryByRole('button', { name: 'Save confirmed content to server' })).toBeNull();
    });
    it('keeps download, file equality and server save as separate facts', async () => {
        const state = reviewed();
        fetcher.mockImplementation(async (_url: string, init: { body: string }) => receipt(JSON.parse(init.body).expectedSha256, state.revision));
        render(<IntentSpecConfirmation review={state} language="en" />); open(); await create();
        fireEvent.click(saveButton());
        await waitFor(() => expect(saveStatus()!.textContent).toContain('Saved on the server'));
        expect(screen.queryByText(/Download requested|matches this exact/)).toBeNull();
        expect((screen.getByLabelText('Saved review ID') as HTMLInputElement).value).toBe(ID);
    });
});

describe('read-only reopen by saved ID', () => {
    it('shows the saved copy read-only without importing it into the current review', async () => {
        fetcher.mockResolvedValue(record());
        render(<IntentSpecConfirmation review={reviewed()} language="en" />); open();
        openSaved();
        const view = await screen.findByRole('region', { name: 'Saved review (read-only)' });
        expect(view.textContent).toContain('SAVED DRAFT CONTENT');
        expect(view.textContent).toContain('Saved Reviewer');
        expect(view.textContent).toContain('does not mark it viewed');
        expect(view.textContent).toContain('the six decisions still need confirming');
        expect(view.querySelector('input, textarea, button, select')).toBeNull();
        expect(fetcher.mock.calls[0][0]).toBe(`/api/intent-spec/reviews/${ID}`);
        expect(fetcher.mock.calls[0][1]).toMatchObject({ method: 'GET', credentials: 'same-origin', cache: 'no-store' });
        // The current review is untouched and still needs its own candidate.
        expect(screen.queryByRole('button', { name: 'Download review file' })).toBeNull();
    });
    it.each([
        [404, 'No saved review with this ID for your account'], [401, 'Sign in again to open a saved review'],
        [503, 'Server saving is not available here'], [500, 'Could not open the saved review'],
    ])('reports reopen status %s', async (status, expected) => {
        fetcher.mockResolvedValue(json(status, { ok: false }));
        render(<IntentSpecConfirmation review={reviewed()} language="en" />); open();
        openSaved();
        await waitFor(() => expect(screen.getByRole('status').textContent).toContain(expected));
        expect(screen.queryByRole('region', { name: 'Saved review (read-only)' })).toBeNull();
    });
    it('refuses a response for another ID, an authority-granting claim, and never fetches a malformed ID', async () => {
        render(<IntentSpecConfirmation review={reviewed()} language="en" />); open();
        fetcher.mockResolvedValue(record({ id: 'c'.repeat(64) }));
        openSaved();
        await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Could not open the saved review'));
        fetcher.mockResolvedValue(record({ claimBoundary: 'BUILD_APPROVED' }));
        fireEvent.click(screen.getByRole('button', { name: 'Open saved copy (read-only)' }));
        await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Could not open the saved review'));
        expect(screen.queryByRole('region', { name: 'Saved review (read-only)' })).toBeNull();
        fetcher.mockClear();
        openSaved('not-an-id');
        await waitFor(() => expect(screen.getByRole('status').textContent).toContain('No saved review with this ID'));
        expect(fetcher).not.toHaveBeenCalled();
    });
    it('discards a reopen response that arrives after the review changed', async () => {
        const state = reviewed();
        let resolveFetch!: (value: Response) => void;
        fetcher.mockImplementation(() => new Promise(resolve => { resolveFetch = resolve; }));
        const { rerender } = render(<IntentSpecConfirmation review={state} language="en" />); open();
        openSaved();
        rerender(<IntentSpecConfirmation review={updateReviewDecision(state, 'data', { answer: 'Changed' })} language="en" />);
        await act(async () => resolveFetch(record()));
        expect(screen.queryByRole('region', { name: 'Saved review (read-only)' })).toBeNull();
    });
    it('matches the Vietnamese labels and keeps controls reachable by accessible name', async () => {
        fetcher.mockResolvedValue(record({ language: 'vi' }));
        render(<IntentSpecConfirmation review={reviewed()} language="vi" />);
        fireEvent.click(screen.getByRole('button', { name: 'Lưu bản review để đối chiếu' }));
        fireEvent.change(screen.getByLabelText('Mã bản review đã lưu'), { target: { value: ID } });
        fireEvent.click(screen.getByRole('button', { name: 'Mở bản đã lưu (chỉ đọc)' }));
        const view = await screen.findByRole('region', { name: 'Bản đã lưu (chỉ đọc)' });
        expect(view.textContent).toContain('không cấp quyền build');
        expect(screen.getByLabelText('Nội dung đã lưu')).toBeDefined();
    });
});

describe('authenticated session lifecycle binding', () => {
    const setSession = (next: typeof SESSION_A | { status: string; data: null }) => { auth.session = next as typeof SESSION_A; };
    const view = (state: ReturnType<typeof reviewed>) => <IntentSpecConfirmation review={state} language="en" />;

    it('drops a late save receipt after A->B and after A->B->A, and clears the displayed result', async () => {
        const state = reviewed();
        let resolveFetch!: (value: Response) => void;
        fetcher.mockImplementation(() => new Promise(resolve => { resolveFetch = resolve; }));
        const { rerender } = render(view(state)); open(); await create();
        fireEvent.click(saveButton());
        const sha = sentDigest();
        setSession(SESSION_B); rerender(view(state));
        setSession(SESSION_A); rerender(view(state));
        await act(async () => resolveFetch(receipt(sha, state.revision)));
        expect(saveStatus()).toBeNull();
        expect(screen.queryByText(/Saved on the server/)).toBeNull();
        expect(screen.queryByRole('button', { name: 'Save confirmed content to server' })).toBeNull();
        expect((screen.getByLabelText('Saved review ID') as HTMLInputElement).value).toBe('');
    });
    it('drops a late reopen record after an A->B->A session change', async () => {
        const state = reviewed();
        let resolveFetch!: (value: Response) => void;
        fetcher.mockImplementation(() => new Promise(resolve => { resolveFetch = resolve; }));
        const { rerender } = render(view(state)); open();
        openSaved();
        setSession(SESSION_B); rerender(view(state));
        setSession(SESSION_A); rerender(view(state));
        await act(async () => resolveFetch(record()));
        expect(screen.queryByRole('region', { name: 'Saved review (read-only)' })).toBeNull();
    });
    it('clears a displayed save result and saved ID when the session changes, and does not restore them', async () => {
        const state = reviewed();
        fetcher.mockImplementation(async (_url: string, init: { body: string }) => receipt(JSON.parse(init.body).expectedSha256, state.revision));
        const { rerender } = render(view(state)); open(); await create();
        fireEvent.click(saveButton());
        await waitFor(() => expect(saveStatus()!.textContent).toContain('Saved on the server'));
        setSession(SESSION_B); rerender(view(state));
        expect(saveStatus()).toBeNull();
        expect((screen.getByLabelText('Saved review ID') as HTMLInputElement).value).toBe('');
        setSession(SESSION_A); rerender(view(state));
        expect(saveStatus()).toBeNull();
        expect(screen.queryByText(/Saved on the server/)).toBeNull();
    });
    it.each([
        ['logout', { status: 'unauthenticated', data: null }, 'No active sign-in session'],
        ['loading', { status: 'loading', data: null }, 'Checking the sign-in session'],
    ])('drops a late receipt after %s and pauses save and reopen', async (_name, next, text) => {
        const state = reviewed();
        let resolveFetch!: (value: Response) => void;
        fetcher.mockImplementation(() => new Promise(resolve => { resolveFetch = resolve; }));
        const { rerender } = render(view(state)); open(); await create();
        fireEvent.click(saveButton());
        const sha = sentDigest();
        setSession(next); rerender(view(state));
        await act(async () => resolveFetch(receipt(sha, state.revision)));
        expect(screen.queryByText(/Saved on the server/)).toBeNull();
        expect(screen.getByRole('status', { name: 'Sign-in session status' }).textContent).toContain(text);
        fireEvent.change(screen.getByLabelText('Saved review ID'), { target: { value: ID } });
        expect((screen.getByRole('button', { name: 'Open saved copy (read-only)' }) as HTMLButtonElement).disabled).toBe(true);
        expect(fetcher).toHaveBeenCalledTimes(1);
    });
    it('treats an expired session as inactive and drops a receipt that was in flight', async () => {
        const state = reviewed();
        let resolveFetch!: (value: Response) => void;
        fetcher.mockImplementation(() => new Promise(resolve => { resolveFetch = resolve; }));
        const { rerender } = render(view(state)); open(); await create();
        fireEvent.click(saveButton());
        const sha = sentDigest();
        setSession({ ...SESSION_A, data: { ...SESSION_A.data, expires: new Date(Date.now() - 1000).toISOString() } });
        rerender(view(state));
        await act(async () => resolveFetch(receipt(sha, state.revision)));
        await waitFor(() => expect(screen.getByRole('status', { name: 'Sign-in session status' }).textContent).toContain('No active sign-in session'));
        expect(screen.queryByText(/Saved on the server/)).toBeNull();
        expect(screen.queryByRole('button', { name: 'Save confirmed content to server' })).toBeNull();
    });
});
