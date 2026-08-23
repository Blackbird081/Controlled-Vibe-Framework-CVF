import {
  CredentialBoundary,
  GatewayReceiptBuilder,
  ProviderExecutionBridge,
  ProviderHealthMonitor,
  ProviderRegistry,
  PROVIDER_CAPABILITY_REGISTRY,
  QuotaLedger,
  RoutingPolicyEngine,
  assertRegistryProviderMethodSupported,
  createCredentialBoundOpenAiCompatibleExecuteAdapter,
  type CredentialReference,
  type GatewayExecuteRequest,
  type OpenAiCompatibleFetch,
  type ProviderExecutionBridgeResult,
} from 'cvf-model-gateway';

const OPENAI_PROVIDER_ID = 'openai';
const OPENAI_MODEL_ID = 'gpt-4o';
const OPENAI_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
const COMPLETE_CAPABILITY = 'complete' as const;

export const LPCI_PROVIDER_BINDING_VERSION = 'cvf.lpciProviderBinding.b2.v1' as const;
export const LPCI_PROVIDER_ATTEMPT_TIMEOUT_MS = 30_000 as const;

export interface LpciProviderBindingConfig {
  providerId: string;
  modelId: string;
  endpoint: string;
}

export type LpciProviderBindingResult =
  | { outcome: 'ANSWER_EMITTED'; response: string }
  | { outcome: 'NO_PROVIDER_CONFIGURED' }
  | { outcome: 'PROVIDER_ERROR'; diagnosticCode?: 'PROVIDER_ERROR' | 'EXACT_PAIR_MISMATCH' }
  | { outcome: 'PROVIDER_TIMEOUT'; diagnosticCode: 'PROVIDER_TIMEOUT' };

export interface LpciProviderBindingInput {
  prompt: string;
  systemPrompt: string;
}

interface BridgeLike {
  execute(
    request: GatewayExecuteRequest,
    options?: { signal?: AbortSignal },
  ): Promise<ProviderExecutionBridgeResult>;
}

export interface LpciProviderBindingDependencies {
  env?: Record<string, string | undefined>;
  credential?: CredentialBoundary;
  fetchImpl?: OpenAiCompatibleFetch;
  bridge?: BridgeLike;
  traceId?: () => string;
  abortController?: () => AbortController;
  setTimeoutImpl?: (callback: () => void, milliseconds: number) => ReturnType<typeof setTimeout>;
  clearTimeoutImpl?: (timer: ReturnType<typeof setTimeout>) => void;
}

type ConfigResolution =
  | { status: 'ok'; config: LpciProviderBindingConfig }
  | { status: 'not_configured' }
  | { status: 'invalid' };

export function resolveLpciProviderBindingConfig(
  env: Record<string, string | undefined>,
): ConfigResolution {
  const rawModel = env.LPCI_LLM_MODEL?.trim();
  if (!rawModel) return { status: 'not_configured' };

  const pair = rawModel.split('/');
  if (
    pair.length !== 2
    || !pair[0]
    || !pair[1]
    || pair[0] !== pair[0].trim()
    || pair[1] !== pair[1].trim()
  ) {
    return { status: 'invalid' };
  }
  const [providerId, modelId] = pair;
  try {
    assertRegistryProviderMethodSupported(
      PROVIDER_CAPABILITY_REGISTRY,
      providerId,
      modelId,
      COMPLETE_CAPABILITY,
    );
  } catch {
    return { status: 'invalid' };
  }

  if (providerId !== OPENAI_PROVIDER_ID || modelId !== OPENAI_MODEL_ID) {
    return { status: 'invalid' };
  }

  const endpoint = resolveEndpoint(env.LPCI_LLM_ENDPOINT);
  if (!endpoint) return { status: 'invalid' };
  return { status: 'ok', config: { providerId, modelId, endpoint } };
}

