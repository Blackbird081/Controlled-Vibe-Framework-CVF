import { z } from 'zod';
import { withMcpToolAudit } from '../audit/mcp-tool-audit.js';
export const MODEL_GATEWAY_EXECUTE_PREVIEW_CONTRACT = 'cvf.modelGatewayMcpRuntimeBridge.wwuT3a.v1';
export const MODEL_GATEWAY_EXECUTE_PREVIEW_TOOL = 'cvf_model_gateway_execute_preview';
const FORBIDDEN_CREDENTIAL_KEYS = [
    'apiKey',
    'authorization',
    'bearerToken',
    'credentials',
    'headers',
    'secret',
    'token',
];
function hasCredentialMaterial(args) {
    return FORBIDDEN_CREDENTIAL_KEYS.filter((key) => {
        const value = args[key];
        if (value == null)
            return false;
        if (typeof value === 'string')
            return value.trim().length > 0;
        if (Array.isArray(value))
            return value.length > 0;
        if (typeof value === 'object')
            return Object.keys(value).length > 0;
        return true;
    });
}
function firstPromptText(args) {
    if (typeof args.prompt === 'string' && args.prompt.trim().length > 0) {
        return args.prompt.trim();
    }
    const firstMessage = args.messages?.find((message) => message.content.trim().length > 0);
    return firstMessage?.content.trim() ?? '';
}
function baseReceipt(args, issuedAt) {
    const requestId = args.requestId?.trim() || `wwu-t3a-preview-${issuedAt.toISOString()}`;
    return {
        receiptId: `mcp-model-gateway-preview:${requestId}`,
        requestId,
        issuedAt: issuedAt.toISOString(),
        credentialBoundary: 'NO_RAW_CREDENTIALS_ACCEPTED_OR_PRINTED',
        providerSelectionBoundary: 'CALLER_SUPPLIED_PROVIDER_AND_MODEL_ONLY',
        liveRunBoundary: 'NO_PROVIDER_CALL_PERFORMED',
        sourceCompatibleWith: [
            'GatewayExecuteRequest',
            'GatewayExecuteResponse',
            'GatewayErrorEnvelope',
            'ProviderExecutionBridge.execute',
        ],
    };
}
export function buildModelGatewayExecutePreview(args, issuedAt = new Date()) {
    const provider = args.provider?.trim();
    const model = args.model?.trim();
    const promptText = firstPromptText(args);
    const receipt = baseReceipt(args, issuedAt);
    const forbiddenCredentialKeys = hasCredentialMaterial(args);
    const base = {
        contractVersion: MODEL_GATEWAY_EXECUTE_PREVIEW_CONTRACT,
        tool: MODEL_GATEWAY_EXECUTE_PREVIEW_TOOL,
        previewMode: 'DETERMINISTIC_DRY_RUN',
        runtimeExecutionAuthorized: false,
        liveProviderCallPerformed: false,
        rawSecretPrinted: false,
        receipt,
    };
    if (forbiddenCredentialKeys.length > 0) {
        return {
            ...base,
            accepted: false,
            errorEnvelope: {
                code: 'RAW_CREDENTIAL_INPUT_REJECTED',
                message: 'Raw credential material is forbidden for this MCP preview tool.',
                rejectedKeys: forbiddenCredentialKeys,
                retryable: false,
            },
        };
    }
    if (args.dryRunOnly === false) {
        return {
            ...base,
            accepted: false,
            errorEnvelope: {
                code: 'LIVE_EXECUTION_NOT_AUTHORIZED',
                message: 'WWU-T3A permits deterministic preview only; live provider execution is out of scope.',
                retryable: false,
            },
        };
    }
    if (!provider || !model || !promptText) {
        return {
            ...base,
            accepted: false,
            errorEnvelope: {
                code: 'MISSING_REQUIRED_GATEWAY_FIELDS',
                message: 'provider, model, and prompt or messages content are required.',
                missing: [
                    ...(!provider ? ['provider'] : []),
                    ...(!model ? ['model'] : []),
                    ...(!promptText ? ['prompt_or_messages'] : []),
                ],
                retryable: false,
            },
        };
    }
    const gatewayRequest = {
        requestId: receipt.requestId,
        provider,
        model,
        input: {
            prompt: promptText,
            messages: args.messages?.map((message) => ({
                role: message.role,
                content: message.content,
            })),
        },
        parameters: {
            maxTokens: args.maxTokens,
            temperature: args.temperature,
        },
        metadata: {
            agentRole: args.agentRole ?? 'AI_AGENT',
            mcpTool: MODEL_GATEWAY_EXECUTE_PREVIEW_TOOL,
            previewOnly: true,
        },
    };
    return {
        ...base,
        accepted: true,
        gatewayRequest,
        previewResponse: {
            id: `${receipt.requestId}:preview-response`,
            provider,
            model,
            content: `[preview:${provider}/${model}] ${promptText.slice(0, 120)}`,
            finishReason: 'preview_only',
            usage: {
                promptCharacters: promptText.length,
                completionCharacters: 0,
            },
        },
    };
}
export function registerModelGatewayExecutePreviewTool(server) {
    server.tool(MODEL_GATEWAY_EXECUTE_PREVIEW_TOOL, 'Build a deterministic, secret-safe Model Gateway execute preview. WWU-T3A does not perform live provider calls.', {
        provider: z.string().describe('Source-verified provider id to preview, for example dashscope'),
        model: z.string().describe('Model id to preview'),
        prompt: z.string().optional().describe('Prompt text for preview request mapping'),
        messages: z.array(z.object({
            role: z.string(),
            content: z.string(),
        })).optional().describe('Optional chat-style messages for preview request mapping'),
        maxTokens: z.number().int().positive().optional().describe('Preview-only max token parameter'),
        temperature: z.number().min(0).max(2).optional().describe('Preview-only temperature parameter'),
        requestId: z.string().optional().describe('Optional caller request id for receipt correlation'),
        agentRole: z.string().optional().describe('Caller role for metadata only'),
        dryRunOnly: z.boolean().optional().describe('Must not be false; live execution is not authorized'),
    }, async (args) => withMcpToolAudit(MODEL_GATEWAY_EXECUTE_PREVIEW_TOOL, args, async () => ({
        content: [{
                type: 'text',
                text: JSON.stringify(buildModelGatewayExecutePreview(args), null, 2),
            }],
    })));
}
//# sourceMappingURL=model-gateway-execute-preview.js.map