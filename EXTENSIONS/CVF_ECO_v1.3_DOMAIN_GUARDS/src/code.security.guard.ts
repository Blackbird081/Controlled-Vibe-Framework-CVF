import {
  DomainGuard,
  GuardRequest,
  GuardResult,
  CodeSecurityGuardConfig,
  Violation,
} from "./types";

const DEFAULT_CONFIG: CodeSecurityGuardConfig = {
  blockedCommands: ["rm -rf", "drop table", "format c:", "del /f", "sudo rm", "mkfs"],
  blockedPatterns: ["eval(", "exec(", "os.system(", "child_process", "dangerouslySetInnerHTML"],
  allowedPackageManagers: ["npm", "yarn", "pnpm", "pip", "cargo"],
  requireCodeReview: true,
  maxFileOperationsPerMinute: 50,
};

export class CodeSecurityGuard implements DomainGuard {
  readonly domain = "code_security" as const;
  private config: CodeSecurityGuardConfig;
  private fileOpsLog: number[] = [];

  constructor(config: Partial<CodeSecurityGuardConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  evaluate(request: GuardRequest): GuardResult {
    const violations: Violation[] = [];
    const warnings: string[] = [];

    const command = (request.params.command as string) ?? "";
    const code = (request.params.code as string) ?? "";
    const isFileOp = (request.params.isFileOperation as boolean) ?? false;

    for (const blocked of this.config.blockedCommands) {
      if (command.toLowerCase().includes(blocked.toLowerCase())) {
        violations.push({
          rule: "BLOCKED_COMMAND",
          description: `Command contains blocked pattern: "${blocked}"`,
          severity: "critical",
        });
      }
    }

    for (const pattern of this.config.blockedPatterns) {
      if (code.includes(pattern)) {
        violations.push({
          rule: "BLOCKED_PATTERN",
          description: `Code contains blocked pattern: "${pattern}"`,
          severity: "high",
        });
      }
    }

    if (request.action === "install" || request.action === "add_dependency") {
      const manager = (request.params.packageManager as string) ?? "";
      if (manager && !this.config.allowedPackageManagers.includes(manager)) {
        violations.push({
          rule: "UNAUTHORIZED_PACKAGE_MANAGER",
          description: `Package manager "${manager}" is not in the allowed list`,
          severity: "medium",
        });
      }
    }

    if (isFileOp) {
      this.recordFileOp();
      const recentOps = this.countRecentFileOps();
      if (recentOps > this.config.maxFileOperationsPerMinute) {
        violations.push({
          rule: "FILE_OP_RATE_LIMIT",
          description: `${recentOps} file operations in last minute exceeds limit of ${this.config.maxFileOperationsPerMinute}`,
          severity: "high",
        });
      } else if (recentOps > this.config.maxFileOperationsPerMinute * 0.8) {
        warnings.push(`File operations at ${((recentOps / this.config.maxFileOperationsPerMinute) * 100).toFixed(0)}% of rate limit`);
      }
    }

    if (this.config.requireCodeReview && request.action === "deploy") {
      const reviewed = (request.params.codeReviewed as boolean) ?? false;
      if (!reviewed) {
        violations.push({
          rule: "CODE_REVIEW_REQUIRED",
          description: "Deployment requires code review approval",
          severity: "high",
        });
      }
    }

    const hasSudo = command.toLowerCase().startsWith("sudo ");
    if (hasSudo) {
      warnings.push("Command requires elevated privileges (sudo)");
    }

    return {
      verdict: this.determineVerdict(violations),
      domain: this.domain,
      violations,
      warnings,
      metadata: {
        commandAnalyzed: command.length > 0,
        codeAnalyzed: code.length > 0,
        recentFileOps: this.countRecentFileOps(),
      },
    };
  }

  resetRateLimit(): void {
    this.fileOpsLog = [];
  }

  private recordFileOp(): void {
    this.fileOpsLog.push(Date.now());
  }

  private countRecentFileOps(): number {
    const oneMinuteAgo = Date.now() - 60_000;
    this.fileOpsLog = this.fileOpsLog.filter((t) => t > oneMinuteAgo);
    return this.fileOpsLog.length;
  }

  private determineVerdict(violations: Violation[]): GuardResult["verdict"] {
    if (violations.some((v) => v.severity === "critical")) return "BLOCK";
    if (violations.some((v) => v.severity === "high")) return "ESCALATE";
    if (violations.length > 0) return "WARN";
    return "ALLOW";
  }
}
