import type { MCPBusinessApprovalDecision } from "./mcp.business.adapter.contract";

export const MCP_PROTOCOL_VERSION_2026_07_28 = "2026-07-28" as const;

export type MCPProtocolInvariantRuleId =
  | "MCP-PR-001"
  | "MCP-PR-002"
  | "MCP-PR-003"
  | "MCP-PR-004"
  | "MCP-PR-005"
  | "MCP-PR-006"
  | "MCP-PR-007"
  | "MCP-PR-008"
  | "MCP-PR-009"
  | "MCP-PR-010"
  | "MCP-PR-011"
  | "MCP-PR-012"
  | "MCP-PR-013";

export type MCPProtocolInvariantDecisionCode =
  | "INVALID_PARAMS"
  | "UNSUPPORTED_PROTOCOL_VERSION"
  | "MISSING_REQUIRED_CLIENT_CAPABILITY"
  | "EXTENSION_NOT_NEGOTIATED"
  | "UNTRUSTED_DISCOVERY_EVIDENCE"
  | "SUBSCRIPTION_PROTOCOL_VIOLATION"
  | "INPUT_REQUIRED_CONTINUATION_VIOLATION"
  | "UNSAFE_CACHE_HINT"
  | "TOKEN_AUDIENCE_MISMATCH"
  | "HEADER_MISMATCH"
  | "UNSAFE_ELICITATION_REQUEST"
  | "ROOTS_HINT_AUTHORITY_VIOLATION"
  | "SAMPLING_SEQUENCE_VIOLATION";

export type MCPProtocolJsonRpcErrorCode = -32602 | -32020 | -32021 | -32022;

export interface MCPProtocolRequestProfile {
  protocolVersion?: string;
  supportedProtocolVersions: readonly string[];
  clientCapabilities?: readonly string[];
  requiredClientCapabilities?: readonly string[];
  negotiatedExtensions?: readonly string[];
  usedExtensions?: readonly string[];
}

export interface MCPDiscoveryEvidenceProfile {
  usedForIdentityDecision?: boolean;
  usedForAuthorizationDecision?: boolean;
}

export interface MCPSubscriptionProfile {
  acknowledged: boolean;
  eventObserved: boolean;
  expectedSubscriptionId: string | number;
  eventSubscriptionId?: string | number;
}

export interface MCPResultProfile {
  resultType: string;
  interpretedAsCompletion?: boolean;
  interpretedAsApproval?: boolean;
}

export interface MCPCacheProfile {
  ttlMs?: number;
  cacheScope?: "public" | "private";
  containsUserSpecificData?: boolean;
  usedAsAuthorization?: boolean;
}

export interface MCPAuthorizationProfile {
  tokenAudience?: string;
  intendedAudience: string;
}

export interface MCPHttpMirrorProfile {
  protocolVersionHeader?: string;
  protocolVersionBody?: string;
  methodHeader?: string;
  methodBody?: string;
  nameHeader?: string;
  nameBody?: string;
}

export type MCPElicitationMode = "form" | "url";

export type MCPElicitationRequestedDataCategory =
  | "password"
  | "api-key"
  | "access-token"
  | "payment-credential"
  | "contact"
  | "profile";

export interface MCPElicitationProfile {
  elicitationMode: MCPElicitationMode;
  requestedDataCategories: readonly MCPElicitationRequestedDataCategory[];
}

export type MCPRootUriScheme = "file";

export type MCPRootsAuthorityClaim =
  | "hints-only"
  | "authorization"
  | "containment"
  | "confinement"
  | "filesystem-authority";

export interface MCPRootsHintEvidenceProfile {
  rootsPresented: true;
  rootUriSchemes: readonly MCPRootUriScheme[];
  callerConsentConfirmed: true;
  callerPathValidationConfirmed: true;
  authorityClaim: MCPRootsAuthorityClaim;
}

export type MCPSamplingCapability = "sampling" | "sampling.tools";

export type MCPSamplingStructuralContent =
  | { type: "text" }
  | { type: "image" }
  | { type: "audio" }
  | { type: "tool_use"; id: string }
  | { type: "tool_result"; toolUseId: string };

export interface MCPSamplingStructuralMessage {
  role: "user" | "assistant";
  content: readonly MCPSamplingStructuralContent[];
}

