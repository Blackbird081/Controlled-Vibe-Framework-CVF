/**
 * Provider Router Adapter — cvf-web → ProviderRouterContract (Track 5A)
 * ======================================================================
 * Self-contained adapter implementing the canonical ProviderRouterContract
 * API within the cvf-web build boundary. Types mirror the Track 5A contract
 * from CVF_CONTROL_PLANE_FOUNDATION/src/provider.router.contract.ts.
 *
 * CVF doctrine: CVF governs WHICH providers are ALLOWED.
 * CVF does NOT call providers directly.
 *
 * @module lib/ai/provider-router-adapter
 */

import type { AIProvider } from './types';

// --- Contract-aligned types (mirroring ProviderRouterContract) ---

type ProviderDecision = 'ALLOW' | 'DENY' | 'ESCALATE';
type RiskLevel = 'R0' | 'R1' | 'R2' | 'R3';

interface ProviderDefinition {
  providerId: string;
  providerName: string;
  modelFamily: string;
  maxRiskLevel: RiskLevel;
  costTier: 'free' | 'standard' | 'premium';
  capabilities: string[];
}

interface ProviderPolicy {
  allowedProviders: ProviderDefinition[];
  defaultProviderId: string;
  riskCeiling: RiskLevel;
  requireExplicitApproval: boolean;
  costBudgetTier?: 'free' | 'standard' | 'premium';
  requiredCapabilities?: string[];
}

interface ProviderSelection {
  selectionId: string;
  evaluatedAt: string;
  decision: ProviderDecision;
  selectedProviderId: string | null;
  selectedProviderName: string | null;
  rationale: string;
  deniedReason: string | null;
  fallbackChain: string[];
  requestRiskLevel: RiskLevel;
  policyRiskCeiling: RiskLevel;
}

// --- Risk ordering ---

const RISK_ORDER: Record<RiskLevel, number> = { R0: 0, R1: 1, R2: 2, R3: 3 };

function riskExceeds(actual: RiskLevel, ceiling: RiskLevel): boolean {
  return RISK_ORDER[actual] > RISK_ORDER[ceiling];
}

function costWithinBudget(
  providerTier: 'free' | 'standard' | 'premium',
  budgetTier: 'free' | 'standard' | 'premium',
): boolean {
  const tierOrder = { free: 0, standard: 1, premium: 2 };
  return tierOrder[providerTier] <= tierOrder[budgetTier];
}

// --- Web provider → ProviderDefinition mapping ---

const WEB_PROVIDER_DEFINITIONS: Record<AIProvider, ProviderDefinition> = {
  openai: {
    providerId: 'openai',
    providerName: 'OpenAI',
    modelFamily: 'gpt',
    maxRiskLevel: 'R2',
    costTier: 'standard',
    capabilities: ['chat', 'code', 'analysis'],
  },
  claude: {
    providerId: 'claude',
    providerName: 'Anthropic Claude',
    modelFamily: 'claude',
    maxRiskLevel: 'R2',
    costTier: 'standard',
    capabilities: ['chat', 'code', 'analysis', 'reasoning'],
  },
  gemini: {
    providerId: 'gemini',
    providerName: 'Google Gemini',
    modelFamily: 'gemini',
    maxRiskLevel: 'R2',
    costTier: 'standard',
    capabilities: ['chat', 'code', 'analysis', 'multimodal'],
  },
  alibaba: {
    providerId: 'alibaba',
    providerName: 'Alibaba DashScope',
    modelFamily: 'qwen',
    maxRiskLevel: 'R1',
    costTier: 'free',
    capabilities: ['chat', 'code'],
  },
  openrouter: {
    providerId: 'openrouter',
    providerName: 'OpenRouter',
    modelFamily: 'multi',
    maxRiskLevel: 'R1',
    costTier: 'standard',
    capabilities: ['chat', 'code', 'analysis'],
  },
  deepseek: {
    providerId: 'deepseek',
    providerName: 'DeepSeek',
    modelFamily: 'deepseek',
    maxRiskLevel: 'R1',
    costTier: 'standard',
    capabilities: ['chat', 'code', 'analysis'],
  },
};

// --- Router logic (aligned with ProviderRouterContract.route()) ---

