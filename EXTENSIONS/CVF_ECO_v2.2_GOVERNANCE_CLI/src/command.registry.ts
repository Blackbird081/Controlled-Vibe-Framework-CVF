import { existsSync, readFileSync } from "node:fs";
import {
  CLICommand,
  CLICommandHandler,
  CLIArgs,
  CLIOutput,
  CLIConfig,
  DEFAULT_CLI_CONFIG,
  type BenchmarkGovernanceOptions,
} from "./types";
import { executeGovernedTemplateCommand } from "./execute.client";
import {
  computeGovernanceReliabilityReport,
  parseAuditJsonl,
  type GovernanceReliabilityReport,
} from "./governance-reliability-metrics";

export class CommandRegistry {
  private handlers: Map<CLICommand, CLICommandHandler> = new Map();
  private config: CLIConfig;

  constructor(config: Partial<CLIConfig> = {}) {
    this.config = { ...DEFAULT_CLI_CONFIG, ...config };
    this.registerBuiltins();
  }

  register(handler: CLICommandHandler): void {
    this.handlers.set(handler.name, handler);
  }

  execute(args: CLIArgs): CLIOutput {
    const handler = this.handlers.get(args.command);
    if (!handler) {
      return {
        success: false,
        message: `Unknown command: ${args.command}. Run 'cvf-guard help' for usage.`,
        exitCode: 1,
      };
    }
    return handler.execute(args);
  }

  async executeAsync(args: CLIArgs): Promise<CLIOutput> {
    const handler = this.handlers.get(args.command);
    if (!handler) {
      return {
        success: false,
        message: `Unknown command: ${args.command}. Run 'cvf-guard help' for usage.`,
        exitCode: 1,
      };
    }
    if (handler.executeAsync) {
      return handler.executeAsync(args);
    }
    return handler.execute(args);
  }

  getHandler(command: CLICommand): CLICommandHandler | undefined {
    return this.handlers.get(command);
  }

  listCommands(): Array<{ name: string; description: string }> {
    return [...this.handlers.values()].map((h) => ({
      name: h.name,
      description: h.description,
    }));
  }

