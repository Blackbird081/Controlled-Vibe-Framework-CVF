// adapters/sandbox.types.ts
// CVF v1.7.3 — Local type mirror for SandboxIsolationContract interface.
// Source of truth: CVF_v1.7.1_SAFETY_RUNTIME/simulation/sandbox.isolation.contract.ts
// Rationale: rootDir is locked to this package; relative cross-package imports cause TS6059.
// TypeScript structural typing guarantees compatibility — these interfaces are shape-identical
// to those in the Safety Runtime package. Keep in sync when Safety Runtime types change.

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

export interface SandboxExecutor {
    readonly platform: SandboxPlatform;
    execute(command: SandboxCommand, config: SandboxConfig): Promise<SandboxResult>;
}

// Default config factory — mirrors Safety Runtime createDefaultSandboxConfig.
export const DEFAULT_SANDBOX_RESOURCE_LIMITS: SandboxResourceLimits = {
    maxCpuTimeMs: 30_000,
    maxMemoryMb: 256,
    maxOutputBytes: 1_048_576,
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