export interface MCPSamplingSequenceEvidenceProfile {
  toolsRequested: boolean;
  declaredCapabilities: readonly MCPSamplingCapability[];
  messages: readonly MCPSamplingStructuralMessage[];
  existingApprovalDisposition?: MCPBusinessApprovalDecision;
}

export interface MCPProtocolInvariantProfileInput {
  request: MCPProtocolRequestProfile;
  discovery?: MCPDiscoveryEvidenceProfile;
  subscription?: MCPSubscriptionProfile;
  result?: MCPResultProfile;
  cache?: MCPCacheProfile;
  authorization?: MCPAuthorizationProfile;
  http?: MCPHttpMirrorProfile;
  elicitation?: MCPElicitationProfile;
  rootsHintEvidence?: MCPRootsHintEvidenceProfile;
  samplingSequenceEvidence?: MCPSamplingSequenceEvidenceProfile;
}

export interface MCPProtocolInvariantViolation {
  ruleId: MCPProtocolInvariantRuleId;
  decisionCode: MCPProtocolInvariantDecisionCode;
  reason: string;
  jsonRpcErrorCode?: MCPProtocolJsonRpcErrorCode;
}

export interface MCPProtocolInvariantDecision {
  accepted: boolean;
  violations: MCPProtocolInvariantViolation[];
}

export class MCPProtocolInvariantProfile {
  evaluate(input: MCPProtocolInvariantProfileInput): MCPProtocolInvariantDecision {
    const violations: MCPProtocolInvariantViolation[] = [];
    this.checkRequestMetadata(input.request, violations);
    this.checkExtensions(input.request, violations);
    this.checkDiscovery(input.discovery, violations);
    this.checkSubscription(input.subscription, violations);
    this.checkResult(input.result, violations);
    this.checkCache(input.cache, violations);
    this.checkAuthorization(input.authorization, violations);
    this.checkHttpMirrors(input.http, violations);
    this.checkElicitation(input.elicitation, violations);
    this.checkRootsHints(input.rootsHintEvidence, violations);
    this.checkSamplingSequence(input.samplingSequenceEvidence, violations);
    return { accepted: violations.length === 0, violations };
  }

  private checkRequestMetadata(
    request: MCPProtocolRequestProfile,
    violations: MCPProtocolInvariantViolation[],
  ): void {
    if (!request.protocolVersion || !request.clientCapabilities) {
      violations.push({
        ruleId: "MCP-PR-001",
        decisionCode: "INVALID_PARAMS",
        jsonRpcErrorCode: -32602,
        reason: "modern MCP requests require per-request protocol version and client capabilities",
      });
      return;
    }

    if (!request.supportedProtocolVersions.includes(request.protocolVersion)) {
      violations.push({
        ruleId: "MCP-PR-002",
        decisionCode: "UNSUPPORTED_PROTOCOL_VERSION",
        jsonRpcErrorCode: -32022,
        reason: "requested MCP protocol version is not supported",
      });
    }

    const declared = new Set(request.clientCapabilities);
    const missing = (request.requiredClientCapabilities ?? []).filter(
      (capability) => !declared.has(capability),
    );
    if (missing.length > 0) {
      violations.push({
        ruleId: "MCP-PR-003",
        decisionCode: "MISSING_REQUIRED_CLIENT_CAPABILITY",
        jsonRpcErrorCode: -32021,
        reason: `required client capabilities were not declared: ${missing.join(", ")}`,
      });
    }
  }

  private checkExtensions(
    request: MCPProtocolRequestProfile,
    violations: MCPProtocolInvariantViolation[],
  ): void {
    const negotiated = new Set(request.negotiatedExtensions ?? []);
    const unnegotiated = (request.usedExtensions ?? []).filter(
      (extension) => !negotiated.has(extension),
    );
    if (unnegotiated.length > 0) {
      violations.push({
        ruleId: "MCP-PR-004",
        decisionCode: "EXTENSION_NOT_NEGOTIATED",
        reason: `extensions were used without capability negotiation: ${unnegotiated.join(", ")}`,
      });
    }
  }