export async function executeLpciProviderBinding(
  input: LpciProviderBindingInput,
  dependencies: LpciProviderBindingDependencies = {},
): Promise<LpciProviderBindingResult> {
  const env = dependencies.env ?? (process.env as Record<string, string | undefined>);
  const resolved = resolveLpciProviderBindingConfig(env);
  if (resolved.status === 'not_configured') return { outcome: 'NO_PROVIDER_CONFIGURED' };
  if (resolved.status === 'invalid') return { outcome: 'PROVIDER_ERROR' };

  const credentialReference: CredentialReference = {
    providerId: resolved.config.providerId,
    keyId: 'lpci-openai',
    envNames: ['LPCI_LLM_API_KEY'],
  };
  const credential = dependencies.credential ?? new CredentialBoundary(env);
  if (!credential.resolveMetadata(credentialReference).available) {
    return { outcome: 'NO_PROVIDER_CONFIGURED' };
  }

  const traceId = dependencies.traceId?.() ?? crypto.randomUUID();
  const request: GatewayExecuteRequest = {
    traceId,
    prompt: input.prompt,
    systemPrompt: input.systemPrompt,
    policy: {
      traceId,
      policyResult: 'allow',
      reason: 'lpci_public_evidence_answer',
      dataClassification: 'public',
      requestRiskClass: 'low',
      allowedProviderIds: [resolved.config.providerId],
    },
    routing: {
      traceId,
      preferredProviderId: resolved.config.providerId,
      requestedModelId: resolved.config.modelId,
      requiredCapabilities: [COMPLETE_CAPABILITY],
    },
  };

  try {
    const bridge = dependencies.bridge ?? buildBridge({
      config: resolved.config,
      credential,
      credentialReference,
      fetchImpl: dependencies.fetchImpl
        ?? (globalThis.fetch as unknown as OpenAiCompatibleFetch),
    });
    const controller = dependencies.abortController?.() ?? new AbortController();
    const schedule = dependencies.setTimeoutImpl ?? setTimeout;
    const cancel = dependencies.clearTimeoutImpl ?? clearTimeout;
    const timer = schedule(() => controller.abort(), LPCI_PROVIDER_ATTEMPT_TIMEOUT_MS);
    let result: ProviderExecutionBridgeResult;
    try {
      result = await bridge.execute(request, { signal: controller.signal });
    } finally {
      cancel(timer);
    }
    if (controller.signal.aborted) {
      return { outcome: 'PROVIDER_TIMEOUT', diagnosticCode: 'PROVIDER_TIMEOUT' };
    }
    if (!isValidExactPairResult(result, traceId, resolved.config)) {
      return { outcome: 'PROVIDER_ERROR', diagnosticCode: result.response
        ? 'EXACT_PAIR_MISMATCH'
        : 'PROVIDER_ERROR' };
    }
    return { outcome: 'ANSWER_EMITTED', response: result.response.text };
  } catch (caught: unknown) {
    if (caught instanceof Error && caught.name === 'AbortError') {
      return { outcome: 'PROVIDER_TIMEOUT', diagnosticCode: 'PROVIDER_TIMEOUT' };
    }
    return { outcome: 'PROVIDER_ERROR', diagnosticCode: 'PROVIDER_ERROR' };
  }
}

function buildBridge(input: {
  config: LpciProviderBindingConfig;
  credential: CredentialBoundary;
  credentialReference: CredentialReference;
  fetchImpl: OpenAiCompatibleFetch;
}): ProviderExecutionBridge {
  const registry = new ProviderRegistry([{
    id: input.config.providerId,
    displayName: 'OpenAI',
    status: 'enabled',
    riskClass: 'low',
    models: [{ id: input.config.modelId, riskClass: 'low' }],
  }]);
  const health = new ProviderHealthMonitor();
  const quota = new QuotaLedger();
  const adapter = createCredentialBoundOpenAiCompatibleExecuteAdapter({
    credential: input.credential,
    credentialReference: input.credentialReference,
    providerId: input.config.providerId,
    modelId: input.config.modelId,
    endpoint: input.config.endpoint,
    fetchImpl: input.fetchImpl,
  });
  return new ProviderExecutionBridge({
    routing: new RoutingPolicyEngine(registry, health, quota),
    credential: input.credential,
    health,
    quota,
    receipt: new GatewayReceiptBuilder(),
    credentialRefs: new Map([[input.config.providerId, input.credentialReference]]),
    adapters: new Map([[input.config.providerId, adapter]]),
  });
}

function resolveEndpoint(rawEndpoint: string | undefined): string | null {
  if (rawEndpoint === undefined || rawEndpoint.trim() === '') return OPENAI_ENDPOINT;
  try {
    const parsed = new URL(rawEndpoint.trim());
    if (
      parsed.protocol !== 'https:'
      || parsed.username
      || parsed.password
      || parsed.search
      || parsed.hash
      || parsed.toString() !== OPENAI_ENDPOINT
    ) {
      return null;
    }
    return OPENAI_ENDPOINT;
  } catch {
    return null;
  }
}

function isValidExactPairResult(
  result: ProviderExecutionBridgeResult,
  traceId: string,
  config: LpciProviderBindingConfig,
): result is ProviderExecutionBridgeResult & { response: NonNullable<ProviderExecutionBridgeResult['response']> } {
  return !result.error
    && typeof result.response?.text === 'string'
    && result.response.text.trim().length > 0
    && result.response.traceId === traceId
    && result.receipt.traceId === traceId
    && result.response.model?.providerId === config.providerId
    && result.response.model.modelId === config.modelId
    && result.receipt.providerId === config.providerId
    && result.receipt.selectedModelId === config.modelId;
}
