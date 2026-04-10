// sandbox.isolation.contract.ts
// CVF v1.7.1 — Sandbox Isolation Contract
// Track 5B: Replaces boolean stub (sandbox.mode.ts) with typed governance contract.
// Doctrine basis: CVF_ARCHITECTURE_PRINCIPLES.md §7 (Execution Isolation Principle)
// Wiring target: EPF CommandRuntimeContract case "sandbox" (DELEGATED_TO_SANDBOX)

// --- Types ---

export type SandboxPlatform = "worker_threads" | "docker" | "v8_isolate" | "stub";

export type SandboxStatus =
  | "CREATED"
  | "RUNNING"
  | "COMPLETED"
  | "FAILED"
  | "TIMEOUT"
  | "CONTAINMENT_VIOLATION";

export type ContainmentViolationType =
  | "FILESYSTEM_BREACH"
  | "NETWORK_EGRESS"
  | "RESOURCE_LIMIT_EXCEEDED"
  | "TIMEOUT_EXCEEDED"
  | "UNAUTHORIZED_SYSCALL";

export interface SandboxResourceLimits {
  maxCpuTimeMs: number;
  maxMemoryMb: number;
  maxOutputBytes: number;
}

export interface SandboxFilesystemPolicy {
  allowRead: boolean;
  readPaths: string[];
  allowWrite: boolean;
  writePaths: string[];
  allowTempDir: boolean;
}

export interface SandboxNetworkPolicy {
  allowEgress: boolean;
  allowedHosts: string[];
}

export interface SandboxConfig {
  platform: SandboxPlatform;
  resourceLimits: SandboxResourceLimits;
  filesystemPolicy: SandboxFilesystemPolicy;
  networkPolicy: SandboxNetworkPolicy;
  timeoutMs: number;
  labels?: Record<string, string>;
}

export interface ContainmentViolation {
  type: ContainmentViolationType;
  detail: string;
  detectedAt: string;
}

export interface SandboxResult {
  sandboxId: string;
  status: SandboxStatus;
  startedAt: string;
  completedAt: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  containmentViolations: ContainmentViolation[];
  resourceUsage: {
    cpuTimeMs: number;
    memoryPeakMb: number;
    outputBytes: number;
  };
  platform: SandboxPlatform;
}

export interface SandboxCommand {
  taskId: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
  workingDir?: string;
}

export interface SandboxIsolationContractDependencies {
  executor?: SandboxExecutor;
  now?: () => string;
  generateId?: () => string;
}

// --- Executor interface (adapter pattern per Doctrine §11 Composability) ---

export interface SandboxExecutor {
  readonly platform: SandboxPlatform;
  execute(command: SandboxCommand, config: SandboxConfig): Promise<SandboxResult>;
}

// --- Default config factory ---

export const DEFAULT_SANDBOX_RESOURCE_LIMITS: SandboxResourceLimits = {
  maxCpuTimeMs: 30_000,
  maxMemoryMb: 256,
  maxOutputBytes: 1_048_576, // 1 MB
};

export const DEFAULT_SANDBOX_FILESYSTEM_POLICY: SandboxFilesystemPolicy = {
  allowRead: true,
  readPaths: [],
  allowWrite: false,
  writePaths: [],
  allowTempDir: true,
};

export const DEFAULT_SANDBOX_NETWORK_POLICY: SandboxNetworkPolicy = {
  allowEgress: false,
  allowedHosts: [],
};

export function createDefaultSandboxConfig(
  platform: SandboxPlatform = "worker_threads",
): SandboxConfig {
  return {
    platform,
    resourceLimits: { ...DEFAULT_SANDBOX_RESOURCE_LIMITS },
    filesystemPolicy: { ...DEFAULT_SANDBOX_FILESYSTEM_POLICY },
    networkPolicy: { ...DEFAULT_SANDBOX_NETWORK_POLICY },
    timeoutMs: 30_000,
  };
}

// --- Stub executor (deterministic, for testing / contract-only mode) ---

