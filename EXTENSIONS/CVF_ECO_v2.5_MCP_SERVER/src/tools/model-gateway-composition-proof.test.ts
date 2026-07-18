import { describe, expect, it, vi } from 'vitest';
import {
  executeModelGatewayAdapter,
  MODEL_GATEWAY_EXECUTE_ADAPTER_CONTRACT,
  MODEL_GATEWAY_EXECUTE_TOOL,
  type ModelGatewayExecutorPort,
} from './model-gateway-execute';
import { CredentialBoundary, type CredentialReference } from '../../../CVF_MODEL_GATEWAY/src/credential-boundary';
import { GatewayReceiptBuilder } from '../../../CVF_MODEL_GATEWAY/src/gateway-receipt';
import { ProviderHealthMonitor } from '../../../CVF_MODEL_GATEWAY/src/provider-health';
import { ProviderExecutionBridge, type ProviderExecutionAdapter } from '../../../CVF_MODEL_GATEWAY/src/provider-execution-bridge';
import { ProviderRegistry } from '../../../CVF_MODEL_GATEWAY/src/provider-registry';
import { QuotaLedger } from '../../../CVF_MODEL_GATEWAY/src/quota-ledger';
import { RoutingPolicyEngine } from '../../../CVF_MODEL_GATEWAY/src/routing-policy';
import type { GatewayExecuteRequest } from '../../../CVF_MODEL_GATEWAY/src/unified-gateway-interface-contract';

const TRACE_ID = 'mcp-gw-composition-proof-001';
const PROVIDER_ID = 'composition-proof-provider';
const MODEL_ID = 'composition-proof-model';
const KEY_ID = 'composition-proof-key';
const TEST_SECRET = 'composition-proof-secret-value';

const VALID_INPUT = {
  traceId: TRACE_ID,
  prompt: 'Execute through the bounded composition proof.',
  agentRole: 'AI_AGENT',
  policyResult: 'allow' as const,
  preferredProviderId: PROVIDER_ID,
  requestedModelId: MODEL_ID,
  estimatedTokens: 42,
  metadata: { proof: 'mcp-model-gateway-composition' },
};

function makeCredentialRef(): CredentialReference {
  return {
    providerId: PROVIDER_ID,
    keyId: KEY_ID,
    envNames: ['COMPOSITION_PROOF_KEY'],
  };
}

function makeCompositionExecutor(adapterExecute = vi.fn(async () => ({
  text: 'composition proof ok',
  usage: { inputTokens: 7, outputTokens: 5 },
}))) {
  const registry = new ProviderRegistry();
  registry.register({
    id: PROVIDER_ID,
    displayName: 'Composition Proof Provider',
    status: 'enabled',
    riskClass: 'low',
    models: [{ id: MODEL_ID, riskClass: 'low' }],
  });

  const adapter: ProviderExecutionAdapter = {
    providerId: PROVIDER_ID,
    execute: adapterExecute,
  };
  const health = new ProviderHealthMonitor(() => new Date('2026-06-19T00:00:00Z'));
  const quota = new QuotaLedger(() => new Date('2026-06-19T00:00:00Z'));
  const credential = new CredentialBoundary({ COMPOSITION_PROOF_KEY: TEST_SECRET });
  const receipt = new GatewayReceiptBuilder(
    () => new Date('2026-06-19T00:00:00Z'),
    () => 'compositionproof'
  );
  const routing = new RoutingPolicyEngine(registry, health, quota);
  const bridge = new ProviderExecutionBridge({
    routing,
    credential,
    health,
    quota,
    receipt,
    credentialRefs: new Map([[PROVIDER_ID, makeCredentialRef()]]),
    adapters: new Map([[PROVIDER_ID, adapter]]),
  });
  const executor: ModelGatewayExecutorPort = {
    async execute(request) {
      const result = await bridge.execute(request as GatewayExecuteRequest);
      return {
        response: result.response as unknown as Record<string, unknown> | undefined,
        error: result.error as unknown as Record<string, unknown> | undefined,
        receipt: result.receipt as unknown as Record<string, unknown>,
      };
    },
  };

  return { executor, adapterExecute };
}

describe('MCP to Model Gateway composition proof', () => {
  it('passes MCP input through the injected Model Gateway bridge and returns receipt evidence', async () => {
    const { executor, adapterExecute } = makeCompositionExecutor();
    const result = await executeModelGatewayAdapter(VALID_INPUT, executor);

    expect(result).toMatchObject({
      contractVersion: MODEL_GATEWAY_EXECUTE_ADAPTER_CONTRACT,
      tool: MODEL_GATEWAY_EXECUTE_TOOL,
      accepted: true,
      executorCalled: true,
      liveProviderCallClaimed: false,
      rawSecretPrinted: false,
      gatewayResult: {
        response: {
          traceId: TRACE_ID,
          text: 'composition proof ok',
          model: { providerId: PROVIDER_ID, modelId: MODEL_ID },
        },
        receipt: {
          traceId: TRACE_ID,
          decision: 'selected',
          validationState: 'passed',
        },
      },
    });
    expect(adapterExecute).toHaveBeenCalledOnce();
    expect(adapterExecute).toHaveBeenCalledWith(expect.objectContaining({
      traceId: TRACE_ID,
      providerId: PROVIDER_ID,
      modelId: MODEL_ID,
      prompt: VALID_INPUT.prompt,
    }));
    expect(JSON.stringify(result)).not.toContain(TEST_SECRET);
  });

  it('preserves policy-denied Model Gateway receipt without calling the provider adapter', async () => {
    const { executor, adapterExecute } = makeCompositionExecutor();
    const result = await executeModelGatewayAdapter(
      { ...VALID_INPUT, policyResult: 'deny' },
      executor
    );

    expect(result.accepted).toBe(true);
    expect(result.executorCalled).toBe(true);
    expect(result.gatewayResult).toMatchObject({
      error: {
        errorClass: 'policy_denied',
        credentialShielded: true,
        retryable: false,
      },
      receipt: {
        decision: 'denied',
        validationState: 'not_run',
      },
    });
    expect(adapterExecute).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain(TEST_SECRET);
  });

  it('blocks raw credential input at the MCP boundary before Model Gateway execution', async () => {
    const execute = vi.fn();
    const result = await executeModelGatewayAdapter(
      { ...VALID_INPUT, metadata: { apiKey: TEST_SECRET } },
      { execute }
    );

    expect(result.accepted).toBe(false);
    expect(result.executorCalled).toBe(false);
    expect(result.errorEnvelope?.code).toBe('RAW_CREDENTIAL_INPUT_REJECTED');
    expect(execute).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain(TEST_SECRET);
  });

  it('returns shielded Model Gateway adapter errors without leaking thrown details', async () => {
    const adapterExecute = vi.fn(async () => {
      throw new Error(`provider failed with ${TEST_SECRET}`);
    });
    const { executor } = makeCompositionExecutor(adapterExecute);
    const result = await executeModelGatewayAdapter(VALID_INPUT, executor);

    expect(result.accepted).toBe(true);
    expect(result.executorCalled).toBe(true);
    expect(result.gatewayResult).toMatchObject({
      error: {
        errorClass: 'internal_error',
        message: 'Provider adapter execution failed',
        credentialShielded: true,
      },
      receipt: {
        decision: 'selected',
        validationState: 'failed',
      },
    });
    expect(JSON.stringify(result)).not.toContain(TEST_SECRET);
  });
});