  private registerBuiltins(): void {
    this.register({
      name: "help",
      description: "Show available commands and usage",
      usage: "cvf-guard help [command]",
      execute: (args) => this.helpCommand(args),
    });

    this.register({
      name: "version",
      description: "Show CLI version",
      usage: "cvf-guard version",
      execute: () => ({
        success: true,
        message: `${this.config.name} v${this.config.version}`,
        data: { version: this.config.version },
        exitCode: 0,
      }),
    });

    this.register({
      name: "status",
      description: "Show governance system status",
      usage: "cvf-guard status",
      execute: () => ({
        success: true,
        message: [
          `${this.config.name} v${this.config.version}`,
          `Status: OPERATIONAL`,
          `Modules: RiskScoring, DomainGuards, SessionManager, AuditLogger`,
          `Domains: finance, privacy, code_security, communication, data, infrastructure, general`,
        ].join("\n"),
        data: { status: "operational", modules: 4, domains: 7 },
        exitCode: 0,
      }),
    });

    this.register({
      name: "evaluate",
      description: "Evaluate an agent action against governance rules",
      usage: "cvf-guard evaluate --domain <domain> --action <action> --target <target> [--amount <n>]",
      execute: (args) => this.evaluateCommand(args),
    });

    this.register({
      name: "execute",
      description: "Execute a governed CVF template through the web execute route",
      usage: "cvf execute --template <id> --role <role> [--input <json>] [--endpoint <url>] [--dry-run] [--receipt] [--verbose]",
      execute: (args) => {
        if (args.flags.help === true || args.flags.h === true) {
          return {
            success: true,
            message: "execute: Execute a governed CVF template through the web execute route\nUsage: cvf execute --template <id> --role <role> [--input <json>] [--endpoint <url>] [--dry-run] [--receipt] [--verbose]",
            exitCode: 0,
          };
        }
        return {
          success: false,
          message: "The execute command performs HTTP I/O. Use GovernanceCLI.runAsync() or the async CLI entrypoint.",
          exitCode: 1,
        };
      },
      executeAsync: (args) => executeGovernedTemplateCommand(args),
    });

    this.register({
      name: "run",
      description: "Alias to cvf execute --template <template>",
      usage: "cvf run <template> --role <role> [--input <json>] [--endpoint <url>] [--dry-run] [--receipt] [--verbose]",
      execute: (args) => this.execute(this.runAliasArgs(args)),
      executeAsync: (args) => this.executeAsync(this.runAliasArgs(args)),
    });

    this.register({
      name: "skill",
      description: "Read-only skill registry inspection",
      usage: "cvf skill <list|show> [id] [--input <skills-index.json>]",
      execute: (args) => this.skillCommand(args),
    });

    this.register({
      name: "receipt",
      description: "Read-only receipt artifact inspection",
      usage: "cvf receipt show <id> [--input <receipts.jsonl>]",
      execute: (args) => this.receiptCommand(args),
    });

    this.register({
      name: "trace",
      description: "Read-only audit trace dump",
      usage: "cvf trace dump [--session <id>] [--input <audit.jsonl>]",
      execute: (args) => this.traceCommand(args),
    });

    this.register({
      name: "provider",
      description: "Read-only provider lane listing",
      usage: "cvf provider list",
      execute: (args) => this.providerCommand(args),
    });

    this.register({
      name: "benchmark",
      description: "Run offline CVF benchmark computations",
      usage: "cvf benchmark <governance|run> --input <audit.jsonl> [--format json|table]",
      execute: (args) => this.benchmarkCommand(args),
    });

    this.register({
      name: "session",
      description: "Manage governance sessions",
      usage: "cvf-guard session <start|end|list|summary> [--agent <id>] [--session <id>]",
      execute: (args) => this.sessionCommand(args),
    });

    this.register({
      name: "report",
      description: "Generate governance report",
      usage: "cvf-guard report [--format text|markdown] [--title <title>]",
      execute: (args) => this.reportCommand(args),
    });

    this.register({
      name: "audit",
      description: "Query audit log",
      usage: "cvf-guard audit [--session <id>] [--verdict <verdict>] [--count]",
      execute: (args) => this.auditCommand(args),
    });
  }

  private helpCommand(args: CLIArgs): CLIOutput {
    const specificCmd = args.positional[0];
    if (specificCmd) {
      const handler = this.handlers.get(specificCmd as CLICommand);
      if (handler) {
        return {
          success: true,
          message: `${handler.name}: ${handler.description}\nUsage: ${handler.usage}`,
          exitCode: 0,
        };
      }
      return { success: false, message: `Unknown command: ${specificCmd}`, exitCode: 1 };
    }

    const lines = [
      `${this.config.name} — ${this.config.description}`,
      "",
      "Commands:",
      ...this.listCommands().map((c) => `  ${c.name.padEnd(12)} ${c.description}`),
      "",
      `Run '${this.config.name} help <command>' for command-specific help.`,
    ];
    return { success: true, message: lines.join("\n"), exitCode: 0 };
  }

  private evaluateCommand(args: CLIArgs): CLIOutput {
    const domain = (args.flags.domain as string) ?? (args.flags.d as string) ?? "general";
    const action = (args.flags.action as string) ?? (args.flags.a as string) ?? "read";
    const target = (args.flags.target as string) ?? (args.flags.t as string) ?? "unknown";
    const amount = parseFloat((args.flags.amount as string) ?? "0");

    const riskScore = this.quickRiskScore(domain, action, amount);
    const level = riskScore >= 0.75 ? "R3" : riskScore >= 0.5 ? "R2" : riskScore >= 0.25 ? "R1" : "R0";
    const verdict = level === "R3" ? "BLOCK" : level === "R2" ? "ESCALATE" : level === "R1" ? "WARN" : "ALLOW";

    return {
      success: true,
      message: `[${verdict}] domain=${domain} action=${action} target=${target} risk=${level}(${riskScore.toFixed(3)})`,
      data: { domain, action, target, amount, riskScore, level, verdict },
      exitCode: verdict === "BLOCK" ? 2 : 0,
    };
  }

