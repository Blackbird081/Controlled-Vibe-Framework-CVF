import { describe, expect, it, vi } from "vitest";
import { parseProviderMap, resolveProviderForRole, buildExecutePayload } from "../src/execute.client";

describe("parseProviderMap", () => {
  it("parses a valid multi-role provider map", () => {
    const result = parseProviderMap("orchestrator:deepseek,builder:gemini,reviewer:claude");
    expect(result).toEqual({
      orchestrator: "deepseek",
      builder: "gemini",
      reviewer: "claude",
    });
  });

  it("returns empty object for empty string", () => {
    expect(parseProviderMap("")).toEqual({});
  });

  it("returns empty object for whitespace-only string", () => {
    expect(parseProviderMap("   ")).toEqual({});
  });

  it("parses a single role entry", () => {
    expect(parseProviderMap("ai_agent:alibaba")).toEqual({ ai_agent: "alibaba" });
  });

  it("normalizes role to lowercase", () => {
    const result = parseProviderMap("Builder:gemini");
    expect(result).toEqual({ builder: "gemini" });
  });

  it("handles partial roles — only provided roles are mapped", () => {
    const result = parseProviderMap("orchestrator:deepseek");
    expect(result).toEqual({ orchestrator: "deepseek" });
    expect(Object.keys(result)).toHaveLength(1);
  });

  it("skips malformed segments without colon", () => {
    const result = parseProviderMap("orchestrator:deepseek,invalidsegment,reviewer:claude");
    expect(result).toEqual({ orchestrator: "deepseek", reviewer: "claude" });
  });

  it("skips segments with empty role or provider", () => {
    const result = parseProviderMap(":deepseek,builder:,reviewer:claude");
    expect(result).toEqual({ reviewer: "claude" });
  });

  it("emits a warning for unknown roles but does not fail", () => {
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const result = parseProviderMap("unknown_role:someProvider,reviewer:claude");
    expect(result).toEqual({ unknown_role: "someProvider", reviewer: "claude" });
    expect(stderrSpy).toHaveBeenCalledWith(
      expect.stringContaining("unknown_role"),
    );
    stderrSpy.mockRestore();
  });

  it("parses provider values with hyphens", () => {
    const result = parseProviderMap("orchestrator:gpt-4o,builder:claude-3-5-sonnet");
    expect(result).toEqual({ orchestrator: "gpt-4o", builder: "claude-3-5-sonnet" });
  });
});

describe("resolveProviderForRole", () => {
  it("returns the mapped provider when role is present in the map", () => {
    const map = { orchestrator: "deepseek", builder: "gemini" };
    expect(resolveProviderForRole("orchestrator", map, "alibaba")).toBe("deepseek");
  });

  it("normalizes input role to lowercase before map lookup", () => {
    const map = { builder: "gemini" };
    // resolveProviderForRole normalizes the role internally
    expect(resolveProviderForRole("BUILDER", map, "alibaba")).toBe("gemini");
    expect(resolveProviderForRole("builder", map, "alibaba")).toBe("gemini");
    expect(resolveProviderForRole("Builder", map, "alibaba")).toBe("gemini");
  });

  it("falls back to the global provider when role is not in the map", () => {
    const map = { orchestrator: "deepseek" };
    expect(resolveProviderForRole("builder", map, "alibaba")).toBe("alibaba");
  });

  it("falls back to undefined when role not in map and fallback is undefined", () => {
    const map = { orchestrator: "deepseek" };
    expect(resolveProviderForRole("reviewer", map, undefined)).toBeUndefined();
  });

  it("returns the fallback when the map is empty", () => {
    expect(resolveProviderForRole("orchestrator", {}, "alibaba")).toBe("alibaba");
  });
});

describe("buildExecutePayload with --providers flag", () => {
  it("uses per-role provider from --providers when role matches", () => {
    const payload = buildExecutePayload({
      command: "execute",
      flags: {
        template: "strategy_analysis",
        role: "orchestrator",
        providers: "orchestrator:deepseek,builder:gemini",
      },
      positional: [],
    });
    expect(payload.provider).toBe("deepseek");
  });

  it("uses per-role provider (case-insensitive role in payload)", () => {
    const payload = buildExecutePayload({
      command: "execute",
      flags: {
        template: "strategy_analysis",
        role: "BUILDER",
        providers: "builder:gemini,orchestrator:deepseek",
      },
      positional: [],
    });
    expect(payload.provider).toBe("gemini");
  });

  it("falls back to --provider when role not in --providers map", () => {
    const payload = buildExecutePayload({
      command: "execute",
      flags: {
        template: "strategy_analysis",
        role: "reviewer",
        providers: "orchestrator:deepseek,builder:gemini",
        provider: "alibaba",
      },
      positional: [],
    });
    expect(payload.provider).toBe("alibaba");
  });

  it("falls back to --provider when --providers flag is absent", () => {
    const payload = buildExecutePayload({
      command: "execute",
      flags: {
        template: "strategy_analysis",
        role: "reviewer",
        provider: "alibaba",
      },
      positional: [],
    });
    expect(payload.provider).toBe("alibaba");
  });

  it("provider is undefined when neither --providers nor --provider is set", () => {
    const payload = buildExecutePayload({
      command: "execute",
      flags: {
        template: "strategy_analysis",
        role: "builder",
      },
      positional: [],
    });
    expect(payload.provider).toBeUndefined();
  });

  it("role not in --providers map falls back to --provider", () => {
    const payload = buildExecutePayload({
      command: "execute",
      flags: {
        template: "strategy_analysis",
        role: "builder",
        providers: "orchestrator:deepseek",
        provider: "alibaba",
      },
      positional: [],
    });
    // builder not in map → falls back to global --provider
    expect(payload.provider).toBe("alibaba");
  });

  it("--providers overrides --provider when role matches", () => {
    const payload = buildExecutePayload({
      command: "execute",
      flags: {
        template: "strategy_analysis",
        role: "builder",
        providers: "builder:deepseek",
        provider: "alibaba",
      },
      positional: [],
    });
    expect(payload.provider).toBe("deepseek");
  });
});
