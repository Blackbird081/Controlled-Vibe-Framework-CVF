/**
 * Sandbox Contract Adapter — cvf-web → SandboxIsolationContract (Track 5B)
 * =========================================================================
 * Self-contained server-side adapter implementing the canonical
 * SandboxIsolationContract API within the cvf-web build boundary.
 * Types mirror the Track 5B contract from
 * CVF_v1.7.1_SAFETY_RUNTIME/simulation/sandbox.isolation.contract.ts.
 *
 * Browser-side sandbox usage (security.ts createSandbox()) remains for
 * client-side code validation. This adapter is the canonical path for
 * server-side execution isolation within the web API surface.
 *
 * Doctrine basis: CVF_ARCHITECTURE_PRINCIPLES.md §7 (Execution Isolation)
 *
 * @module lib/sandbox-contract-adapter
 */

// --- Contract-aligned types (mirroring SandboxIsolationContract) ---

type SandboxPlatform = 'worker_threads' | 'docker' | 'v8_isolate' | 'stub';
type SandboxStatus = 'CREATED' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'TIMEOUT' | 'CONTAINMENT_VIOLATION';
type ContainmentViolationType = 'FILESYSTEM_BREACH' | 'NETWORK_EGRESS' | 'RESOURCE_LIMIT_EXCEEDED' | 'TIMEOUT_EXCEEDED' | 'UNAUTHORIZED_SYSCALL';

interface SandboxResourceLimits {
  maxCpuTimeMs: number;
  maxMemoryMb: number;
  maxOutputBytes: number;
}

interface SandboxConfig {
  platform: SandboxPlatform;
  resourceLimits: SandboxResourceLimits;
  timeoutMs: number;
  networkPolicy: { allowEgress: boolean; allowedHosts: string[] };
  filesystemPolicy: { allowRead: boolean; readPaths: string[]; allowWrite: boolean; writePaths: string[]; allowTempDir: boolean };
  labels?: Record<string, string>;
}

interface ContainmentViolation {
  type: ContainmentViolationType;
  detail: string;
  detectedAt: string;
}

interface SandboxResult {
  sandboxId: string;
  status: SandboxStatus;
  startedAt: string;
  completedAt: string;
  exitCode: number;
  stdout: string;
  stderr: string;
  containmentViolations: ContainmentViolation[];
  resourceUsage: { cpuTimeMs: number; memoryPeakMb: number; outputBytes: number };
  platform: SandboxPlatform;
}

// --- Default config ---

const DEFAULT_WEB_SANDBOX_LIMITS: SandboxResourceLimits = {
  maxCpuTimeMs: 5_000,
  maxMemoryMb: 128,
  maxOutputBytes: 512_000,
};

function createDefaultConfig(platform: SandboxPlatform = 'stub'): SandboxConfig {
  return {
    platform,
    resourceLimits: { ...DEFAULT_WEB_SANDBOX_LIMITS },
    timeoutMs: 5_000,
    networkPolicy: { allowEgress: false, allowedHosts: [] },
    filesystemPolicy: { allowRead: false, readPaths: [], allowWrite: false, writePaths: [], allowTempDir: true },
  };
}

// --- Stub executor (deterministic, contract-only mode for web) ---

function stubExecute(taskId: string, command: string, config: SandboxConfig): SandboxResult {
  const now = new Date().toISOString();
  return {
    sandboxId: `web-stub-${taskId}`,
    status: 'COMPLETED',
    startedAt: now,
    completedAt: now,
    exitCode: 0,
    stdout: `[sandbox-stub] Executed: ${command}`,
    stderr: '',
    containmentViolations: [],
    resourceUsage: { cpuTimeMs: 0, memoryPeakMb: 0, outputBytes: 0 },
    platform: config.platform,
  };
}

// --- Validation (aligned with SandboxIsolationContract.validateConfig) ---

