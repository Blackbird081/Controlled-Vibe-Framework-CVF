import type { AIProvider } from '@/lib/ai/types';

export type ExecutionDiagnosticStage =
    | 'request_validation'
    | 'auth'
    | 'rate_limit'
    | 'governance'
    | 'routing'
    | 'provider'
    | 'output_validation'
    | 'storage'
    | 'network'
    | 'benchmark_model'
    | 'unknown';

export type ExecutionDiagnosticClass =
    | 'invalid_input'
    | 'missing_api_key'
    | 'invalid_api_key'
    | 'insufficient_balance'
    | 'quota_exceeded'
    | 'rate_limited'
    | 'provider_timeout'
    | 'provider_http_error'
    | 'model_unavailable'
    | 'provider_empty_output'
    | 'provider_parse_error'
    | 'policy_blocked'
    | 'approval_required'
    | 'routing_denied'
    | 'routing_unresolved'
    | 'output_validation_failed'
    | 'mock_fallback'
    | 'receipt_missing'
    | 'receipt_non_live'
    | 'benchmark_denominator_ambiguous'
    | 'network_error'
    | 'worker_timeout'
    | 'worker_timeout_recovered'
    | 'review_deadlock'
    | 'review_deadlock_decomposed'
    | 'unknown_error';

export type ExecutionDiagnosticUserAction =
    | 'check_api_key'
    | 'top_up_or_check_quota'
    | 'wait_and_retry'
    | 'change_model'
    | 'lower_risk_or_change_provider'
    | 'revise_request'
    | 'request_approval'
    | 'contact_admin'
    | 'inspect_receipt'
    | 'do_not_retry_without_new_evidence'
    | 'none';

export interface ExecutionDiagnostic {
    contractVersion: 'cvf.executionDiagnostic.v1';
    stage: ExecutionDiagnosticStage;
    class: ExecutionDiagnosticClass;
    retryable: boolean;
    userAction: ExecutionDiagnosticUserAction;
    safeMessage: string;
    provider?: AIProvider | string;
    model?: string;
    httpStatus?: number;
    latencyMs?: number;
    receiptId?: string;
    traceId?: string;
}

export interface BuildExecutionDiagnosticInput {
    stage: ExecutionDiagnosticStage;
    class: ExecutionDiagnosticClass;
    retryable?: boolean;
    userAction?: ExecutionDiagnosticUserAction;
    safeMessage?: string;
    provider?: AIProvider | string;
    model?: string;
    httpStatus?: number;
    latencyMs?: number;
    receiptId?: string;
    traceId?: string;
}

const DEFAULT_BY_CLASS: Record<ExecutionDiagnosticClass, {
    retryable: boolean;
    userAction: ExecutionDiagnosticUserAction;
    safeMessage: string;
}> = {
    invalid_input: { retryable: false, userAction: 'revise_request', safeMessage: 'The request payload is invalid or incomplete.' },
    missing_api_key: { retryable: false, userAction: 'check_api_key', safeMessage: 'The selected provider has no configured API key.' },
    invalid_api_key: { retryable: false, userAction: 'check_api_key', safeMessage: 'The provider rejected the configured API key or token.' },
    insufficient_balance: { retryable: false, userAction: 'top_up_or_check_quota', safeMessage: 'The provider account appears to lack balance or quota.' },
    quota_exceeded: { retryable: false, userAction: 'top_up_or_check_quota', safeMessage: 'The execution was blocked by quota limits.' },
    rate_limited: { retryable: true, userAction: 'wait_and_retry', safeMessage: 'The request was rate limited.' },
    provider_timeout: { retryable: true, userAction: 'wait_and_retry', safeMessage: 'The provider call exceeded the configured timeout.' },
    provider_http_error: { retryable: true, userAction: 'wait_and_retry', safeMessage: 'The provider returned an HTTP error.' },
    model_unavailable: { retryable: false, userAction: 'change_model', safeMessage: 'The selected model is unavailable for the current provider account or endpoint.' },
    provider_empty_output: { retryable: true, userAction: 'wait_and_retry', safeMessage: 'The provider returned no usable output.' },
    provider_parse_error: { retryable: true, userAction: 'wait_and_retry', safeMessage: 'The provider response could not be parsed into the expected shape.' },
    policy_blocked: { retryable: false, userAction: 'revise_request', safeMessage: 'CVF policy blocked this execution.' },
    approval_required: { retryable: false, userAction: 'request_approval', safeMessage: 'Human approval is required before execution can continue.' },
    routing_denied: { retryable: false, userAction: 'lower_risk_or_change_provider', safeMessage: 'Provider routing denied the requested lane.' },
    routing_unresolved: { retryable: false, userAction: 'contact_admin', safeMessage: 'Provider routing could not resolve an executable lane.' },
    output_validation_failed: { retryable: false, userAction: 'revise_request', safeMessage: 'The generated output did not satisfy CVF output validation.' },
    mock_fallback: { retryable: false, userAction: 'do_not_retry_without_new_evidence', safeMessage: 'The run used mock fallback and cannot support a live governance claim.' },
    receipt_missing: { retryable: false, userAction: 'inspect_receipt', safeMessage: 'The run did not emit a required governance receipt.' },
    receipt_non_live: { retryable: false, userAction: 'inspect_receipt', safeMessage: 'The run did not emit a live governance receipt.' },
    benchmark_denominator_ambiguous: { retryable: false, userAction: 'inspect_receipt', safeMessage: 'Benchmark event denominators need call-level clarification.' },
    network_error: { retryable: true, userAction: 'wait_and_retry', safeMessage: 'A network error interrupted execution.' },
    worker_timeout: { retryable: true, userAction: 'wait_and_retry', safeMessage: 'The worker execution step timed out and will be retried.' },
    worker_timeout_recovered: { retryable: false, userAction: 'none', safeMessage: 'Worker timeout was recovered: sandbox cleared and task re-dispatched successfully.' },
    review_deadlock: { retryable: false, userAction: 'contact_admin', safeMessage: 'Reviewer rejected the output more than 3 times — deadlock detected.' },
    review_deadlock_decomposed: { retryable: false, userAction: 'none', safeMessage: 'Review deadlock was decomposed into micro-tasks and re-dispatched.' },
    unknown_error: { retryable: false, userAction: 'do_not_retry_without_new_evidence', safeMessage: 'The execution failed for an unclassified reason.' },
};

