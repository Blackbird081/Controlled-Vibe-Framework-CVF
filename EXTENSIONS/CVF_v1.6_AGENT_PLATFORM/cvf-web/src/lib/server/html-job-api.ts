import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { BOUND_DISCLOSURE, BOUND_EFFECT, type BoundDisclosure } from '@/lib/artifacts-bound-receipt-contract';
import { SOURCE_ID, VERSION_ID, type DraftPrincipal } from '@/lib/html-draft-recovery-contract';
import { MAX_JOB_BODY_BYTES, parseAcceptVersion, parseCreateJob, parseLinkVersion, parseProductDecision } from '@/lib/html-job-contract';
import { HtmlDraftSnapshotStore } from './html-draft-snapshot-store';
import { normalPrincipal } from './html-draft-recovery-api';
import type { ResolvedHtmlJobProfile } from './html-job-synthetic-profile';
import { issuedProfileForDisclosure, type BoundReceiptFixtureProfile } from './bound-receipt-profile';
import { requireHtmlPilotOwner, htmlPilotSameOwner } from './ncr-html-pilot-auth';
import type { HtmlPilotRuntimeProfile } from './ncr-html-pilot-runtime-profile';
import { verifyHtmlPilotSource } from './html-execution-evidence';

const reply = (status: number, body: Record<string, unknown>) => NextResponse.json(body, {
  status, headers: { 'Cache-Control': 'no-store', Pragma: 'no-cache', 'X-Content-Type-Options': 'nosniff', Vary: 'Cookie, Origin' },
});
const fail = (status: number, error: string) => reply(status, { success: false, error });
const sameOrigin = (request: Request) => {
  try { const origin = request.headers.get('origin'); const site = request.headers.get('sec-fetch-site');
    return !!origin && origin === new URL(request.url).origin && (!site || site === 'same-origin'); }
  catch { return false; }
};
const object = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const scoped = (source: string, prefix: string) => SOURCE_ID.test(source) && source.startsWith(prefix);
/** `bound` is an explicitly injected nonsecret disclosure. It is never read from a query, body, header or the environment. */
type Dependencies = { profile?: ResolvedHtmlJobProfile | null; auth?: typeof requireAdminApiSession; clock?: () => number;
  bound?: BoundDisclosure | null; boundProfile?: BoundReceiptFixtureProfile | null; pilot?: HtmlPilotRuntimeProfile | null };

