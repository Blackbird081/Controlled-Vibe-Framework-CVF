import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type GatewaySignalType = "vibe" | "command" | "query" | "event";

export interface GatewayEnvContext {
  platform?: string;
  phase?: string;
  riskLevel?: string;
  locale?: string;
  tags?: string[];
}

export interface GatewayPrivacyConfig {
  maskPII?: boolean;
  maskSecrets?: boolean;
  redactPatterns?: string[];
}

export interface GatewaySignalRequest {
  rawSignal: string;
  signalType?: GatewaySignalType;
  envContext?: GatewayEnvContext;
  privacyConfig?: GatewayPrivacyConfig;
  sessionId?: string;
  agentId?: string;
  consumerId?: string;
}

export interface GatewayPrivacyReport {
  filtered: boolean;
  maskedTokenCount: number;
  appliedPatterns: string[];
}

export interface GatewayEnvMetadata {
  platform: string;
  phase: string;
  riskLevel: string;
  locale: string;
  tags: string[];
}

export interface GatewayProcessedRequest {
  gatewayId: string;
  processedAt: string;
  rawSignal: string;
  normalizedSignal: string;
  signalType: GatewaySignalType;
  envMetadata: GatewayEnvMetadata;
  privacyReport: GatewayPrivacyReport;
  sessionId?: string;
  agentId?: string;
  consumerId?: string;
  gatewayHash: string;
  warnings: string[];
}

export interface AIGatewayContractDependencies {
  applyPrivacyFilter?: (
    signal: string,
    config: GatewayPrivacyConfig,
  ) => { filtered: string; report: GatewayPrivacyReport };
  now?: () => string;
}

// --- Default privacy filter (deterministic pattern-based) ---

const PII_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, label: "[PII_EMAIL]" },
  { pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, label: "[PII_PHONE]" },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, label: "[PII_SSN]" },
];

const SECRET_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\b(sk|pk|api|key|token|secret|bearer|auth)[-_]?[A-Za-z0-9]{16,}\b/gi, label: "[SECRET_MASKED]" },
  { pattern: /password\s*[=:]\s*\S+/gi, label: "[SECRET_MASKED]" },
];

function defaultApplyPrivacyFilter(
  signal: string,
  config: GatewayPrivacyConfig,
): { filtered: string; report: GatewayPrivacyReport } {
  let filtered = signal;
  let maskedTokenCount = 0;
  const appliedPatterns: string[] = [];

  if (config.maskPII !== false) {
    for (const { pattern, label } of PII_PATTERNS) {
      const matches = filtered.match(pattern);
      if (matches && matches.length > 0) {
        maskedTokenCount += matches.length;
        appliedPatterns.push(label);
        filtered = filtered.replace(pattern, label);
      }
    }
  }

  if (config.maskSecrets !== false) {
    for (const { pattern, label } of SECRET_PATTERNS) {
      const matches = filtered.match(pattern);
      if (matches && matches.length > 0) {
        maskedTokenCount += matches.length;
        if (!appliedPatterns.includes(label)) appliedPatterns.push(label);
        filtered = filtered.replace(pattern, label);
      }
    }
  }

  if (config.redactPatterns) {
    for (const rawPattern of config.redactPatterns) {
      try {
        const pattern = new RegExp(rawPattern, "g");
        const matches = filtered.match(pattern);
        if (matches && matches.length > 0) {
          maskedTokenCount += matches.length;
          appliedPatterns.push(`[REDACTED:${rawPattern}]`);
          filtered = filtered.replace(pattern, "[REDACTED]");
        }
      } catch {
        // invalid regex — skip silently
      }
    }
  }

  return {
    filtered,
    report: {
      filtered: maskedTokenCount > 0,
      maskedTokenCount,
      appliedPatterns,
    },
  };
}

// --- Env metadata builder ---

function buildEnvMetadata(ctx: GatewayEnvContext | undefined): GatewayEnvMetadata {
  return {
    platform: ctx?.platform ?? "cvf",
    phase: ctx?.phase ?? "INTAKE",
    riskLevel: ctx?.riskLevel ?? "R1",
    locale: ctx?.locale ?? "en",
    tags: ctx?.tags ?? [],
  };
}

// --- Contract ---

export class AIGatewayContract {
  private readonly applyPrivacyFilter: (
    signal: string,
    config: GatewayPrivacyConfig,
  ) => { filtered: string; report: GatewayPrivacyReport };
  private readonly now: () => string;

  constructor(dependencies: AIGatewayContractDependencies = {}) {
    this.applyPrivacyFilter = dependencies.applyPrivacyFilter ?? defaultApplyPrivacyFilter;
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  process(signal: GatewaySignalRequest): GatewayProcessedRequest {
    const processedAt = this.now();

    if (!signal.rawSignal || signal.rawSignal.trim().length === 0) {
      const gatewayHash = computeDeterministicHash(
        "w1-t4-cp1-gateway",
        `${processedAt}:empty`,
        signal.consumerId ?? "anonymous",
      );
      const gatewayId = computeDeterministicHash("w1-t4-cp1-gateway-id", gatewayHash, processedAt);
      return {
        gatewayId,
        processedAt,
        rawSignal: "",
        normalizedSignal: "",
        signalType: signal.signalType ?? "vibe",
        envMetadata: buildEnvMetadata(signal.envContext),
        privacyReport: { filtered: false, maskedTokenCount: 0, appliedPatterns: [] },
        sessionId: signal.sessionId,
        agentId: signal.agentId,
        consumerId: signal.consumerId,
        gatewayHash,
        warnings: ["Gateway received empty signal — downstream intake will produce low-confidence results."],
      };
    }

    const privacyConfig: GatewayPrivacyConfig = signal.privacyConfig ?? {
      maskPII: true,
      maskSecrets: true,
    };

    const { filtered: normalizedSignal, report: privacyReport } = this.applyPrivacyFilter(
      signal.rawSignal.trim(),
      privacyConfig,
    );

    const envMetadata = buildEnvMetadata(signal.envContext);
    const signalType: GatewaySignalType = signal.signalType ?? "vibe";

    const gatewayHash = computeDeterministicHash(
      "w1-t4-cp1-gateway",
      `${processedAt}:${signal.consumerId ?? "anonymous"}`,
      `type:${signalType}`,
      `signal:${normalizedSignal}`,
      `env:${envMetadata.platform}:${envMetadata.phase}:${envMetadata.riskLevel}`,
    );

    const gatewayId = computeDeterministicHash(
      "w1-t4-cp1-gateway-id",
      gatewayHash,
      processedAt,
    );

    const warnings: string[] = [];
    if (privacyReport.maskedTokenCount > 0) {
      warnings.push(
        `Gateway masked ${privacyReport.maskedTokenCount} sensitive token(s) before intake.`,
      );
    }
    if (normalizedSignal.length < 10) {
      warnings.push("Normalized signal is very short — intake may produce low-confidence results.");
    }

    return {
      gatewayId,
      processedAt,
      rawSignal: signal.rawSignal,
      normalizedSignal,
      signalType,
      envMetadata,
      privacyReport,
      sessionId: signal.sessionId,
      agentId: signal.agentId,
      consumerId: signal.consumerId,
      gatewayHash,
      warnings,
    };
  }
}

export function createAIGatewayContract(
  dependencies?: AIGatewayContractDependencies,
): AIGatewayContract {
  return new AIGatewayContract(dependencies);
}
