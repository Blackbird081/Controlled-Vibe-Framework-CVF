import { CLICommand, CLICommandHandler, CLIArgs, CLIOutput, CLIConfig, DEFAULT_CLI_CONFIG } from "./types";

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