function createStubResult(
  sandboxId: string,
  command: SandboxCommand,
  config: SandboxConfig,
  now: string,
): SandboxResult {
  return {
    sandboxId,
    status: "COMPLETED",
    startedAt: now,
    completedAt: now,
    exitCode: 0,
    stdout: `[sandbox-stub] Executed: ${command.command}`,
    stderr: "",
    containmentViolations: [],
    resourceUsage: {
      cpuTimeMs: 0,
      memoryPeakMb: 0,
      outputBytes: 0,
    },
    platform: config.platform,
  };
}

const stubExecutor: SandboxExecutor = {
  platform: "stub",
  async execute(
    command: SandboxCommand,
    config: SandboxConfig,
  ): Promise<SandboxResult> {
    return createStubResult(
      `stub-${command.taskId}`,
      command,
      config,
      new Date().toISOString(),
    );
  },
};

// --- Contract ---

let idCounter = 0;

export class SandboxIsolationContract {
  private readonly executor: SandboxExecutor;
  private readonly now: () => string;
  private readonly generateId: () => string;
  private readonly auditLog: SandboxResult[] = [];

  constructor(dependencies: SandboxIsolationContractDependencies = {}) {
    this.executor = dependencies.executor ?? stubExecutor;
    this.now = dependencies.now ?? (() => new Date().toISOString());
    this.generateId = dependencies.generateId ?? (() => `sandbox-${++idCounter}-${Date.now()}`);
  }

  getPlatform(): SandboxPlatform {
    return this.executor.platform;
  }

  async execute(
    command: SandboxCommand,
    config?: Partial<SandboxConfig>,
  ): Promise<SandboxResult> {
    const fullConfig = {
      ...createDefaultSandboxConfig(this.executor.platform),
      ...config,
    };

    // Fail closed: reject invalid configs before delegating to executor
    const validation = this.validateConfig(fullConfig);
    if (!validation.valid) {
      const now = this.now();
      const failedResult: SandboxResult = {
        sandboxId: this.generateId(),
        status: "FAILED",
        startedAt: now,
        completedAt: now,
        exitCode: -1,
        stdout: "",
        stderr: `Config validation failed: ${validation.errors.join("; ")}`,
        containmentViolations: [],
        resourceUsage: { cpuTimeMs: 0, memoryPeakMb: 0, outputBytes: 0 },
        platform: fullConfig.platform,
      };
      this.auditLog.push(failedResult);
      return failedResult;
    }

    const result = await this.executor.execute(command, fullConfig);

    const enrichedResult: SandboxResult = {
      ...result,
      sandboxId: result.sandboxId || this.generateId(),
    };

    this.auditLog.push(enrichedResult);
    return enrichedResult;
  }

  validateConfig(config: SandboxConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.timeoutMs <= 0) {
      errors.push("timeoutMs must be positive");
    }
    if (config.resourceLimits.maxCpuTimeMs <= 0) {
      errors.push("maxCpuTimeMs must be positive");
    }
    if (config.resourceLimits.maxMemoryMb <= 0) {
      errors.push("maxMemoryMb must be positive");
    }
    if (config.resourceLimits.maxOutputBytes <= 0) {
      errors.push("maxOutputBytes must be positive");
    }
    if (config.networkPolicy.allowEgress && config.networkPolicy.allowedHosts.length === 0) {
      errors.push("allowEgress is true but allowedHosts is empty — network would be unrestricted");
    }
    if (config.filesystemPolicy.allowWrite && config.filesystemPolicy.writePaths.length === 0 && !config.filesystemPolicy.allowTempDir) {
      errors.push("allowWrite is true but no writePaths or tempDir specified");
    }

    return { valid: errors.length === 0, errors };
  }

  getAuditLog(): readonly SandboxResult[] {
    return this.auditLog;
  }
}

// --- Factory ---

export function createSandboxIsolationContract(
  dependencies?: SandboxIsolationContractDependencies,
): SandboxIsolationContract {
  return new SandboxIsolationContract(dependencies);
}
