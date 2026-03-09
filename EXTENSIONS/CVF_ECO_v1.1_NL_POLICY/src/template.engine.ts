import {
  PolicyTemplate,
  PolicyDocument,
  PolicyRule,
  PolicyDomain,
} from "./types";

let templateRuleCounter = 0;
let templateDocCounter = 100;

function nextTemplateRuleId(): string {
  templateRuleCounter++;
  return `TR-${String(templateRuleCounter).padStart(4, "0")}`;
}

function nextTemplateDocId(): string {
  templateDocCounter++;
  return `TD-${String(templateDocCounter).padStart(4, "0")}`;
}

export function resetTemplateCounters(): void {
  templateRuleCounter = 0;
  templateDocCounter = 100;
}

const BUILT_IN_TEMPLATES: PolicyTemplate[] = [
  {
    id: "financial_governance",
    name: "Financial Governance",
    description: "Protect against unauthorized financial transactions and spending overruns",
    domain: "finance",
    rules: [
      {
        intentDomain: "finance",
        actionTrigger: "WITHDRAW_FUNDS",
        constraints: { max_value: "${max_daily_spend}", currency: "${currency}" },
        enforcement: "HARD_BLOCK",
        description: "Block withdrawals exceeding daily limit",
      },
      {
        intentDomain: "finance",
        actionTrigger: "BUY_ASSET",
        constraints: { asset_class_filter: "${blocked_assets}" },
        enforcement: "HUMAN_IN_THE_LOOP",
        description: "Require approval for asset purchases in restricted classes",
      },
      {
        intentDomain: "finance",
        actionTrigger: "PAYMENT",
        constraints: { require_invoice: true },
        enforcement: "REJECT_AND_RETRY",
        description: "Reject payments without attached invoice",
      },
    ],
    parameters: [
      { name: "max_daily_spend", type: "number", defaultValue: 5000, description: "Maximum daily spend" },
      { name: "currency", type: "string", defaultValue: "USD", description: "Currency code" },
      { name: "blocked_assets", type: "string[]", defaultValue: ["CRYPTO", "MEMECOIN"], description: "Blocked asset classes" },
    ],
  },
  {
    id: "data_privacy",
    name: "Data Privacy Guard",
    description: "Prevent unauthorized access and transfer of personal data",
    domain: "privacy",
    rules: [
      {
        intentDomain: "privacy",
        actionTrigger: "EXPORT_DATA",
        constraints: { scope: "external", pii_fields: "${protected_fields}" },
        enforcement: "HARD_BLOCK",
        description: "Block external export of PII data",
      },
      {
        intentDomain: "privacy",
        actionTrigger: "SHARE_DATA",
        constraints: { require_anonymization: true },
        enforcement: "HUMAN_IN_THE_LOOP",
        description: "Require approval and anonymization before sharing",
      },
    ],
    parameters: [
      { name: "protected_fields", type: "string[]", defaultValue: ["email", "phone", "address", "ssn"], description: "PII fields to protect" },
    ],
  },
  {
    id: "code_quality",
    name: "Code Quality & Security",
    description: "Ensure generated code meets quality and security standards",
    domain: "quality",
    rules: [
      {
        intentDomain: "quality",
        actionTrigger: "CODE_GENERATION",
        constraints: { mandatory_steps: ["UNIT_TEST_INCLUDED", "ERROR_HANDLING_REQUIRED"], forbidden_patterns: "${forbidden_patterns}" },
        enforcement: "REJECT_AND_RETRY",
        description: "Reject code without tests and error handling",
      },
      {
        intentDomain: "code_security",
        actionTrigger: "EXECUTE_COMMAND",
        constraints: { blocked_commands: "${blocked_commands}" },
        enforcement: "HARD_BLOCK",
        description: "Block execution of dangerous commands",
      },
    ],
    parameters: [
      { name: "forbidden_patterns", type: "string[]", defaultValue: ["hard-coded credentials", "eval(", "exec("], description: "Forbidden code patterns" },
      { name: "blocked_commands", type: "string[]", defaultValue: ["rm -rf", "drop table", "format"], description: "Blocked shell commands" },
    ],
  },
  {
    id: "budget_resource",
    name: "Budget & Resource Ledger",
    description: "Control token usage and compute costs",
    domain: "budget",
    rules: [
      {
        intentDomain: "budget",
        actionTrigger: "LLM_CALL",
        constraints: { daily_token_budget: "${daily_token_budget}", max_cost_per_task: "${max_cost_per_task}" },
        enforcement: "HARD_BLOCK",
        description: "Block LLM calls when budget exceeded",
      },
      {
        intentDomain: "budget",
        actionTrigger: "MODEL_SELECTION",
        constraints: { force_cheap_when: "LOW_COMPLEXITY" },
        enforcement: "LOG_ONLY",
        description: "Log when expensive model used for low-complexity tasks",
      },
    ],
    parameters: [
      { name: "daily_token_budget", type: "number", defaultValue: 500000, description: "Daily token budget" },
      { name: "max_cost_per_task", type: "number", defaultValue: 2.0, description: "Max USD cost per task" },
    ],
  },
];

export class TemplateEngine {
  private templates: Map<string, PolicyTemplate> = new Map();

  constructor() {
    for (const t of BUILT_IN_TEMPLATES) {
      this.templates.set(t.id, t);
    }
  }

  listTemplates(): PolicyTemplate[] {
    return [...this.templates.values()];
  }

  getTemplate(id: string): PolicyTemplate | undefined {
    return this.templates.get(id);
  }

  instantiate(
    templateId: string,
    params: Record<string, unknown> = {}
  ): PolicyDocument {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    const resolvedParams = this.resolveParams(template, params);
    const rules = this.instantiateRules(template, resolvedParams);
    const now = Date.now();

    return {
      id: nextTemplateDocId(),
      name: template.name,
      version: 1,
      status: "active",
      createdAt: now,
      updatedAt: now,
      sourceVibes: [`template:${templateId}`],
      rules,
      metadata: {
        author: "template-engine",
        templateId,
        tags: [template.domain, templateId],
        scope: "global",
      },
    };
  }

  registerTemplate(template: PolicyTemplate): void {
    this.templates.set(template.id, template);
  }

  private resolveParams(
    template: PolicyTemplate,
    overrides: Record<string, unknown>
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    for (const param of template.parameters) {
      resolved[param.name] = overrides[param.name] ?? param.defaultValue;
    }

    return resolved;
  }

  private instantiateRules(
    template: PolicyTemplate,
    params: Record<string, unknown>
  ): PolicyRule[] {
    return template.rules.map((ruleDef) => {
      const constraints = this.resolveConstraints(ruleDef.constraints, params);

      return {
        id: nextTemplateRuleId(),
        intentDomain: ruleDef.intentDomain,
        actionTrigger: ruleDef.actionTrigger,
        constraints,
        enforcement: ruleDef.enforcement,
        description: ruleDef.description,
      };
    });
  }

  private resolveConstraints(
    constraints: Record<string, unknown>,
    params: Record<string, unknown>
  ): Record<string, unknown> {
    const resolved: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(constraints)) {
      if (typeof value === "string" && value.startsWith("${") && value.endsWith("}")) {
        const paramName = value.slice(2, -1);
        resolved[key] = params[paramName] ?? value;
      } else {
        resolved[key] = value;
      }
    }

    return resolved;
  }
}
