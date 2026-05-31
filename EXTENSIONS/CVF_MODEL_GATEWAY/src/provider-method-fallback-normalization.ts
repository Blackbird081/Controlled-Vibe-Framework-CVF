import { FallbackPolicy, type FallbackAttempt } from "./fallback-policy";
import {
  classifyProviderExitCode,
  PROVIDER_OUTPUT_EXIT_CODES,
  type ProviderExitClassification,
} from "./provider-output-contract";
import { findProviderCapability, normalizeProviderMethodName } from "./provider-method-gate";
import type { ProviderCapabilityFile, ProviderMethodName } from "./provider-method-contract";
import type { ProviderHealthState } from "./provider-health";

export const PROVIDER_METHOD_FALLBACK_NORMALIZATION_VERSION =
  "cvf.providerMethodFallbackNormalization.w5.v1" as const;

export type ProviderFallbackDiagnosticClass =
  | "none"
  | "missing_provider_model"
  | "unsupported_method"
  | "provider_config_error"
  | "missing_api_key"
  | "invalid_api_key"
  | "provider_forbidden"
  | "provider_not_found"
  | "insufficient_balance"
  | "rate_limited"
  | "provider_timeout"
  | "provider_http_error"
  | "provider_unavailable"
  | "provider_empty_output"
  | "provider_parse_error"
  | "quota_exceeded"
  | "unknown_error";

export type ProviderFallbackUserAction =
  | "proceed"
  | "retry"
  | "choose_supported_method"
  | "choose_registered_provider_model"
  | "add_api_key"
  | "check_api_key_or_permissions"
  | "top_up_balance"
  | "wait_or_reduce_rate"
  | "inspect_provider_status"
  | "reduce_usage_or_change_model"
  | "stop_and_diagnose";

export type ProviderMethodFallbackStatus =
  | "ready"
  | "missing_provider_model"
  | "unsupported_method"
  | "fallback_available"
  | "fallback_unavailable"
  | "blocked_non_retryable"
  | "blocked_quota"
  | "provider_unhealthy";

export interface ProviderMethodFailureInput {
  readonly statusCode?: number;
  readonly exitCode?: number;
  readonly emptyOutput?: boolean;
  readonly parseError?: boolean;
  readonly quotaAllowed?: boolean;
  readonly quotaReason?: string;
  readonly providerHealthState?: ProviderHealthState;
  readonly attempts?: readonly FallbackAttempt[];
  readonly maxAttempts?: number;
  readonly reason?: string;
}

export interface ProviderMethodFallbackEvaluationInput {
  readonly registry: readonly ProviderCapabilityFile[];
  readonly providerId: string;
  readonly modelId: string;
  readonly method: ProviderMethodName;
  readonly failure?: ProviderMethodFailureInput;
}

export interface ProviderFallbackPosture {
  readonly available: boolean;
  readonly retryable: boolean;
  readonly attemptedCount: number;
  readonly remainingAttempts: number;
  readonly reason: string;
}

export interface ProviderMethodFallbackEvaluation {
  readonly version: typeof PROVIDER_METHOD_FALLBACK_NORMALIZATION_VERSION;
  readonly status: ProviderMethodFallbackStatus;
  readonly providerId: string;
  readonly modelId: string;
  readonly requestedMethod: ProviderMethodName;
  readonly normalizedMethod: ProviderMethodName;
  readonly supportedMethods: readonly ProviderMethodName[];
  readonly methodSupported: boolean;
  readonly adapterExecutionAuthorized: boolean;
  readonly diagnosticClass: ProviderFallbackDiagnosticClass;
  readonly retryable: boolean;
  readonly fallback: ProviderFallbackPosture;
  readonly userAction: ProviderFallbackUserAction;
  readonly safeMessage: string;
  readonly exit?: ProviderExitClassification;
}

export function evaluateProviderMethodFallback(
  input: ProviderMethodFallbackEvaluationInput,
): ProviderMethodFallbackEvaluation {
  const normalizedMethod = normalizeProviderMethodName(input.method);
  const lookup = findProviderCapability(input.registry, input.providerId, input.modelId);
  if (!lookup) {
    return buildResult(input, normalizedMethod, [], {
      status: "missing_provider_model",
      methodSupported: false,
      adapterExecutionAuthorized: false,
      diagnosticClass: "missing_provider_model",
      retryable: false,
      fallback: noFallback(input.failure, "provider_model_not_registered"),
      userAction: "choose_registered_provider_model",
      safeMessage: `${input.providerId}/${input.modelId} is not registered in the provider capability registry.`,
    });
  }

  const supportedMethods = lookup.model.supportedMethods;
  const methodSupported = supportsMethod(supportedMethods, input.method, normalizedMethod);
  if (!methodSupported) {
    return buildResult(input, normalizedMethod, supportedMethods, {
      status: "unsupported_method",
      methodSupported,
      adapterExecutionAuthorized: false,
      diagnosticClass: "unsupported_method",
      retryable: false,
      fallback: noFallback(input.failure, "method_not_supported_by_model"),
      userAction: "choose_supported_method",
      safeMessage: `${input.providerId}/${input.modelId} does not support ${input.method}; supported methods: ${supportedMethods.join(", ") || "none"}.`,
    });
  }

  if (!input.failure) {
    return buildResult(input, normalizedMethod, supportedMethods, {
      status: "ready",
      methodSupported,
      adapterExecutionAuthorized: true,
      diagnosticClass: "none",
      retryable: false,
      fallback: noFallback(undefined, "no_failure_present"),
      userAction: "proceed",
      safeMessage: `${input.providerId}/${input.modelId} supports ${input.method}.`,
    });
  }

  const diagnostic = classifyFailure(input.failure);
  const fallback = buildFallbackPosture(input.failure, diagnostic.retryable);
  const status = chooseFailureStatus(input.failure, diagnostic.diagnosticClass, fallback.available);

  return buildResult(input, normalizedMethod, supportedMethods, {
    status,
    methodSupported,
    adapterExecutionAuthorized: false,
    diagnosticClass: diagnostic.diagnosticClass,
    retryable: diagnostic.retryable,
    fallback,
    userAction: diagnostic.userAction,
    safeMessage: buildSafeFailureMessage(input, diagnostic.diagnosticClass, fallback),
    exit: diagnostic.exit,
  });
}

