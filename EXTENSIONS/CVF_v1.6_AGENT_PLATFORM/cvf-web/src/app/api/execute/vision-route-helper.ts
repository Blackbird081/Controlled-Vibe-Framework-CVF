import type { ExecutionRequest, ExecutionResponse } from '@/lib/ai';
import {
    createAlibabaVisionRuntimeAdapter,
    VISION_RUNTIME_DEFAULT_MODELS,
} from '../../../../../../CVF_MODEL_GATEWAY/src/vision-runtime-adapter';

export interface VisionRouteState {
    isVisionExecution: boolean;
    model?: string;
}

export interface ExecuteVisionRouteInput {
    apiKey: string;
    body: Partial<ExecutionRequest>;
    prompt: string;
    traceId: string;
}

export const VISION_ROUTE_MODEL = VISION_RUNTIME_DEFAULT_MODELS.alibaba;

export function prepareVisionRouteRequest(body: Partial<ExecutionRequest>): VisionRouteState {
    if (typeof body.imageUrl === 'string') {
        body.imageUrl = body.imageUrl.trim() || undefined;
    }
    if (typeof body.imageBase64 === 'string') {
        body.imageBase64 = body.imageBase64.trim() || undefined;
    }
    if (typeof body.mimeType === 'string') {
        body.mimeType = body.mimeType.trim() || undefined;
    }

    const isVisionExecution = Boolean(body.imageUrl || body.imageBase64);
    if (isVisionExecution) {
        body.provider = 'alibaba';
        body.model = VISION_ROUTE_MODEL;
    }

    return {
        isVisionExecution,
        model: isVisionExecution ? VISION_ROUTE_MODEL : undefined,
    };
}

export async function executeVisionRouteRequest(input: ExecuteVisionRouteInput): Promise<ExecutionResponse> {
    const executionStartedAtMs = Date.now();
    const visionAdapter = createAlibabaVisionRuntimeAdapter({
        apiKey: input.apiKey,
        model: VISION_ROUTE_MODEL,
    });
    const visionContract = await visionAdapter.vision({
        traceId: input.traceId,
        prompt: input.prompt,
        imageUrl: input.body.imageUrl,
        imageBase64: input.body.imageBase64,
        mimeType: input.body.mimeType,
    });

    return {
        success: visionContract.done,
        output: visionContract.description,
        error: visionContract.done ? undefined : 'Vision provider returned an empty description.',
        provider: 'alibaba',
        model: VISION_ROUTE_MODEL,
        executionTime: Date.now() - executionStartedAtMs,
    };
}