  private sessionCommand(args: CLIArgs): CLIOutput {
    const subCommand = args.positional[0] ?? "list";
    const agentId = (args.flags.agent as string) ?? "cli-agent";

    switch (subCommand) {
      case "start":
        return {
          success: true,
          message: `Session started for agent: ${agentId}`,
          data: { action: "start", agentId, sessionId: `CLI-SES-${Date.now()}` },
          exitCode: 0,
        };
      case "end":
        return {
          success: true,
          message: `Session ended for agent: ${agentId}`,
          data: { action: "end", agentId },
          exitCode: 0,
        };
      case "list":
        return {
          success: true,
          message: "Active sessions: (none in CLI-only mode)",
          data: { action: "list", sessions: [] },
          exitCode: 0,
        };
      case "summary":
        return {
          success: true,
          message: "Session summary: No active sessions in CLI-only mode",
          data: { action: "summary" },
          exitCode: 0,
        };
      default:
        return { success: false, message: `Unknown session sub-command: ${subCommand}`, exitCode: 1 };
    }
  }

  private reportCommand(args: CLIArgs): CLIOutput {
    const format = (args.flags.format as string) ?? "text";
    const title = (args.flags.title as string) ?? "CVF Governance Report";

    return {
      success: true,
      message: `Report generated (format=${format}, title="${title}")`,
      data: { format, title, generated: true },
      exitCode: 0,
    };
  }

  private auditCommand(args: CLIArgs): CLIOutput {
    const sessionFilter = args.flags.session as string | undefined;
    const verdictFilter = args.flags.verdict as string | undefined;
    const countOnly = args.flags.count === true;

    const filters: string[] = [];
    if (sessionFilter) filters.push(`session=${sessionFilter}`);
    if (verdictFilter) filters.push(`verdict=${verdictFilter}`);

    return {
      success: true,
      message: countOnly
        ? `Audit entries: 0 (${filters.join(", ") || "no filters"})`
        : `Audit log: 0 entries (${filters.join(", ") || "no filters"})`,
      data: { entries: 0, filters },
      exitCode: 0,
    };
  }

  private runAliasArgs(args: CLIArgs): CLIArgs {
    const templateFromPositional = args.positional[0];
    return {
      command: "execute",
      flags: {
        ...args.flags,
        ...(templateFromPositional && !args.flags.template ? { template: templateFromPositional } : {}),
      },
      positional: [],
    };
  }

  private skillCommand(args: CLIArgs): CLIOutput {
    const subCommand = args.positional[0] ?? "list";
    const skills = this.loadSkillRecords(stringFlag(args, "input") || DEFAULT_SKILL_INDEX_PATH);
    if ("error" in skills) return skills.error;

    if (subCommand === "list") {
      return {
        success: true,
        message: ["id title domain riskLevel", ...skills.records.map((skill) => {
          return `${skill.id} ${skill.title} ${skill.domain} ${skill.riskLevel}`;
        })].join("\n"),
        data: { skills: skills.records },
        exitCode: 0,
      };
    }

    if (subCommand === "show") {
      const id = args.positional[1];
      if (!id) return { success: false, message: "Missing required skill id.", exitCode: 1 };
      const skill = skills.records.find((record) => record.id === id);
      if (!skill) return { success: false, message: `Skill not found: ${id}`, exitCode: 1 };
      return {
        success: true,
        message: JSON.stringify(skill, null, 2),
        data: skill,
        exitCode: 0,
      };
    }

    return { success: false, message: "Unknown skill sub-command. Usage: cvf skill <list|show> [id]", exitCode: 1 };
  }

