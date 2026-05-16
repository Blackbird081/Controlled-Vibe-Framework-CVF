import { describe, expect, it } from "vitest";
import {
  assertProviderStdoutPolicy,
  classifyProviderExitCode,
  parseProviderJsonEnvelope,
  parseProviderNdjsonStream,
  PROVIDER_OUTPUT_EXIT_CODES,
  PROVIDER_STDOUT_POLICY,
} from "../src/provider-output-contract";

describe("provider output contract", () => {
  it("keeps stdout machine-readable and stderr diagnostic-only by policy", () => {
    expect(PROVIDER_STDOUT_POLICY).toEqual({
      stdoutMustBeMachineReadable: true,
      stderrReservedForDiagnostics: true,
      allowHumanLogsOnStdout: false,
    });
  });

  it("parses a normalized JSON envelope", () => {
    const envelope = parseProviderJsonEnvelope(JSON.stringify({
      schema_version: "1",
      success: true,
      data: { text: "ok" },
      meta: { provider: "openrouter" },
    }));

    expect(envelope).toMatchObject({
      schemaVersion: "1",
      success: true,
      data: { text: "ok" },
      meta: { provider: "openrouter" },
    });
  });

  it("parses newline-delimited stream chunks", () => {
    const chunks = parseProviderNdjsonStream('{"type":"delta","text":"a"}\n{"type":"done"}\n');

    expect(chunks).toHaveLength(2);
    expect(chunks[0]).toMatchObject({ index: 0, type: "delta" });
    expect(chunks[1]).toMatchObject({ index: 1, type: "done" });
  });

  it("classifies retryable and non-retryable provider exits", () => {
    expect(classifyProviderExitCode(PROVIDER_OUTPUT_EXIT_CODES.RATE_LIMITED)).toMatchObject({
      class: "rate_limit",
      retryable: true,
    });
    expect(classifyProviderExitCode(PROVIDER_OUTPUT_EXIT_CODES.TIMEOUT)).toMatchObject({
      class: "timeout",
      retryable: true,
    });
    expect(classifyProviderExitCode(PROVIDER_OUTPUT_EXIT_CODES.UNAUTHORIZED)).toMatchObject({
      class: "auth",
      retryable: false,
    });
    expect(classifyProviderExitCode(PROVIDER_OUTPUT_EXIT_CODES.UNEXPECTED_RESPONSE_SHAPE)).toMatchObject({
      class: "contract",
      retryable: false,
    });
  });

  it("rejects empty or non-machine-readable stdout", () => {
    expect(() => assertProviderStdoutPolicy("", "json")).toThrow("provider_stdout_empty");
    expect(() => assertProviderStdoutPolicy("human log line", "json")).toThrow();
  });
});
