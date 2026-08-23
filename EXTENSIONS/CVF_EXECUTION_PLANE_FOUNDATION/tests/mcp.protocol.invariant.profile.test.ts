import { describe, expect, it } from "vitest";

import {
  MCP_PROTOCOL_VERSION_2026_07_28,
  createMCPProtocolInvariantProfile,
  type MCPProtocolInvariantProfileInput,
} from "../src/mcp.protocol.invariant.profile";

function validInput(): MCPProtocolInvariantProfileInput {
  return {
    request: {
      protocolVersion: MCP_PROTOCOL_VERSION_2026_07_28,
      supportedProtocolVersions: [MCP_PROTOCOL_VERSION_2026_07_28],
      clientCapabilities: ["elicitation"],
      requiredClientCapabilities: ["elicitation"],
      negotiatedExtensions: ["io.modelcontextprotocol/ui"],
      usedExtensions: ["io.modelcontextprotocol/ui"],
    },
    discovery: {},
    subscription: {
      acknowledged: true,
      eventObserved: true,
      expectedSubscriptionId: "sub-1",
      eventSubscriptionId: "sub-1",
    },
    result: { resultType: "complete", interpretedAsCompletion: true },
    cache: { ttlMs: 30_000, cacheScope: "private", containsUserSpecificData: true },
    authorization: {
      tokenAudience: "https://mcp.example.test",
      intendedAudience: "https://mcp.example.test",
    },
    http: {
      protocolVersionHeader: MCP_PROTOCOL_VERSION_2026_07_28,
      protocolVersionBody: MCP_PROTOCOL_VERSION_2026_07_28,
      methodHeader: "tools/call",
      methodBody: "tools/call",
    },
  };
}

function evaluate(overrides: Partial<MCPProtocolInvariantProfileInput>) {
  return createMCPProtocolInvariantProfile().evaluate({ ...validInput(), ...overrides });
}

function expectRule(
  result: ReturnType<typeof evaluate>,
  ruleId: string,
  jsonRpcErrorCode?: number,
): void {
  expect(result.accepted).toBe(false);
  const violation = result.violations.find((item) => item.ruleId === ruleId);
  expect(violation).toBeDefined();
  if (jsonRpcErrorCode !== undefined) expect(violation?.jsonRpcErrorCode).toBe(jsonRpcErrorCode);
}

