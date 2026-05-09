const TRUSTED_NONCODER_TEMPLATE_MAX_TOKENS = 2048;
const EXECUTE_ROUTE_RESPONSE_BUDGET_MS = 85_000;
const VALIDATION_RETRY_PROVIDER_BUDGET_MS = 65_000;

const TRUSTED_NONCODER_TEMPLATE_IDS = new Set([
  'email_template',
  'documentation',
  'competitor_review',
  'risk_assessment',
  'user_persona',
  'feature_prioritization',
  'pricing_strategy',
  'strategy_analysis',
]);

export function resolveExecutionMaxTokens(templateId?: string): number | undefined {
  return templateId && TRUSTED_NONCODER_TEMPLATE_IDS.has(templateId)
    ? TRUSTED_NONCODER_TEMPLATE_MAX_TOKENS
    : undefined;
}

export function hasValidationRetryBudget(routeStartedAtMs: number, nowMs = Date.now()): boolean {
  return nowMs - routeStartedAtMs <= EXECUTE_ROUTE_RESPONSE_BUDGET_MS - VALIDATION_RETRY_PROVIDER_BUDGET_MS;
}
