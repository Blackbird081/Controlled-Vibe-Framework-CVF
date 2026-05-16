export type ProviderOutputMode = "json" | "ndjson";

export type ProviderExitClass =
  | "success"
  | "config"
  | "auth"
  | "provider"
  | "rate_limit"
  | "timeout"
  | "contract"
  | "unknown";

export interface ProviderJsonEnvelope {
  schemaVersion: string;
  success: boolean;
  data: unknown;
  error: unknown;
  meta: Record<string, unknown>;
}

export interface ProviderStreamChunk {
  index: number;
  type: string;
  payload: Record<string, unknown>;
}

export interface ProviderExitClassification {
  exitCode: number;
  class: ProviderExitClass;
  retryable: boolean;
  code: string;
}

export interface ProviderStdoutPolicy {
  stdoutMustBeMachineReadable: true;
  stderrReservedForDiagnostics: true;
  allowHumanLogsOnStdout: false;
}

export const PROVIDER_STDOUT_POLICY: ProviderStdoutPolicy = {
  stdoutMustBeMachineReadable: true,
  stderrReservedForDiagnostics: true,
  allowHumanLogsOnStdout: false,
};

export const PROVIDER_OUTPUT_EXIT_CODES = {
  OK: 0,
  CONFIG_ERROR: 64,
  MISSING_API_KEY: 65,
  UNAUTHORIZED: 66,
  FORBIDDEN: 67,
  NOT_FOUND: 68,
  INSUFFICIENT_CREDITS: 69,
  RATE_LIMITED: 70,
  TIMEOUT: 71,
  UNEXPECTED_RESPONSE_SHAPE: 72,
  ASYNC_JOB_FAILED: 73,
} as const;

export function assertProviderStdoutPolicy(stdout: string, mode: ProviderOutputMode): void {
  if (!stdout.trim()) {
    throw new Error("provider_stdout_empty");
  }
  if (mode === "json") {
    parseProviderJsonEnvelope(stdout);
    return;
  }
  parseProviderNdjsonStream(stdout);
}

export function parseProviderJsonEnvelope(stdout: string): ProviderJsonEnvelope {
  const trimmed = stdout.trim();
  if (!trimmed) {
    return {
      schemaVersion: "unknown",
      success: false,
      data: null,
      error: { message: "provider_stdout_empty" },
      meta: {},
    };
  }
  const parsed = JSON.parse(trimmed) as Record<string, unknown>;
  return {
    schemaVersion: stringValue(parsed.schema_version, "unknown"),
    success: Boolean(parsed.success),
    data: parsed.data ?? null,
    error: parsed.error ?? null,
    meta: isRecord(parsed.meta) ? parsed.meta : {},
  };
}

export function parseProviderNdjsonStream(stdout: string): ProviderStreamChunk[] {
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const parsed = JSON.parse(line) as Record<string, unknown>;
      return {
        index,
        type: stringValue(parsed.type, "unknown"),
        payload: parsed,
      };
    });
}

export function classifyProviderExitCode(exitCode: number): ProviderExitClassification {
  switch (exitCode) {
    case PROVIDER_OUTPUT_EXIT_CODES.OK:
      return build(exitCode, "success", "PROVIDER_OK", false);
    case PROVIDER_OUTPUT_EXIT_CODES.CONFIG_ERROR:
      return build(exitCode, "config", "PROVIDER_CONFIG_ERROR", false);
    case PROVIDER_OUTPUT_EXIT_CODES.MISSING_API_KEY:
      return build(exitCode, "auth", "PROVIDER_API_KEY_MISSING", false);
    case PROVIDER_OUTPUT_EXIT_CODES.UNAUTHORIZED:
      return build(exitCode, "auth", "PROVIDER_UNAUTHORIZED", false);
    case PROVIDER_OUTPUT_EXIT_CODES.FORBIDDEN:
      return build(exitCode, "auth", "PROVIDER_FORBIDDEN", false);
    case PROVIDER_OUTPUT_EXIT_CODES.NOT_FOUND:
      return build(exitCode, "provider", "PROVIDER_NOT_FOUND", false);
    case PROVIDER_OUTPUT_EXIT_CODES.INSUFFICIENT_CREDITS:
      return build(exitCode, "provider", "PROVIDER_INSUFFICIENT_CREDITS", false);
    case PROVIDER_OUTPUT_EXIT_CODES.RATE_LIMITED:
      return build(exitCode, "rate_limit", "PROVIDER_RATE_LIMITED", true);
    case PROVIDER_OUTPUT_EXIT_CODES.TIMEOUT:
      return build(exitCode, "timeout", "PROVIDER_TIMEOUT", true);
    case PROVIDER_OUTPUT_EXIT_CODES.UNEXPECTED_RESPONSE_SHAPE:
      return build(exitCode, "contract", "PROVIDER_RESPONSE_SHAPE_INVALID", false);
    case PROVIDER_OUTPUT_EXIT_CODES.ASYNC_JOB_FAILED:
      return build(exitCode, "provider", "PROVIDER_ASYNC_JOB_FAILED", false);
    default:
      return build(exitCode, "unknown", "PROVIDER_UNKNOWN_EXIT", false);
  }
}

function build(
  exitCode: number,
  exitClass: ProviderExitClass,
  code: string,
  retryable: boolean,
): ProviderExitClassification {
  return { exitCode, class: exitClass, retryable, code };
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
