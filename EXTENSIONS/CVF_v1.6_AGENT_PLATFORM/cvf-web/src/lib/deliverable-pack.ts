/**
 * deliverable-pack.ts — W125-T1 CP1
 * ===================================
 * Typed deliverable pack contract and generator functions.
 * Packs combine main output, governance evidence, and next-step
 * handoff context into a single repeatable artifact.
 *
 * Pack families (4 total — locked by W125 taxonomy):
 *   app_planning        → development / product starters
 *   business_decision   → business / marketing / strategy starters
 *   review_findings     → security / research / review starters
 *   documentation_handoff → content / technical / doc starters
 */

import type { Execution, Category } from '@/types';
import type { GovernanceEvidenceReceipt } from '@/lib/ai';

// ── Types ────────────────────────────────────────────────────────────────────

export type PackType =
  | 'app_planning'
  | 'business_decision'
  | 'review_findings'
  | 'documentation_handoff';

export interface DeliverablePack {
  packType: PackType;
  headline: string;
  executiveSummary: string;
  mainOutput: string;
  governanceEvidence: PackGovernanceEvidence;
  scopeBoundary: string;
  recommendedNextActions: string[];
  handoffNotes: string;
  generatedAt: string;
  sourceExecutionId: string;
}

export interface PackGovernanceEvidence {
  decision: string;
  provider?: string;
  model?: string;
  policySnapshot?: string;
  receiptAvailable: boolean;
  rawReceipt?: GovernanceEvidenceReceipt;
}

// ── Category → pack type mapping (CP3 contract) ─────────────────────────────

const CATEGORY_PACK_MAP: Partial<Record<Category, PackType>> = {
  development: 'app_planning',
  product: 'app_planning',
  business: 'business_decision',
  marketing: 'business_decision',
  security: 'review_findings',
  research: 'review_findings',
  content: 'documentation_handoff',
  technical: 'documentation_handoff',
};

const TEMPLATE_PACK_MAP: Record<string, PackType> = {
  app_builder_wizard: 'app_planning',
  'app-planning': 'app_planning',
  business_strategy_wizard: 'business_decision',
  strategy_analysis: 'business_decision',
  market_analysis: 'business_decision',
  marketing_campaign_wizard: 'business_decision',
  security_assessment_wizard: 'review_findings',
  code_review_wizard: 'review_findings',
  review_analysis: 'review_findings',
  research_project_wizard: 'review_findings',
  documentation_wizard: 'documentation_handoff',
  documentation: 'documentation_handoff',
  content_strategy_wizard: 'documentation_handoff',
  system_design_wizard: 'app_planning',
  data_analysis_wizard: 'review_findings',
  product_design_wizard: 'app_planning',
};

/**
 * Infer pack type from execution template + category.
 * Template match takes priority over category match.
 * Falls back to 'documentation_handoff' if unrecognized.
 */
export function inferPackType(
  templateId: string,
  category?: Category
): PackType {
  const byTemplate = TEMPLATE_PACK_MAP[templateId];
  if (byTemplate) return byTemplate;
  if (category && CATEGORY_PACK_MAP[category]) {
    return CATEGORY_PACK_MAP[category]!;
  }
  return 'documentation_handoff';
}

// ── Pack shape templates (CP0 taxonomy shapes) ───────────────────────────────

const PACK_DEFAULTS: Record<
  PackType,
  {
    scopeBoundary: string;
    recommendedNextActions: string[];
    handoffNotes: string;
  }
> = {
  app_planning: {
    scopeBoundary:
      'This pack covers the planning and scoping phase only. It does not include implementation, testing, or deployment decisions.',
    recommendedNextActions: [
      'Review requirements with the engineering lead',
      'Break down the plan into sprint-sized tasks',
      'Identify technical dependencies and blockers',
      'Set acceptance criteria for the first build milestone',
      'Schedule a kickoff with the build team',
    ],
    handoffNotes:
      'This output was generated via a governed AI path. The plan is a starting point — the build team should validate technical feasibility before committing.',
  },
  business_decision: {
    scopeBoundary:
      'This pack covers the analysis and recommendation phase only. Final decisions remain with the leadership team.',
    recommendedNextActions: [
      'Review the recommendation with relevant stakeholders',
      'Identify any gaps or missing context that require further research',
      'Schedule a decision meeting with the appropriate authority',
      'Document the final decision and rationale',
    ],
    handoffNotes:
      'This analysis was generated via a governed AI path. Confidence level and known limitations are described in the main output. Human judgement is required before acting.',
  },
  review_findings: {
    scopeBoundary:
      'This pack covers the findings from the governed review run only. It does not constitute a full audit or legal opinion.',
    recommendedNextActions: [
      'Triage findings by severity (critical / major / minor)',
      'Assign owners for each finding requiring remediation',
      'Set remediation deadlines by severity tier',
      'Schedule a follow-up review after fixes are applied',
    ],
    handoffNotes:
      'Findings flagged here require human confirmation before any remediation is applied. Items marked for human judgement must not be auto-resolved.',
  },
  documentation_handoff: {
    scopeBoundary:
      'This pack covers the documentation scope defined in the run. It is a first draft — review and approval by subject-matter experts is expected.',
    recommendedNextActions: [
      'Review the draft with the designated subject-matter expert',
      'Fill gaps where specific technical details are required',
      'Apply any required style guide or formatting standards',
      'Approve and publish through the standard documentation workflow',
    ],
    handoffNotes:
      'This documentation was generated via a governed AI path. A human reviewer must confirm accuracy before publication.',
  },
};