function validateConfig(config: SandboxConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (config.timeoutMs <= 0) errors.push('timeoutMs must be positive');
  if (config.resourceLimits.maxCpuTimeMs <= 0) errors.push('maxCpuTimeMs must be positive');
  if (config.resourceLimits.maxMemoryMb <= 0) errors.push('maxMemoryMb must be positive');
  if (config.resourceLimits.maxOutputBytes <= 0) errors.push('maxOutputBytes must be positive');
  if (config.networkPolicy.allowEgress && config.networkPolicy.allowedHosts.length === 0) {
    errors.push('allowEgress is true but allowedHosts is empty');
  }
  if (config.filesystemPolicy.allowWrite && config.filesystemPolicy.writePaths.length === 0 && !config.filesystemPolicy.allowTempDir) {
    errors.push('allowWrite is true but no writePaths or tempDir specified');
  }
  return { valid: errors.length === 0, errors };
}

// --- Audit log ---

const auditLog: SandboxResult[] = [];

// --- Public API ---

export interface WebSandboxRequest {
  code: string;
  timeoutMs?: number;
  maxMemoryMb?: number;
  platform?: SandboxPlatform;
  labels?: Record<string, string>;
}

export interface WebSandboxResponse {
  success: boolean;
  output: string;
  error?: string;
  sandboxId: string;
  platform: SandboxPlatform;
  executionTimeMs: number;
  violations: string[];
}

/**
 * Execute code through the canonical sandbox isolation path.
 * Server-side only — browser sandbox (security.ts) is for client use.
 */
export async function executeInSandbox(request: WebSandboxRequest): Promise<WebSandboxResponse> {
  const taskId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const config: SandboxConfig = {
    ...createDefaultConfig(request.platform ?? 'stub'),
    timeoutMs: request.timeoutMs ?? 5_000,
    resourceLimits: {
      ...DEFAULT_WEB_SANDBOX_LIMITS,
      maxMemoryMb: request.maxMemoryMb ?? DEFAULT_WEB_SANDBOX_LIMITS.maxMemoryMb,
    },
    labels: { source: 'cvf-web', ...request.labels },
  };

  const validation = validateConfig(config);
  if (!validation.valid) {
    const now = new Date().toISOString();
    const failedResult: SandboxResult = {
      sandboxId: `web-stub-${taskId}`,
      status: 'FAILED',
      startedAt: now,
      completedAt: now,
      exitCode: 1,
      stdout: '',
      stderr: validation.errors.join('; '),
      containmentViolations: [],
      resourceUsage: { cpuTimeMs: 0, memoryPeakMb: 0, outputBytes: 0 },
      platform: config.platform,
    };
    auditLog.push(failedResult);
    return {
      success: false,
      output: '',
      error: `Invalid sandbox config: ${validation.errors.join('; ')}`,
      sandboxId: failedResult.sandboxId,
      platform: config.platform,
      executionTimeMs: 0,
      violations: [],
    };
  }

  const startTime = Date.now();
  const result = stubExecute(taskId, request.code, config);
  auditLog.push(result);

  return {
    success: result.status === 'COMPLETED',
    output: result.stdout,
    error: result.status !== 'COMPLETED'
      ? result.stderr || `Sandbox status: ${result.status}`
      : undefined,
    sandboxId: result.sandboxId,
    platform: result.platform,
    executionTimeMs: Date.now() - startTime,
    violations: result.containmentViolations.map(v => `[${v.type}] ${v.detail}`),
  };
}

/**
 * Validate whether a sandbox config is safe before executing.
 */
export function validateWebSandboxConfig(request: WebSandboxRequest): { valid: boolean; errors: string[] } {
  const config: SandboxConfig = {
    ...createDefaultConfig(request.platform ?? 'stub'),
    timeoutMs: request.timeoutMs ?? 5_000,
    resourceLimits: {
      ...DEFAULT_WEB_SANDBOX_LIMITS,
      maxMemoryMb: request.maxMemoryMb ?? DEFAULT_WEB_SANDBOX_LIMITS.maxMemoryMb,
    },
  };
  return validateConfig(config);
}

/**
 * Get the sandbox audit log (for governance traceability).
 */
export function getSandboxAuditLog(): readonly SandboxResult[] {
  return auditLog;
}

export type { SandboxPlatform, SandboxStatus, SandboxResult };
