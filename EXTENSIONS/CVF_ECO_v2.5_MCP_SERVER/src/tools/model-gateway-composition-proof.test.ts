import { describe, expect, it, vi } from 'vitest';
import {
  executeModelGatewayAdapter,
  MODEL_GATEWAY_EXECUTE_ADAPTER_CONTRACT,
  MODEL_GATEWAY_EXECUTE_TOOL,
  type ModelGatewayExecutorPort,
} from './model-gateway-execute';
import { createGuardEngine } from 'cvf-guard-contract';
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
  preferredProviderId: PROVIDER_ID,
  requestedModelId: MODEL_ID,
  estimatedTokens: 42,
  metadata: { proof: 'mcp-model-gateway-composition' },
};

function allowAdmission() {
  return {
    evaluate: vi.fn((context: { requestId: string }) => ({
      requestId: context.requestId,
      finalDecision: 'ALLOW' as const,
      results: [],
      executedAt: new Date().toISOString(),
      durationMs: 1,
    })),
  };
}

function blockAdmission(blockedBy = 'mock_guard') {
  return {
    evaluate: vi.fn((context: { requestId: string }) => ({
      requestId: context.requestId,
      finalDecision: 'BLOCK' as const,
      results: [],
      executedAt: new Date().toISOString(),
      durationMs: 1,
      blockedBy,
    })),
  };
}

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
  it('passes MCP input through the injected Model Gateway bridge only after a native ALLOW, and returns receipt evidence', async () => {
    const { executor, adapterExecute } = makeCompositionExecutor();
    const admission = allowAdmission();
    const result = await executeModelGatewayAdapter(VALID_INPUT, admission, executor);

    expect(result).toMatchObject({
      contractVersion: MODEL_GATEWAY_EXECUTE_ADAPTER_CONTRACT,
      tool: MODEL_GATEWAY_EXECUTE_TOOL,
      accepted: true,
      executorCalled: true,
      liveProviderCallClaimed: false,
      rawSecretPrinted: false,
      admissionEvidence: { traceId: TRACE_ID, decision: 'ALLOW' },
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
    expect(admission.evaluate).toHaveBeenCalledOnce();
    expect(adapterExecute).toHaveBeenCalledOnce();
    expect(adapterExecute).toHaveBeenCalledWith(expect.objectContaining({
      traceId: TRACE_ID,
      providerId: PROVIDER_ID,
      modelId: MODEL_ID,
      prompt: VALID_INPUT.prompt,
    }));
    expect(JSON.stringify(result)).not.toContain(TEST_SECRET);
  });

  it('rejects a native BLOCK before the Model Gateway bridge or provider adapter ever runs', async () => {
    const { executor, adapterExecute } = makeCompositionExecutor();
    const admission = blockAdmission('authority_gate');
    const result = await executeModelGatewayAdapter(VALID_INPUT, admission, executor);

    expect(result.accepted).toBe(false);
    expect(result.executorCalled).toBe(false);
    expect(result.errorEnvelope?.code).toBe('NATIVE_ADMISSION_BLOCKED');
    expect(result.admissionEvidence).toMatchObject({ decision: 'BLOCK', blockedBy: 'authority_gate' });
    expect(adapterExecute).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain(TEST_SECRET);
  });

  it('a caller-supplied policyResult cannot forward a hostile allow into the Model Gateway bridge', async () => {
    const { executor, adapterExecute } = makeCompositionExecutor();
    const admission = blockAdmission();
    const hostileInput = { ...VALID_INPUT, policyResult: 'allow' as const };
    const result = await executeModelGatewayAdapter(hostileInput, admission, executor);

    expect(result.accepted).toBe(false);
    expect(result.executorCalled).toBe(false);
    expect(adapterExecute).not.toHaveBeenCalled();
  });

  it('wires the real server-owned native engine end to end and reaches the bridge only on ALLOW', async () => {
    // OPERATOR is genuinely authorized to `execute` in phase BUILD under the
    // canonical authority_gate matrix (AUTHORITY_MATRIX.OPERATOR.BUILD
    // includes 'execute'), matching the precedent already proved in
    // model-gateway-execute.test.ts. VALID_INPUT itself intentionally carries
    // agentRole: 'AI_AGENT' for the other cases in this file that exercise
    // AI-agent/orchestrator BLOCK behavior, so this case uses a case-local
    // override rather than mutating the shared fixture.
    const { executor, adapterExecute } = makeCompositionExecutor();
    const engine = createGuardEngine();
    const operatorInput = { ...VALID_INPUT, agentRole: 'OPERATOR' as const };
    const result = await executeModelGatewayAdapter(operatorInput, engine, executor);

    expect(result.accepted).toBe(true);
    expect(result.executorCalled).toBe(true);
    expect(result.admissionEvidence?.decision).toBe('ALLOW');
    expect(adapterExecute).toHaveBeenCalledOnce();
  });

  it('wires the real server-owned native engine so a real R3 BLOCK stops before the bridge', async () => {
    const { executor, adapterExecute } = makeCompositionExecutor();
    const engine = createGuardEngine();
    const result = await executeModelGatewayAdapter(
      { ...VALID_INPUT, requestRiskClass: 'critical' },
      engine,
      executor
    );

    expect(result.accepted).toBe(false);
    expect(result.executorCalled).toBe(false);
    expect(result.admissionEvidence?.decision).toBe('BLOCK');
    expect(result.admissionEvidence?.blockedBy).toBe('risk_gate');
    expect(adapterExecute).not.toHaveBeenCalled();
  });

  it('blocks raw credential input at the MCP boundary before native admission or Model Gateway execution', async () => {
    const admission = allowAdmission();
    const execute = vi.fn();
    const result = await executeModelGatewayAdapter(
      { ...VALID_INPUT, metadata: { apiKey: TEST_SECRET } },
      admission,
      { execute }
    );

    expect(result.accepted).toBe(false);
    expect(result.executorCalled).toBe(false);
    expect(result.errorEnvelope?.code).toBe('RAW_CREDENTIAL_INPUT_REJECTED');
    expect(admission.evaluate).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
    expect(JSON.stringify(result)).not.toContain(TEST_SECRET);
  });

  it('returns shielded Model Gateway adapter errors without leaking thrown details, after a native ALLOW', async () => {
    const adapterExecute = vi.fn(async () => {
      throw new Error(`provider failed with ${TEST_SECRET}`);
    });
    const { executor } = makeCompositionExecutor(adapterExecute);
    const admission = allowAdmission();
    const result = await executeModelGatewayAdapter(VALID_INPUT, admission, executor);

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
