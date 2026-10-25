import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import type { ExecutionRequest } from '@/lib/ai';
import { verifySessionCookie, type SessionCookie } from '@/lib/middleware-auth';
import { htmlPilotNormalPrincipal, htmlPilotSameOwner } from '@/lib/server/ncr-html-pilot-auth';
import { loadHtmlPilotRuntimeProfile, htmlPilotGrantActive, publicHtmlPilotDisclosure, type HtmlPilotRuntimeProfile } from '@/lib/server/ncr-html-pilot-runtime-profile';
import { HtmlPilotOperationLedger, type HtmlPilotClaim } from '@/lib/server/ncr-html-pilot-operation-ledger';
import { htmlPilotRequestSha256, verifyHtmlPilotSource } from '@/lib/server/html-execution-evidence';
import { HtmlDraftSnapshotStore } from '@/lib/server/html-draft-snapshot-store';
import { loadHtmlPilotBuildContext, type HtmlPilotBuildContext } from '@/lib/server/ncr-html-pilot-build-authority';

const sha = (v: string) => createHash('sha256').update(v, 'utf8').digest('hex');
const ident = (v: unknown) => typeof v === 'string' && /^[A-Za-z0-9_-]{1,150}$/.test(v);
const run = (v: unknown) => typeof v === 'string' && /^[a-f0-9]{32}$/.test(v);
const hex = (v: unknown) => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const deny = (code: string, status = 403) => NextResponse.json({ success: false, error: code },
  { status, headers: { 'Cache-Control': 'no-store' } });

export interface HtmlPilotPrepared {
  profile: HtmlPilotRuntimeProfile;
  owner: { userId: string; orgId: string; teamId: string };
  mode: 'CREATE' | 'REVISION';
  operationKey: string;
  requestSha256: string;
  parentRunId: string | null;
  rootRunId: string | null;
  parentOutputSha256: string | null;
  htmlJobId: string | null;
  ledger: HtmlPilotOperationLedger;
  build: HtmlPilotBuildContext;
}

