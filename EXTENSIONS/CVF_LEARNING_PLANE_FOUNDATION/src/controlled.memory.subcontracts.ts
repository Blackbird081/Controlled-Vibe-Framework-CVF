import type {
  ControlledMemoryKind,
  ControlledMemoryPrivacyReport,
  ControlledMemorySensitivity,
} from "./controlled.memory.gateway.contract";

export const APPROVED_MEMORY_CAPTURE_SOURCES = [
  "session_start",
  "user_prompt_submit",
  "pre_tool_use",
  "post_tool_use",
  "post_tool_use_failure",
  "subagent_start",
  "subagent_stop",
  "approval_request",
  "approval_result",
  "execution_result",
  "session_end",
  "prompt_submit",
  "tool_result",
  "handoff",
] as const;

export type ApprovedMemoryCaptureSource = (typeof APPROVED_MEMORY_CAPTURE_SOURCES)[number];

export interface MemoryRetentionDecision {
  lifecycleClass: ControlledMemoryKind;
  reviewRequired: boolean;
  expiresAt?: string;
  reason: string;
}

const MEMORY_PRIVACY_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, label: "[PII_EMAIL]" },
  { pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, label: "[PII_PHONE]" },
  { pattern: /\b(?:sk|pk|api|key|token|secret|bearer|auth)[-_]?[A-Za-z0-9]{12,}\b/gi, label: "[SECRET_MASKED]" },
  { pattern: /password\s*[=:]\s*\S+/gi, label: "[SECRET_MASKED]" },
  { pattern: /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g, label: "[SECRET_MASKED]" },
];

export function isApprovedMemoryCaptureSource(sourceEvent: string): sourceEvent is ApprovedMemoryCaptureSource {
  return APPROVED_MEMORY_CAPTURE_SOURCES.includes(sourceEvent as ApprovedMemoryCaptureSource);
}

export function applyMemoryPrivacyFilter(content: string): { content: string; report: ControlledMemoryPrivacyReport } {
  let filtered = content;
  let maskedTokenCount = 0;
  const appliedPatterns: string[] = [];

  for (const { pattern, label } of MEMORY_PRIVACY_PATTERNS) {
    const matches = filtered.match(pattern);
    if (!matches?.length) continue;
    maskedTokenCount += matches.length;
    if (!appliedPatterns.includes(label)) appliedPatterns.push(label);
    filtered = filtered.replace(pattern, label);
  }

  return {
    content: filtered,
    report: {
      filtered: maskedTokenCount > 0,
      maskedTokenCount,
      appliedPatterns,
    },
  };
}

export function resolveMemoryRetention(input: {
  kind: ControlledMemoryKind;
  sensitivity: ControlledMemorySensitivity;
  capturedAt: string;
  ttlDays?: number;
}): MemoryRetentionDecision {
  const ttlDays = input.ttlDays ?? defaultTtlDays(input.kind);
  const reviewRequired = input.sensitivity === "confidential" || input.sensitivity === "restricted";
  return {
    lifecycleClass: input.kind,
    reviewRequired,
    expiresAt: ttlDays
      ? new Date(Date.parse(input.capturedAt) + ttlDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined,
    reason: reviewRequired
      ? "sensitive_memory_requires_review_gate"
      : "memory_retention_policy_applied",
  };
}

function defaultTtlDays(kind: ControlledMemoryKind): number | undefined {
  if (kind === "working") return 1;
  if (kind === "episodic") return 90;
  return undefined;
}
