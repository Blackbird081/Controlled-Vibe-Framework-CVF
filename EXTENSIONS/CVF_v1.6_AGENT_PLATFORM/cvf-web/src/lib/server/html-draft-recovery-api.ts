import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminApiSession, type AdminSession } from '@/lib/admin-session';
import { parseDraftInput, SOURCE_ID, VERSION_ID, type DraftPrincipal } from '@/lib/html-draft-recovery-contract';
import { HtmlDraftSnapshotStore, type SyntheticDraftProfile } from './html-draft-snapshot-store';
import { requireHtmlPilotOwner, htmlPilotSameOwner } from './ncr-html-pilot-auth';
import type { HtmlPilotRuntimeProfile } from './ncr-html-pilot-runtime-profile';
import { verifyHtmlPilotSource } from './html-execution-evidence';

const reply = (status: number, body: Record<string, unknown>) => NextResponse.json(body, {
  status, headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff', Vary: 'Cookie, Origin' },
});
const fail = (status: number, error: string) => reply(status, { success: false, error });
const sameOrigin = (request: Request) => {
  try {
    const origin = request.headers.get('origin');
    const site = request.headers.get('sec-fetch-site');
    return !!origin && origin === new URL(request.url).origin && (!site || site === 'same-origin');
  } catch { return false; }
};
export function normalPrincipal(session: AdminSession, now: number): DraftPrincipal | null {
  if (session.authMode !== 'session' || session.realUserId || session.realRole || session.impersonation
    || !Number.isFinite(session.expiresAt) || session.expiresAt <= now) return null;
  const fields = [session.userId, session.orgId, session.teamId];
  if (!fields.every(value => typeof value === 'string' && /^[A-Za-z0-9_-]{1,150}$/.test(value))) return null;
  return { userId: session.userId, orgId: session.orgId, teamId: session.teamId };
}
type Dependencies = {
  profile?: SyntheticDraftProfile;
  recordPrefix?: string;
  auth?: typeof requireAdminApiSession;
  clock?: () => number;
  pilot?: HtmlPilotRuntimeProfile | null;
};
// Explicit injection is the only enabling path. Deployed route exports below remain disabled.
export function draftRouteHandlers(deps: Dependencies = {}) {
  const clock = deps.clock ?? Date.now;
  const auth = deps.auth ?? requireAdminApiSession;
  const store = deps.pilot ? new HtmlDraftSnapshotStore(deps.pilot.store, clock)
    : deps.profile ? new HtmlDraftSnapshotStore(deps.profile, clock) : null;
  async function principal(request: NextRequest): Promise<DraftPrincipal | NextResponse> {
    if (deps.pilot) {
      const selected = await requireHtmlPilotOwner(request, clock());
      return selected instanceof NextResponse || htmlPilotSameOwner(selected, deps.pilot.owner)
        ? selected : fail(403, 'PILOT_OWNER_REFUSED');
    }
    const session = await auth(request, '/api/artifacts/drafts', { allowBreakGlass: false });
    if (session instanceof NextResponse) {
      session.headers.set('Cache-Control', 'no-store');
      session.headers.set('Pragma', 'no-cache');
      session.headers.set('Vary', 'Cookie, Origin');
      return session;
    }
    return normalPrincipal(session, clock()) ?? fail(403, 'SESSION_REFUSED');
  }
  return {
    async POST(request: NextRequest): Promise<NextResponse> {
      if (!sameOrigin(request)) return fail(403, 'ORIGIN_REFUSED');
      const owner = await principal(request);
      if (owner instanceof NextResponse) return owner;
      if (!store) return fail(503, 'DRAFT_PROFILE_DISABLED');
      if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return fail(415, 'JSON_REQUIRED');
      const declared = request.headers.get('content-length');
      if (declared && (!/^\d+$/.test(declared) || Number(declared) > 280_000)) return fail(413, 'BODY_TOO_LARGE');
      let body: unknown;
      try {
        const reader = request.body?.getReader();
        if (!reader) return fail(400, 'INVALID_BODY');
        const chunks: Uint8Array[] = []; let total = 0;
        for (;;) {
          const { done, value } = await reader.read(); if (done) break;
          total += value.byteLength; if (total > 280_000) { await reader.cancel(); return fail(413, 'BODY_TOO_LARGE'); }
          chunks.push(value);
        }
        const bytes = new Uint8Array(total); let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
        body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      } catch { return fail(400, 'INVALID_BODY'); }
      const input = parseDraftInput(body);
      if (!input) return fail(422, 'INVALID_DRAFT');
      if (deps.pilot && (!input.pilotSource || !(await verifyHtmlPilotSource({ receipt: input.pilotSource.receipt,
        output: input.request.sourceContent, owner, profile: deps.pilot,
        expectedJobId: input.pilotSource.receipt.htmlPilotEvidence?.parentRunId
          ? input.pilotSource.receipt.htmlPilotEvidence.htmlJobId : null }))
        || input.pilotSource.receipt.htmlPilotEvidence?.rootRunId !== input.sourceRecordId)) return fail(403, 'PILOT_SOURCE_REFUSED');
      if (deps.recordPrefix && !input.sourceRecordId.startsWith(deps.recordPrefix)) return fail(404, 'NOT_FOUND');
      const outcome = await store.save(input, owner);
      if (outcome === 'SAVED') return reply(201, { success: true, state: 'SAVED', versionId: input.versionId });
      return fail(outcome === 'COLLISION' ? 409 : 503, outcome === 'COLLISION' ? 'VERSION_UNAVAILABLE' : 'SAVE_UNCONFIRMED');
    },
    async GET(request: NextRequest): Promise<NextResponse> {
      const owner = await principal(request);
      if (owner instanceof NextResponse) return owner;
      if (!store) return fail(503, 'DRAFT_PROFILE_DISABLED');
      const query = new URL(request.url).searchParams;
      if (query.size !== 2 || query.getAll('sourceRecordId').length !== 1 || !SOURCE_ID.test(query.get('sourceRecordId') ?? '')) return fail(400, 'INVALID_QUERY');
      const sourceRecordId = query.get('sourceRecordId')!;
      if (deps.recordPrefix && !sourceRecordId.startsWith(deps.recordPrefix)) return fail(404, 'NOT_FOUND');
      if (query.has('id')) {
        if (query.getAll('id').length !== 1 || !VERSION_ID.test(query.get('id') ?? '')) return fail(404, 'NOT_FOUND');
        const snapshot = await store.get(query.get('id')!, sourceRecordId, owner);
        if (deps.pilot && snapshot && (!snapshot.pilotSource || !(await verifyHtmlPilotSource({ receipt: snapshot.pilotSource.receipt,
          output: snapshot.request.sourceContent, owner, profile: deps.pilot })))) return fail(404, 'NOT_FOUND');
        return snapshot ? reply(200, { success: true, data: snapshot }) : fail(404, 'NOT_FOUND');
      }
      if (!query.has('list') || query.get('list') !== '1') return fail(400, 'INVALID_QUERY');
      const rows = await store.list(sourceRecordId, owner);
      if (!deps.pilot) return reply(200, { success: true, data: rows });
      const verified = [];
      for (const row of rows) {
        const snapshot = await store.get(row.versionId, sourceRecordId, owner);
        if (snapshot?.pilotSource && await verifyHtmlPilotSource({ receipt: snapshot.pilotSource.receipt,
          output: snapshot.request.sourceContent, owner, profile: deps.pilot })) verified.push(row);
      }
      return reply(200, { success: true, data: verified });
    },
  };
}

