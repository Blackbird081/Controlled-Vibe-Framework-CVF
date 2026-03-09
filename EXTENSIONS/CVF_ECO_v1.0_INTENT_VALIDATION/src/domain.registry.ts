import { DomainDefinition } from "./types";

export const DOMAIN_REGISTRY: readonly DomainDefinition[] = [
  {
    domain: "finance",
    keywords: [
      "spend", "cost", "budget", "payment", "money", "dollar", "$",
      "price", "invoice", "transaction", "purchase", "expense", "fee",
      "subscription", "billing", "refund", "credit", "debit", "withdraw",
    ],
    actions: [
      "payment", "transfer", "withdraw", "purchase", "subscribe",
      "refund", "invoice", "billing", "spend",
    ],
    defaultRisk: "R2",
    defaultEnforcement: "HUMAN_IN_THE_LOOP",
  },
  {
    domain: "privacy",
    keywords: [
      "personal", "data", "email", "phone", "address", "name", "user",
      "customer", "patient", "employee", "sensitive", "confidential",
      "pii", "gdpr", "hipaa", "encrypt", "anonymize",
    ],
    actions: [
      "collect", "store", "share", "transfer", "delete", "export",
      "anonymize", "encrypt",
    ],
    defaultRisk: "R2",
    defaultEnforcement: "HARD_BLOCK",
  },
  {
    domain: "code_security",
    keywords: [
      "code", "script", "execute", "run", "shell", "command", "install",
      "deploy", "compile", "build", "dependency", "package", "npm",
      "pip", "sudo", "admin", "root", "permission",
    ],
    actions: [
      "execute", "install", "deploy", "compile", "build",
      "delete_file", "modify_system", "escalate_privilege", "block",
    ],
    defaultRisk: "R3",
    defaultEnforcement: "HARD_BLOCK",
  },
  {
    domain: "communication",
    keywords: [
      "send", "email", "message", "notify", "alert", "sms", "slack",
      "webhook", "api", "post", "publish", "broadcast", "share",
    ],
    actions: [
      "send_email", "send_message", "post_webhook", "publish",
      "broadcast", "notify",
    ],
    defaultRisk: "R1",
    defaultEnforcement: "HUMAN_IN_THE_LOOP",
  },
  {
    domain: "data",
    keywords: [
      "database", "query", "select", "insert", "update", "delete",
      "drop", "table", "record", "row", "column", "schema", "migrate",
      "backup", "restore", "sql",
    ],
    actions: [
      "read", "write", "delete", "migrate", "backup", "restore",
      "drop_table", "alter_schema",
    ],
    defaultRisk: "R2",
    defaultEnforcement: "HUMAN_IN_THE_LOOP",
  },
  {
    domain: "infrastructure",
    keywords: [
      "server", "cloud", "aws", "azure", "gcp", "container", "docker",
      "kubernetes", "vm", "instance", "network", "firewall", "dns",
      "ssl", "certificate", "scaling", "load balancer",
    ],
    actions: [
      "provision", "terminate", "scale", "configure", "restart",
      "update_firewall", "modify_dns",
    ],
    defaultRisk: "R3",
    defaultEnforcement: "HARD_BLOCK",
  },
  {
    domain: "general",
    keywords: [],
    actions: ["read", "analyze", "summarize", "generate", "format"],
    defaultRisk: "R0",
    defaultEnforcement: "LOG_ONLY",
  },
] as const;

export function findDomains(text: string): DomainDefinition[] {
  const lower = text.toLowerCase();
  const scored: { def: DomainDefinition; score: number }[] = [];

  for (const def of DOMAIN_REGISTRY) {
    if (def.domain === "general") continue;
    const score = def.keywords.filter((kw) => lower.includes(kw)).length;
    if (score > 0) {
      scored.push({ def, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const matched = scored.map((s) => s.def);

  if (matched.length === 0) {
    const general = DOMAIN_REGISTRY.find((d) => d.domain === "general");
    if (general) matched.push(general);
  }

  return matched;
}

export function findActions(text: string, domains: DomainDefinition[]): string[] {
  const lower = text.toLowerCase();
  const actions: string[] = [];

  for (const domain of domains) {
    for (const action of domain.actions) {
      const actionWords = action.replace(/_/g, " ").split(" ");
      if (actionWords.some((w) => lower.includes(w))) {
        actions.push(action);
      }
    }
  }

  return [...new Set(actions)];
}
