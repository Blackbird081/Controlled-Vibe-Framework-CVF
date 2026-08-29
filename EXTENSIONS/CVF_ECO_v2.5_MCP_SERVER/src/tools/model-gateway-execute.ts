import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { withMcpToolAudit } from '../audit/mcp-tool-audit.js';
import type { GuardRuntimeEngine } from 'cvf-guard-contract';
import type { GuardRequestContext } from '../guards/types.js';

export const MODEL_GATEWAY_EXECUTE_TOOL = 'cvf_model_gateway_execute' as const;
export const MODEL_GATEWAY_EXECUTE_ADAPTER_CONTRACT =
  'cvf.mcpModelGatewayExecuteAdapter.rfrR3.v2' as const;

const ALLOWED_ROLES = new Set(['OPERATOR', 'ORCHESTRATOR', 'AI_AGENT']);
const SECRET_KEY = /^(?:api[_-]?key|authorization|credential(?:Ref(?:erence)?)?|password|secret|(?:access|auth|bearer)[_-]?token)$/i;
const NATIVE_ROLE_MAP: Record<string, 'OPERATOR' | 'AI_AGENT' | 'HUMAN' | 'REVIEWER'> = {
  OPERATOR: 'OPERATOR',
  ORCHESTRATOR: 'AI_AGENT',
  AI_AGENT: 'AI_AGENT',
};

