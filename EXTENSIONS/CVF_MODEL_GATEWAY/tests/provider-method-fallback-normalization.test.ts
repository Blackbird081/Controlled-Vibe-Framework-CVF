import { describe, expect, it } from "vitest";
import {
  evaluateProviderMethodFallback,
  PROVIDER_METHOD_FALLBACK_NORMALIZATION_VERSION,
  PROVIDER_CAPABILITY_REGISTRY,
  PROVIDER_OUTPUT_EXIT_CODES,
  type FallbackAttempt,
} from "../src/index";

function attempt(reason = "timeout"): FallbackAttempt {
  return {
    providerId: "alibaba",
    modelId: "qwen-turbo",
    statusCode: 504,
    reason,
    at: "2026-05-24T00:00:00.000Z",
  };
}

describe("provider method fallback normalization", () => {
  it("returns a ready result for known provider/model/method support", () => {
    const result = evaluateProviderMethodFallback({
      registry: PROVIDER_CAPABILITY_REGISTRY,
      providerId: "alibaba",
      modelId: "qwen-turbo",
      method: "chat",
    });

    expect(result).toMatchObject({
      version: PROVIDER_METHOD_FALLBACK_NORMALIZATION_VERSION,
      status: "ready",
      requestedMethod: "chat",
      normalizedMethod: "complete",
      methodSupported: true,
      adapterExecutionAuthorized: true,
      diagnosticClass: "none",
      userAction: "proceed",
    });
  });

  it("blocks unsupported methods before adapter execution and lists supported alternatives", () => {
    const result = evaluateProviderMethodFallback({
      registry: PROVIDER_CAPABILITY_REGISTRY,
      providerId: "deepseek",
      modelId: "deepseek-chat",
      method: "stream",
    });

    expect(result).toMatchObject({
      status: "unsupported_method",
      methodSupported: false,
      adapterExecutionAuthorized: false,
      diagnosticClass: "unsupported_method",
      userAction: "choose_supported_method",
      supportedMethods: ["complete", "chat", "json_mode"],
    });
    expect(result.safeMessage).toContain("does not support stream");
  });

  it("classifies missing provider/model separately from unsupported methods", () => {
    const result = evaluateProviderMethodFallback({
      registry: PROVIDER_CAPABILITY_REGISTRY,
      providerId: "missing",
      modelId: "unknown-model",
      method: "complete",
    });

    expect(result).toMatchObject({
      status: "missing_provider_model",
      diagnosticClass: "missing_provider_model",
      userAction: "choose_registered_provider_model",
      adapterExecutionAuthorized: false,
      supportedMethods: [],
    });
  });

  it("reports retryable timeout fallback while attempts remain", () => {
    const result = evaluateProviderMethodFallback({
      registry: PROVIDER_CAPABILITY_REGISTRY,
      providerId: "alibaba",
      modelId: "qwen-turbo",
      method: "complete",
      failure: {
        exitCode: PROVIDER_OUTPUT_EXIT_CODES.TIMEOUT,
        attempts: [],
        maxAttempts: 2,
      },
    });

    expect(result).toMatchObject({
      status: "fallback_available",
      diagnosticClass: "provider_timeout",
      retryable: true,
      userAction: "retry",
      adapterExecutionAuthorized: false,
      fallback: {
        available: true,
        retryable: true,
        remainingAttempts: 2,
      },
    });
    expect(result.exit).toMatchObject({ code: "PROVIDER_TIMEOUT", retryable: true });
  });

  it("reports retry budget exhaustion without hiding the diagnostic class", () => {
    const result = evaluateProviderMethodFallback({
      registry: PROVIDER_CAPABILITY_REGISTRY,
      providerId: "alibaba",
      modelId: "qwen-turbo",
      method: "complete",
      failure: {
        statusCode: 504,
        attempts: [attempt(), attempt("retry-1")],
        maxAttempts: 2,
      },
    });

    expect(result).toMatchObject({
      status: "fallback_unavailable",
      diagnosticClass: "provider_http_error",
      retryable: true,
      fallback: {
        available: false,
        remainingAttempts: 0,
        reason: "max_attempts_reached",
      },
    });
  });

  it("maps missing key and insufficient balance to non-retryable user actions", () => {
    const missingKey = evaluateProviderMethodFallback({
      registry: PROVIDER_CAPABILITY_REGISTRY,
      providerId: "deepseek",
      modelId: "deepseek-chat",
      method: "complete",
      failure: { exitCode: PROVIDER_OUTPUT_EXIT_CODES.MISSING_API_KEY },
    });
    const insufficientBalance = evaluateProviderMethodFallback({
      registry: PROVIDER_CAPABILITY_REGISTRY,
      providerId: "deepseek",
      modelId: "deepseek-chat",
      method: "complete",
      failure: { exitCode: PROVIDER_OUTPUT_EXIT_CODES.INSUFFICIENT_CREDITS },
    });

    expect(missingKey).toMatchObject({
      status: "blocked_non_retryable",
      diagnosticClass: "missing_api_key",
      userAction: "add_api_key",
      fallback: { available: false, reason: "failure_class_not_retryable" },
    });
    expect(insufficientBalance).toMatchObject({
      status: "blocked_non_retryable",
      diagnosticClass: "insufficient_balance",
      userAction: "top_up_balance",
    });
  });

  it("keeps quota denial distinct from provider failure", () => {
    const result = evaluateProviderMethodFallback({
      registry: PROVIDER_CAPABILITY_REGISTRY,
      providerId: "openai",
      modelId: "gpt-4o",
      method: "json_mode",
      failure: {
        quotaAllowed: false,
        quotaReason: "actual_tokens_per_day_exceeded",
      },
    });

    expect(result).toMatchObject({
      status: "blocked_quota",
      diagnosticClass: "quota_exceeded",
      userAction: "reduce_usage_or_change_model",
      retryable: false,
      fallback: { available: false },
    });
  });

  it("classifies unavailable health as fallback-eligible without claiming runtime fallback execution", () => {
    const result = evaluateProviderMethodFallback({
      registry: PROVIDER_CAPABILITY_REGISTRY,
      providerId: "alibaba",
      modelId: "qwen-turbo",
      method: "stream",
      failure: {
        providerHealthState: "unavailable",
        attempts: [],
        maxAttempts: 1,
      },
    });

    expect(result).toMatchObject({
      status: "fallback_available",
      diagnosticClass: "provider_unavailable",
      userAction: "inspect_provider_status",
      adapterExecutionAuthorized: false,
      fallback: {
        available: true,
        remainingAttempts: 1,
      },
    });
  });

  it("classifies empty HTTP 200 output as a stop-and-diagnose failure", () => {
    const result = evaluateProviderMethodFallback({
      registry: PROVIDER_CAPABILITY_REGISTRY,
      providerId: "deepseek",
      modelId: "deepseek-chat",
      method: "complete",
      failure: {
        statusCode: 200,
        emptyOutput: true,
        reason: "success_false_empty_output",
      },
    });

    expect(result).toMatchObject({
      status: "blocked_non_retryable",
      diagnosticClass: "provider_empty_output",
      retryable: false,
      userAction: "stop_and_diagnose",
      fallback: {
        available: false,
        reason: "failure_class_not_retryable",
      },
    });
    expect(result.safeMessage).not.toContain("success_false_empty_output");
  });
});
