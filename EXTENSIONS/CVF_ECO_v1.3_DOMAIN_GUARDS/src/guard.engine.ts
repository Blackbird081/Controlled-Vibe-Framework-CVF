import { DomainGuard, GuardRequest, GuardResult, GuardDomain } from "./types";
import { FinanceGuard } from "./finance.guard";
import { PrivacyGuard } from "./privacy.guard";
import { CodeSecurityGuard } from "./code.security.guard";

export class GuardEngine {
  private guards: Map<GuardDomain, DomainGuard> = new Map();
  private auditLog: Array<{ request: GuardRequest; result: GuardResult; timestamp: number }> = [];

  constructor() {
    this.registerDefaults();
  }

  evaluate(request: GuardRequest): GuardResult {
    const guard = this.guards.get(request.domain);
    if (!guard) {
      return {
        verdict: "WARN",
        domain: request.domain,
        violations: [],
        warnings: [`No guard registered for domain: ${request.domain}`],
        metadata: {},
      };
    }

    const result = guard.evaluate(request);
    this.auditLog.push({ request, result, timestamp: Date.now() });
    return result;
  }

  evaluateAll(request: GuardRequest): GuardResult[] {
    const results: GuardResult[] = [];
    for (const guard of this.guards.values()) {
      const r = guard.evaluate(request);
      results.push(r);
      this.auditLog.push({ request, result: r, timestamp: Date.now() });
    }
    return results;
  }

  registerGuard(guard: DomainGuard): void {
    this.guards.set(guard.domain, guard);
  }

  getGuard(domain: GuardDomain): DomainGuard | undefined {
    return this.guards.get(domain);
  }

  listDomains(): GuardDomain[] {
    return [...this.guards.keys()];
  }

  getAuditLog() {
    return [...this.auditLog];
  }

  clearAuditLog(): void {
    this.auditLog = [];
  }

  private registerDefaults(): void {
    this.guards.set("finance", new FinanceGuard());
    this.guards.set("privacy", new PrivacyGuard());
    this.guards.set("code_security", new CodeSecurityGuard());
  }
}
