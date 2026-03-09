import {
  PolicyDocument,
  PolicyRule,
  PolicyDomain,
  EnforcementLevel,
} from "./types";

const SENTENCE_SPLIT = /[.!?\n]+/;
let ruleCounter = 0;
let docCounter = 0;

function nextRuleId(): string {
  ruleCounter++;
  return `PR-${String(ruleCounter).padStart(4, "0")}`;
}

function nextDocId(): string {
  docCounter++;
  return `PD-${String(docCounter).padStart(4, "0")}`;
}

export function resetCompilerCounters(): void {
  ruleCounter = 0;
  docCounter = 0;
}

const DOMAIN_KEYWORDS: Record<PolicyDomain, string[]> = {
  finance: ["spend", "cost", "budget", "payment", "money", "$", "price", "transaction", "withdraw", "invoice", "fee"],
  privacy: ["personal", "data", "email", "customer", "sensitive", "pii", "gdpr", "encrypt", "anonymize", "confidential"],
  code_security: ["code", "script", "execute", "shell", "command", "install", "deploy", "package", "sudo", "root"],
  communication: ["send", "email", "message", "notify", "slack", "webhook", "sms", "broadcast"],
  data: ["database", "query", "sql", "table", "record", "backup", "migrate", "schema"],
  infrastructure: ["server", "cloud", "aws", "azure", "docker", "kubernetes", "firewall", "dns"],
  quality: ["test", "code review", "lint", "error handling", "unit test", "coverage"],
  transparency: ["explain", "summary", "report", "log", "trace", "audit", "glass box"],
  budget: ["token", "cost per task", "resource limit", "daily budget", "compute"],
  general: [],
};

const ENFORCEMENT_KEYWORDS: Record<string, EnforcementLevel> = {
  never: "HARD_BLOCK",
  block: "HARD_BLOCK",
  prevent: "HARD_BLOCK",
  forbid: "HARD_BLOCK",
  prohibit: "HARD_BLOCK",
  "must not": "HARD_BLOCK",
  reject: "REJECT_AND_RETRY",
  retry: "REJECT_AND_RETRY",
  require: "HUMAN_IN_THE_LOOP",
  approval: "HUMAN_IN_THE_LOOP",
  "ask me": "HUMAN_IN_THE_LOOP",
  confirm: "HUMAN_IN_THE_LOOP",
  log: "LOG_ONLY",
  monitor: "LOG_ONLY",
  track: "LOG_ONLY",
  record: "LOG_ONLY",
};

const AMOUNT_PATTERN = /\$?\s*(\d+(?:,\d{3})*(?:\.\d+)?)\s*(?:\/\s*(day|hour|minute|month|week|year))?/gi;
const ACTION_PATTERN = /(?:any|all|every)?\s*(?:attempt to\s+)?(\w+(?:\s+\w+)?)\s+(?:action|operation|request|call)/i;

export class PolicyCompiler {
  compile(vibeText: string, name?: string): PolicyDocument {
    const sentences = vibeText
      .split(SENTENCE_SPLIT)
      .map((s) => s.trim())
      .filter((s) => s.length > 3);

    const rules: PolicyRule[] = [];

    for (const sentence of sentences) {
      const rule = this.compileSentence(sentence);
      if (rule) rules.push(rule);
    }

    const now = Date.now();

    return {
      id: nextDocId(),
      name: name ?? this.generateName(vibeText),
      version: 1,
      status: "draft",
      createdAt: now,
      updatedAt: now,
      sourceVibes: [vibeText],
      rules,
      metadata: {
        author: "nl-policy-compiler",
        tags: this.extractTags(rules),
        scope: "global",
      },
    };
  }

  compileSentence(sentence: string): PolicyRule | null {
    const lower = sentence.toLowerCase();

    if (lower.length < 5) return null;

    const domain = this.detectDomain(lower);
    const enforcement = this.detectEnforcement(lower);
    const action = this.detectAction(lower);
    const constraints = this.extractConstraints(sentence);

    return {
      id: nextRuleId(),
      intentDomain: domain,
      actionTrigger: action,
      constraints,
      enforcement,
      description: sentence,
    };
  }

  private detectDomain(text: string): PolicyDomain {
    let best: PolicyDomain = "general";
    let bestScore = 0;

    for (const [domain, keywords] of Object.entries(DOMAIN_KEYWORDS)) {
      if (domain === "general") continue;
      const score = keywords.filter((kw) => text.includes(kw)).length;
      if (score > bestScore) {
        bestScore = score;
        best = domain as PolicyDomain;
      }
    }

    return best;
  }

  private detectEnforcement(text: string): EnforcementLevel {
    for (const [keyword, level] of Object.entries(ENFORCEMENT_KEYWORDS)) {
      if (text.includes(keyword)) return level;
    }
    return "HUMAN_IN_THE_LOOP";
  }

  private detectAction(text: string): string {
    const match = ACTION_PATTERN.exec(text);
    if (match) return match[1].trim();

    const verbPatterns = [
      /(?:to\s+)(\w+)\s+(?:any|all|the)/i,
      /(?:from\s+)(\w+ing)/i,
      /(?:no|block|prevent)\s+(\w+)/i,
    ];

    for (const pattern of verbPatterns) {
      const m = pattern.exec(text);
      if (m) return m[1].trim();
    }

    return "governed_action";
  }

  private extractConstraints(sentence: string): Record<string, unknown> {
    const constraints: Record<string, unknown> = {};

    const amountRegex = new RegExp(AMOUNT_PATTERN.source, AMOUNT_PATTERN.flags);
    let match: RegExpExecArray | null;

    while ((match = amountRegex.exec(sentence)) !== null) {
      const value = parseFloat(match[1].replace(/,/g, ""));
      const period = match[2]?.toLowerCase();

      if (period) {
        constraints[`max_per_${period}`] = value;
      } else {
        constraints["max_value"] = value;
      }
    }

    const domainMatch = sentence.match(/(?:to|from|with)\s+@?([\w.]+\.\w{2,})/i);
    if (domainMatch) {
      constraints["allowed_domains"] = [domainMatch[1]];
    }

    const countMatch = sentence.match(/(\d+)\s*(times?|requests?|calls?|attempts?)/i);
    if (countMatch) {
      constraints["max_count"] = parseInt(countMatch[1], 10);
    }

    return constraints;
  }

  private generateName(vibeText: string): string {
    const words = vibeText.slice(0, 60).split(/\s+/).slice(0, 6);
    return words.join(" ") + (vibeText.length > 60 ? "..." : "");
  }

  private extractTags(rules: PolicyRule[]): string[] {
    const tags = new Set<string>();
    for (const rule of rules) {
      tags.add(rule.intentDomain);
      tags.add(rule.enforcement.toLowerCase());
    }
    return [...tags];
  }
}
