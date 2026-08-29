import { describe, expect, it, vi } from 'vitest';
import {
  executeModelGatewayAdapter,
  registerModelGatewayExecuteTool,
  MODEL_GATEWAY_EXECUTE_ADAPTER_CONTRACT,
  MODEL_GATEWAY_EXECUTE_TOOL,
} from './model-gateway-execute';
import { createGuardEngine } from 'cvf-guard-contract';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

const VALID_INPUT = {
  traceId: 'wwu-t3b-trace',
  prompt: 'Execute the bounded request.',
  agentRole: 'AI_AGENT',
  preferredProviderId: 'deepseek',
  requestedModelId: 'deepseek-chat',
  estimatedTokens: 64,
  metadata: { source: 'focused-test' },
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

function escalateAdmission(escalatedBy = 'mock_guard') {
  return {
    evaluate: vi.fn((context: { requestId: string }) => ({
      requestId: context.requestId,
      finalDecision: 'ESCALATE' as const,
      results: [],
      executedAt: new Date().toISOString(),
      durationMs: 1,
      escalatedBy,
    })),
  };
}

describe('cvf_model_gateway_execute -- native admission', () => {
  it('calls the injected executor only after a native ALLOW and preserves receipt', async () => {
    const admission = allowAdmission();
    const execute = vi.fn().mockResolvedValue({
      response: { traceId: VALID_INPUT.traceId, text: 'ok' },
      receipt: { receiptId: 'receipt-1', validationState: 'passed' },
    });
    const result = await executeModelGatewayAdapter(VALID_INPUT, admission, { execute });

    expect(result).toMatchObject({
      contractVersion: MODEL_GATEWAY_EXECUTE_ADAPTER_CONTRACT,
      tool: MODEL_GATEWAY_EXECUTE_TOOL,
      accepted: true,
      executorCalled: true,
      rawSecretPrinted: false,
      admissionEvidence: { traceId: VALID_INPUT.traceId, decision: 'ALLOW' },
      gatewayResult: { receipt: { receiptId: 'receipt-1' } },
    });
    expect(admission.evaluate).toHaveBeenCalledOnce();
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

  it('rejects a native BLOCK decision before calling the executor', async () => {
    const admission = blockAdmission('phase_gate');
    const execute = vi.fn();
    const result = await executeModelGatewayAdapter(VALID_INPUT, admission, { execute });

    expect(result.accepted).toBe(false);
    expect(result.executorCalled).toBe(false);
    expect(result.errorEnvelope?.code).toBe('NATIVE_ADMISSION_BLOCKED');
    expect(result.admissionEvidence).toMatchObject({ decision: 'BLOCK', blockedBy: 'phase_gate' });
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects a native ESCALATE decision before calling the executor', async () => {
    const admission = escalateAdmission('risk_gate');
    const execute = vi.fn();
    const result = await executeModelGatewayAdapter(VALID_INPUT, admission, { execute });

    expect(result.accepted).toBe(false);
    expect(result.executorCalled).toBe(false);
    expect(result.errorEnvelope?.code).toBe('NATIVE_ADMISSION_ESCALATION_REQUIRED');
    expect(result.admissionEvidence).toMatchObject({ decision: 'ESCALATE', escalatedBy: 'risk_gate' });
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects when native admission is not configured, before calling the executor', async () => {
    const execute = vi.fn();
    const result = await executeModelGatewayAdapter(VALID_INPUT, undefined, { execute });

    expect(result.accepted).toBe(false);
    expect(result.executorCalled).toBe(false);
    expect(result.errorEnvelope?.code).toBe('NATIVE_ADMISSION_NOT_CONFIGURED');
    expect(execute).not.toHaveBeenCalled();
  });

  it('shields a thrown native admission error and calls the executor zero times', async () => {
    const admission = { evaluate: vi.fn(() => { throw new Error('admission engine leaked raw-secret-value'); }) };
    const execute = vi.fn();
    const result = await executeModelGatewayAdapter(VALID_INPUT, admission, { execute });

    expect(result.accepted).toBe(false);
    expect(result.executorCalled).toBe(false);
    expect(result.errorEnvelope?.code).toBe('NATIVE_ADMISSION_EVALUATION_FAILED');
    expect(JSON.stringify(result)).not.toContain('raw-secret-value');
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects malformed admission evidence (missing finalDecision) and calls the executor zero times', async () => {
    const admission = { evaluate: vi.fn(() => ({ requestId: 'mcp-mgw-wwu-t3b-trace' }) as any) };
    const execute = vi.fn();
    const result = await executeModelGatewayAdapter(VALID_INPUT, admission, { execute });

    expect(result.accepted).toBe(false);
    expect(result.executorCalled).toBe(false);
    expect(result.errorEnvelope?.code).toBe('NATIVE_ADMISSION_EVIDENCE_INVALID');
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects admission evidence with an unrecognized decision value', async () => {
    const admission = { evaluate: vi.fn(() => ({ requestId: 'mcp-mgw-wwu-t3b-trace', finalDecision: 'MAYBE' }) as any) };
    const execute = vi.fn();
    const result = await executeModelGatewayAdapter(VALID_INPUT, admission, { execute });

    expect(result.errorEnvelope?.code).toBe('NATIVE_ADMISSION_EVIDENCE_INVALID');
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects admission evidence whose requestId does not bind to the exact trace', async () => {
    const admission = { evaluate: vi.fn(() => ({ requestId: 'mcp-mgw-a-different-trace', finalDecision: 'ALLOW' }) as any) };
    const execute = vi.fn();
    const result = await executeModelGatewayAdapter(VALID_INPUT, admission, { execute });

    expect(result.errorEnvelope?.code).toBe('NATIVE_ADMISSION_EVIDENCE_INVALID');
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects malformed root, cyclic input, and invalid risk without admission or executor calls', async () => {
    const admission = allowAdmission();
    const execute = vi.fn();
    const cyclic = { ...VALID_INPUT, metadata: {} as Record<string, unknown> };
    cyclic.metadata.self = cyclic;

    const nullResult = await executeModelGatewayAdapter(null as any, admission, { execute });
    const cyclicResult = await executeModelGatewayAdapter(cyclic, admission, { execute });
    const riskResult = await executeModelGatewayAdapter(
      { ...VALID_INPUT, requestRiskClass: 'critical ' as any },
      admission,
      { execute }
    );

    expect(nullResult.errorEnvelope?.code).toBe('INVALID_GATEWAY_REQUEST');
    expect(cyclicResult.errorEnvelope).toBeUndefined();
    expect(cyclicResult.accepted).toBe(true);
    expect(riskResult.errorEnvelope?.code).toBe('INVALID_GATEWAY_REQUEST');
    expect(admission.evaluate).toHaveBeenCalledOnce();
    expect(execute).toHaveBeenCalledOnce();
  });

  it('fails closed when hostile admission evidence throws during inspection', async () => {
    const evidence = Object.defineProperty({}, 'requestId', {
      enumerable: true,
      get: () => { throw new Error('evidence leaked raw-secret-value'); },
    });
    const admission = { evaluate: vi.fn(() => evidence as any) };
    const execute = vi.fn();
    const result = await executeModelGatewayAdapter(VALID_INPUT, admission, { execute });

    expect(result.errorEnvelope?.code).toBe('NATIVE_ADMISSION_EVIDENCE_INVALID');
    expect(JSON.stringify(result)).not.toContain('raw-secret-value');
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects BLOCK or ESCALATE evidence without a non-empty deciding guard', async () => {
    const execute = vi.fn();
    const block = { evaluate: vi.fn(() => ({ requestId: 'mcp-mgw-wwu-t3b-trace', finalDecision: 'BLOCK' }) as any) };
    const escalate = { evaluate: vi.fn(() => ({ requestId: 'mcp-mgw-wwu-t3b-trace', finalDecision: 'ESCALATE', escalatedBy: '' }) as any) };

    const blockResult = await executeModelGatewayAdapter(VALID_INPUT, block, { execute });
    const escalateResult = await executeModelGatewayAdapter(VALID_INPUT, escalate, { execute });

    expect(blockResult.errorEnvelope?.code).toBe('NATIVE_ADMISSION_EVIDENCE_INVALID');
    expect(escalateResult.errorEnvelope?.code).toBe('NATIVE_ADMISSION_EVIDENCE_INVALID');
    expect(execute).not.toHaveBeenCalled();
  });

  it('caller-supplied policyResult: allow cannot authorize when native admission blocks', async () => {
    const admission = blockAdmission();
    const execute = vi.fn();
    const hostileInput = { ...VALID_INPUT, policyResult: 'allow' as const };
    const result = await executeModelGatewayAdapter(hostileInput, admission, { execute });

    expect(result.accepted).toBe(false);
    expect(result.executorCalled).toBe(false);
    expect(execute).not.toHaveBeenCalled();
  });

  it('caller-supplied policyResult: deny cannot block when native admission allows', async () => {
    const admission = allowAdmission();
    const execute = vi.fn().mockResolvedValue({ receipt: { decision: 'selected' } });
    const hostileInput = { ...VALID_INPUT, policyResult: 'deny' as const };
    const result = await executeModelGatewayAdapter(hostileInput, admission, { execute });

    expect(result.accepted).toBe(true);
    expect(result.executorCalled).toBe(true);
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({
      policy: expect.objectContaining({ policyResult: 'allow' }),
    }));
  });

  it('rejects unauthorized roles before evaluating native admission or calling the executor', async () => {
    const admission = allowAdmission();
    const execute = vi.fn();
    const result = await executeModelGatewayAdapter(
      { ...VALID_INPUT, agentRole: 'REVIEWER' },
      admission,
      { execute }
    );

    expect(result.errorEnvelope?.code).toBe('ROLE_NOT_AUTHORIZED');
    expect(admission.evaluate).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('rejects nested credential-bearing input before evaluating native admission', async () => {
    const admission = allowAdmission();
    const execute = vi.fn();
    const result = await executeModelGatewayAdapter(
      { ...VALID_INPUT, metadata: { authorization: 'Bearer raw-secret-value' } },
      admission,
      { execute }
    );

    expect(result.errorEnvelope?.code).toBe('RAW_CREDENTIAL_INPUT_REJECTED');
    expect(JSON.stringify(result)).not.toContain('raw-secret-value');
    expect(admission.evaluate).not.toHaveBeenCalled();
    expect(execute).not.toHaveBeenCalled();
  });

  it('fails closed when required fields are missing, before evaluating admission', async () => {
    const admission = allowAdmission();
    const invalid = await executeModelGatewayAdapter({ ...VALID_INPUT, prompt: '' }, admission, {
      execute: vi.fn(),
    });

    expect(invalid.errorEnvelope?.code).toBe('INVALID_GATEWAY_REQUEST');
    expect(admission.evaluate).not.toHaveBeenCalled();
  });

  it('fails closed when the executor is absent, after a native ALLOW and zero executor calls', async () => {
    const admission = allowAdmission();
    const unconfigured = await executeModelGatewayAdapter(VALID_INPUT, admission);

    expect(unconfigured.errorEnvelope?.code).toBe('MODEL_GATEWAY_EXECUTOR_NOT_CONFIGURED');
    expect(unconfigured.admissionEvidence?.decision).toBe('ALLOW');
    expect(admission.evaluate).toHaveBeenCalledOnce();
  });

  it('shields thrown executor details after a native ALLOW', async () => {
    const admission = allowAdmission();
    const result = await executeModelGatewayAdapter(VALID_INPUT, admission, {
      execute: vi.fn().mockRejectedValue(new Error('provider leaked raw-secret-value')),
    });

    expect(result.errorEnvelope?.code).toBe('MODEL_GATEWAY_EXECUTION_FAILED');
    expect(result.executorCalled).toBe(true);
    expect(JSON.stringify(result)).not.toContain('raw-secret-value');
  });

  it('binds native admission, downstream policy, and evidence to the same exact trace', async () => {
    const admission = allowAdmission();
    const execute = vi.fn().mockResolvedValue({ receipt: { decision: 'selected' } });
    const result = await executeModelGatewayAdapter(VALID_INPUT, admission, { execute });

    const [calledContext] = admission.evaluate.mock.calls[0];
    expect(calledContext.traceHash).toBe(VALID_INPUT.traceId);
    expect(result.admissionEvidence?.traceId).toBe(VALID_INPUT.traceId);
    expect(execute).toHaveBeenCalledWith(expect.objectContaining({ traceId: VALID_INPUT.traceId }));
  });
});

interface RegisteredMcpTool {
  handler: (args: Record<string, unknown>) => Promise<{ content: Array<{ type: string; text: string }> }>;
  inputSchema?: { shape?: Record<string, unknown> };
}

describe('cvf_model_gateway_execute -- registered MCP tool composition', () => {
  function getRegisteredTool(server: McpServer): RegisteredMcpTool {
    const registered = (server as unknown as { _registeredTools: Record<string, RegisteredMcpTool> })._registeredTools;
    return registered[MODEL_GATEWAY_EXECUTE_TOOL];
  }

  it('wires the server-owned native engine so a real OPERATOR ALLOW reaches the executor with a truthful execute action', async () => {
    // OPERATOR is genuinely authorized to `execute` in phase BUILD under the
    // canonical authority_gate matrix (AUTHORITY_MATRIX.OPERATOR.BUILD
    // includes 'execute'), so this proves at least one honestly-labeled role
    // still legitimately reaches ALLOW - the fix does not leave every caller
    // fail-closed indiscriminately.
    const server = new McpServer({ name: 'test-server', version: '0.0.0' });
    const engine = createGuardEngine();
    const execute = vi.fn().mockResolvedValue({ receipt: { decision: 'selected' } });
    registerModelGatewayExecuteTool(server, engine, { execute });

    const handler = getRegisteredTool(server).handler;
    const response = await handler({ ...VALID_INPUT, agentRole: 'OPERATOR' });
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.accepted).toBe(true);
    expect(parsed.executorCalled).toBe(true);
    expect(parsed.admissionEvidence.decision).toBe('ALLOW');
    expect(execute).toHaveBeenCalledOnce();
  });

  it('wires the server-owned native engine so a real R3 BLOCK stops before the executor', async () => {
    const server = new McpServer({ name: 'test-server', version: '0.0.0' });
    const engine = createGuardEngine();
    const execute = vi.fn();
    registerModelGatewayExecuteTool(server, engine, { execute });

    const handler = getRegisteredTool(server).handler;
    const response = await handler({ ...VALID_INPUT, requestRiskClass: 'critical' });
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.accepted).toBe(false);
    expect(parsed.executorCalled).toBe(false);
    expect(parsed.admissionEvidence.decision).toBe('BLOCK');
    expect(execute).not.toHaveBeenCalled();
  });

  it('AI_AGENT/orchestrator execution is genuinely BLOCKED by authority_gate at every risk level, not converted to ALLOW by a synthetic "code" prefix', async () => {
    // With the truthful "execute" action label, AI_AGENT (which also covers
    // an ORCHESTRATOR caller via normalizeNativeRole) has no 'execute' verb
    // in its BUILD authority cell, so authority_gate genuinely blocks it -
    // even at the lowest risk class, where the prior "code"-prefixed label
    // would have reached ALLOW. This is the real behavior the semantic
    // action-laundering repair is required to produce.
    const server = new McpServer({ name: 'test-server', version: '0.0.0' });
    const engine = createGuardEngine();
    const execute = vi.fn();
    registerModelGatewayExecuteTool(server, engine, { execute });

    const handler = getRegisteredTool(server).handler;
    const agentResponse = await handler({ ...VALID_INPUT, agentRole: 'AI_AGENT', requestRiskClass: 'low' });
    const orchestratorResponse = await handler({ ...VALID_INPUT, agentRole: 'ORCHESTRATOR', requestRiskClass: 'low' });
    const agentParsed = JSON.parse(agentResponse.content[0].text);
    const orchestratorParsed = JSON.parse(orchestratorResponse.content[0].text);

    expect(agentParsed.accepted).toBe(false);
    expect(agentParsed.executorCalled).toBe(false);
    expect(agentParsed.admissionEvidence.decision).toBe('BLOCK');
    expect(agentParsed.admissionEvidence.blockedBy).toBe('authority_gate');
    expect(orchestratorParsed.accepted).toBe(false);
    expect(orchestratorParsed.executorCalled).toBe(false);
    expect(orchestratorParsed.admissionEvidence.decision).toBe('BLOCK');
    expect(orchestratorParsed.admissionEvidence.blockedBy).toBe('authority_gate');
    expect(execute).not.toHaveBeenCalled();
  });

  it('does not depend on a "code" token: the admission action text carries no "code" verb', async () => {
    const server = new McpServer({ name: 'test-server', version: '0.0.0' });
    const engine = createGuardEngine();
    const evaluateSpy = vi.spyOn(engine, 'evaluate');
    const execute = vi.fn().mockResolvedValue({ receipt: { decision: 'selected' } });
    registerModelGatewayExecuteTool(server, engine, { execute });

    const handler = getRegisteredTool(server).handler;
    await handler({ ...VALID_INPUT, agentRole: 'OPERATOR' });

    expect(evaluateSpy).toHaveBeenCalledOnce();
    const [calledContext] = evaluateSpy.mock.calls[0];
    expect(calledContext.action).not.toMatch(/\bcode\b/);
    expect(calledContext.action).toMatch(/\bexecute\b/);
  });

  it('remains fail-closed by default when no admission engine or executor is supplied', async () => {
    const server = new McpServer({ name: 'test-server', version: '0.0.0' });
    registerModelGatewayExecuteTool(server);

    const handler = getRegisteredTool(server).handler;
    const response = await handler(VALID_INPUT);
    const parsed = JSON.parse(response.content[0].text);

    expect(parsed.accepted).toBe(false);
    expect(parsed.executorCalled).toBe(false);
    expect(parsed.errorEnvelope.code).toBe('NATIVE_ADMISSION_NOT_CONFIGURED');
  });

  it('registers a tool schema with no policyResult field, so a hostile caller cannot even shape one', () => {
    const server = new McpServer({ name: 'test-server', version: '0.0.0' });
    registerModelGatewayExecuteTool(server, createGuardEngine());

    const shape = getRegisteredTool(server).inputSchema?.shape;
    expect(shape ? Object.keys(shape) : []).not.toContain('policyResult');
  });
});
