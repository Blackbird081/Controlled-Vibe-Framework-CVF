import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
export declare const MODEL_GATEWAY_EXECUTE_PREVIEW_CONTRACT: "cvf.modelGatewayMcpRuntimeBridge.wwuT3a.v1";
export declare const MODEL_GATEWAY_EXECUTE_PREVIEW_TOOL: "cvf_model_gateway_execute_preview";
export interface ModelGatewayExecutePreviewInput {
    provider: string;
    model: string;
    prompt?: string;
    messages?: Array<{
        role: string;
        content: string;
    }>;
    maxTokens?: number;
    temperature?: number;
    requestId?: string;
    agentRole?: string;
    dryRunOnly?: boolean;
    apiKey?: string;
    authorization?: string;
    bearerToken?: string;
    credentials?: unknown;
    headers?: Record<string, string>;
    secret?: string;
    token?: string;
}
export interface ModelGatewayExecutePreviewResult {
    contractVersion: typeof MODEL_GATEWAY_EXECUTE_PREVIEW_CONTRACT;
    tool: typeof MODEL_GATEWAY_EXECUTE_PREVIEW_TOOL;
    accepted: boolean;
    previewMode: 'DETERMINISTIC_DRY_RUN';
    runtimeExecutionAuthorized: false;
    liveProviderCallPerformed: false;
    rawSecretPrinted: false;
    gatewayRequest?: Record<string, unknown>;
    previewResponse?: Record<string, unknown>;
    errorEnvelope?: Record<string, unknown>;
    receipt: Record<string, unknown>;
}
export declare function buildModelGatewayExecutePreview(args: ModelGatewayExecutePreviewInput, issuedAt?: Date): ModelGatewayExecutePreviewResult;
export declare function registerModelGatewayExecutePreviewTool(server: McpServer): void;
//# sourceMappingURL=model-gateway-execute-preview.d.ts.map