/** This is the server-selected pilot binding, never a client profile flag. */
export async function prepareHtmlPilotExecution(
  body: Partial<ExecutionRequest>, session: SessionCookie | null, isServiceAllowed: boolean,
): Promise<HtmlPilotPrepared | NextResponse | null> {
  const profile = await loadHtmlPilotRuntimeProfile();
  if (!profile) return body.htmlPilotIntent ? deny('PILOT_PROFILE_UNAVAILABLE') : null;
  if (body.templateId !== 'web_build_handoff') return body.htmlPilotIntent ? deny('PILOT_TEMPLATE_REFUSED') : null;
  const owner = htmlPilotNormalPrincipal(session, Date.now());
  if (!owner || isServiceAllowed && !session || !htmlPilotSameOwner(owner, profile.owner)) return deny('PILOT_OWNER_REFUSED');
  if (body.provider && body.provider !== profile.provider || body.model && body.model !== profile.model) return deny('PILOT_PROVIDER_PIN_REFUSED');
  const hint = body.htmlPilotIntent;
  if (!hint || !ident(hint.operationKey) || !body.intent || !body.inputs || !Object.keys(body.inputs).length) return deny('PILOT_INTENT_REQUIRED', 400);
  const raw = body as Record<string, unknown>;
  if (['cvfPhase', 'cvfRiskLevel', 'skillPreflightPassed', 'skillPreflightDeclaration',
    'skillPreflightRecordRef', 'skillIds', 'fileScope', 'approvalId', 'targetFiles',
    'buildAuthority', 'riskApproval', 'approvalBinding', 'traceHash'].some(key => Object.hasOwn(raw, key))
    || body.mode && body.mode !== 'governance'
    || typeof raw.action !== 'string' || raw.action !== 'analyze template execution request') {
    return deny('PILOT_CLIENT_AUTHORITY_REFUSED', 400);
  }
  const contextSelectors: ReadonlyArray<keyof ExecutionRequest> = [
    'knowledgeContext', 'knowledgeCollectionId', 'aifMemoryReinjection', 'durableMemory',
    'durableMemoryWrite', 'imageUrl', 'imageBase64', 'mimeType', 'verticalIntegrationChain',
  ];
  if (contextSelectors.some(key => Object.hasOwn(body, key))) return deny('PILOT_CONTEXT_SELECTOR_REFUSED', 400);
  const intentSha = sha(body.intent);
  const mode = intentSha === profile.initialIntentSha256 ? 'CREATE'
    : intentSha === profile.revisionIntentSha256 ? 'REVISION' : null;
  if (!mode) return deny('PILOT_GOAL_PIN_REFUSED');
  if (mode === 'CREATE' && body.inputs.websiteGoal !== body.intent) return deny('PILOT_INPUT_GOAL_MISMATCH');
  // This narrow pilot sends only the pinned fictional goal; ambient template fields and previous output never enter the provider prompt.
  body.inputs = { websiteGoal: body.intent };
  const ledger = new HtmlPilotOperationLedger(profile.operationRoot);
  let parentRunId: string | null = null;
  let rootRunId: string | null = null;
  let parentOutputSha256: string | null = null;
  let htmlJobId: string | null = null;
  if (mode === 'CREATE') {
    if (hint.parentRunId || hint.rootRunId || hint.parentOutputSha256 || hint.htmlJobId || hint.parentReceipt || hint.parentOutput) return deny('PILOT_CREATE_LINEAGE_REFUSED', 400);
  } else {
    if (!run(hint.parentRunId) || !run(hint.rootRunId) || !hex(hint.parentOutputSha256) || !ident(hint.htmlJobId)
      || !hint.parentReceipt || typeof hint.parentOutput !== 'string') return deny('PILOT_PARENT_REQUIRED', 400);
    parentRunId = hint.parentRunId!;
    rootRunId = hint.rootRunId!;
    parentOutputSha256 = hint.parentOutputSha256!;
    htmlJobId = hint.htmlJobId!;
    const parent = await ledger.readOutcome(parentRunId, owner);
    if (!parent || parent.rootRunId !== rootRunId || parent.outputSha256 !== parentOutputSha256) return deny('PILOT_PARENT_REFUSED');
    const signedParent = await verifyHtmlPilotSource({ receipt: hint.parentReceipt, output: hint.parentOutput,
      owner, profile, expectedJobId: null });
    if (!signedParent || signedParent.runId !== parentRunId || signedParent.rootRunId !== rootRunId
      || signedParent.outputSha256 !== parentOutputSha256 || signedParent.parentRunId !== null
      || signedParent.htmlJobId !== null || signedParent.rootRunId !== signedParent.runId) return deny('PILOT_SIGNED_PARENT_REFUSED');
    const job = await new HtmlDraftSnapshotStore(profile.store).getJob(htmlJobId, rootRunId, owner);
    if (!job) return deny('PILOT_JOB_REFUSED');
  }
  if (!(await htmlPilotGrantActive(profile))) return deny('PILOT_GRANT_UNAVAILABLE');
  const build = await loadHtmlPilotBuildContext({ profile, owner, operationKey: hint.operationKey, kind: mode });
  if (!build) return deny('PILOT_BUILD_AUTHORITY_UNAVAILABLE');
  body.cvfPhase = 'BUILD';
  body.cvfRiskLevel = 'R2';
  body.mode = 'governance';
  body.skillPreflightPassed = true;
  body.skillPreflightDeclaration = build.skillPreflight.declaration;
  body.skillPreflightRecordRef = build.skillPreflight.recordRef;
  body.skillIds = build.skillPreflight.skillIds;
  body.fileScope = build.fileScope;
  body.provider = profile.provider;
  body.model = profile.model;
  const requestSha256 = htmlPilotRequestSha256({ owner, templateId: body.templateId, templateName: body.templateName,
    inputs: body.inputs, intent: body.intent, provider: profile.provider, model: profile.model,
    mode, parentRunId, rootRunId, parentOutputSha256, htmlJobId, profileDigest: profile.manifestSha256 });
  return { profile, owner, mode, operationKey: hint.operationKey, requestSha256, parentRunId,
    rootRunId, parentOutputSha256, htmlJobId, ledger, build };
}

export { pilotAmbientContextPresent, measurePilotProvider } from '@/lib/server/html-execution-evidence';

export async function claimHtmlPilotExecution(prepared: HtmlPilotPrepared): Promise<{ prepared: HtmlPilotPrepared; claim: HtmlPilotClaim } | NextResponse> {
  // Re-read the local grant immediately before provider admission; earlier UI disclosure never grants an effect.
  if (!(await htmlPilotGrantActive(prepared.profile))) return deny('PILOT_GRANT_UNAVAILABLE');
  const result = await prepared.ledger.claim({ operationKey: prepared.operationKey, owner: prepared.owner,
    requestSha256: prepared.requestSha256, parentRunId: prepared.parentRunId, rootRunId: prepared.rootRunId });
  return result.kind === 'CLAIMED' ? { prepared, claim: result.claim } : deny(result.kind === 'EXISTING_OR_UNKNOWN'
    ? 'PILOT_OPERATION_UNKNOWN_NO_RESEND' : 'PILOT_OPERATION_ADMISSION_UNAVAILABLE', 409);
}

/** Authenticated, nonsecret disclosure only; it neither starts a provider call nor grants one. */
export async function htmlPilotDisclosureGet(request: NextRequest) {
    const session = await verifySessionCookie(request);
    const profile = await loadHtmlPilotRuntimeProfile();
    if (!session || !profile || session.userId !== profile.owner.userId || session.orgId !== profile.owner.orgId
        || session.teamId !== profile.owner.teamId || session.realUserId || session.realRole || session.impersonation) {
        return NextResponse.json({ success: false, error: 'PILOT_DISCLOSURE_UNAVAILABLE' }, { status: 403, headers: { 'Cache-Control': 'no-store' } });
    }
    return NextResponse.json({ success: true, disclosure: publicHtmlPilotDisclosure(profile) }, { headers: { 'Cache-Control': 'no-store' } });
}