function supportsMethod(
  supportedMethods: readonly ProviderMethodName[],
  method: ProviderMethodName,
  normalizedMethod: ProviderMethodName,
): boolean {
  return supportedMethods.includes(method)
    || supportedMethods.includes(normalizedMethod)
    || (normalizedMethod === "complete" && supportedMethods.includes("chat"));
}

function classifyFailure(failure: ProviderMethodFailureInput): {
  diagnosticClass: ProviderFallbackDiagnosticClass;
  retryable: boolean;
  userAction: ProviderFallbackUserAction;
  exit?: ProviderExitClassification;
} {
  if (failure.quotaAllowed === false) {
    return {
      diagnosticClass: "quota_exceeded",
      retryable: false,
      userAction: "reduce_usage_or_change_model",
    };
  }
  if (failure.emptyOutput) {
    return {
      diagnosticClass: "provider_empty_output",
      retryable: false,
      userAction: "stop_and_diagnose",
    };
  }
  if (failure.parseError) {
    return {
      diagnosticClass: "provider_parse_error",
      retryable: false,
      userAction: "stop_and_diagnose",
    };
  }
  if (failure.providerHealthState === "rate_limited") {
    return {
      diagnosticClass: "rate_limited",
      retryable: true,
      userAction: "wait_or_reduce_rate",
    };
  }
  if (failure.providerHealthState === "unavailable") {
    return {
      diagnosticClass: "provider_unavailable",
      retryable: true,
      userAction: "inspect_provider_status",
    };
  }
  if (failure.exitCode !== undefined) {
    return classifyExitFailure(failure.exitCode);
  }
  if (failure.statusCode !== undefined) {
    return classifyHttpFailure(failure.statusCode);
  }
  return {
    diagnosticClass: "unknown_error",
    retryable: false,
    userAction: "stop_and_diagnose",
  };
}

function classifyExitFailure(exitCode: number): {
  diagnosticClass: ProviderFallbackDiagnosticClass;
  retryable: boolean;
  userAction: ProviderFallbackUserAction;
  exit: ProviderExitClassification;
} {
  const exit = classifyProviderExitCode(exitCode);
  switch (exitCode) {
    case PROVIDER_OUTPUT_EXIT_CODES.CONFIG_ERROR:
      return { diagnosticClass: "provider_config_error", retryable: false, userAction: "stop_and_diagnose", exit };
    case PROVIDER_OUTPUT_EXIT_CODES.MISSING_API_KEY:
      return { diagnosticClass: "missing_api_key", retryable: false, userAction: "add_api_key", exit };
    case PROVIDER_OUTPUT_EXIT_CODES.UNAUTHORIZED:
      return { diagnosticClass: "invalid_api_key", retryable: false, userAction: "check_api_key_or_permissions", exit };
    case PROVIDER_OUTPUT_EXIT_CODES.FORBIDDEN:
      return { diagnosticClass: "provider_forbidden", retryable: false, userAction: "check_api_key_or_permissions", exit };
    case PROVIDER_OUTPUT_EXIT_CODES.NOT_FOUND:
      return { diagnosticClass: "provider_not_found", retryable: false, userAction: "choose_registered_provider_model", exit };
    case PROVIDER_OUTPUT_EXIT_CODES.INSUFFICIENT_CREDITS:
      return { diagnosticClass: "insufficient_balance", retryable: false, userAction: "top_up_balance", exit };
    case PROVIDER_OUTPUT_EXIT_CODES.RATE_LIMITED:
      return { diagnosticClass: "rate_limited", retryable: true, userAction: "wait_or_reduce_rate", exit };
    case PROVIDER_OUTPUT_EXIT_CODES.TIMEOUT:
      return { diagnosticClass: "provider_timeout", retryable: true, userAction: "retry", exit };
    case PROVIDER_OUTPUT_EXIT_CODES.UNEXPECTED_RESPONSE_SHAPE:
      return { diagnosticClass: "provider_parse_error", retryable: false, userAction: "stop_and_diagnose", exit };
    case PROVIDER_OUTPUT_EXIT_CODES.ASYNC_JOB_FAILED:
      return { diagnosticClass: "provider_http_error", retryable: false, userAction: "inspect_provider_status", exit };
    default:
      return { diagnosticClass: "unknown_error", retryable: exit.retryable, userAction: "stop_and_diagnose", exit };
  }
}