  private checkDiscovery(
    discovery: MCPDiscoveryEvidenceProfile | undefined,
    violations: MCPProtocolInvariantViolation[],
  ): void {
    if (discovery?.usedForIdentityDecision || discovery?.usedForAuthorizationDecision) {
      violations.push({
        ruleId: "MCP-PR-005",
        decisionCode: "UNTRUSTED_DISCOVERY_EVIDENCE",
        reason: "self-reported discovery metadata cannot decide identity or authorization",
      });
    }
  }

  private checkSubscription(
    subscription: MCPSubscriptionProfile | undefined,
    violations: MCPProtocolInvariantViolation[],
  ): void {
    if (!subscription?.eventObserved) return;
    if (!subscription.acknowledged) {
      violations.push({
        ruleId: "MCP-PR-006",
        decisionCode: "SUBSCRIPTION_PROTOCOL_VIOLATION",
        reason: "subscription event arrived before acknowledgment",
      });
      return;
    }
    if (subscription.eventSubscriptionId !== subscription.expectedSubscriptionId) {
      violations.push({
        ruleId: "MCP-PR-006",
        decisionCode: "SUBSCRIPTION_PROTOCOL_VIOLATION",
        reason: "subscription event does not correlate to the originating request ID",
      });
    }
  }

  private checkResult(
    result: MCPResultProfile | undefined,
    violations: MCPProtocolInvariantViolation[],
  ): void {
    if (
      result?.resultType === "input_required"
      && (result.interpretedAsCompletion || result.interpretedAsApproval)
    ) {
      violations.push({
        ruleId: "MCP-PR-007",
        decisionCode: "INPUT_REQUIRED_CONTINUATION_VIOLATION",
        reason: "input_required is an incomplete continuation, not completion or approval",
      });
    }
  }

  private checkCache(
    cache: MCPCacheProfile | undefined,
    violations: MCPProtocolInvariantViolation[],
  ): void {
    if (!cache) return;
    const negativeTtl = cache.ttlMs !== undefined && cache.ttlMs < 0;
    const unsafePublicScope = cache.cacheScope === "public" && cache.containsUserSpecificData === true;
    if (negativeTtl || unsafePublicScope || cache.usedAsAuthorization) {
      violations.push({
        ruleId: "MCP-PR-008",
        decisionCode: "UNSAFE_CACHE_HINT",
        reason: "cache TTL/scope is invalid or was treated as authorization",
      });
    }
  }

  private checkAuthorization(
    authorization: MCPAuthorizationProfile | undefined,
    violations: MCPProtocolInvariantViolation[],
  ): void {
    if (!authorization) return;
    if (
      !authorization.tokenAudience
      || authorization.tokenAudience !== authorization.intendedAudience
    ) {
      violations.push({
        ruleId: "MCP-PR-009",
        decisionCode: "TOKEN_AUDIENCE_MISMATCH",
        reason: "access token was not issued for the intended MCP server audience",
      });
    }
  }

  private checkHttpMirrors(
    http: MCPHttpMirrorProfile | undefined,
    violations: MCPProtocolInvariantViolation[],
  ): void {
    if (!http) return;
    const mirroredPairs: ReadonlyArray<readonly [string | undefined, string | undefined]> = [
      [http.protocolVersionHeader, http.protocolVersionBody],
      [http.methodHeader, http.methodBody],
      [http.nameHeader, http.nameBody],
    ];
    const mismatch = mirroredPairs.some(([header, body]) => {
      const onlyOneValuePresent = (header === undefined) !== (body === undefined);
      return onlyOneValuePresent || (header !== undefined && header !== body);
    });
    if (mismatch) {
      violations.push({
        ruleId: "MCP-PR-010",
        decisionCode: "HEADER_MISMATCH",
        jsonRpcErrorCode: -32020,
        reason: "required HTTP mirror header does not match the request body",
      });
    }
  }