export function jobRouteHandlers(deps: Dependencies = {}) {
  const clock = deps.clock ?? Date.now;
  const auth = deps.auth ?? requireAdminApiSession;
  const profile = deps.pilot ? { profile: deps.pilot.store, recordPrefix: '', jobDecisions: true as const }
    : deps.profile?.jobDecisions === true ? deps.profile : null;
  const store = profile ? new HtmlDraftSnapshotStore(profile.profile, clock) : null;
  // Snapshot once so a later mutation of the injected object cannot change what the capability response discloses.
  const issued = issuedProfileForDisclosure(deps.bound);
  const bound: BoundDisclosure | null = issued && issued === deps.boundProfile && profile?.profile.root === issued.store.root
    && deps.bound?.effectBoundary === BOUND_EFFECT && deps.bound.mode === BOUND_DISCLOSURE
    ? JSON.parse(JSON.stringify(deps.bound)) as BoundDisclosure : null;
  async function principal(request: NextRequest): Promise<DraftPrincipal | NextResponse> {
    if (deps.pilot) {
      const selected = await requireHtmlPilotOwner(request, clock());
      return selected instanceof NextResponse || htmlPilotSameOwner(selected, deps.pilot.owner)
        ? selected : fail(403, 'PILOT_OWNER_REFUSED');
    }
    const session = await auth(request, '/api/artifacts/jobs', { allowBreakGlass: false });
    if (session instanceof NextResponse) {
      session.headers.set('Cache-Control', 'no-store'); session.headers.set('Pragma', 'no-cache');
      session.headers.set('Vary', 'Cookie, Origin'); return session;
    }
    return normalPrincipal(session, clock()) ?? fail(403, 'SESSION_REFUSED');
  }
  return {
    async POST(request: NextRequest): Promise<NextResponse> {
      if (!sameOrigin(request)) return fail(403, 'ORIGIN_REFUSED');
      const owner = await principal(request); if (owner instanceof NextResponse) return owner;
      if (!store || !profile) return fail(503, 'JOB_PROFILE_DISABLED');
      if (!(request.headers.get('content-type') ?? '').toLowerCase().startsWith('application/json')) return fail(415, 'JSON_REQUIRED');
      const declared = request.headers.get('content-length');
      if (declared && (!/^\d+$/.test(declared) || Number(declared) > MAX_JOB_BODY_BYTES)) return fail(413, 'BODY_TOO_LARGE');
      let body: unknown;
      try {
        const reader = request.body?.getReader(); if (!reader) return fail(422, 'INVALID_BODY');
        const chunks: Uint8Array[] = []; let total = 0;
        for (;;) { const { done, value } = await reader.read(); if (done) break;
          total += value.byteLength; if (total > MAX_JOB_BODY_BYTES) { await reader.cancel(); return fail(413, 'BODY_TOO_LARGE'); } chunks.push(value); }
        const bytes = new Uint8Array(total); let offset = 0;
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
        body = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
      } catch { return fail(422, 'INVALID_BODY'); }
      if (!object(body) || typeof body.action !== 'string') return fail(422, 'INVALID_ACTION');
      const { action, ...value } = body;
      if (action === 'CREATE_JOB') {
        const input = parseCreateJob(value); if (!input) return fail(422, 'INVALID_JOB');
        if (!scoped(input.sourceRecordId, profile.recordPrefix)) return fail(404, 'NOT_FOUND');
        if (deps.pilot && (!input.pilotSource || !(await verifyHtmlPilotSource({ receipt: input.pilotSource.receipt,
          output: input.request.sourceContent, owner, profile: deps.pilot, expectedJobId: null }))
          || input.pilotSource.receipt.htmlPilotEvidence?.rootRunId !== input.sourceRecordId)) return fail(403, 'PILOT_SOURCE_REFUSED');
        const outcome = await store.createJob(input, owner);
        if (outcome !== 'SAVED') return fail(outcome === 'COLLISION' ? 409 : 503, outcome === 'COLLISION' ? 'JOB_UNAVAILABLE' : 'WRITE_UNCONFIRMED');
        const job = await store.getJob(input.jobId, input.sourceRecordId, owner);
        return job ? reply(201, { success: true, data: job }) : fail(503, 'READBACK_UNCONFIRMED');
      }
      if (action === 'LINK_VERSION') {
        const input = parseLinkVersion(value); if (!input) return fail(422, 'INVALID_LINK');
        if (!scoped(input.sourceRecordId, profile.recordPrefix)) return fail(404, 'NOT_FOUND');
        if (deps.pilot) {
          const snapshot = await store.get(input.versionId, input.sourceRecordId, owner);
          const job = await store.getJob(input.jobId, input.sourceRecordId, owner);
          if (!snapshot?.pilotSource || !job?.pilotRootRunId || !(await verifyHtmlPilotSource({ receipt: snapshot.pilotSource.receipt,
            output: snapshot.request.sourceContent, owner, profile: deps.pilot,
            expectedJobId: snapshot.pilotSource.receipt.htmlPilotEvidence?.parentRunId ? input.jobId : null }))) return fail(403, 'PILOT_SOURCE_REFUSED');
        }
        const outcome = await store.linkVersion(input, owner);
        if (outcome !== 'SAVED') return fail(outcome === 'COLLISION' ? 409 : 503, outcome === 'COLLISION' ? 'VERSION_UNAVAILABLE' : 'WRITE_UNCONFIRMED');
        const link = await store.getVersion(input.jobId, input.sourceRecordId, input.versionId, owner);
        return link ? reply(201, { success: true, data: link }) : fail(503, 'READBACK_UNCONFIRMED');
      }
      if (action === 'ACCEPT_VERSION') {
        if (deps.pilot) return fail(403, 'PRODUCT_DISPOSITION_SEPARATE');
        const input = parseAcceptVersion(value); if (!input) return fail(422, 'INVALID_DECISION');
        if (!scoped(input.sourceRecordId, profile.recordPrefix)) return fail(404, 'NOT_FOUND');
        const outcome = await store.acceptVersion(input, owner);
        if (outcome !== 'SAVED') return fail(outcome === 'COLLISION' ? 409 : 503, outcome === 'COLLISION' ? 'DECISION_UNAVAILABLE' : 'WRITE_UNCONFIRMED');
        const decision = await store.getDecision(input.jobId, input.sourceRecordId, input.versionId, input.decisionId, owner);
        return decision ? reply(201, { success: true, data: decision }) : fail(503, 'READBACK_UNCONFIRMED');
      }
      if (action === 'DECIDE_PRODUCT_VERSION') {
        if (!deps.pilot) return fail(403, 'PRODUCT_PROFILE_REQUIRED');
        const input = parseProductDecision(value); if (!input) return fail(422, 'INVALID_PRODUCT_DECISION');
        const snapshot = await store.get(input.versionId, input.sourceRecordId, owner);
        if (!snapshot?.pilotSource || !(await verifyHtmlPilotSource({ receipt: snapshot.pilotSource.receipt,
          output: snapshot.request.sourceContent, owner, profile: deps.pilot }))) return fail(403, 'PILOT_SOURCE_REFUSED');
        const outcome = await store.decideProductVersion(input, owner);
        if (outcome !== 'SAVED') return fail(outcome === 'COLLISION' ? 409 : 503, 'PRODUCT_DECISION_UNCONFIRMED');
        const decision = await store.getProductDecision(input.jobId, input.sourceRecordId, input.versionId, owner);
        return decision ? reply(201, { success: true, data: decision }) : fail(503, 'READBACK_UNCONFIRMED');
      }
      return fail(422, 'INVALID_ACTION');
    },
    async GET(request: NextRequest): Promise<NextResponse> {
      const owner = await principal(request); if (owner instanceof NextResponse) return owner;
      if (!store || !profile) return fail(503, 'JOB_PROFILE_DISABLED');
      const q = new URL(request.url).searchParams;
      const kind = q.get('kind');
      if (kind === 'capabilities') return q.size === 1 && q.getAll('kind').length === 1
        ? reply(200, { success: true, data: deps.pilot ? { jobDecisions: true, effectBoundary: 'REAL_PROVIDER_FICTIONAL_CONTENT',
          productDisposition: 'PENDING_OPERATOR_ACCEPTANCE', profileDigest: deps.pilot.manifestSha256 }
          : bound ? { jobDecisions: true, effectBoundary: BOUND_EFFECT, boundDisclosure: bound }
            : { jobDecisions: true, effectBoundary: 'LOCAL_SYNTHETIC' } }) : fail(422, 'INVALID_QUERY');
      const source = q.get('sourceRecordId') ?? '';
      const jobId = q.get('jobId') ?? '';
      if (!['job', 'version', 'decision', 'product-decision'].includes(kind ?? '') || !scoped(source, profile.recordPrefix) || !VERSION_ID.test(jobId)
        || q.getAll('kind').length !== 1 || q.getAll('jobId').length !== 1 || q.getAll('sourceRecordId').length !== 1) return fail(422, 'INVALID_QUERY');
      if (kind === 'job') {
        if (q.size !== 3) return fail(422, 'INVALID_QUERY');
        const job = await store.getJob(jobId, source, owner);
        return job ? reply(200, { success: true, data: job }) : fail(404, 'NOT_FOUND');
      }
      const versionId = q.get('versionId') ?? '';
      if (!VERSION_ID.test(versionId) || q.getAll('versionId').length !== 1) return fail(422, 'INVALID_QUERY');
      if (kind === 'product-decision') {
        if (!deps.pilot || q.size !== 4) return fail(422, 'INVALID_QUERY');
        const snapshot = await store.get(versionId, source, owner);
        if (!snapshot?.pilotSource || !(await verifyHtmlPilotSource({ receipt: snapshot.pilotSource.receipt,
          output: snapshot.request.sourceContent, owner, profile: deps.pilot,
          expectedJobId: snapshot.pilotSource.receipt.htmlPilotEvidence?.parentRunId ? jobId : null }))) return fail(404, 'NOT_FOUND');
        const decision = await store.getProductDecision(jobId, source, versionId, owner);
        return decision ? reply(200, { success: true, data: decision }) : fail(404, 'NOT_FOUND');
      }
      if (kind === 'version') {
        if (q.size !== 4) return fail(422, 'INVALID_QUERY');
        const version = await store.getVersion(jobId, source, versionId, owner);
        if (deps.pilot && version) {
          const snapshot = await store.get(versionId, source, owner);
          if (!snapshot?.pilotSource || !(await verifyHtmlPilotSource({ receipt: snapshot.pilotSource.receipt,
            output: snapshot.request.sourceContent, owner, profile: deps.pilot,
            expectedJobId: snapshot.pilotSource.receipt.htmlPilotEvidence?.parentRunId ? jobId : null }))) return fail(404, 'NOT_FOUND');
        }
        return version ? reply(200, { success: true, data: version }) : fail(404, 'NOT_FOUND');
      }
      const decisionId = q.get('decisionId') ?? '';
      if (q.size !== 5 || q.getAll('decisionId').length !== 1 || !VERSION_ID.test(decisionId)) return fail(422, 'INVALID_QUERY');
      const decision = await store.getDecision(jobId, source, versionId, decisionId, owner);
      return decision ? reply(200, { success: true, data: decision }) : fail(404, 'NOT_FOUND');
    },
  };
}