const SECRET_PATTERNS = [
    /sk-[A-Za-z0-9_-]{8,}/g,
    /Bearer\s+[A-Za-z0-9._~+/=-]+/gi,
    /(api[_-]?key|token|signature|secret)\s*[:=]\s*["']?[^"'\s,}]+/gi,
];

export function redactDiagnosticMessage(value: unknown): string {
    const raw = value instanceof Error ? value.message : String(value ?? '');
    return SECRET_PATTERNS.reduce(
        (message, pattern) => message.replace(pattern, '[redacted]'),
        raw,
    ).slice(0, 300);
}

export function classifyProviderError(error: unknown): Pick<BuildExecutionDiagnosticInput, 'class' | 'retryable' | 'userAction' | 'safeMessage'> {
    const message = redactDiagnosticMessage(error).toLowerCase();
    if (message.includes('timeout') || message.includes('aborted') || message.includes('aborterror')) {
        return { class: 'provider_timeout', retryable: true, userAction: 'wait_and_retry', safeMessage: DEFAULT_BY_CLASS.provider_timeout.safeMessage };
    }
    if (message.includes('insufficient') || message.includes('balance') || message.includes('quota')) {
        return { class: 'insufficient_balance', retryable: false, userAction: 'top_up_or_check_quota', safeMessage: DEFAULT_BY_CLASS.insufficient_balance.safeMessage };
    }
    if (message.includes('rate limit') || message.includes('too many requests') || message.includes('429')) {
        return { class: 'rate_limited', retryable: true, userAction: 'wait_and_retry', safeMessage: DEFAULT_BY_CLASS.rate_limited.safeMessage };
    }
    if (message.includes('unauthorized') || message.includes('invalid api key') || message.includes('authentication') || message.includes('401')) {
        return { class: 'invalid_api_key', retryable: false, userAction: 'check_api_key', safeMessage: DEFAULT_BY_CLASS.invalid_api_key.safeMessage };
    }
    if (message.includes('model') && (message.includes('not exist') || message.includes('not found') || message.includes('unavailable') || message.includes('not supported'))) {
        return { class: 'model_unavailable', retryable: false, userAction: 'change_model', safeMessage: DEFAULT_BY_CLASS.model_unavailable.safeMessage };
    }
    if (message.includes('network') || message.includes('fetch failed') || message.includes('econnreset')) {
        return { class: 'network_error', retryable: true, userAction: 'wait_and_retry', safeMessage: DEFAULT_BY_CLASS.network_error.safeMessage };
    }
    return { class: 'provider_http_error', retryable: true, userAction: 'wait_and_retry', safeMessage: DEFAULT_BY_CLASS.provider_http_error.safeMessage };
}

export function buildExecutionDiagnostic(input: BuildExecutionDiagnosticInput): ExecutionDiagnostic {
    const defaults = DEFAULT_BY_CLASS[input.class];
    return {
        contractVersion: 'cvf.executionDiagnostic.v1',
        stage: input.stage,
        class: input.class,
        retryable: input.retryable ?? defaults.retryable,
        userAction: input.userAction ?? defaults.userAction,
        safeMessage: input.safeMessage ?? defaults.safeMessage,
        ...(input.provider ? { provider: input.provider } : {}),
        ...(input.model ? { model: input.model } : {}),
        ...(typeof input.httpStatus === 'number' ? { httpStatus: input.httpStatus } : {}),
        ...(typeof input.latencyMs === 'number' ? { latencyMs: input.latencyMs } : {}),
        ...(input.receiptId ? { receiptId: input.receiptId } : {}),
        ...(input.traceId ? { traceId: input.traceId } : {}),
    };
}

export function buildProviderExecutionDiagnostic(params: {
    provider: AIProvider;
    model: string;
    error: unknown;
    latencyMs?: number;
}): ExecutionDiagnostic {
    const classified = classifyProviderError(params.error);
    return buildExecutionDiagnostic({
        stage: 'provider',
        provider: params.provider,
        model: params.model,
        latencyMs: params.latencyMs,
        ...classified,
    });
}

export function renderExecutionDiagnostic(diagnostic: ExecutionDiagnostic): string {
    const target = [diagnostic.provider, diagnostic.model].filter(Boolean).join(' / ');
    const targetSuffix = target ? ` (${target})` : '';
    return `${diagnostic.safeMessage}${targetSuffix} Next action: ${diagnostic.userAction}.`;
}

export function attachReceiptToDiagnostic(
    diagnostic: ExecutionDiagnostic | undefined,
    fallback: ExecutionDiagnostic,
    receiptId?: string,
    traceId?: string,
): ExecutionDiagnostic {
    return {
        ...(diagnostic ?? fallback),
        ...(receiptId && !diagnostic?.receiptId ? { receiptId } : {}),
        ...(traceId && !diagnostic?.traceId ? { traceId } : {}),
    };
}
