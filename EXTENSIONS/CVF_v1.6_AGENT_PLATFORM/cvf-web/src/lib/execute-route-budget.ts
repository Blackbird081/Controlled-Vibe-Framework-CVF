import type { AIProvider } from '@/lib/ai/types';

const TRUSTED_NONCODER_TEMPLATE_MAX_TOKENS = 2048;
const DEEPSEEK_TRUSTED_NONCODER_TEMPLATE_MAX_TOKENS = 3072;
const EXECUTE_ROUTE_RESPONSE_BUDGET_MS = 85_000;
const VALIDATION_RETRY_PROVIDER_BUDGET_MS = 65_000;

const TRUSTED_NONCODER_TEMPLATE_IDS = new Set([
  'email_template',
  'documentation',
  'faq_outline',
  'acceptance_criteria',
  'competitor_review',
  'risk_assessment',
  'user_persona',
  'feature_prioritization',
  'pricing_strategy',
  'strategy_analysis',
  'operator_plan',
  'decision_memo',
]);

export function resolveExecutionMaxTokens(
  templateId?: string,
  provider?: AIProvider | string,
  model?: string,
): number | undefined {
  if (!templateId || !TRUSTED_NONCODER_TEMPLATE_IDS.has(templateId)) return undefined;

  const normalizedProvider = provider?.toLowerCase();
  const normalizedModel = model?.toLowerCase();
  if (normalizedProvider === 'deepseek' && normalizedModel === 'deepseek-v4-pro') {
    return DEEPSEEK_TRUSTED_NONCODER_TEMPLATE_MAX_TOKENS;
  }

  return TRUSTED_NONCODER_TEMPLATE_MAX_TOKENS;
}

export function hasValidationRetryBudget(routeStartedAtMs: number, nowMs = Date.now()): boolean {
  return nowMs - routeStartedAtMs <= EXECUTE_ROUTE_RESPONSE_BUDGET_MS - VALIDATION_RETRY_PROVIDER_BUDGET_MS;
}
