import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

export type ControlledMemorySegmentClass = "general" | "identity" | "preference" | "correction";
export type ControlledMemorySourceTrust =
  | "trusted_user_instruction"
  | "trusted_owner_message"
  | "untrusted_tool_output"
  | "untrusted_retrieval"
  | "untrusted_generated";
export type ControlledMemoryLinkType =
  | "supersedes" | "transition" | "corrects" | "relates"
  | "derived_from" | "supports" | "contradicts";

export interface ControlledMemoryOrigin {
  principalId: string;
  scope: string;
  projectId?: string;
  sessionId?: string;
}

export interface ControlledMemoryLink {
  type: ControlledMemoryLinkType;
  targetMemoryId: string;
}

const PROTECTED_SEGMENTS = new Set<ControlledMemorySegmentClass>(["identity", "preference", "correction"]);
const TRUSTED_SOURCES = new Set<ControlledMemorySourceTrust>(["trusted_user_instruction", "trusted_owner_message"]);
const TRUST_REQUIRED_LINKS = new Set<ControlledMemoryLinkType>(["supersedes", "corrects"]);

export function deriveMemorySourceTrust(sourceEvent: string, actorRole: string): ControlledMemorySourceTrust {
  if (sourceEvent === "user_prompt_submit" || sourceEvent === "prompt_submit") return "trusted_user_instruction";
  if (actorRole === "operator" && (sourceEvent === "handoff" || sourceEvent === "approval_result")) {
    return "trusted_owner_message";
  }
  if (sourceEvent === "tool_result" || sourceEvent === "post_tool_use" || sourceEvent === "post_tool_use_failure") {
    return "untrusted_tool_output";
  }
  return "untrusted_generated";
}

export function buildControlledMemoryOriginKey(origin: ControlledMemoryOrigin): string {
  return computeDeterministicHash(
    "cvf-controlled-memory-origin",
    origin.principalId,
    origin.scope,
    origin.projectId ?? "",
    origin.sessionId ?? "",
  );
}

export function isTrustedMemorySource(sourceTrust: ControlledMemorySourceTrust): boolean {
  return TRUSTED_SOURCES.has(sourceTrust);
}

export function validateMemoryTrustAdmission(input: {
  segmentClass: ControlledMemorySegmentClass;
  sourceTrust: ControlledMemorySourceTrust;
  links: readonly ControlledMemoryLink[];
}): string | undefined {
  if (PROTECTED_SEGMENTS.has(input.segmentClass) && !isTrustedMemorySource(input.sourceTrust)) {
    return "untrusted_source_cannot_write_protected_memory";
  }
  if (!isTrustedMemorySource(input.sourceTrust) && input.links.some((link) => TRUST_REQUIRED_LINKS.has(link.type))) {
    return "untrusted_source_cannot_supersede_or_correct_memory";
  }
  return undefined;
}
