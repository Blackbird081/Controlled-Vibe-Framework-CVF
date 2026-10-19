import type { ExecutionRequest } from '@/lib/ai';
import { applyDLPFilter } from '@/lib/dlp-filter';

export type ExecutionRequestWithSpecFirst = ExecutionRequest & {
    specFirst?: {
        originalPrompt?: string;
        advisory?: {
            draftSummary?: string;
            draftText?: string;
            [key: string]: unknown;
        };
        [key: string]: unknown;
    };
};

async function redactTextForReadout(value: string | undefined): Promise<string | undefined> {
    if (typeof value !== 'string') return value;
    return (await applyDLPFilter(value)).redacted;
}

export async function buildDlpRedactedReadoutRequest(
    request: Partial<ExecutionRequestWithSpecFirst>,
    dlpWasRedacted: boolean,
): Promise<ExecutionRequestWithSpecFirst> {
    if (!dlpWasRedacted) return request as ExecutionRequestWithSpecFirst;

    const redactedInputs = Object.fromEntries(
        await Promise.all(
            Object.entries(request.inputs ?? {}).map(async ([key, value]) => [
                key,
                (await redactTextForReadout(value)) ?? '',
            ]),
        ),
    );
    const specFirst = request.specFirst
        ? {
            ...request.specFirst,
            originalPrompt: await redactTextForReadout(request.specFirst.originalPrompt),
            advisory: request.specFirst.advisory
                ? {
                    ...request.specFirst.advisory,
                    draftSummary: await redactTextForReadout(request.specFirst.advisory.draftSummary),
                    draftText: await redactTextForReadout(request.specFirst.advisory.draftText),
                }
                : request.specFirst.advisory,
        }
        : request.specFirst;

    return {
        ...request,
        templateId: request.templateId ?? '',
        templateName: (await redactTextForReadout(request.templateName)) ?? '',
        inputs: redactedInputs,
        intent: (await redactTextForReadout(request.intent)) ?? '',
        specFirst,
    } as ExecutionRequestWithSpecFirst;
}

