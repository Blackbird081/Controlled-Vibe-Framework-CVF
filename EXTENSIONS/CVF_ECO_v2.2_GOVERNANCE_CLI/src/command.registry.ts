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
import { executeWorkflowChain, CLI_WORKFLOW_TEMPLATES, WORKFLOW_CHAIN_CONTRACT } from "./workflow.client";
import {
  computeGovernanceReliabilityReport,
  parseAuditJsonl,
  type GovernanceReliabilityReport,
} from "./governance-reliability-metrics";
import {
  buildOperationalBenchmarkReport,
  formatOperationalBenchmarkReport,
  parseOperationalBenchmarkInput,
} from "./operational-benchmark-suite";
import {
  CERTIFIED_SKILL_PACK_REGISTRY_PATH,
  assertProductOutcomeRuntimePlanFiles,
  listProductOutcomeRuntimePlans,
  resolveProductOutcomeRuntimePlan,
  selectProductSkillPackForRequest,
  type ProductSkillPackSelectionReadout,
  type ProductOutcomeRuntimePlan,
} from "./product-outcome.runtime";

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
        message: `Unknown command: ${args.command}. Run 'cvf help' for usage.`,
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
        message: `Unknown command: ${args.command}. Run 'cvf help' for usage.`,
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
      usage: "cvf help [command]",
      execute: (args) => this.helpCommand(args),
    });

    this.register({
      name: "version",
      description: "Show CLI version",
      usage: "cvf version",
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
      usage: "cvf status",
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
      usage: "cvf evaluate --domain <domain> --action <action> --target <target> [--amount <n>]",
      execute: (args) => this.evaluateCommand(args),
    });

    this.register({
      name: "execute",
      description: "Execute a governed CVF template through the web execute route",
      usage: "cvf execute --template <id> --role <role> [--input <json>] [--endpoint <url>] [--providers <role:provider,...>] [--provider <name>] [--dry-run] [--receipt] [--verbose]",
      execute: (args) => {
        if (args.flags.help === true || args.flags.h === true) {
          return {
            success: true,
            message: "execute: Execute a governed CVF template through the web execute route\nUsage: cvf execute --template <id> --role <role> [--input <json>] [--endpoint <url>] [--providers <role:provider,...>] [--provider <name>] [--dry-run] [--receipt] [--verbose]",
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
      name: "workflow",
      description: "Run a multi-agent workflow pipeline (sequential O->A->B->R with governance receipts per step)",
      usage: "cvf workflow --template <key> --input <json> [--role <role>] [--providers <role:provider,...>] [--endpoint <url>] [--receipt] [--verbose]",
      execute: (args) => {
        if (args.flags.help === true || args.flags.h === true) {
          const keys = Object.keys(CLI_WORKFLOW_TEMPLATES).join(", ");
          return {
            success: true,
            message: `workflow: Run a multi-agent pipeline\nUsage: cvf workflow --template <key> --input <json> [--providers role:provider,...]\nTemplates: ${keys}\nContract: ${WORKFLOW_CHAIN_CONTRACT}`,
            exitCode: 0,
          };
        }
        return {
          success: false,
          message: "The workflow command performs HTTP I/O. Use GovernanceCLI.runAsync() or the async CLI entrypoint.",
          exitCode: 1,
        };
      },
      executeAsync: async (args) => {
        const templateKey = typeof args.flags.template === "string" ? args.flags.template : args.positional[0];
        if (!templateKey) {
          return { success: false, message: "Missing required --template <key>.", exitCode: 1 };
        }
        const rawInput = typeof args.flags.input === "string" ? args.flags.input : "{}";
        const endpoint = typeof args.flags.endpoint === "string" ? args.flags.endpoint : (process.env.CVF_EXECUTE_ENDPOINT ?? "http://localhost:3000");
        const verbose = args.flags.verbose === true || args.flags.v === true;
        const receipt = args.flags.receipt === true || typeof args.flags.receipt === "string";

        // Parse --providers flag: "orchestrator:deepseek,builder:gemini"
        let providers: Record<string, string> | undefined;
        const rawProviders = typeof args.flags.providers === "string" ? args.flags.providers : undefined;
        if (rawProviders) {
          providers = {};
          for (const segment of rawProviders.split(",")) {
            const idx = segment.indexOf(":");
            if (idx > 0) {
              providers[segment.slice(0, idx).trim().toLowerCase()] = segment.slice(idx + 1).trim();
            }
          }
        }

        const result = await executeWorkflowChain(templateKey, rawInput, { endpoint, receipt, verbose, providers });
        const message = JSON.stringify(result, null, verbose ? 2 : 0);
        return { success: result.success, message, data: result, exitCode: result.success ? 0 : 1 };
      },
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
      usage: "cvf skill <list|show|plan|select> [id|request] [--input <skills-index.json>] [--registry <certified-registry.json>] [--certified] [--json]",
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
      usage: "cvf benchmark <governance|run|operational> --input <audit.jsonl|release-gate.json> [--format json|table]",
      execute: (args) => this.benchmarkCommand(args),
    });

    this.register({
      name: "session",
      description: "Manage governance sessions",
      usage: "cvf session <start|end|list|summary> [--agent <id>] [--session <id>]",
      execute: (args) => this.sessionCommand(args),
    });

    this.register({
      name: "report",
      description: "Generate governance report",
      usage: "cvf report [--format text|markdown] [--title <title>]",
      execute: (args) => this.reportCommand(args),
    });

    this.register({
      name: "audit",
      description: "Query audit log",
      usage: "cvf audit [--input <audit.jsonl>] [--session <id>] [--verdict <verdict>] [--count]",
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
    const input = stringFlag(args, "input");

    const entries = input ? readJsonlFile(input) : { records: [] };
    if ("error" in entries) return entries.error;

    const records = entries.records.filter((record) => {
      const sessionMatches = sessionFilter ? recordContainsValue(record, sessionFilter) : true;
      const verdictMatches = verdictFilter ? recordContainsValue(record, verdictFilter) : true;
      return sessionMatches && verdictMatches;
    });

    const filters: string[] = [];
    if (input) filters.push(`input=${input}`);
    if (sessionFilter) filters.push(`session=${sessionFilter}`);
    if (verdictFilter) filters.push(`verdict=${verdictFilter}`);

    return {
      success: true,
      message: countOnly
        ? `Audit entries: ${records.length} (${filters.join(", ") || "no filters"})`
        : `Audit log: ${records.length} entries (${filters.join(", ") || "no filters"})${records.length ? `\n${records.map((record) => JSON.stringify(record)).join("\n")}` : ""}`,
      data: { entries: records.length, filters, records },
      exitCode: 0,
    };
  }

  private runAliasArgs(args: CLIArgs): CLIArgs {
    const templateFromPositional = args.positional[0];
    const runtimePlan = templateFromPositional
      ? resolveProductOutcomeRuntimePlan(templateFromPositional)
      : undefined;
    return {
      command: "execute",
      flags: {
        ...args.flags,
        ...(runtimePlan && !args.flags.template ? this.runtimePlanExecuteFlags(runtimePlan, args.flags.input) : {}),
        ...(templateFromPositional && !runtimePlan && !args.flags.template ? { template: templateFromPositional } : {}),
      },
      positional: [],
    };
  }

  private skillCommand(args: CLIArgs): CLIOutput {
    const subCommand = args.positional[0] ?? "list";
    const registryPath = stringFlag(args, "registry") || CERTIFIED_SKILL_PACK_REGISTRY_PATH;

    if (subCommand === "select") {
      const request = args.positional.slice(1).join(" ").trim() || stringFlag(args, "request");
      if (!request) return { success: false, message: "Missing required noncoder request.", exitCode: 1 };
      const readout = selectProductSkillPackForRequest(request, registryPath);
      return {
        success: true,
        message: args.flags.json === true
          ? JSON.stringify(readout, null, 2)
          : formatProductSkillPackSelectionReadout(readout),
        data: readout,
        exitCode: 0,
      };
    }

    if (subCommand === "plan") {
      const id = args.positional[1];
      if (!id) return { success: false, message: "Missing required skill pack id or outcome key.", exitCode: 1 };
      const plan = resolveProductOutcomeRuntimePlan(id, registryPath);
      if (!plan) return { success: false, message: `Product outcome runtime plan not found: ${id}`, exitCode: 1 };
      try {
        assertProductOutcomeRuntimePlanFiles(plan);
      } catch (error) {
        return { success: false, message: error instanceof Error ? error.message : "Invalid product outcome runtime plan.", exitCode: 1 };
      }
      return {
        success: true,
        message: args.flags.json === true
          ? JSON.stringify(plan, null, 2)
          : [
            `${plan.skillPackId} -> ${plan.templateId}`,
            `outcome=${plan.outcomeKey}`,
            `riskLevel=${plan.riskLevel}`,
            `humanReviewRequired=${plan.humanReviewRequired}`,
            `command=${plan.command}`,
            `receiptSchema=${plan.receiptSchemaPath}`,
            `failureRecovery=${plan.failureRecoveryPath}`,
          ].join("\n"),
        data: plan,
        exitCode: 0,
      };
    }

    if (subCommand === "list" && args.flags.certified === true) {
      const plans = listProductOutcomeRuntimePlans(registryPath);
      return {
        success: true,
        message: args.flags.json === true
          ? JSON.stringify({ plans }, null, 2)
          : ["id outcome template riskLevel status", ...plans.map((plan) => {
            return `${plan.skillPackId} ${plan.outcomeKey} ${plan.templateId} ${plan.riskLevel} ${plan.status}`;
          })].join("\n"),
        data: { plans },
        exitCode: 0,
      };
    }

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

    return { success: false, message: "Unknown skill sub-command. Usage: cvf skill <list|show|plan|select> [id|request]", exitCode: 1 };
  }

  private runtimePlanExecuteFlags(
    plan: ProductOutcomeRuntimePlan,
    rawInput: string | boolean | undefined,
  ): Record<string, string> {
    return {
      template: plan.templateId,
      templateName: plan.name,
      intent: `Execute certified product outcome ${plan.outcomeKey} via ${plan.skillPackId}.`,
      input: mergeRuntimePlanInput(rawInput, plan),
    };
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
    if (subCommand !== "governance" && subCommand !== "run" && subCommand !== "operational") {
      return {
        success: false,
        message: "Unknown benchmark sub-command. Usage: cvf benchmark governance --input <audit.jsonl> [--format json|table] or cvf benchmark operational --input <audit.jsonl|release-gate.json> [--format json|table]",
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
      const content = readFileSync(options.input, "utf8");
      const events = subCommand === "operational"
        ? parseOperationalBenchmarkInput(content)
        : parseAuditJsonl(content);
      if (subCommand === "operational") {
        const report = buildOperationalBenchmarkReport(events, options.input);
        return {
          success: true,
          message: formatOperationalBenchmarkReport(report, options.format),
          data: report,
          exitCode: 0,
        };
      }
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

function formatProductSkillPackSelectionReadout(readout: ProductSkillPackSelectionReadout): string {
  if (readout.status === "no_certified_pack_match") {
    return [
      "status=no_certified_pack_match",
      `reason=${readout.reason}`,
      `requestReadiness=${readout.requestContext.readiness}`,
      `contextBudgetTier=${readout.requestContext.budgetTier}`,
      `missingSignals=${readout.requestContext.missingSignals.join(",")}`,
      `contextAction=${readout.requestContext.recommendedNextAction}`,
      `userAction=${readout.userAction}`,
      `boundaries=${readout.boundaries.join(",")}`,
    ].join("\n");
  }
  const plan = readout.selectedPlan;
  return [
    `status=${readout.status}`,
    `selected=${plan?.skillPackId}`,
    `outcome=${plan?.outcomeKey}`,
    `template=${plan?.templateId}`,
    `confidence=${readout.confidence}`,
    `score=${readout.score}`,
    `matchedTerms=${readout.matchedTerms.join(",")}`,
    `riskLevel=${readout.riskLevel}`,
    `humanReviewRequired=${readout.humanReviewRequired}`,
    `requestReadiness=${readout.requestContext.readiness}`,
    `contextBudgetTier=${readout.requestContext.budgetTier}`,
    `missingSignals=${readout.requestContext.missingSignals.join(",")}`,
    `contaminationFlags=${readout.requestContext.contaminationFlags.join(",")}`,
    `noiseFlags=${readout.requestContext.noiseFlags.join(",")}`,
    `contextAction=${readout.requestContext.recommendedNextAction}`,
    `userAction=${readout.userAction}`,
    `boundaries=${readout.boundaries.join(",")}`,
  ].join("\n");
}

function stringFlag(args: CLIArgs, name: string): string | undefined {
  const value = args.flags[name];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function mergeRuntimePlanInput(
  rawInput: string | boolean | undefined,
  plan: ProductOutcomeRuntimePlan,
): string {
  const base = parseInputObject(rawInput);
  return JSON.stringify({
    ...base,
    cvfProductOutcomeRuntime: {
      planVersion: plan.planVersion,
      skillPackId: plan.skillPackId,
      outcomeKey: plan.outcomeKey,
      templateId: plan.templateId,
      receiptSchemaPath: plan.receiptSchemaPath,
      failureRecoveryPath: plan.failureRecoveryPath,
    },
  });
}

function parseInputObject(rawInput: string | boolean | undefined): Record<string, unknown> {
  if (!rawInput || rawInput === true) return {};
  try {
    const parsed = JSON.parse(rawInput);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed as Record<string, unknown>
      : {};
  } catch {
    return {};
  }
}