  private checkElicitation(
    elicitation: MCPElicitationProfile | undefined,
    violations: MCPProtocolInvariantViolation[],
  ): void {
    if (!elicitation) return;

    const knownCategories: readonly MCPElicitationRequestedDataCategory[] = [
      "password",
      "api-key",
      "access-token",
      "payment-credential",
      "contact",
      "profile",
    ];
    const sensitiveFormCategories: readonly MCPElicitationRequestedDataCategory[] = [
      "password",
      "api-key",
      "access-token",
      "payment-credential",
    ];
    const categories: unknown = elicitation.requestedDataCategories;
    const categoriesAreKnown = Array.isArray(categories)
      && categories.length > 0
      && categories.every(
        (category) => typeof category === "string" && knownCategories.includes(
          category as MCPElicitationRequestedDataCategory,
        ),
      );
    const hasSensitiveFormCategory = categoriesAreKnown
      && elicitation.elicitationMode === "form"
      && categories.some((category) => sensitiveFormCategories.includes(category));
    const modeIsKnown = elicitation.elicitationMode === "form"
      || elicitation.elicitationMode === "url";

    if (!modeIsKnown || !categoriesAreKnown || hasSensitiveFormCategory) {
      violations.push({
        ruleId: "MCP-PR-011",
        decisionCode: "UNSAFE_ELICITATION_REQUEST",
        reason: "elicitation mode and requested-data categories are invalid or unsafe for form collection",
      });
    }
  }

  private checkRootsHints(
    roots: MCPRootsHintEvidenceProfile | undefined,
    violations: MCPProtocolInvariantViolation[],
  ): void {
    if (!roots) return;

    const candidate: unknown = roots;
    const validShape = isExactRecord(candidate, [
      "rootsPresented",
      "rootUriSchemes",
      "callerConsentConfirmed",
      "callerPathValidationConfirmed",
      "authorityClaim",
    ]);
    const schemes: unknown = validShape ? candidate.rootUriSchemes : undefined;
    const validSchemes = Array.isArray(schemes)
      && schemes.length > 0
      && schemes.every((scheme) => scheme === "file");
    const validHintsOnlyEvidence = validShape
      && candidate.rootsPresented === true
      && validSchemes
      && candidate.callerConsentConfirmed === true
      && candidate.callerPathValidationConfirmed === true
      && candidate.authorityClaim === "hints-only";

    if (!validHintsOnlyEvidence) {
      violations.push({
        ruleId: "MCP-PR-012",
        decisionCode: "ROOTS_HINT_AUTHORITY_VIOLATION",
        reason: "legacy roots evidence is malformed, non-file, or claims path authority beyond caller-owned hints",
      });
    }
  }

  private checkSamplingSequence(
    sampling: MCPSamplingSequenceEvidenceProfile | undefined,
    violations: MCPProtocolInvariantViolation[],
  ): void {
    if (!sampling) return;

    if (!isValidSamplingEvidence(sampling)) {
      violations.push({
        ruleId: "MCP-PR-013",
        decisionCode: "SAMPLING_SEQUENCE_VIOLATION",
        reason: "legacy sampling evidence has invalid capability metadata or tool-use/result sequencing",
      });
    }
  }
}

const STRUCTURAL_ID = /^[A-Za-z][A-Za-z0-9._:-]{0,127}$/;
const SAMPLING_CAPABILITIES: readonly MCPSamplingCapability[] = [
  "sampling",
  "sampling.tools",
];
const APPROVAL_DISPOSITIONS: readonly MCPBusinessApprovalDecision[] = [
  "allow",
  "allow_with_receipt",
  "requires_approval",
  "deny",
];

