import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";

// --- Types ---

export type PIIType = "EMAIL" | "PHONE" | "SSN" | "CREDIT_CARD" | "CUSTOM";

export interface PIIDetectionConfig {
  enabledTypes?: PIIType[];
  customPatterns?: Array<{ pattern: string; label: string }>;
}

export interface GatewayPIIDetectionRequest {
  signal: string;
  tenantId: string;
  config?: PIIDetectionConfig;
}

export interface PIIDetectionMatch {
  piiType: PIIType;
  matchCount: number;
}

export interface GatewayPIIDetectionResult {
  resultId: string;
  detectedAt: string;
  tenantId: string;
  piiDetected: boolean;
  piiTypes: PIIType[];
  matches: PIIDetectionMatch[];
  redactedSignal: string;
  detectionHash: string;
}

export interface GatewayPIIDetectionContractDependencies {
  now?: () => string;
}

// --- NLP Pattern registry ---

const PII_PATTERNS: Record<PIIType, Array<{ pattern: RegExp; label: string }>> =
  {
    EMAIL: [
      {
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
        label: "[PII_EMAIL]",
      },
    ],
    PHONE: [
      {
        pattern: /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
        label: "[PII_PHONE]",
      },
    ],
    SSN: [
      {
        pattern: /\b\d{3}-\d{2}-\d{4}\b/g,
        label: "[PII_SSN]",
      },
    ],
    CREDIT_CARD: [
      {
        pattern: /\b(?:\d{4}[-\s]?){3}\d{4}\b/g,
        label: "[PII_CC]",
      },
    ],
    CUSTOM: [],
  };

const ALL_PII_TYPES: PIIType[] = ["EMAIL", "PHONE", "SSN", "CREDIT_CARD"];

// --- Contract ---

export class GatewayPIIDetectionContract {
  private readonly now: () => string;

  constructor(dependencies: GatewayPIIDetectionContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  detect(request: GatewayPIIDetectionRequest): GatewayPIIDetectionResult {
    const detectedAt = this.now();
    const enabledTypes = request.config?.enabledTypes ?? ALL_PII_TYPES;

    let redacted = request.signal;
    const matchMap: Map<PIIType, number> = new Map();

    // Standard PII types
    for (const piiType of enabledTypes) {
      if (piiType === "CUSTOM") continue;
      for (const { pattern, label } of PII_PATTERNS[piiType]) {
        const found = redacted.match(pattern);
        if (found && found.length > 0) {
          const prior = matchMap.get(piiType) ?? 0;
          matchMap.set(piiType, prior + found.length);
          redacted = redacted.replace(pattern, label);
        }
      }
    }

    // Custom patterns
    if (
      enabledTypes.includes("CUSTOM") &&
      request.config?.customPatterns
    ) {
      for (const { pattern: rawPattern, label } of request.config
        .customPatterns) {
        try {
          const pattern = new RegExp(rawPattern, "g");
          const found = redacted.match(pattern);
          if (found && found.length > 0) {
            const prior = matchMap.get("CUSTOM") ?? 0;
            matchMap.set("CUSTOM", prior + found.length);
            redacted = redacted.replace(pattern, label);
          }
        } catch {
          // invalid regex — skip silently
        }
      }
    }

    const piiTypes: PIIType[] = Array.from(matchMap.keys());
    const matches: PIIDetectionMatch[] = piiTypes.map((t) => ({
      piiType: t,
      matchCount: matchMap.get(t)!,
    }));
    const piiDetected = piiTypes.length > 0;

    const detectionHash = computeDeterministicHash(
      "w1-t9-cp1-pii-detection",
      `${detectedAt}:${request.tenantId}`,
      `detected:${piiDetected}:types:${piiTypes.join(",")}`,
      `signal:${request.signal.length}`,
    );

    const resultId = computeDeterministicHash(
      "w1-t9-cp1-result-id",
      detectionHash,
      detectedAt,
    );

    return {
      resultId,
      detectedAt,
      tenantId: request.tenantId,
      piiDetected,
      piiTypes,
      matches,
      redactedSignal: redacted,
      detectionHash,
    };
  }
}

export function createGatewayPIIDetectionContract(
  dependencies?: GatewayPIIDetectionContractDependencies,
): GatewayPIIDetectionContract {
  return new GatewayPIIDetectionContract(dependencies);
}
