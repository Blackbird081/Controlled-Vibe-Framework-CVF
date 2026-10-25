// Text Encoding Exception: the locked fictional Vietnamese title, headings and CTA must retain their exact Unicode bytes.
import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import { canonicalizeReceiptForIntegrity, verifySignedReceiptIntegrity } from '@/lib/receipt-integrity-anchor';
import { renderLockedHtmlPilotSource, HTML_PILOT_CREATE_TITLE, HTML_PILOT_REVISION_TITLE } from '@/lib/html-cta-rendering';
import { CVF_SYSTEM_PROMPT } from '@/lib/ai/types';
import { HtmlPilotOperationLedger } from './ncr-html-pilot-operation-ledger';
import type { HtmlPilotRuntimeProfile } from './ncr-html-pilot-runtime-profile';

/** Ambient memory and retrieval may be configured independently of the user payload. */
export function pilotAmbientContextPresent(input: {
  knowledgeInjected: boolean; finalKnowledgeContext?: string | null;
  durableMemoryPromptBlock?: string | null; aifMemoryPromptBlock?: string | null;
}): boolean {
  return input.knowledgeInjected || !!input.finalKnowledgeContext?.trim()
    || !!input.durableMemoryPromptBlock?.trim() || !!input.aifMemoryPromptBlock?.trim();
}

/** Includes the fully awaited provider response parse, not only response headers. */
export async function measurePilotProvider<T>(invoke: () => Promise<T>, record: (elapsedMs: number) => void): Promise<T> {
  const started = performance.now();
  try { return await invoke(); }
  finally { record(Math.max(0, performance.now() - started)); }
}

export interface HtmlExecutionEvidence {
  schema: 'cvf.ncrHtmlExecutionEvidence.v1';
  owner: { userId: string; orgId: string; teamId: string };
  operationKey: string;
  requestSha256: string;
  runId: string;
  rootRunId: string;
  parentRunId: string | null;
  parentOutputSha256: string | null;
  htmlJobId: string | null;
  receiptId: string;
  receiptSha256: string;
  outputSha256: string;
  templateId: 'web_build_handoff';
  outcomeId: 'build_landing_page';
  provider: string;
  model: string;
  profileDigest: string;
  issuedAt: string;
  hmacSha256: string;
}
type Unsigned = Omit<HtmlExecutionEvidence, 'hmacSha256'>;
const hash = (value: string) => createHash('sha256').update(value, 'utf8').digest('hex');
const hmac = (secret: string, value: string) => createHmac('sha256', secret).update(value, 'utf8').digest('hex');
const stable = (value: unknown): string => JSON.stringify(value, (_key, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.entries(v).sort(([a], [b]) => a.localeCompare(b))) : v);
const hex = (value: unknown): value is string => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const ident = (value: unknown): value is string => typeof value === 'string' && /^[A-Za-z0-9_-]{1,150}$/.test(value);
const equalsHex = (a: string, b: string) => hex(a) && hex(b) && timingSafeEqual(Buffer.from(a, 'hex'), Buffer.from(b, 'hex'));

/** Fixed server-owned grammar for the two already-pinned fictional goals. */
export function htmlPilotSystemPrompt(parentRunId: string | null): string {
  const title = parentRunId === null ? HTML_PILOT_CREATE_TITLE : HTML_PILOT_REVISION_TITLE;
  return `${CVF_SYSTEM_PROMPT}\n\nFor this fictional Vietnamese page, return only plain Markdown source. `
    + `The first line must be exactly "# ${title}". Then use exactly these headings in order: `
    + `"## Giới thiệu", "## Hoạt động", "## Liên hệ". Put at least one short Vietnamese sentence under each heading. `
    + `The final line must be exactly "CTA: Đăng ký tham gia -> Liên hệ". `
    + `Keep the complete response within 180 Vietnamese words. Do not add a code fence, raw HTML, other headings, `
    + `links, email addresses, external assets, extra CTA lines or explanatory text.`;
}

export function htmlPilotRequestSha256(value: unknown): string { return hash(stable(value)); }
export function htmlPilotOutputSha256(output: string): string { return hash(output); }