  private receiptCommand(args: CLIArgs): CLIOutput {
    const subCommand = args.positional[0];
    if (subCommand !== "show") {
      return { success: false, message: "Unknown receipt sub-command. Usage: cvf receipt show <id>", exitCode: 1 };
    }
    const id = args.positional[1];
    if (!id) return { success: false, message: "Missing required receipt id.", exitCode: 1 };
    const input = stringFlag(args, "input") || DEFAULT_RECEIPT_LOG_PATH;
    const entries = readJsonlFile(input);
    if ("error" in entries) return entries.error;
    const match = entries.records.find((entry) => recordContainsValue(entry, id));
    if (!match) return { success: false, message: `Receipt not found: ${id}`, exitCode: 1 };
    return { success: true, message: JSON.stringify(match, null, 2), data: match, exitCode: 0 };
  }

  private traceCommand(args: CLIArgs): CLIOutput {
    const subCommand = args.positional[0] ?? "dump";
    if (subCommand !== "dump") {
      return { success: false, message: "Unknown trace sub-command. Usage: cvf trace dump [--session <id>]", exitCode: 1 };
    }
    const input = stringFlag(args, "input") || DEFAULT_TRACE_LOG_PATH;
    const entries = readJsonlFile(input);
    if ("error" in entries) return entries.error;
    const session = stringFlag(args, "session");
    const records = session
      ? entries.records.filter((record) => recordContainsValue(record, session))
      : entries.records;
    return {
      success: true,
      message: records.map((record) => JSON.stringify(record)).join("\n"),
      data: { entries: records.length },
      exitCode: 0,
    };
  }

  private providerCommand(args: CLIArgs): CLIOutput {
    const subCommand = args.positional[0] ?? "list";
    if (subCommand !== "list") {
      return { success: false, message: "Unknown provider sub-command. Usage: cvf provider list", exitCode: 1 };
    }
    return {
      success: true,
      message: ["provider status source", ...PROVIDER_LANES.map((lane) => `${lane.provider} ${lane.status} ${lane.source}`)].join("\n"),
      data: { providers: PROVIDER_LANES },
      exitCode: 0,
    };
  }

  private loadSkillRecords(path: string): { records: SkillRecord[] } | { error: CLIOutput } {
    if (!existsSync(path)) {
      return { error: { success: false, message: `Skill index not found: ${path}`, exitCode: 1 } };
    }
    try {
      const payload = JSON.parse(readFileSync(path, "utf8")) as SkillIndexPayload | SkillIndexPayload["categories"];
      const categories = Array.isArray(payload) ? payload : (payload?.categories ?? []);
      return {
        records: categories.flatMap((category) => (category.skills ?? []).map((skill) => ({
          id: String(skill.id ?? ""),
          title: String(skill.title ?? skill.id ?? ""),
          domain: String(skill.domain ?? category.id ?? category.title ?? "unknown"),
          riskLevel: String(skill.riskLevel ?? "R1"),
          path: typeof skill.path === "string" ? skill.path : undefined,
        }))).filter((skill) => skill.id),
      };
    } catch (error) {
      return { error: { success: false, message: error instanceof Error ? error.message : "Failed to read skill index.", exitCode: 1 } };
    }
  }

  private benchmarkCommand(args: CLIArgs): CLIOutput {
    const subCommand = args.positional[0];
    if (subCommand !== "governance" && subCommand !== "run") {
      return {
        success: false,
        message: "Unknown benchmark sub-command. Usage: cvf benchmark governance --input <audit.jsonl> [--format json|table] or cvf benchmark run --input <audit.jsonl> [--format json|table]",
        exitCode: 1,
      };
    }

    const input = args.flags.input;
    if (typeof input !== "string" || !input.trim()) {
      return {
        success: false,
        message: "Missing required --input <audit.jsonl>.",
        exitCode: 1,
      };
    }

    const formatFlag = typeof args.flags.format === "string" ? args.flags.format : "table";
    const format: BenchmarkGovernanceOptions["format"] = formatFlag === "json" ? "json" : "table";
    const options: BenchmarkGovernanceOptions = { input: input.trim(), format };

    try {
      const events = parseAuditJsonl(readFileSync(options.input, "utf8"));
      const report = computeGovernanceReliabilityReport(events);
      return {
        success: true,
        message: subCommand === "run"
          ? formatGovernanceBenchmarkRunReport(report, options.format)
          : formatGovernanceReliabilityReport(report, options.format),
        data: { input: options.input, eventCount: events.length, metrics: report },
        exitCode: 0,
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : "Failed to read governance benchmark input.",
        exitCode: 1,
      };
    }
  }