function classifyHttpFailure(statusCode: number): {
  diagnosticClass: ProviderFallbackDiagnosticClass;
  retryable: boolean;
  userAction: ProviderFallbackUserAction;
} {
  if (statusCode === 401) {
    return { diagnosticClass: "invalid_api_key", retryable: false, userAction: "check_api_key_or_permissions" };
  }
  if (statusCode === 403) {
    return { diagnosticClass: "provider_forbidden", retryable: false, userAction: "check_api_key_or_permissions" };
  }
  if (statusCode === 402) {
    return { diagnosticClass: "insufficient_balance", retryable: false, userAction: "top_up_balance" };
  }
  if (statusCode === 404) {
    return { diagnosticClass: "provider_not_found", retryable: false, userAction: "choose_registered_provider_model" };
  }
  if (statusCode === 408) {
    return { diagnosticClass: "provider_timeout", retryable: true, userAction: "retry" };
  }
  if (statusCode === 429) {
    return { diagnosticClass: "rate_limited", retryable: true, userAction: "wait_or_reduce_rate" };
  }
  if ([500, 502, 503, 504].includes(statusCode)) {
    return { diagnosticClass: "provider_http_error", retryable: true, userAction: "inspect_provider_status" };
  }
  return { diagnosticClass: "provider_http_error", retryable: false, userAction: "stop_and_diagnose" };
}

function buildFallbackPosture(
  failure: ProviderMethodFailureInput,
  retryable: boolean,
): ProviderFallbackPosture {
  const attempts = [...(failure.attempts ?? [])];
  if (!retryable) {
    return {
      available: false,
      retryable: false,
      attemptedCount: attempts.length,
      remainingAttempts: Math.max((failure.maxAttempts ?? 3) - attempts.length, 0),
      reason: "failure_class_not_retryable",
    };
  }

  const policy = new FallbackPolicy({ maxAttempts: failure.maxAttempts ?? 3 });
  const decision = policy.decide(attempts, failure.statusCode);
  return {
    available: decision.shouldFallback,
    retryable,
    attemptedCount: attempts.length,
    remainingAttempts: decision.remainingAttempts,
    reason: decision.reason,
  };
}

function chooseFailureStatus(
  failure: ProviderMethodFailureInput,
  diagnosticClass: ProviderFallbackDiagnosticClass,
  fallbackAvailable: boolean,
): ProviderMethodFallbackStatus {
  if (failure.quotaAllowed === false || diagnosticClass === "quota_exceeded") {
    return "blocked_quota";
  }
  if (failure.providerHealthState === "unavailable") {
    return fallbackAvailable ? "fallback_available" : "provider_unhealthy";
  }
  if (fallbackAvailable) {
    return "fallback_available";
  }
  if (diagnosticClass === "rate_limited" || diagnosticClass === "provider_timeout" || diagnosticClass === "provider_http_error") {
    return "fallback_unavailable";
  }
  return "blocked_non_retryable";
}

function noFallback(
  failure: ProviderMethodFailureInput | undefined,
  reason: string,
): ProviderFallbackPosture {
  const attemptedCount = failure?.attempts?.length ?? 0;
  return {
    available: false,
    retryable: false,
    attemptedCount,
    remainingAttempts: Math.max((failure?.maxAttempts ?? 3) - attemptedCount, 0),
    reason,
  };
}

function buildSafeFailureMessage(
  input: ProviderMethodFallbackEvaluationInput,
  diagnosticClass: ProviderFallbackDiagnosticClass,
  fallback: ProviderFallbackPosture,
): string {
  const fallbackText = fallback.available
    ? `Fallback or retry remains available (${fallback.remainingAttempts} attempt(s) left).`
    : `Fallback or retry is not available (${fallback.reason}).`;
  return `${input.providerId}/${input.modelId} ${input.method} failed as ${diagnosticClass}. ${fallbackText}`;
}

function buildResult(
  input: ProviderMethodFallbackEvaluationInput,
  normalizedMethod: ProviderMethodName,
  supportedMethods: readonly ProviderMethodName[],
  result: Omit<
    ProviderMethodFallbackEvaluation,
    "version" | "providerId" | "modelId" | "requestedMethod" | "normalizedMethod" | "supportedMethods"
  >,
): ProviderMethodFallbackEvaluation {
  return {
    version: PROVIDER_METHOD_FALLBACK_NORMALIZATION_VERSION,
    providerId: input.providerId,
    modelId: input.modelId,
    requestedMethod: input.method,
    normalizedMethod,
    supportedMethods,
    ...result,
  };
}
