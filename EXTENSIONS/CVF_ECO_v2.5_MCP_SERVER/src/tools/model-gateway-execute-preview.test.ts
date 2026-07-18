import { describe, expect, it } from 'vitest';
import {
  buildModelGatewayExecutePreview,
  MODEL_GATEWAY_EXECUTE_PREVIEW_CONTRACT,
  MODEL_GATEWAY_EXECUTE_PREVIEW_TOOL,
} from './model-gateway-execute-preview';

const FIXED_TIME = new Date('2026-06-19T00:00:00.000Z');

describe('cvf_model_gateway_execute_preview', () => {
  it('maps a valid preview request to a GatewayExecuteRequest-compatible shape', () => {
    const result = buildModelGatewayExecutePreview({
      provider: 'dashscope',
      model: 'qwen-plus',
      prompt: 'Summarize the current work order boundary.',
      requestId: 'wwu-t3a-test',
      agentRole: 'AI_AGENT',
      maxTokens: 256,
      temperature: 0.2,
    }, FIXED_TIME);

    expect(result.contractVersion).toBe(MODEL_GATEWAY_EXECUTE_PREVIEW_CONTRACT);
    expect(result.tool).toBe(MODEL_GATEWAY_EXECUTE_PREVIEW_TOOL);
    expect(result.accepted).toBe(true);
    expect(result.runtimeExecutionAuthorized).toBe(false);
    expect(result.liveProviderCallPerformed).toBe(false);
    expect(result.rawSecretPrinted).toBe(false);
    expect(result.gatewayRequest).toMatchObject({
      requestId: 'wwu-t3a-test',
      provider: 'dashscope',
      model: 'qwen-plus',
      metadata: {
        mcpTool: MODEL_GATEWAY_EXECUTE_PREVIEW_TOOL,
        previewOnly: true,
      },
    });
    expect(result.previewResponse?.finishReason).toBe('preview_only');
    expect(result.receipt.sourceCompatibleWith).toContain('GatewayExecuteRequest');
    expect(result.receipt.sourceCompatibleWith).toContain('ProviderExecutionBridge.execute');
  });

  it('uses message content when prompt is omitted', () => {
    const result = buildModelGatewayExecutePreview({
      provider: 'dashscope',
      model: 'qwen-plus',
      messages: [{ role: 'user', content: 'Plan a narrow bridge preview.' }],
      requestId: 'message-input',
    }, FIXED_TIME);

    expect(result.accepted).toBe(true);
    expect(result.gatewayRequest?.input).toMatchObject({
      prompt: 'Plan a narrow bridge preview.',
    });
  });

  it('rejects raw credential material without echoing secret values', () => {
    const result = buildModelGatewayExecutePreview({
      provider: 'dashscope',
      model: 'qwen-plus',
      prompt: 'test',
      requestId: 'secret-reject',
      apiKey: 'secret-value',
    }, FIXED_TIME);

    expect(result.accepted).toBe(false);
    expect(result.errorEnvelope?.code).toBe('RAW_CREDENTIAL_INPUT_REJECTED');
    expect(JSON.stringify(result)).not.toContain('secret-value');
    expect(result.rawSecretPrinted).toBe(false);
  });

  it('rejects live execution requests', () => {
    const result = buildModelGatewayExecutePreview({
      provider: 'dashscope',
      model: 'qwen-plus',
      prompt: 'test',
      requestId: 'live-reject',
      dryRunOnly: false,
    }, FIXED_TIME);

    expect(result.accepted).toBe(false);
    expect(result.errorEnvelope?.code).toBe('LIVE_EXECUTION_NOT_AUTHORIZED');
    expect(result.liveProviderCallPerformed).toBe(false);
  });

  it('rejects missing provider, model, or prompt/message content', () => {
    const result = buildModelGatewayExecutePreview({
      provider: '',
      model: '',
      requestId: 'missing-fields',
    }, FIXED_TIME);

    expect(result.accepted).toBe(false);
    expect(result.errorEnvelope?.code).toBe('MISSING_REQUIRED_GATEWAY_FIELDS');
    expect(result.errorEnvelope?.missing).toEqual(['provider', 'model', 'prompt_or_messages']);
  });
});