describe("MCPProtocolInvariantProfile", () => {
  it("accepts a composite profile satisfying all thirteen rules when optional legacy evidence is absent", () => {
    expect(evaluate({})).toEqual({ accepted: true, violations: [] });
  });

  it.each([
    ["missing protocol version", { protocolVersion: undefined, clientCapabilities: [] }],
    ["missing client capabilities", { protocolVersion: MCP_PROTOCOL_VERSION_2026_07_28, clientCapabilities: undefined }],
  ])("rejects %s as invalid params", (_name, requestOverride) => {
    const result = evaluate({ request: { ...validInput().request, ...requestOverride } });
    expectRule(result, "MCP-PR-001", -32602);
  });

  it("rejects an unsupported protocol version with the exact MCP error", () => {
    const result = evaluate({
      request: { ...validInput().request, protocolVersion: "1900-01-01" },
    });
    expectRule(result, "MCP-PR-002", -32022);
  });

  it("rejects a required but undeclared client capability", () => {
    const result = evaluate({
      request: { ...validInput().request, clientCapabilities: [] },
    });
    expectRule(result, "MCP-PR-003", -32021);
  });

  it("rejects use of an extension that was not negotiated", () => {
    const result = evaluate({
      request: { ...validInput().request, negotiatedExtensions: [] },
    });
    expectRule(result, "MCP-PR-004");
  });

  it("rejects discovery metadata used for identity or authorization", () => {
    expectRule(evaluate({ discovery: { usedForIdentityDecision: true } }), "MCP-PR-005");
    expectRule(evaluate({ discovery: { usedForAuthorizationDecision: true } }), "MCP-PR-005");
  });

  it("rejects a subscription event before acknowledgment", () => {
    const result = evaluate({
      subscription: { ...validInput().subscription!, acknowledged: false },
    });
    expectRule(result, "MCP-PR-006");
  });

  it.each([undefined, "wrong-subscription"])(
    "rejects a missing or wrong subscription correlation ID (%s)",
    (eventSubscriptionId) => {
      const result = evaluate({
        subscription: { ...validInput().subscription!, eventSubscriptionId },
      });
      expectRule(result, "MCP-PR-006");
    },
  );

  it.each([
    { interpretedAsCompletion: true },
    { interpretedAsApproval: true },
  ])("rejects input_required interpreted as terminal authority: %o", (interpretation) => {
    const result = evaluate({
      result: { resultType: "input_required", ...interpretation },
    });
    expectRule(result, "MCP-PR-007");
  });

  it.each([
    { ttlMs: -1, cacheScope: "private" as const },
    { ttlMs: 1, cacheScope: "public" as const, containsUserSpecificData: true },
    { ttlMs: 1, cacheScope: "private" as const, usedAsAuthorization: true },
  ])("rejects unsafe cache semantics: %o", (cache) => {
    expectRule(evaluate({ cache }), "MCP-PR-008");
  });

  it.each([undefined, "https://other.example.test"])(
    "rejects a missing or mismatched token audience (%s)",
    (tokenAudience) => {
      const result = evaluate({
        authorization: { tokenAudience, intendedAudience: "https://mcp.example.test" },
      });
      expectRule(result, "MCP-PR-009");
    },
  );

  it("rejects an HTTP header/body mismatch with HeaderMismatch", () => {
    const result = evaluate({
      http: {
        protocolVersionHeader: MCP_PROTOCOL_VERSION_2026_07_28,
        protocolVersionBody: "2025-11-25",
      },
    });
    expectRule(result, "MCP-PR-010", -32020);
  });

  it("rejects a missing required HTTP mirror header with HeaderMismatch", () => {
    const result = evaluate({
      http: {
        protocolVersionBody: MCP_PROTOCOL_VERSION_2026_07_28,
      },
    });
    expectRule(result, "MCP-PR-010", -32020);
  });

  it.each(["password", "api-key", "access-token", "payment-credential"] as const)(
    "rejects the sensitive %s category in form-mode elicitation",
    (category) => {
      const result = evaluate({
        elicitation: {
          elicitationMode: "form",
          requestedDataCategories: [category],
        },
      });
      expectRule(result, "MCP-PR-011");
      expect(
        result.violations.find((violation) => violation.ruleId === "MCP-PR-011")?.decisionCode,
      ).toBe("UNSAFE_ELICITATION_REQUEST");
    },
  );

  it.each([
    ["unknown category", ["private-key"]],
    ["non-string category", [42]],
    ["empty category list", []],
    ["non-array category container", "contact"],
  ])("fails closed for a malformed form-mode %s", (_name, requestedDataCategories) => {
    const result = evaluate({
      elicitation: {
        elicitationMode: "form",
        requestedDataCategories,
      } as unknown as MCPProtocolInvariantProfileInput["elicitation"],
    });
    expectRule(result, "MCP-PR-011");
  });

  it.each([
    ["unknown mode", "inline"],
    ["non-string mode", 42],
  ])("fails closed for an %s", (_name, elicitationMode) => {
    const result = evaluate({
      elicitation: {
        elicitationMode,
        requestedDataCategories: ["contact"],
      } as unknown as MCPProtocolInvariantProfileInput["elicitation"],
    });
    expectRule(result, "MCP-PR-011");
  });

  it.each(["password", "api-key", "access-token", "payment-credential"] as const)(
    "accepts the sensitive %s category in URL-mode elicitation",
    (category) => {
      expect(evaluate({
        elicitation: {
          elicitationMode: "url",
          requestedDataCategories: [category],
        },
      })).toEqual({ accepted: true, violations: [] });
    },
  );

  it.each(["contact", "profile"] as const)(
    "accepts the ordinary %s category in form-mode elicitation",
    (category) => {
      expect(evaluate({
        elicitation: {
          elicitationMode: "form",
          requestedDataCategories: [category],
        },
      })).toEqual({ accepted: true, violations: [] });
    },
  );

  it("preserves prior composite acceptance when ordinary form elicitation is present", () => {
    expect(evaluate({
      elicitation: {
        elicitationMode: "form",
        requestedDataCategories: ["contact", "profile"],
      },
    })).toEqual({ accepted: true, violations: [] });
  });

  it("accepts bounded roots as caller-validated hints without receiving path values", () => {
    expect(evaluate({
      rootsHintEvidence: {
        rootsPresented: true,
        rootUriSchemes: ["file", "file"],
        callerConsentConfirmed: true,
        callerPathValidationConfirmed: true,
        authorityClaim: "hints-only",
      },
    })).toEqual({ accepted: true, violations: [] });
  });

  it.each(["authorization", "containment", "confinement", "filesystem-authority"] as const)(
    "rejects the roots %s authority claim",
    (authorityClaim) => {
      const result = evaluate({
        rootsHintEvidence: {
          rootsPresented: true,
          rootUriSchemes: ["file"],
          callerConsentConfirmed: true,
          callerPathValidationConfirmed: true,
          authorityClaim,
        },
      });
      expectRule(result, "MCP-PR-012");
      expect(
        result.violations.find((violation) => violation.ruleId === "MCP-PR-012")?.decisionCode,
      ).toBe("ROOTS_HINT_AUTHORITY_VIOLATION");
    },
  );

  it.each([
    ["empty roots", { rootUriSchemes: [] }],
    ["non-file root", { rootUriSchemes: ["https"] }],
    ["missing caller consent", { callerConsentConfirmed: false }],
    ["missing caller path validation", { callerPathValidationConfirmed: false }],
    ["roots not presented", { rootsPresented: false }],
    ["unknown authority claim", { authorityClaim: "workspace-boundary" }],
    ["unknown field", { payload: "not-accepted" }],
  ])("fails closed for malformed roots evidence: %s", (_name, override) => {
    const result = evaluate({
      rootsHintEvidence: {
        rootsPresented: true,
        rootUriSchemes: ["file"],
        callerConsentConfirmed: true,
        callerPathValidationConfirmed: true,
        authorityClaim: "hints-only",
        ...override,
      } as unknown as MCPProtocolInvariantProfileInput["rootsHintEvidence"],
    });
    expectRule(result, "MCP-PR-012");
  });

  it("accepts bounded tool-less sampling evidence", () => {
    expect(evaluate({
      samplingSequenceEvidence: {
        toolsRequested: false,
        declaredCapabilities: ["sampling"],
        messages: [
          { role: "user", content: [{ type: "text" }] },
          { role: "assistant", content: [{ type: "text" }] },
        ],
        existingApprovalDisposition: "deny",
      },
    })).toEqual({ accepted: true, violations: [] });
  });

  it("accepts parallel tool uses with exact adjacent results-only correlation", () => {
    expect(evaluate({
      samplingSequenceEvidence: {
        toolsRequested: true,
        declaredCapabilities: ["sampling", "sampling.tools"],
        messages: [
          { role: "user", content: [{ type: "text" }] },
          {
            role: "assistant",
            content: [
              { type: "text" },
              { type: "tool_use", id: "call.paris" },
              { type: "tool_use", id: "call.london" },
            ],
          },
          {
            role: "user",
            content: [
              { type: "tool_result", toolUseId: "call.london" },
              { type: "tool_result", toolUseId: "call.paris" },
            ],
          },
          { role: "assistant", content: [{ type: "text" }] },
        ],
        existingApprovalDisposition: "allow_with_receipt",
      },
    })).toEqual({ accepted: true, violations: [] });
  });

  it("rejects tool-enabled sampling without the nested sampling.tools capability", () => {
    const result = evaluate({
      samplingSequenceEvidence: {
        toolsRequested: true,
        declaredCapabilities: ["sampling"],
        messages: [],
      },
    });
    expectRule(result, "MCP-PR-013");
    expect(
      result.violations.find((violation) => violation.ruleId === "MCP-PR-013")?.decisionCode,
    ).toBe("SAMPLING_SEQUENCE_VIOLATION");
  });

  it.each([
    [
      "duplicate tool-use IDs",
      [
        {
          role: "assistant",
          content: [
            { type: "tool_use", id: "call.1" },
            { type: "tool_use", id: "call.1" },
          ],
        },
        { role: "user", content: [{ type: "tool_result", toolUseId: "call.1" }] },
      ],
    ],
    [
      "missing tool result",
      [
        {
          role: "assistant",
          content: [
            { type: "tool_use", id: "call.1" },
            { type: "tool_use", id: "call.2" },
          ],
        },
        { role: "user", content: [{ type: "tool_result", toolUseId: "call.1" }] },
      ],
    ],
    [
      "mismatched tool result",
      [
        { role: "assistant", content: [{ type: "tool_use", id: "call.1" }] },
        { role: "user", content: [{ type: "tool_result", toolUseId: "call.unknown" }] },
      ],
    ],
    [
      "duplicate tool result",
      [
        { role: "assistant", content: [{ type: "tool_use", id: "call.1" }] },
        {
          role: "user",
          content: [
            { type: "tool_result", toolUseId: "call.1" },
            { type: "tool_result", toolUseId: "call.1" },
          ],
        },
      ],
    ],
    [
      "mixed result content",
      [
        { role: "assistant", content: [{ type: "tool_use", id: "call.1" }] },
        {
          role: "user",
          content: [
            { type: "tool_result", toolUseId: "call.1" },
            { type: "text" },
          ],
        },
      ],
    ],
    [
      "intervening message",
      [
        { role: "assistant", content: [{ type: "tool_use", id: "call.1" }] },
        { role: "assistant", content: [{ type: "text" }] },
        { role: "user", content: [{ type: "tool_result", toolUseId: "call.1" }] },
      ],
    ],
    [
      "unknown standalone result",
      [{ role: "user", content: [{ type: "tool_result", toolUseId: "call.unknown" }] }],
    ],
  ])("fails closed for sampling sequence violation: %s", (_name, messages) => {
    const result = evaluate({
      samplingSequenceEvidence: {
        toolsRequested: true,
        declaredCapabilities: ["sampling", "sampling.tools"],
        messages,
      } as unknown as MCPProtocolInvariantProfileInput["samplingSequenceEvidence"],
    });
    expectRule(result, "MCP-PR-013");
  });

  it.each([
    ["unknown capability", { declaredCapabilities: ["sampling.unknown"] }],
    ["missing basic sampling capability", { declaredCapabilities: [] }],
    ["duplicate capability", { declaredCapabilities: ["sampling", "sampling"] }],
    ["unknown role", { messages: [{ role: "system", content: [{ type: "text" }] }] }],
    ["empty message content", { messages: [{ role: "user", content: [] }] }],
    ["unknown content type", { messages: [{ role: "user", content: [{ type: "secret" }] }] }],
    ["raw content field", { messages: [{ role: "user", content: [{ type: "text", text: "raw" }] }] }],
    ["malformed approval disposition", { existingApprovalDisposition: "APPROVE" }],
  ])("fails closed for malformed sampling evidence: %s", (_name, override) => {
    const result = evaluate({
      samplingSequenceEvidence: {
        toolsRequested: false,
        declaredCapabilities: ["sampling"],
        messages: [{ role: "user", content: [{ type: "text" }] }],
        ...override,
      } as unknown as MCPProtocolInvariantProfileInput["samplingSequenceEvidence"],
    });
    expectRule(result, "MCP-PR-013");
  });

  it("accepts a complete thirteen-rule composite with both legacy evidence profiles", () => {
    expect(evaluate({
      elicitation: {
        elicitationMode: "form",
        requestedDataCategories: ["contact"],
      },
      rootsHintEvidence: {
        rootsPresented: true,
        rootUriSchemes: ["file"],
        callerConsentConfirmed: true,
        callerPathValidationConfirmed: true,
        authorityClaim: "hints-only",
      },
      samplingSequenceEvidence: {
        toolsRequested: true,
        declaredCapabilities: ["sampling", "sampling.tools"],
        messages: [
          { role: "assistant", content: [{ type: "tool_use", id: "call.composite" }] },
          { role: "user", content: [{ type: "tool_result", toolUseId: "call.composite" }] },
        ],
        existingApprovalDisposition: "requires_approval",
      },
    })).toEqual({ accepted: true, violations: [] });
  });

  it("returns both defensive legacy violations alongside an unchanged prior-rule violation", () => {
    const result = evaluate({
      authorization: {
        tokenAudience: "https://wrong.example.test",
        intendedAudience: "https://mcp.example.test",
      },
      rootsHintEvidence: {
        rootsPresented: true,
        rootUriSchemes: ["https"],
        callerConsentConfirmed: true,
        callerPathValidationConfirmed: true,
        authorityClaim: "hints-only",
      } as unknown as MCPProtocolInvariantProfileInput["rootsHintEvidence"],
      samplingSequenceEvidence: {
        toolsRequested: true,
        declaredCapabilities: ["sampling"],
        messages: [],
      },
    });

    expectRule(result, "MCP-PR-009");
    expectRule(result, "MCP-PR-012");
    expectRule(result, "MCP-PR-013");
  });
});
