import {
  DomainGuard,
  GuardRequest,
  GuardResult,
  PrivacyGuardConfig,
  Violation,
} from "./types";

const DEFAULT_CONFIG: PrivacyGuardConfig = {
  protectedFields: ["email", "phone", "ssn", "address", "date_of_birth", "credit_card"],
  allowedExportScopes: ["internal"],
  requireAnonymization: true,
  maxDataRetentionDays: 90,
  blockedExternalDomains: [],
};

export class PrivacyGuard implements DomainGuard {
  readonly domain = "privacy" as const;
  private config: PrivacyGuardConfig;

  constructor(config: Partial<PrivacyGuardConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  evaluate(request: GuardRequest): GuardResult {
    const violations: Violation[] = [];
    const warnings: string[] = [];

    const fields = (request.params.fields as string[]) ?? [];
    const scope = (request.params.scope as string) ?? "unknown";
    const anonymized = (request.params.anonymized as boolean) ?? false;

    const exposedPII = fields.filter((f) =>
      this.config.protectedFields.includes(f.toLowerCase())
    );

    if (exposedPII.length > 0 && !anonymized) {
      violations.push({
        rule: "PII_EXPOSURE",
        description: `Protected fields exposed without anonymization: ${exposedPII.join(", ")}`,
        severity: "critical",
      });
    }

    if (!this.config.allowedExportScopes.includes(scope)) {
      violations.push({
        rule: "SCOPE_VIOLATION",
        description: `Export scope "${scope}" is not in allowed list: ${this.config.allowedExportScopes.join(", ")}`,
        severity: scope === "external" ? "critical" : "high",
      });
    }

    if (this.config.blockedExternalDomains.length > 0) {
      const targetDomain = request.target.split("/")[0];
      if (this.config.blockedExternalDomains.includes(targetDomain)) {
        violations.push({
          rule: "BLOCKED_DOMAIN",
          description: `Target domain "${targetDomain}" is blocked for data transfers`,
          severity: "critical",
        });
      }
    }

    if (this.config.requireAnonymization && !anonymized && fields.length > 0) {
      warnings.push("Data transfer without anonymization flag — review required");
    }

    if (exposedPII.length > 0 && anonymized) {
      warnings.push(`${exposedPII.length} PII field(s) included but anonymized`);
    }

    const retentionDays = (request.params.retentionDays as number) ?? 0;
    if (retentionDays > this.config.maxDataRetentionDays) {
      violations.push({
        rule: "RETENTION_EXCEEDED",
        description: `Retention of ${retentionDays} days exceeds max of ${this.config.maxDataRetentionDays} days`,
        severity: "medium",
      });
    }

    return {
      verdict: this.determineVerdict(violations),
      domain: this.domain,
      violations,
      warnings,
      metadata: {
        piiFieldsDetected: exposedPII,
        scope,
        anonymized,
      },
    };
  }

  private determineVerdict(violations: Violation[]): GuardResult["verdict"] {
    if (violations.some((v) => v.severity === "critical")) return "BLOCK";
    if (violations.some((v) => v.severity === "high")) return "ESCALATE";
    if (violations.length > 0) return "WARN";
    return "ALLOW";
  }
}