/** Bind the exact signed governance receipt and final provider output in a second pilot-only HMAC. */
export function issueHtmlExecutionEvidence(input: {
  owner: Unsigned['owner']; operationKey: string; requestSha256: string; runId: string; rootRunId: string;
  parentRunId: string | null; parentOutputSha256: string | null; htmlJobId: string | null;
  receipt: GovernanceEvidenceReceipt; output: string; provider: string; model: string; profileDigest: string;
  secret: string; issuedAt?: string;
}): HtmlExecutionEvidence | null {
  if (!input.secret || input.secret.length < 16 || !ident(input.operationKey) || !ident(input.runId)
    || !ident(input.rootRunId) || (input.parentRunId !== null && !ident(input.parentRunId))
    || (input.htmlJobId !== null && !ident(input.htmlJobId)) || !hex(input.requestSha256)
    || (input.parentOutputSha256 !== null && !hex(input.parentOutputSha256)) || !hex(input.profileDigest)
    || ![input.owner.userId, input.owner.orgId, input.owner.teamId].every(ident)
    || input.receipt.evidenceMode !== 'live' || input.receipt.routeId !== '/api/execute'
    || input.receipt.receiptIntegrity?.signatureStatus !== 'SIGNED' || !input.receipt.receiptIntegrity.signatureDigest
    || !renderLockedHtmlPilotSource(input.output, input.parentRunId)) return null;
  const receiptBase = { ...input.receipt };
  delete receiptBase.receiptIntegrity;
  delete receiptBase.htmlPilotEvidence;
  const canonicalReceipt = canonicalizeReceiptForIntegrity(receiptBase);
  if (!verifySignedReceiptIntegrity(input.receipt, input.secret)) return null;
  const unsigned: Unsigned = {
    schema: 'cvf.ncrHtmlExecutionEvidence.v1', owner: input.owner, operationKey: input.operationKey,
    requestSha256: input.requestSha256, runId: input.runId, rootRunId: input.rootRunId,
    parentRunId: input.parentRunId, parentOutputSha256: input.parentOutputSha256, htmlJobId: input.htmlJobId,
    receiptId: input.receipt.receiptId, receiptSha256: hash(canonicalReceipt), outputSha256: hash(input.output),
    templateId: 'web_build_handoff', outcomeId: 'build_landing_page', provider: input.provider,
    model: input.model, profileDigest: input.profileDigest, issuedAt: input.issuedAt ?? new Date().toISOString(),
  };
  return { ...unsigned, hmacSha256: hmac(input.secret, stable(unsigned)) };
}

export function verifyHtmlExecutionEvidence(input: {
  evidence: unknown; receipt: GovernanceEvidenceReceipt; output: string; owner: Unsigned['owner']; secret: string;
  expectedProfileDigest: string;
}): input is typeof input & { evidence: HtmlExecutionEvidence } {
  const v = input.evidence as HtmlExecutionEvidence | null;
  if (!v || v.schema !== 'cvf.ncrHtmlExecutionEvidence.v1' || !hex(v.hmacSha256) || !input.secret
    || v.receiptId !== input.receipt.receiptId || v.outputSha256 !== hash(input.output)
    || v.profileDigest !== input.expectedProfileDigest || stable(v.owner) !== stable(input.owner)
    || v.templateId !== 'web_build_handoff' || v.outcomeId !== 'build_landing_page') return false;
  const { hmacSha256, ...unsigned } = v;
  if (!equalsHex(hmacSha256, hmac(input.secret, stable(unsigned)))) return false;
  const receiptBase = { ...input.receipt };
  delete receiptBase.receiptIntegrity;
  delete receiptBase.htmlPilotEvidence;
  const canonicalReceipt = canonicalizeReceiptForIntegrity(receiptBase);
  return v.receiptSha256 === hash(canonicalReceipt)
    && verifySignedReceiptIntegrity(input.receipt, input.secret);
}

/** A browser-carried receipt is only a selector. The signed bytes and the physical outcome must agree. */
export async function verifyHtmlPilotSource(input: {
  receipt: GovernanceEvidenceReceipt; output: string; owner: Unsigned['owner'];
  profile: HtmlPilotRuntimeProfile; expectedJobId?: string | null;
}): Promise<HtmlExecutionEvidence | null> {
  const secret = process.env.CVF_RECEIPT_HMAC_SECRET ?? process.env.CVF_AUDIT_SIGNING_KEY ?? '';
  const evidence = input.receipt?.htmlPilotEvidence;
  if (!evidence || !verifyHtmlExecutionEvidence({ evidence, receipt: input.receipt, output: input.output,
    owner: input.owner, secret, expectedProfileDigest: input.profile.manifestSha256 })) return null;
  if (evidence.provider !== input.profile.provider || evidence.model !== input.profile.model
    || (input.expectedJobId !== undefined && evidence.htmlJobId !== input.expectedJobId)) return null;
  if (!renderLockedHtmlPilotSource(input.output, evidence.parentRunId)) return null;
  const outcome = await new HtmlPilotOperationLedger(input.profile.operationRoot).readOutcome(evidence.runId, input.owner);
  return outcome && outcome.requestSha256 === evidence.requestSha256 && outcome.rootRunId === evidence.rootRunId
    && outcome.parentRunId === evidence.parentRunId && outcome.outputSha256 === evidence.outputSha256
    && outcome.evidenceSha256 === htmlPilotRequestSha256(evidence) ? evidence : null;
}
