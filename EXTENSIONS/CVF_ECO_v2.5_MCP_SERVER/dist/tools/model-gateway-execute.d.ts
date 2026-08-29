import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GuardRuntimeEngine } from 'cvf-guard-contract';
export declare const MODEL_GATEWAY_EXECUTE_TOOL: "cvf_model_gateway_execute";
export declare const MODEL_GATEWAY_EXECUTE_ADAPTER_CONTRACT: "cvf.mcpModelGatewayExecuteAdapter.rfrR3.v2";
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
export declare function executeModelGatewayAdapter(input: ModelGatewayExecuteInput, admission?: Pick<GuardRuntimeEngine, 'evaluate'>, executor?: ModelGatewayExecutorPort): Promise<ModelGatewayExecuteAdapterResult>;
export declare function registerModelGatewayExecuteTool(server: McpServer, admission?: Pick<GuardRuntimeEngine, 'evaluate'>, executor?: ModelGatewayExecutorPort): void;
//# sourceMappingURL=model-gateway-execute.d.ts.map