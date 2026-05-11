export const GOVERNANCE_FAMILIES = [
  'normal_productivity_app_planning',
  'builder_handoff_technical_planning',
  'documentation_operations',
  'cost_quota_provider_selection',
  'high_risk_security_secrets',
  'bypass_adversarial_governance',
  'ambiguous_noncoder_requests',
  'negative_controls',
] as const;

export type GovernanceFamily = typeof GOVERNANCE_FAMILIES[number];

type GovernanceFamilyInput = {
  qbsFamily?: string | null;
  governanceFamily?: string | null;
  intent?: string | null;
  templateId?: string | null;
  templateCategory?: string | null;
  riskLevel?: string | null;
};

const FAMILY_SET = new Set<string>(GOVERNANCE_FAMILIES);

const TEMPLATE_FAMILY_MAP: Record<string, GovernanceFamily> = {
  app_builder_wizard: 'normal_productivity_app_planning',
  build_my_app: 'normal_productivity_app_planning',
  app_builder_complete: 'normal_productivity_app_planning',
  app_requirements_spec: 'normal_productivity_app_planning',
  vibe_to_spec: 'normal_productivity_app_planning',
  feature_prioritization: 'normal_productivity_app_planning',
  user_persona: 'normal_productivity_app_planning',
  web_build_handoff: 'normal_productivity_app_planning',

  api_design: 'builder_handoff_technical_planning',
  architecture_design: 'builder_handoff_technical_planning',
  architecture_review: 'builder_handoff_technical_planning',
  code_review: 'builder_handoff_technical_planning',
  cli_tool_spec: 'builder_handoff_technical_planning',
  project_init_checklist: 'builder_handoff_technical_planning',
  non_coder_debug: 'builder_handoff_technical_planning',

  pricing_strategy: 'cost_quota_provider_selection',
};

function normalizeText(value?: string | null): string {
  return (value || '').trim().toLowerCase();
}

export function isGovernanceFamily(value?: string | null): value is GovernanceFamily {
  return !!value && FAMILY_SET.has(value);
}

function resolveByIntent(input: GovernanceFamilyInput): GovernanceFamily | null {
  const text = [
    input.intent,
    input.templateId,
    input.templateCategory,
  ]
    .map(normalizeText)
    .filter(Boolean)
    .join(' ');

  if (!text) return null;

  if (/\b(cost|quota|budget|spend|pricing|price|provider|model lane|latency|retry policy|token|usage)\b/.test(text)) {
    return 'cost_quota_provider_selection';
  }

  if (/\b(api|architecture|code review|developer handoff|migration|rollback|feature flag|module boundary|test coverage|implementation plan|debug|cli tool)\b/.test(text)) {
    return 'builder_handoff_technical_planning';
  }

  if (/\b(app|mvp|product brief|feature idea|acceptance criteria|user persona|workflow|dashboard|requirements|builder-ready|non-technical)\b/.test(text)) {
    return 'normal_productivity_app_planning';
  }

  return null;
}

export function resolveGovernanceFamily(input: GovernanceFamilyInput): GovernanceFamily | null {
  if (isGovernanceFamily(input.governanceFamily)) return input.governanceFamily;
  if (isGovernanceFamily(input.qbsFamily)) return input.qbsFamily;

  const templateId = normalizeText(input.templateId);
  if (templateId && TEMPLATE_FAMILY_MAP[templateId]) {
    return TEMPLATE_FAMILY_MAP[templateId];
  }

  return resolveByIntent(input);
}
