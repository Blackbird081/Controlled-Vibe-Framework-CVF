import { describe, expect, it, vi } from 'vitest';
import {
  executeModelGatewayAdapter,
  MODEL_GATEWAY_EXECUTE_ADAPTER_CONTRACT,
  MODEL_GATEWAY_EXECUTE_TOOL,
  type ModelGatewayExecutorPort,
} from './model-gateway-execute';

const VALID_INPUT = {
  traceId: 'wwu-t3b-trace',
  prompt: 'Execute the bounded request.',
  agentRole: 'AI_AGENT',
  policyResult: 'allow' as const,
  preferredProviderId: 'deepseek',
  requestedModelId: 'deepseek-chat',
  estimatedTokens: 64,
  metadata: { source: 'focused-test' },
};

describe('cvf_model_gateway_execute', () => {
  it('calls the injected executor with a source-compatible request and preserves receipt', async () => {
    const execute = vi.fn().mockResolvedValue({
      response: { traceId: VALID_INPUT.traceId, text: 'ok' },
      receipt: { receiptId: 'receipt-1', validationState: 'passed' },
    });
    const result = await executeModelGatewayAdapter(VALID_INPUT, { execute });

    expect(result).toMatchObject({
      contractVersion: MODEL_GATEWAY_EXECUTE_ADAPTER_CONTRACT,
      tool: MODEL_GATEWAY_EXECUTE_TOOL,
      accepted: true,
      executorCalled: true,
      rawSecretPrinted: false,
      gatewayResult: { receipt: { receiptId: 'receipt-1' } },
    });
    expect(execute).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({
      traceId: VALID_INPUT.traceId,
      prompt: VALID_INPUT.prompt,
      policy: expect.objectContaining({ policyResult: 'allow' }),
      routing: expect.objectContaining({
        preferredProviderId: 'deepseek',
        requestedModelId: 'deepseek-chat',
      }),
    }));
  });

  it('preserves a gateway error and receipt without converting it to an MCP success claim', async () => {
    const executor: ModelGatewayExecutorPort = {
      execute: vi.fn().mockResolvedValue({
        error: { errorClass: 'policy_denied', credentialShielded: true },
        receipt: { decision: 'denied' },
      }),
    };
    const result = await executeModelGatewayAdapter(
      { ...VALID_INPUT, policyResult: 'deny' },
      executor
    );

    expect(result.accepted).toBe(true);
    expect(result.gatewayResult).toMatchObject({
      error: { errorClass: 'policy_denied' },
      receipt: { decision: 'denied' },
    });
  });

  it('rejects unauthorized roles before calling the executor', async () => {
    const execute = vi.fn();
    const result = await executeModelGatewayAdapter(
      { ...VALID_INPUT, agentRole: 'REVIEWER' },
      { execute }
    );

    expect(result.errorEnvelope?.code).toBe('ROLE_NOT_AUTHORIZED');
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects nested credential-bearing input without echoing values', async () => {
    const execute = vi.fn();
    const result = await executeModelGatewayAdapter(
      { ...VALID_INPUT, metadata: { authorization: 'Bearer raw-secret-value' } },
      { execute }
    );

    expect(result.errorEnvelope?.code).toBe('RAW_CREDENTIAL_INPUT_REJECTED');
    expect(JSON.stringify(result)).not.toContain('raw-secret-value');
    expect(execute).not.toHaveBeenCalled();
  });

  it('fails closed when required fields or the executor are absent', async () => {
    const invalid = await executeModelGatewayAdapter({ ...VALID_INPUT, prompt: '' }, {
      execute: vi.fn(),
    });
    const unconfigured = await executeModelGatewayAdapter(VALID_INPUT);

    expect(invalid.errorEnvelope?.code).toBe('INVALID_GATEWAY_REQUEST');
    expect(unconfigured.errorEnvelope?.code).toBe('MODEL_GATEWAY_EXECUTOR_NOT_CONFIGURED');
  });

  it('shields thrown executor details', async () => {
    const result = await executeModelGatewayAdapter(VALID_INPUT, {
      execute: vi.fn().mockRejectedValue(new Error('provider leaked raw-secret-value')),
    });

    expect(result.errorEnvelope?.code).toBe('MODEL_GATEWAY_EXECUTION_FAILED');
    expect(result.executorCalled).toBe(true);
    expect(JSON.stringify(result)).not.toContain('raw-secret-value');
  });
});