function routeProvider(
  requestRiskLevel: RiskLevel,
  policy: ProviderPolicy,
): ProviderSelection {
  const evaluatedAt = new Date().toISOString();
  const selectionId = `web-pr-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  // 1. Policy-level risk ceiling check
  if (riskExceeds(requestRiskLevel, policy.riskCeiling)) {
    return {
      selectionId,
      evaluatedAt,
      decision: 'DENY',
      selectedProviderId: null,
      selectedProviderName: null,
      rationale: `Request risk ${requestRiskLevel} exceeds policy ceiling ${policy.riskCeiling}`,
      deniedReason: `Risk level ${requestRiskLevel} > ceiling ${policy.riskCeiling}`,
      fallbackChain: [],
      requestRiskLevel,
      policyRiskCeiling: policy.riskCeiling,
    };
  }

  // 2. Explicit approval check
  if (policy.requireExplicitApproval && requestRiskLevel !== 'R0') {
    return {
      selectionId,
      evaluatedAt,
      decision: 'ESCALATE',
      selectedProviderId: null,
      selectedProviderName: null,
      rationale: `Policy requires explicit approval for non-R0 requests (risk: ${requestRiskLevel})`,
      deniedReason: null,
      fallbackChain: [],
      requestRiskLevel,
      policyRiskCeiling: policy.riskCeiling,
    };
  }

  // 3. Filter eligible providers
  const eligible = policy.allowedProviders.filter(p => {
    if (riskExceeds(requestRiskLevel, p.maxRiskLevel)) return false;
    if (policy.costBudgetTier && !costWithinBudget(p.costTier, policy.costBudgetTier)) return false;
    if (policy.requiredCapabilities) {
      const missing = policy.requiredCapabilities.filter(cap => !p.capabilities.includes(cap));
      if (missing.length > 0) return false;
    }
    return true;
  });

  if (eligible.length === 0) {
    return {
      selectionId,
      evaluatedAt,
      decision: 'DENY',
      selectedProviderId: null,
      selectedProviderName: null,
      rationale: `No eligible provider: ${policy.allowedProviders.length} checked, none satisfy constraints`,
      deniedReason: 'No provider matches policy constraints',
      fallbackChain: [],
      requestRiskLevel,
      policyRiskCeiling: policy.riskCeiling,
    };
  }

  // 4. Select: prefer default if eligible, else first eligible
  const defaultProvider = eligible.find(p => p.providerId === policy.defaultProviderId);
  const selected = defaultProvider ?? eligible[0];
  const fallbackChain = eligible
    .filter(p => p.providerId !== selected.providerId)
    .map(p => p.providerId);

  return {
    selectionId,
    evaluatedAt,
    decision: 'ALLOW',
    selectedProviderId: selected.providerId,
    selectedProviderName: selected.providerName,
    rationale: defaultProvider
      ? `Default provider ${selected.providerName} is eligible and selected`
      : `Default not eligible; ${selected.providerName} selected as first eligible`,
    deniedReason: null,
    fallbackChain,
    requestRiskLevel,
    policyRiskCeiling: policy.riskCeiling,
  };
}

// --- Public API ---

export interface WebProviderRouterInput {
  requestedProvider: AIProvider;
  riskLevel?: string;
  phase?: string;
  configuredProviders?: AIProvider[];
}

export interface WebProviderRoutingResult {
  decision: ProviderDecision;
  selectedProvider: AIProvider | null;
  rationale: string;
  deniedReason: string | null;
  fallbackChain: string[];
  selection: ProviderSelection;
}

function normalizeRisk(raw?: string): RiskLevel {
  if (!raw) return 'R1';
  const upper = raw.trim().toUpperCase();
  if (upper === 'R0' || upper === 'LOW' || upper === 'SAFE') return 'R0';
  if (upper === 'R1' || upper === 'MEDIUM') return 'R1';
  if (upper === 'R2' || upper === 'HIGH') return 'R2';
  if (upper === 'R3' || upper === 'CRITICAL' || upper === 'DANGEROUS') return 'R3';
  return 'R1';
}

/**
 * Consult provider governance routing before executing AI.
 * Implements the ProviderRouterContract decision logic locally,
 * conforming to Track 5A API from CVF_CONTROL_PLANE_FOUNDATION.
 */
export function routeWebProvider(input: WebProviderRouterInput): WebProviderRoutingResult {
  const available = input.configuredProviders ?? (Object.keys(WEB_PROVIDER_DEFINITIONS) as AIProvider[]);
  const allowedProviders = available.map(id => WEB_PROVIDER_DEFINITIONS[id]).filter(Boolean);
  const requestRiskLevel = normalizeRisk(input.riskLevel);

  const policy: ProviderPolicy = {
    allowedProviders,
    defaultProviderId: input.requestedProvider,
    riskCeiling: 'R2',
    requireExplicitApproval: false,
    costBudgetTier: 'standard',
  };

  const selection = routeProvider(requestRiskLevel, policy);

  return {
    decision: selection.decision,
    selectedProvider: selection.selectedProviderId as AIProvider | null,
    rationale: selection.rationale,
    deniedReason: selection.deniedReason,
    fallbackChain: selection.fallbackChain,
    selection,
  };
}

export { WEB_PROVIDER_DEFINITIONS };
export type { ProviderDecision, RiskLevel, ProviderSelection };
