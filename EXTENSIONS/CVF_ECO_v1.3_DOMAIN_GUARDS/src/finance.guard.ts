import {
  DomainGuard,
  GuardRequest,
  GuardResult,
  FinanceGuardConfig,
  Violation,
} from "./types";

const DEFAULT_CONFIG: FinanceGuardConfig = {
  maxTransactionAmount: 5000,
  dailyLimit: 20000,
  requireInvoiceAbove: 500,
  blockedRecipients: [],
  currency: "USD",
};

export class FinanceGuard implements DomainGuard {
  readonly domain = "finance" as const;
  private config: FinanceGuardConfig;
  private dailyTotal = 0;
  private lastResetDate = "";

  constructor(config: Partial<FinanceGuardConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  evaluate(request: GuardRequest): GuardResult {
    this.resetDailyIfNeeded();

    const violations: Violation[] = [];
    const warnings: string[] = [];
    const amount = (request.params.amount as number) ?? 0;

    if (amount > this.config.maxTransactionAmount) {
      violations.push({
        rule: "MAX_TRANSACTION",
        description: `Amount ${amount} exceeds max transaction limit of ${this.config.maxTransactionAmount} ${this.config.currency}`,
        severity: "critical",
      });
    }

    if (this.dailyTotal + amount > this.config.dailyLimit) {
      violations.push({
        rule: "DAILY_LIMIT",
        description: `Daily total would reach ${this.dailyTotal + amount}, exceeding limit of ${this.config.dailyLimit} ${this.config.currency}`,
        severity: "critical",
      });
    }

    if (amount > this.config.requireInvoiceAbove && !request.params.hasInvoice) {
      violations.push({
        rule: "INVOICE_REQUIRED",
        description: `Invoice required for amounts over ${this.config.requireInvoiceAbove} ${this.config.currency}`,
        severity: "high",
      });
    }

    if (this.config.blockedRecipients.includes(request.target)) {
      violations.push({
        rule: "BLOCKED_RECIPIENT",
        description: `Recipient "${request.target}" is on the blocked list`,
        severity: "critical",
      });
    }

    if (amount > this.config.maxTransactionAmount * 0.8) {
      warnings.push(`Transaction at ${((amount / this.config.maxTransactionAmount) * 100).toFixed(0)}% of max limit`);
    }

    if (this.dailyTotal + amount > this.config.dailyLimit * 0.8) {
      warnings.push(`Daily spend at ${(((this.dailyTotal + amount) / this.config.dailyLimit) * 100).toFixed(0)}% of daily limit`);
    }

    const verdict = this.determineVerdict(violations);

    if (verdict === "ALLOW" || verdict === "WARN") {
      this.dailyTotal += amount;
    }

    return {
      verdict,
      domain: this.domain,
      violations,
      warnings,
      metadata: {
        amount,
        dailyTotal: this.dailyTotal,
        dailyRemaining: Math.max(0, this.config.dailyLimit - this.dailyTotal),
      },
    };
  }

  resetDaily(): void {
    this.dailyTotal = 0;
  }

  getDailyTotal(): number {
    return this.dailyTotal;
  }

  private resetDailyIfNeeded(): void {
    const today = new Date().toISOString().slice(0, 10);
    if (today !== this.lastResetDate) {
      this.dailyTotal = 0;
      this.lastResetDate = today;
    }
  }

  private determineVerdict(violations: Violation[]): GuardResult["verdict"] {
    if (violations.some((v) => v.severity === "critical")) return "BLOCK";
    if (violations.some((v) => v.severity === "high")) return "ESCALATE";
    if (violations.length > 0) return "WARN";
    return "ALLOW";
  }
}