  private quickRiskScore(domain: string, action: string, amount: number): number {
    const domainScores: Record<string, number> = {
      infrastructure: 0.8, code_security: 0.75, finance: 0.6,
      privacy: 0.55, data: 0.4, communication: 0.3, general: 0.1,
    };
    const actionScores: Record<string, number> = {
      execute: 0.3, deploy: 0.2, delete: 0.25, withdraw: 0.25,
      transfer: 0.2, export: 0.15, write: 0.1, read: 0.0,
    };

    let score = (domainScores[domain] ?? 0.1) * 0.7;
    score += actionScores[action] ?? 0.05;
    if (amount > 10000) score += 0.15;
    else if (amount > 1000) score += 0.08;

    return Math.min(score, 1.0);
  }
}

function formatGovernanceReliabilityReport(
  report: GovernanceReliabilityReport,
  format: BenchmarkGovernanceOptions["format"],
): string {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }
  return [
    "metric rate count total",
    ...Object.entries(report).map(([name, result]) => {
      return `${name} ${formatMetricRate(result.rate, 3)} ${result.count} ${result.total}`;
    }),
  ].join("\n");
}

function formatGovernanceBenchmarkRunReport(
  report: GovernanceReliabilityReport,
  format: BenchmarkGovernanceOptions["format"],
): string {
  if (format === "json") {
    return JSON.stringify(report, null, 2);
  }
  return [
    "CVF Governance Reliability Report",
    "==================================",
    ...Object.entries(report).map(([name, result]) => {
      return `${name}: ${formatMetricRate(result.rate, 2)} (${result.count}/${result.total})`;
    }),
  ].join("\n");
}

const DEFAULT_SKILL_INDEX_PATH = "EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web/public/data/skills-index.json";
const DEFAULT_RECEIPT_LOG_PATH = "docs/evidence/cvf-execute-receipts.jsonl";
const DEFAULT_TRACE_LOG_PATH = ".cvf/runtime/web-governance-jobs.jsonl";

interface SkillIndexPayload {
  categories?: Array<{ id?: string; title?: string; skills?: Array<Record<string, unknown>> }>;
}

interface SkillRecord {
  id: string;
  title: string;
  domain: string;
  riskLevel: string;
  path?: string;
}

const PROVIDER_LANES = [
  { provider: "openai", status: "registered", source: "cvf-web/api/providers" },
  { provider: "claude", status: "registered", source: "cvf-web/api/providers" },
  { provider: "gemini", status: "registered", source: "cvf-web/api/providers" },
  { provider: "alibaba", status: "registered", source: "cvf-web/api/providers" },
  { provider: "openrouter", status: "registered", source: "cvf-web/api/providers" },
  { provider: "deepseek", status: "registered", source: "cvf-web/api/providers" },
] as const;

function readJsonlFile(path: string): { records: Record<string, unknown>[] } | { error: CLIOutput } {
  if (!existsSync(path)) {
    return { error: { success: false, message: `JSONL input not found: ${path}`, exitCode: 1 } };
  }
  try {
    const records = readFileSync(path, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as Record<string, unknown>);
    return { records };
  } catch (error) {
    return { error: { success: false, message: error instanceof Error ? error.message : "Failed to read JSONL input.", exitCode: 1 } };
  }
}

function recordContainsValue(value: unknown, target: string): boolean {
  if (value === target) return true;
  if (Array.isArray(value)) return value.some((item) => recordContainsValue(item, target));
  if (value && typeof value === "object") {
    return Object.values(value).some((item) => recordContainsValue(item, target));
  }
  return false;
}

function formatMetricRate(rate: number | null, fractionDigits: number): string {
  return rate === null ? "n/a" : rate.toFixed(fractionDigits);
}

function stringFlag(args: CLIArgs, name: string): string | undefined {
  const value = args.flags[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