function isValidSamplingEvidence(value: unknown): value is MCPSamplingSequenceEvidenceProfile {
  if (!isPlainRecord(value)) return false;
  const allowedKeys = [
    "toolsRequested",
    "declaredCapabilities",
    "messages",
    "existingApprovalDisposition",
  ];
  if (!hasOnlyKeys(value, allowedKeys)) return false;
  if (typeof value.toolsRequested !== "boolean") return false;
  if (
    !Array.isArray(value.declaredCapabilities)
    || value.declaredCapabilities.some(
      (capability) => !SAMPLING_CAPABILITIES.includes(capability as MCPSamplingCapability),
    )
    || new Set(value.declaredCapabilities).size !== value.declaredCapabilities.length
  ) return false;
  if (
    value.existingApprovalDisposition !== undefined
    && !APPROVAL_DISPOSITIONS.includes(
      value.existingApprovalDisposition as MCPBusinessApprovalDecision,
    )
  ) return false;
  if (!Array.isArray(value.messages)) return false;
  if (!value.declaredCapabilities.includes("sampling")) return false;
  if (value.toolsRequested && !value.declaredCapabilities.includes("sampling.tools")) return false;

  const messages = value.messages;
  const seenToolUseIds = new Set<string>();
  for (let index = 0; index < messages.length; index += 1) {
    const message = messages[index];
    if (!isValidSamplingMessage(message)) return false;
    const toolUses = message.content.filter(
      (content): content is Extract<MCPSamplingStructuralContent, { type: "tool_use" }> => (
        content.type === "tool_use"
      ),
    );
    const toolResults = message.content.filter(
      (content): content is Extract<MCPSamplingStructuralContent, { type: "tool_result" }> => (
        content.type === "tool_result"
      ),
    );

    if (toolResults.length > 0) {
      if (message.role !== "user" || toolResults.length !== message.content.length) return false;
      const previous = messages[index - 1];
      if (!previous || !isValidSamplingMessage(previous) || previous.role !== "assistant") return false;
      const previousUses = previous.content.filter(
        (content): content is Extract<MCPSamplingStructuralContent, { type: "tool_use" }> => (
          content.type === "tool_use"
        ),
      );
      if (!hasExactToolResultCorrelation(previousUses, toolResults)) return false;
    }

    if (toolUses.length > 0) {
      if (
        message.role !== "assistant"
        || !value.toolsRequested
        || !value.declaredCapabilities.includes("sampling.tools")
      ) return false;
      for (const toolUse of toolUses) {
        if (seenToolUseIds.has(toolUse.id)) return false;
        seenToolUseIds.add(toolUse.id);
      }
      const next = messages[index + 1];
      if (!next || next.role !== "user" || !isValidSamplingMessage(next)) return false;
      const nextResults = next.content.filter(
        (content): content is Extract<MCPSamplingStructuralContent, { type: "tool_result" }> => (
          content.type === "tool_result"
        ),
      );
      if (nextResults.length !== next.content.length) return false;
      if (!hasExactToolResultCorrelation(toolUses, nextResults)) return false;
    }
  }
  return true;
}

function isValidSamplingMessage(value: unknown): value is MCPSamplingStructuralMessage {
  if (!isExactRecord(value, ["role", "content"])) return false;
  if (value.role !== "user" && value.role !== "assistant") return false;
  if (!Array.isArray(value.content) || value.content.length === 0) return false;
  return value.content.every((content) => {
    if (!isPlainRecord(content) || typeof content.type !== "string") return false;
    if (content.type === "tool_use") {
      return isExactRecord(content, ["type", "id"])
        && typeof content.id === "string"
        && STRUCTURAL_ID.test(content.id);
    }
    if (content.type === "tool_result") {
      return isExactRecord(content, ["type", "toolUseId"])
        && typeof content.toolUseId === "string"
        && STRUCTURAL_ID.test(content.toolUseId);
    }
    return ["text", "image", "audio"].includes(content.type)
      && isExactRecord(content, ["type"]);
  });
}

function hasExactToolResultCorrelation(
  uses: readonly Extract<MCPSamplingStructuralContent, { type: "tool_use" }>[],
  results: readonly Extract<MCPSamplingStructuralContent, { type: "tool_result" }>[],
): boolean {
  if (uses.length === 0 || uses.length !== results.length) return false;
  const useIds = uses.map((use) => use.id);
  const resultIds = results.map((result) => result.toolUseId);
  if (new Set(useIds).size !== useIds.length || new Set(resultIds).size !== resultIds.length) {
    return false;
  }
  const expected = new Set(useIds);
  return resultIds.every((id) => expected.has(id));
}

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function isExactRecord(
  value: unknown,
  expectedKeys: readonly string[],
): value is Record<string, unknown> {
  return isPlainRecord(value)
    && Object.keys(value).length === expectedKeys.length
    && Object.keys(value).every((key) => expectedKeys.includes(key));
}

function hasOnlyKeys(value: Record<string, unknown>, allowedKeys: readonly string[]): boolean {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

export function createMCPProtocolInvariantProfile(): MCPProtocolInvariantProfile {
  return new MCPProtocolInvariantProfile();
}
