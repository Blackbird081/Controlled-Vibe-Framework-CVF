import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { withMcpToolAudit } from '../audit/mcp-tool-audit.js';

export const MODEL_GATEWAY_EXECUTE_TOOL = 'cvf_model_gateway_execute' as const;
export const MODEL_GATEWAY_EXECUTE_ADAPTER_CONTRACT =
  'cvf.mcpModelGatewayExecuteAdapter.wwuT3B.v1' as const;

const ALLOWED_ROLES = new Set(['OPERATOR', 'ORCHESTRATOR', 'AI_AGENT']);
const SECRET_KEY = /^(?:api[_-]?key|authorization|credential(?:Ref(?:erence)?)?|password|secret|(?:access|auth|bearer)[_-]?token)$/i;

export interface ModelGatewayExecuteInput {
  traceId: string;
  prompt: string;
  systemPrompt?: string;
  agentRole: string;
  policyResult: 'allow' | 'deny' | 'requires_approval';
  operatorId?: string;
  workspaceId?: string;
  dataClassification?: 'public' | 'internal' | 'confidential' | 'restricted';
  requestRiskClass?: 'low' | 'medium' | 'high' | 'critical';
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

export interface ModelGatewayExecuteAdapterResult {
  contractVersion: typeof MODEL_GATEWAY_EXECUTE_ADAPTER_CONTRACT;
  tool: typeof MODEL_GATEWAY_EXECUTE_TOOL;
  accepted: boolean;
  executorCalled: boolean;
  liveProviderCallClaimed: false;
  rawSecretPrinted: false;
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

function containsCredentialMaterial(value: unknown): boolean {
  if (Array.isArray(value)) {
    return value.some(containsCredentialMaterial);
  }
  if (!value || typeof value !== 'object') {
    return false;
  }
  return Object.entries(value as Record<string, unknown>).some(
    ([key, nested]) => SECRET_KEY.test(key) || containsCredentialMaterial(nested)
  );
}

function rejected(code: string, message: string, traceId?: string): ModelGatewayExecuteAdapterResult {
  return {
    contractVersion: MODEL_GATEWAY_EXECUTE_ADAPTER_CONTRACT,
    tool: MODEL_GATEWAY_EXECUTE_TOOL,
    accepted: false,
    executorCalled: false,
    liveProviderCallClaimed: false,
    rawSecretPrinted: false,
    errorEnvelope: {
      code,
      message,
      traceId,
      retryable: false,
      credentialShielded: true,
    },
  };
}

export async function executeModelGatewayAdapter(
  input: ModelGatewayExecuteInput,
  executor?: ModelGatewayExecutorPort
): Promise<ModelGatewayExecuteAdapterResult> {
  const traceId = input.traceId?.trim();
  const prompt = input.prompt?.trim();
  const role = input.agentRole?.trim().toUpperCase();

  if (containsCredentialMaterial(input)) {
    return rejected(
      'RAW_CREDENTIAL_INPUT_REJECTED',
      'Credential-bearing fields are not accepted by the MCP execution adapter.',
      traceId
    );
  }
  if (!ALLOWED_ROLES.has(role)) {
    return rejected('ROLE_NOT_AUTHORIZED', 'Caller role is not authorized for this MCP tool.', traceId);
  }
  if (!traceId || !prompt || !input.policyResult) {
    return rejected(
      'INVALID_GATEWAY_REQUEST',
      'traceId, prompt, agentRole, and policyResult are required.',
      traceId
    );
  }
  if (!executor) {
    return rejected(
      'MODEL_GATEWAY_EXECUTOR_NOT_CONFIGURED',
      'Model Gateway executor is not configured for this MCP server instance.',
      traceId
    );
  }

  const policy: GatewayExecuteRequestPort['policy'] = {
    traceId,
    policyResult: input.policyResult,
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
      gatewayResult,
    };
  } catch {
    return {
      ...rejected(
        'MODEL_GATEWAY_EXECUTION_FAILED',
        'Model Gateway executor failed behind the credential boundary.',
        traceId
      ),
      executorCalled: true,
    };
  }
}

export function registerModelGatewayExecuteTool(
  server: McpServer,
  executor?: ModelGatewayExecutorPort
): void {
  server.tool(
    MODEL_GATEWAY_EXECUTE_TOOL,
    'Execute through an injected CVF Model Gateway executor. Fails closed when no executor is configured.',
    {
      traceId: z.string().min(1),
      prompt: z.string().min(1),
      systemPrompt: z.string().optional(),
      agentRole: z.string(),
      policyResult: z.enum(['allow', 'deny', 'requires_approval']),
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
            await executeModelGatewayAdapter(args as ModelGatewayExecuteInput, executor),
            null,
            2
          ),
        }],
      })
    )
  );
}
