/**
 * agent-handoff-spec.ts
 * =====================
 * English, agent-consumable handoff spec for a deliverable pack. A receiving
 * human or agent gets the goal, the original request (verbatim), acceptance
 * criteria with honest status, limits, evidence and remaining work, so it can
 * continue without the originating session.
 *
 * Status vocabulary is deliberately conservative: the spec never reports a
 * criterion as MET unless a mechanical check observed it, and never reports
 * the pack as accepted. Business accuracy always stays UNVERIFIED.
 */

import type { Execution } from '@/types';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';
import type { ContentConstraintCheck } from '@/lib/pack-content-constraints';
import { getTemplateName } from '@/lib/template-i18n';

export const AGENT_HANDOFF_SPEC_VERSION = 'cvf.agentHandoffSpec.v1' as const;

export type HandoffCriterionStatus = 'MET' | 'UNMET' | 'UNVERIFIED';

export type HandoffReadiness =
  | 'REWORK_REQUIRED'
  | 'READY_FOR_HUMAN_REVIEW';

export interface HandoffCriterion {
  id: string;
  criterion: string;
  status: HandoffCriterionStatus;
  evidence: string;
}

export interface HandoffRequestField {
  field: string;
  value: string;
}

export interface AgentHandoffSpec {
  contractVersion: typeof AGENT_HANDOFF_SPEC_VERSION;
  readiness: HandoffReadiness;
  goal: string;
  originalRequest: HandoffRequestField[];
  acceptanceCriteria: HandoffCriterion[];
  limits: string[];
  evidence: string[];
  remainingWork: string[];
  continuation: string[];
}

export interface AgentHandoffSpecInput {
  execution: Execution;
  packType: string;
  scopeBoundary: string;
  verificationStatus: 'PASS' | 'PASS_WITH_WARNINGS' | 'FAIL';
  failedBlockingChecks: string[];
  contentConstraints?: ContentConstraintCheck[];
  evidenceReceipt?: GovernanceEvidenceReceipt;
  recommendedNextActions: string[];
  generatedAt: string;
}

const NOT_REQUESTED = /^No (?:unambiguous )?recognized /;

function originalRequestFields(execution: Execution): HandoffRequestField[] {
  return Object.entries(execution.input ?? {})
    .filter(([key, value]) => !key.startsWith('_') && typeof value === 'string' && value.trim())
    .map(([field, value]) => ({ field, value: value.trim() }));
}

function constraintToCriterion(check: ContentConstraintCheck): HandoffCriterion | null {
  // Checks the user never asked for are not criteria; keep the spec about the request.
  if (check.status === 'NOT_CHECKED' && NOT_REQUESTED.test(check.detail)) return null;
  const status: HandoffCriterionStatus =
    check.status === 'PASS' ? 'MET' : check.status === 'FAIL' ? 'UNMET' : 'UNVERIFIED';
  return { id: check.id, criterion: check.label, status, evidence: check.detail };
}