// ── Generator ────────────────────────────────────────────────────────────────

function buildGovernanceEvidence(
  receipt?: GovernanceEvidenceReceipt
): PackGovernanceEvidence {
  if (!receipt) {
    return {
      decision: 'ALLOWED',
      receiptAvailable: false,
    };
  }
  return {
    decision: receipt.decision ?? 'ALLOWED',
    provider: receipt.provider,
    model: receipt.model,
    policySnapshot: receipt.policySnapshotId,
    receiptAvailable: true,
    rawReceipt: receipt,
  };
}

function buildHeadline(execution: Execution, packType: PackType): string {
  const templateLabel = execution.templateName ?? execution.templateId;
  switch (packType) {
    case 'app_planning':
      return `App Planning: ${execution.intent ?? templateLabel}`;
    case 'business_decision':
      return `Business Analysis: ${execution.intent ?? templateLabel}`;
    case 'review_findings':
      return `Review Findings: ${execution.intent ?? templateLabel}`;
    case 'documentation_handoff':
      return `Documentation: ${execution.intent ?? templateLabel}`;
  }
}

function buildExecutiveSummary(
  execution: Execution,
  packType: PackType
): string {
  const output = execution.output ?? '';
  const firstParagraph = output.split('\n').find(l => l.trim().length > 40) ?? '';
  if (firstParagraph) {
    return firstParagraph.trim().slice(0, 300);
  }
  const fallbacks: Record<PackType, string> = {
    app_planning:
      'This pack contains a governed app planning output ready for handoff to the build team.',
    business_decision:
      'This pack contains a governed business analysis and recommendation ready for leadership review.',
    review_findings:
      'This pack contains governed review findings ready for triage and remediation.',
    documentation_handoff:
      'This pack contains governed documentation ready for expert review and publication.',
  };
  return fallbacks[packType];
}

/**
 * Generate a DeliverablePack from an Execution and optional evidence receipt.
 * This is the primary entry point for CP1.
 */
export function generateDeliverablePack(
  execution: Execution,
  evidenceReceipt?: GovernanceEvidenceReceipt
): DeliverablePack {
  const packType = inferPackType(execution.templateId, execution.category);
  const defaults = PACK_DEFAULTS[packType];

  return {
    packType,
    headline: buildHeadline(execution, packType),
    executiveSummary: buildExecutiveSummary(execution, packType),
    mainOutput: execution.output ?? '',
    governanceEvidence: buildGovernanceEvidence(evidenceReceipt),
    scopeBoundary: defaults.scopeBoundary,
    recommendedNextActions: defaults.recommendedNextActions,
    handoffNotes: defaults.handoffNotes,
    generatedAt: new Date().toISOString(),
    sourceExecutionId: execution.id,
  };
}

/**
 * Serialize a DeliverablePack to a Markdown string for export.
 */
export function serializePackToMarkdown(pack: DeliverablePack): string {
  const nextActions = pack.recommendedNextActions
    .map((a, i) => `${i + 1}. ${a}`)
    .join('\n');

  const evidenceSection = pack.governanceEvidence.receiptAvailable
    ? [
        `- **Decision**: ${pack.governanceEvidence.decision}`,
        pack.governanceEvidence.provider
          ? `- **Provider**: ${pack.governanceEvidence.provider}`
          : null,
        pack.governanceEvidence.model
          ? `- **Model**: ${pack.governanceEvidence.model}`
          : null,
        pack.governanceEvidence.policySnapshot
          ? `- **Policy snapshot**: ${pack.governanceEvidence.policySnapshot}`
          : null,
      ]
        .filter(Boolean)
        .join('\n')
    : '- Decision: ALLOWED (no receipt recorded)';

  return [
    `# ${pack.headline}`,
    '',
    `> Pack type: \`${pack.packType}\` | Generated: ${pack.generatedAt}`,
    '',
    '## Executive Summary',
    '',
    pack.executiveSummary,
    '',
    '## Main Output',
    '',
    pack.mainOutput,
    '',
    '## Scope Boundary',
    '',
    pack.scopeBoundary,
    '',
    '## Governance Evidence',
    '',
    evidenceSection,
    '',
    '## Recommended Next Actions',
    '',
    nextActions,
    '',
    '## Handoff Notes',
    '',
    pack.handoffNotes,
    '',
    '---',
    '',
    `*Generated by CVF governed path | Execution: ${pack.sourceExecutionId}*`,
  ].join('\n');
}
