import { AgentAction, ActionVerdict, ViolationDetail, GovernanceDomain } from "./types";

interface GuardRule {
  id: string;
  domain: GovernanceDomain;
  check: (action: AgentAction) => { pass: boolean; message: string; severity: ViolationDetail["severity"] };
}

const BUILT_IN_RULES: GuardRule[] = [
  {
    id: "FIN_MAX_TRANSACTION",
    domain: "finance",
    check: (a) => {
      const amount = (a.params.amount as number) ?? 0;
      return {
        pass: amount <= 5000,
        message: `Transaction ${amount} exceeds max limit 5000`,
        severity: "critical",
      };
    },
  },
  {
    id: "FIN_BLOCKED_RECIPIENT",
    domain: "finance",
    check: (a) => {
      const blocked = (a.params.blockedRecipients as string[]) ?? [];
      return {
        pass: !blocked.includes(a.target),
        message: `Recipient "${a.target}" is blocked`,
        severity: "critical",
      };
    },
  },
  {
    id: "FIN_INVOICE_REQUIRED",
    domain: "finance",
    check: (a) => {
      const amount = (a.params.amount as number) ?? 0;
      const hasInvoice = (a.params.hasInvoice as boolean) ?? false;
      return {
        pass: amount <= 500 || hasInvoice,
        message: `Invoice required for amounts over 500`,
        severity: "high",
      };
    },
  },
  {
    id: "PRIV_PII_EXPOSURE",
    domain: "privacy",
    check: (a) => {
      const fields = (a.params.fields as string[]) ?? [];
      const anonymized = (a.params.anonymized as boolean) ?? false;
      const piiFields = ["email", "phone", "ssn", "address", "credit_card", "date_of_birth"];
      const exposed = fields.filter((f) => piiFields.includes(f.toLowerCase()));
      return {
        pass: exposed.length === 0 || anonymized,
        message: `PII fields exposed without anonymization: ${exposed.join(", ")}`,
        severity: "critical",
      };
    },
  },
  {
    id: "PRIV_SCOPE_VIOLATION",
    domain: "privacy",
    check: (a) => {
      const scope = (a.params.scope as string) ?? "internal";
      return {
        pass: scope === "internal",
        message: `Export scope "${scope}" not allowed — only internal permitted`,
        severity: "critical",
      };
    },
  },
  {
    id: "SEC_BLOCKED_COMMAND",
    domain: "code_security",
    check: (a) => {
      const command = (a.params.command as string) ?? "";
      const blocked = ["rm -rf", "drop table", "format c:", "del /f", "mkfs"];
      const found = blocked.find((b) => command.toLowerCase().includes(b.toLowerCase()));
      return {
        pass: !found,
        message: `Blocked command detected: "${found}"`,
        severity: "critical",
      };
    },
  },
  {
    id: "SEC_BLOCKED_PATTERN",
    domain: "code_security",
    check: (a) => {
      const code = (a.params.code as string) ?? "";
      const patterns = ["eval(", "exec(", "os.system(", "child_process"];
      const found = patterns.find((p) => code.includes(p));
      return {
        pass: !found,
        message: `Blocked code pattern: "${found}"`,
        severity: "high",
      };
    },
  },
  {
    id: "SEC_CODE_REVIEW",
    domain: "code_security",
    check: (a) => {
      if (a.action !== "deploy") return { pass: true, message: "", severity: "low" };
      const reviewed = (a.params.codeReviewed as boolean) ?? false;
      return {
        pass: reviewed,
        message: "Deployment requires code review",
        severity: "high",
      };
    },
  },
];

export interface GuardResult {
  verdict: ActionVerdict;
  violations: ViolationDetail[];
  warnings: string[];
}

export class GuardModule {
  private rules: GuardRule[] = [...BUILT_IN_RULES];
  private customRules: GuardRule[] = [];

  evaluate(action: AgentAction): GuardResult {
    const violations: ViolationDetail[] = [];
    const warnings: string[] = [];

    const applicableRules = [...this.rules, ...this.customRules].filter(
      (r) => r.domain === action.domain || r.domain === "general"
    );

    for (const rule of applicableRules) {
      const result = rule.check(action);
      if (!result.pass) {
        violations.push({
          rule: rule.id,
          description: result.message,
          severity: result.severity,
          domain: rule.domain,
        });
      }
    }

    return {
      verdict: this.determineVerdict(violations),
      violations,
      warnings,
    };
  }

  addRule(rule: GuardRule): void {
    this.customRules.push(rule);
  }

  getRuleCount(): number {
    return this.rules.length + this.customRules.length;
  }

  private determineVerdict(violations: ViolationDetail[]): ActionVerdict {
    if (violations.some((v) => v.severity === "critical")) return "BLOCK";
    if (violations.some((v) => v.severity === "high")) return "ESCALATE";
    if (violations.length > 0) return "WARN";
    return "ALLOW";
  }
}