export function buildAgentHandoffSpec(input: AgentHandoffSpecInput): AgentHandoffSpec {
  const { execution, evidenceReceipt } = input;
  const templateLabel = getTemplateName(execution.templateId, execution.templateName || execution.templateId, 'en');
  const subject = (execution.input?.subject ?? '').split(/[\r\n]/, 1)[0].trim().slice(0, 120);
  const hasOutput = Boolean((execution.output ?? '').trim());
  const receiptId = evidenceReceipt?.receiptId;

  const acceptanceCriteria: HandoffCriterion[] = [
    {
      id: 'main_output_present',
      criterion: 'A generated deliverable exists',
      status: hasOutput ? 'MET' : 'UNMET',
      evidence: hasOutput ? 'Main output is present in this pack.' : 'The pack has no generated output.',
    },
    ...(input.contentConstraints ?? [])
      .map(constraintToCriterion)
      .filter((item): item is HandoffCriterion => item !== null),
  ];
  if (!acceptanceCriteria.some(item => item.id === 'business_accuracy')) {
    acceptanceCriteria.push({
      id: 'business_accuracy',
      criterion: 'Content is accurate and fit for the original request',
      status: 'UNVERIFIED',
      evidence: 'Requires review by an accountable subject-matter owner.',
    });
  }

  const limits = [
    input.scopeBoundary,
    'Artifact verification is structural only; it is not content approval or proof of business accuracy.',
    'A human owner decides acceptance; this spec never records approval.',
    ...(receiptId ? [] : ['No governance receipt is attached; do not treat this pack as live governance proof.']),
  ];

  const evidence = [
    `Source execution: ${execution.id || 'UNKNOWN'}`,
    `Template: ${execution.templateId || 'UNKNOWN'} (${input.packType})`,
    `Generated at: ${input.generatedAt}`,
    `Governance decision: ${evidenceReceipt?.decision ?? 'UNKNOWN'}`,
    ...(evidenceReceipt?.provider ? [`Provider: ${evidenceReceipt.provider}${evidenceReceipt.model ? ` / ${evidenceReceipt.model}` : ''}`] : []),
    `Receipt: ${receiptId ?? 'none'}`,
    `Artifact verification: ${input.verificationStatus}`,
  ];

  const remainingWork = [
    ...input.failedBlockingChecks.map(label => `Fix blocking verification failure: ${label}.`),
    ...acceptanceCriteria
      .filter(item => item.status === 'UNMET' && item.id !== 'main_output_present')
      .map(item => `Rework the deliverable until "${item.criterion}" is met (${item.evidence}).`),
    ...acceptanceCriteria
      .filter(item => item.status === 'UNVERIFIED')
      .map(item => `Verify "${item.criterion}": ${item.evidence}`),
    ...(receiptId ? [] : ['Re-run through the governed live path to attach a receipt before any governance claim.']),
    ...input.recommendedNextActions,
  ];

  const rework = input.verificationStatus === 'FAIL' || acceptanceCriteria.some(item => item.status === 'UNMET');

  return {
    contractVersion: AGENT_HANDOFF_SPEC_VERSION,
    readiness: rework ? 'REWORK_REQUIRED' : 'READY_FOR_HUMAN_REVIEW',
    goal: `Deliver a ${templateLabel} output${subject ? ` for "${subject}"` : ''} that satisfies the original request below within the stated limits.`,
    originalRequest: originalRequestFields(execution),
    acceptanceCriteria,
    limits,
    evidence,
    remainingWork,
    continuation: [
      'Read the original request verbatim; it is the authority, not this summary.',
      rework
        ? 'Start with the REWORK items in Remaining Work, then re-check every UNMET criterion.'
        : 'Do not change the deliverable unless review finds a defect; route it to the human owner.',
      'Report any criterion you cannot verify as UNVERIFIED; never upgrade a status without new evidence.',
    ],
  };
}

function longestBacktickRun(text: string): number {
  return Math.max(0, ...[...text.matchAll(/`+/g)].map(match => match[0].length));
}

function quote(value: string): string {
  return value.split(/\r?\n/).map(line => `> ${line}`).join('\n');
}

/** Markdown section with canonical English headings plus a machine-readable copy. */
export function serializeAgentHandoffSpec(spec: AgentHandoffSpec): string {
  const json = JSON.stringify(spec, null, 2);
  const fence = '`'.repeat(Math.max(3, longestBacktickRun(json) + 1));
  const request = spec.originalRequest.length
    ? spec.originalRequest.map(item => `**${item.field}**\n\n${quote(item.value)}`).join('\n\n')
    : '- No original request fields were recorded.';
  return [
    '## Agent Handoff Spec',
    '',
    `- **Contract**: ${spec.contractVersion}`,
    `- **Readiness**: ${spec.readiness}`,
    '',
    '### Goal',
    '',
    spec.goal,
    '',
    '### Original Request (verbatim, source language preserved)',
    '',
    request,
    '',
    '### Acceptance Criteria',
    '',
    '| Criterion | Status | Evidence |',
    '|---|---|---|',
    ...spec.acceptanceCriteria.map(item =>
      `| ${item.criterion.replace(/\|/g, '\\|')} | ${item.status} | ${item.evidence.replace(/\|/g, '\\|')} |`),
    '',
    '### Limits',
    '',
    ...spec.limits.map(item => `- ${item}`),
    '',
    '### Evidence',
    '',
    ...spec.evidence.map(item => `- ${item}`),
    '',
    '### Remaining Work',
    '',
    ...spec.remainingWork.map((item, i) => `${i + 1}. ${item}`),
    '',
    '### Continuation Instructions',
    '',
    ...spec.continuation.map(item => `- ${item}`),
    '',
    '### Machine-Readable Spec',
    '',
    `${fence}json`,
    json,
    fence,
  ].join('\n');
}