export interface ModelGatewayExecuteInput {
  traceId: string;
  prompt: string;
  systemPrompt?: string;
  agentRole: string;
  requestRiskClass?: 'low' | 'medium' | 'high' | 'critical';
  operatorId?: string;
  workspaceId?: string;
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
  allowedProviderIds?: string[];
  blockedProviderIds?: string[];
  preferredProviderId?: string;
  requestedModelId?: string;
  estimatedTokens?: number;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface GatewayExecuteRequestPort {
  traceId: string;
  prompt: string;
  systemPrompt?: string;
  policy: {
    traceId: string;
    policyResult: 'allow' | 'deny' | 'requires_approval';
    operatorId?: string;
    workspaceId?: string;
    dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
    requestRiskClass?: 'low' | 'medium' | 'high' | 'critical';
    allowedProviderIds?: string[];
    blockedProviderIds?: string[];
  };
  routing?: {
    traceId: string;
    policy: GatewayExecuteRequestPort['policy'];
    preferredProviderId?: string;
    requestedModelId?: string;
    estimatedTokens?: number;
  };
  metadata?: Record<string, unknown>;
}

export interface ModelGatewayExecutorPort {
  execute(request: GatewayExecuteRequestPort): Promise<{
    response?: Record<string, unknown>;
    error?: Record<string, unknown>;
    receipt: Record<string, unknown>;
  }>;
}

/**
 * Native CVF admission evidence bound to the exact request trace. This is
 * derived only from the server-owned guard engine's evaluation result; it is
 * never accepted as MCP caller input and never claims a Model Gateway/
 * provider call occurred.
 */
export interface ModelGatewayAdmissionEvidence {
  traceId: string;
  decision: 'ALLOW' | 'BLOCK' | 'ESCALATE';
  guardRequestId: string;
  blockedBy?: string;
  escalatedBy?: string;
}

export interface ModelGatewayExecuteAdapterResult {
  contractVersion: typeof MODEL_GATEWAY_EXECUTE_ADAPTER_CONTRACT;
  tool: typeof MODEL_GATEWAY_EXECUTE_TOOL;
  accepted: boolean;
  executorCalled: boolean;
  liveProviderCallClaimed: false;
  rawSecretPrinted: false;
  admissionEvidence?: ModelGatewayAdmissionEvidence;
  gatewayResult?: {
    response?: Record<string, unknown>;
    error?: Record<string, unknown>;
    receipt: Record<string, unknown>;
  };
  errorEnvelope?: {
    code: string;
    message: string;
    traceId?: string;
    retryable: boolean;
    credentialShielded: true;
  };
}

function containsCredentialMaterial(value: unknown, seen = new WeakSet<object>()): boolean {
  if (!value || typeof value !== 'object') {
    return false;
  }
  if (seen.has(value)) {
    return false;
  }
  seen.add(value);
  if (Array.isArray(value)) {
    return value.some((nested) => containsCredentialMaterial(nested, seen));
  }
  return Object.entries(value as Record<string, unknown>).some(
    ([key, nested]) => SECRET_KEY.test(key) || containsCredentialMaterial(nested, seen)
  );
}

function rejected(
  code: string,
  message: string,
  traceId?: string,
  admissionEvidence?: ModelGatewayAdmissionEvidence
): ModelGatewayExecuteAdapterResult {
  return {
    contractVersion: MODEL_GATEWAY_EXECUTE_ADAPTER_CONTRACT,
    tool: MODEL_GATEWAY_EXECUTE_TOOL,
    accepted: false,
    executorCalled: false,
    liveProviderCallClaimed: false,
    rawSecretPrinted: false,
    ...(admissionEvidence !== undefined ? { admissionEvidence } : {}),
    errorEnvelope: {
      code,
      message,
      traceId,
      retryable: false,
      credentialShielded: true,
    },
  };
}

function normalizeNativeRole(role: string): 'OPERATOR' | 'AI_AGENT' | 'HUMAN' | 'REVIEWER' {
  return NATIVE_ROLE_MAP[role] ?? 'AI_AGENT';
}

function normalizeNativeRiskLevel(requestRiskClass: ModelGatewayExecuteInput['requestRiskClass']): 'R0' | 'R1' | 'R2' | 'R3' {
  switch (requestRiskClass) {
    case 'critical':
      return 'R3';
    case 'high':
      return 'R2';
    case 'medium':
      return 'R1';
    case 'low':
    default:
      return 'R0';
  }
}

/**
 * Builds a deterministic, secret-safe native admission context from
 * validated MCP intent, role, trace, and risk inputs only. The returned
 * context carries no prompt text, provider selection, credential, or
 * caller-supplied policy field.
 */
function buildAdmissionContext(traceId: string, role: string, riskClass: ModelGatewayExecuteInput['requestRiskClass']): GuardRequestContext {
  // The action is truthfully labeled "execute": this native admission check
  // gates an actual Model Gateway execution call, not code authoring. Using
  // the truthful verb means the canonical authority_gate matrix decides this
  // honestly: OPERATOR is authorized to `execute` in phase BUILD
  // (AUTHORITY_MATRIX.OPERATOR.BUILD includes 'execute'), so an OPERATOR
  // caller can genuinely reach ALLOW. AI_AGENT (which also covers an
  // ORCHESTRATOR caller via normalizeNativeRole) has no `execute` verb in
  // its BUILD cell, so an AI_AGENT/ORCHESTRATOR caller is truthfully BLOCKED
  // by authority_gate rather than being relabeled with an allow-listed verb
  // (such as "code") purely to obtain ALLOW. This is not a permissive
  // default: risk_gate/phase_gate/authority_gate still evaluate this
  // context and can still BLOCK/ESCALATE it on their own independent
  // grounds even for an OPERATOR caller.
  return {
    requestId: `mcp-mgw-${traceId}`,
    phase: 'BUILD',
    riskLevel: normalizeNativeRiskLevel(riskClass),
    role: normalizeNativeRole(role),
    agentId: `mcp-caller-${traceId}`,
    action: 'execute: model gateway request',
    traceHash: traceId,
  };
}

function isMalformedAdmissionEvidence(traceId: string, evidence: unknown): boolean {
  if (!evidence || typeof evidence !== 'object') {
    return true;
  }
  const candidate = evidence as { requestId?: unknown; finalDecision?: unknown };
  if (typeof candidate.requestId !== 'string' || candidate.requestId.trim() === '') {
    return true;
  }
  if (candidate.requestId !== `mcp-mgw-${traceId}`) {
    return true;
  }
  if (
    candidate.finalDecision !== 'ALLOW' &&
    candidate.finalDecision !== 'BLOCK' &&
    candidate.finalDecision !== 'ESCALATE'
  ) {
    return true;
  }
  if (
    candidate.finalDecision === 'BLOCK' &&
    (typeof (candidate as { blockedBy?: unknown }).blockedBy !== 'string' ||
      (candidate as { blockedBy: string }).blockedBy.trim() === '')
  ) {
    return true;
  }
  if (
    candidate.finalDecision === 'ESCALATE' &&
    (typeof (candidate as { escalatedBy?: unknown }).escalatedBy !== 'string' ||
      (candidate as { escalatedBy: string }).escalatedBy.trim() === '')
  ) {
    return true;
  }
  return false;
}

function isValidRiskClass(value: unknown): value is ModelGatewayExecuteInput['requestRiskClass'] {
  return value === undefined || value === 'low' || value === 'medium' || value === 'high' || value === 'critical';
}

export async function executeModelGatewayAdapter(
  input: ModelGatewayExecuteInput,
  admission?: Pick<GuardRuntimeEngine, 'evaluate'>,
  executor?: ModelGatewayExecutorPort
): Promise<ModelGatewayExecuteAdapterResult> {
  let traceId: string | undefined;
  let prompt: string | undefined;
  let role: string | undefined;
  try {
    if (!input || typeof input !== 'object' || Array.isArray(input)) {
      return rejected('INVALID_GATEWAY_REQUEST', 'MCP execution input must be an object.');
    }
    traceId = typeof input.traceId === 'string' ? input.traceId.trim() : undefined;
    prompt = typeof input.prompt === 'string' ? input.prompt.trim() : undefined;
    role = typeof input.agentRole === 'string' ? input.agentRole.trim().toUpperCase() : undefined;
    if (containsCredentialMaterial(input)) {
      return rejected(
        'RAW_CREDENTIAL_INPUT_REJECTED',
        'Credential-bearing fields are not accepted by the MCP execution adapter.',
        traceId
      );
    }
    if (!traceId || !prompt || !role || !isValidRiskClass(input.requestRiskClass)) {
      return rejected(
        'INVALID_GATEWAY_REQUEST',
        'traceId, prompt, and agentRole must be non-empty strings; requestRiskClass must be valid when supplied.',
        traceId
      );
    }
  } catch {
    return rejected(
      'INVALID_GATEWAY_REQUEST',
      'MCP execution input could not be validated safely.'
    );
  }
  if (!ALLOWED_ROLES.has(role)) {
    return rejected('ROLE_NOT_AUTHORIZED', 'Caller role is not authorized for this MCP tool.', traceId);
  }
  if (!admission) {
    return rejected(
      'NATIVE_ADMISSION_NOT_CONFIGURED',
      'Native CVF admission is not configured for this MCP server instance.',
      traceId
    );
  }

  let pipelineResult: { requestId: string; finalDecision: string; blockedBy?: string; escalatedBy?: string };
  try {
    pipelineResult = admission.evaluate(buildAdmissionContext(traceId, role, input.requestRiskClass));
  } catch {
    return rejected(
      'NATIVE_ADMISSION_EVALUATION_FAILED',
      'Native CVF admission failed behind the credential boundary.',
      traceId
    );
  }

  try {
    if (isMalformedAdmissionEvidence(traceId, pipelineResult)) {
      return rejected(
        'NATIVE_ADMISSION_EVIDENCE_INVALID',
        'Native CVF admission returned malformed or trace-mismatched evidence.',
        traceId
      );
    }
  } catch {
    return rejected(
      'NATIVE_ADMISSION_EVIDENCE_INVALID',
      'Native CVF admission evidence could not be validated safely.',
      traceId
    );
  }

  const admissionEvidence: ModelGatewayAdmissionEvidence = {
    traceId,
    decision: pipelineResult.finalDecision as 'ALLOW' | 'BLOCK' | 'ESCALATE',
    guardRequestId: pipelineResult.requestId,
    blockedBy: pipelineResult.blockedBy,
    escalatedBy: pipelineResult.escalatedBy,
  };

  if (admissionEvidence.decision === 'BLOCK') {
    return rejected(
      'NATIVE_ADMISSION_BLOCKED',
      'Native CVF admission blocked this request before Model Gateway execution.',
      traceId,
      admissionEvidence
    );
  }
  if (admissionEvidence.decision === 'ESCALATE') {
    return rejected(
      'NATIVE_ADMISSION_ESCALATION_REQUIRED',
      'Native CVF admission requires approval before Model Gateway execution.',
      traceId,
      admissionEvidence
    );
  }
  if (!executor) {
    return rejected(
      'MODEL_GATEWAY_EXECUTOR_NOT_CONFIGURED',
      'Model Gateway executor is not configured for this MCP server instance.',
      traceId,
      admissionEvidence
    );
  }

  const policy: GatewayExecuteRequestPort['policy'] = {
    traceId,
    policyResult: 'allow',
    operatorId: input.operatorId,
    workspaceId: input.workspaceId,
    dataClassification: input.dataClassification,
    requestRiskClass: input.requestRiskClass,
    allowedProviderIds: input.allowedProviderIds,
    blockedProviderIds: input.blockedProviderIds,
  };
  const request: GatewayExecuteRequestPort = {
    traceId,
    prompt,
    systemPrompt: input.systemPrompt,
    policy,
    routing: {
      traceId,
      policy,
      preferredProviderId: input.preferredProviderId,
      requestedModelId: input.requestedModelId,
      estimatedTokens: input.estimatedTokens,
    },
    metadata: input.metadata,
  };

  try {
    const gatewayResult = await executor.execute(request);
    return {
      contractVersion: MODEL_GATEWAY_EXECUTE_ADAPTER_CONTRACT,
      tool: MODEL_GATEWAY_EXECUTE_TOOL,
      accepted: true,
      executorCalled: true,
      liveProviderCallClaimed: false,
      rawSecretPrinted: false,
      admissionEvidence,
      gatewayResult,
    };
  } catch {
    return {
      ...rejected(
        'MODEL_GATEWAY_EXECUTION_FAILED',
        'Model Gateway executor failed behind the credential boundary.',
        traceId,
        admissionEvidence
      ),
      executorCalled: true,
    };
  }
}

export function registerModelGatewayExecuteTool(
  server: McpServer,
  admission?: Pick<GuardRuntimeEngine, 'evaluate'>,
  executor?: ModelGatewayExecutorPort
): void {
  server.tool(
    MODEL_GATEWAY_EXECUTE_TOOL,
    'Execute through an injected CVF Model Gateway executor, gated by mandatory native CVF admission. Caller intent data cannot authorize execution; only a server-owned native admission ALLOW can. Fails closed when native admission or the executor is not configured.',
    {
      traceId: z.string().min(1),
      prompt: z.string().min(1),
      systemPrompt: z.string().optional(),
      agentRole: z.string(),
      operatorId: z.string().optional(),
      workspaceId: z.string().optional(),
      dataClassification: z.enum(['public', 'internal', 'confidential', 'restricted']).optional(),
      requestRiskClass: z.enum(['low', 'medium', 'high', 'critical']).optional(),
      allowedProviderIds: z.array(z.string()).optional(),
      blockedProviderIds: z.array(z.string()).optional(),
      preferredProviderId: z.string().optional(),
      requestedModelId: z.string().optional(),
      estimatedTokens: z.number().int().positive().optional(),
      metadata: z.record(z.string(), z.unknown()).optional(),
    },
    async (args) => withMcpToolAudit(
      MODEL_GATEWAY_EXECUTE_TOOL,
      args as Record<string, unknown>,
      async () => ({
        content: [{
          type: 'text' as const,
          text: JSON.stringify(
            await executeModelGatewayAdapter(args as ModelGatewayExecuteInput, admission, executor),
            null,
            2
          ),
        }],
      })
    )
  );
}
