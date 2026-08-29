// sandbox.isolation.contract.ts
// CVF v1.7.1 — Sandbox Isolation Contract
// Track 5B: Replaces boolean stub (sandbox.mode.ts) with typed governance contract.
// RFR-R5: Adds typed isolation-dimension admission so no executor can imply a
// containment guarantee it does not actually provide. Admission is evaluated
// before any executor/worker/child-process creation; unsupported required
// dimensions reject with named evidence and never reach the executor.
// Doctrine basis: CVF_ARCHITECTURE_PRINCIPLES.md §7 (Execution Isolation Principle)
// Wiring target: EPF CommandRuntimeContract case "sandbox" (DELEGATED_TO_SANDBOX)

// --- Types ---

export type SandboxPlatform = "worker_threads" | "docker" | "v8_isolate" | "stub";

// --- Isolation dimension admission (RFR-R5 / F9) ---

/**
 * The exact canonical isolation-dimension vocabulary. No ninth dimension may
 * be added without a fresh governed tranche; every executor's guarantee
 * profile and every requirement/result must reconcile against exactly these
 * eight keys.
 */
export const ISOLATION_DIMENSIONS = [
  "filesystem",
  "network",
  "process",
  "environment",
  "credential",
  "ipc",
  "persistence",
  "host",
] as const;

export type IsolationDimension = (typeof ISOLATION_DIMENSIONS)[number];

export type IsolationRequirementMode = "SECURITY_BOUNDARY_REQUIRED" | "BEST_EFFORT_EXPLICIT";

/**
 * Caller-declared isolation intent. `SECURITY_BOUNDARY_REQUIRED` means every
 * dimension in `requiredDimensions` must be guaranteed by the executor's
 * profile or admission rejects before execution. `BEST_EFFORT_EXPLICIT`
 * means the caller explicitly accepts non-security-boundary delegation and
 * `requiredDimensions` must be empty -- a non-empty set under best-effort is
 * an inconsistent, rejected configuration.
 */
export interface IsolationRequirement {
  mode: IsolationRequirementMode;
  requiredDimensions: readonly IsolationDimension[];
}

export function createDefaultIsolationRequirement(): IsolationRequirement {
  return {
    mode: "SECURITY_BOUNDARY_REQUIRED",
    requiredDimensions: [...ISOLATION_DIMENSIONS],
  };
}

/**
 * An executor's immutable, truthful guarantee profile: for every canonical
 * dimension, whether that executor actually enforces it as a security
 * boundary. This is a fact about the executor, not a request; it must be
 * declared once per executor instance and never derived from caller input.
 */
export type IsolationGuaranteeProfile = Readonly<Record<IsolationDimension, boolean>>;

const NO_ISOLATION_GUARANTEES: IsolationGuaranteeProfile = Object.freeze({
  filesystem: false,
  network: false,
  process: false,
  environment: false,
  credential: false,
  ipc: false,
  persistence: false,
  host: false,
});

function snapshotIsolationGuaranteeProfile(
  value: unknown,
): { valid: boolean; profile: IsolationGuaranteeProfile } {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) {
      return { valid: false, profile: NO_ISOLATION_GUARANTEES };
    }
    const keys = Reflect.ownKeys(value);
    if (
      keys.length !== ISOLATION_DIMENSIONS.length ||
      keys.some((key) => typeof key !== "string" || !(ISOLATION_DIMENSIONS as readonly string[]).includes(key))
    ) {
      return { valid: false, profile: NO_ISOLATION_GUARANTEES };
    }
    const descriptors = Object.getOwnPropertyDescriptors(value);
    const snapshot: Partial<Record<IsolationDimension, boolean>> = {};
    for (const dimension of ISOLATION_DIMENSIONS) {
      const descriptor = descriptors[dimension];
      if (!descriptor || !("value" in descriptor) || typeof descriptor.value !== "boolean") {
        return { valid: false, profile: NO_ISOLATION_GUARANTEES };
      }
      snapshot[dimension] = descriptor.value;
    }
    return {
      valid: true,
      profile: Object.freeze(snapshot) as IsolationGuaranteeProfile,
    };
  } catch {
    return { valid: false, profile: NO_ISOLATION_GUARANTEES };
  }
}

export function isCompleteIsolationGuaranteeProfile(
  value: unknown,
): value is IsolationGuaranteeProfile {
  return snapshotIsolationGuaranteeProfile(value).valid;
}

export type IsolationAdmissionVerdict = "ADMITTED" | "REJECTED";

export type IsolationAdmissionReasonCode =
  | "REQUIREMENT_SATISFIED"
  | "UNSUPPORTED_DIMENSION"
  | "UNKNOWN_DIMENSION"
  | "DUPLICATE_DIMENSION"
  | "MISSING_DIMENSION"
  | "INCONSISTENT_BEST_EFFORT_REQUIREMENT"
  | "PLATFORM_MISMATCH"
  | "MALFORMED_GUARANTEE_PROFILE"
  | "MALFORMED_REQUIREMENT";

export interface IsolationAdmissionContext {
  requestedPlatform: SandboxPlatform;
  executorPlatform: SandboxPlatform;
}

/**
 * Auditable, per-dimension admission evidence. `guaranteed` and `required`
 * are always present for every canonical dimension regardless of verdict, so
 * a caller can see exactly which guarantee was missing without re-deriving
 * it from prose.
 */
export interface IsolationDimensionEvidence {
  dimension: IsolationDimension;
  required: boolean;
  guaranteed: boolean;
  satisfied: boolean;
}

export interface IsolationAdmissionEvidence {
  verdict: IsolationAdmissionVerdict;
  mode: IsolationRequirementMode;
  reasonCode: IsolationAdmissionReasonCode;
  detail: string;
  dimensions: readonly IsolationDimensionEvidence[];
  unsupportedRequiredDimensions: readonly IsolationDimension[];
}

function buildDimensionEvidence(
  requiredDimensions: ReadonlySet<IsolationDimension>,
  profile: IsolationGuaranteeProfile,
): IsolationDimensionEvidence[] {
  return ISOLATION_DIMENSIONS.map((dimension) => {
    const required = requiredDimensions.has(dimension);
    const guaranteed = profile[dimension];
    return { dimension, required, guaranteed, satisfied: !required || guaranteed };
  });
}

function rejectedEvidence(
  mode: IsolationRequirementMode,
  reasonCode: IsolationAdmissionReasonCode,
  detail: string,
  dimensions: readonly IsolationDimensionEvidence[] = [],
  unsupportedRequiredDimensions: readonly IsolationDimension[] = [],
): IsolationAdmissionEvidence {
  return {
    verdict: "REJECTED",
    mode,
    reasonCode,
    detail,
    dimensions,
    unsupportedRequiredDimensions,
  };
}

/**
 * Evaluates a caller's isolation requirement against an executor's
 * guarantee profile before any executor/worker/child-process creation.
 * Never mutates, never calls into the executor, and always returns
 * complete per-dimension evidence regardless of verdict.
 */
export function evaluateIsolationAdmission(
  requirement: IsolationRequirement,
  profile: IsolationGuaranteeProfile,
  context?: IsolationAdmissionContext,
): IsolationAdmissionEvidence {
  const profileSnapshot = snapshotIsolationGuaranteeProfile(profile);
  if (!profileSnapshot.valid) {
    return rejectedEvidence(
      "SECURITY_BOUNDARY_REQUIRED",
      "MALFORMED_GUARANTEE_PROFILE",
      "Executor guarantee profile is missing, malformed, or does not cover exactly the eight canonical dimensions.",
      buildDimensionEvidence(new Set(), profileSnapshot.profile),
    );
  }

  if (context && context.requestedPlatform !== context.executorPlatform) {
    return rejectedEvidence(
      "SECURITY_BOUNDARY_REQUIRED",
      "PLATFORM_MISMATCH",
      `Requested platform ${context.requestedPlatform} does not match executor platform ${context.executorPlatform}.`,
      buildDimensionEvidence(new Set(), profileSnapshot.profile),
    );
  }

  let mode: IsolationRequirementMode;
  let rawDimensions: readonly unknown[];
  try {
    if (requirement === null || typeof requirement !== "object") {
      throw new TypeError("malformed requirement");
    }
    const modeDescriptor = Object.getOwnPropertyDescriptor(requirement, "mode");
    const dimensionsDescriptor = Object.getOwnPropertyDescriptor(requirement, "requiredDimensions");
    if (
      !modeDescriptor || !("value" in modeDescriptor) ||
      !dimensionsDescriptor || !("value" in dimensionsDescriptor) ||
      (modeDescriptor.value !== "SECURITY_BOUNDARY_REQUIRED" && modeDescriptor.value !== "BEST_EFFORT_EXPLICIT") ||
      !Array.isArray(dimensionsDescriptor.value)
    ) {
      throw new TypeError("malformed requirement");
    }
    mode = modeDescriptor.value;
    rawDimensions = [...dimensionsDescriptor.value];
  } catch {
    return rejectedEvidence(
      "SECURITY_BOUNDARY_REQUIRED",
      "MALFORMED_REQUIREMENT",
      "Isolation requirement is missing, malformed, accessor-backed, or declares an unknown mode.",
      buildDimensionEvidence(new Set(), profileSnapshot.profile),
    );
  }

  const seen = new Set<string>();
  for (const raw of rawDimensions) {
    if (typeof raw !== "string" || !(ISOLATION_DIMENSIONS as readonly string[]).includes(raw)) {
      return rejectedEvidence(
        mode,
        "UNKNOWN_DIMENSION",
        "A required dimension is not one of the eight canonical isolation dimensions.",
        buildDimensionEvidence(seen as Set<IsolationDimension>, profileSnapshot.profile),
      );
    }
    if (seen.has(raw)) {
      return rejectedEvidence(
        mode,
        "DUPLICATE_DIMENSION",
        `Required dimension \`${raw}\` was declared more than once.`,
        buildDimensionEvidence(seen as Set<IsolationDimension>, profileSnapshot.profile),
      );
    }
    seen.add(raw);
  }

  const requiredDimensions = seen as Set<IsolationDimension>;

  if (mode === "BEST_EFFORT_EXPLICIT") {
    if (requiredDimensions.size > 0) {
      return rejectedEvidence(
        mode,
        "INCONSISTENT_BEST_EFFORT_REQUIREMENT",
        "BEST_EFFORT_EXPLICIT requires an empty requiredDimensions set; a non-empty set under best-effort delegation is an inconsistent, rejected configuration.",
        buildDimensionEvidence(requiredDimensions, profileSnapshot.profile),
      );
    }
    return {
      verdict: "ADMITTED",
      mode,
      reasonCode: "REQUIREMENT_SATISFIED",
      detail: "Explicit best-effort delegation admitted; execution is not a security boundary.",
      dimensions: buildDimensionEvidence(requiredDimensions, profileSnapshot.profile),
      unsupportedRequiredDimensions: [],
    };
  }

  const dimensions = buildDimensionEvidence(requiredDimensions, profileSnapshot.profile);
  const unsupportedRequiredDimensions = dimensions
    .filter((entry) => entry.required && !entry.guaranteed)
    .map((entry) => entry.dimension);

  if (unsupportedRequiredDimensions.length > 0) {
    return rejectedEvidence(
      mode,
      "UNSUPPORTED_DIMENSION",
      `Selected executor cannot guarantee required dimension(s): ${unsupportedRequiredDimensions.join(", ")}.`,
      dimensions,
      unsupportedRequiredDimensions,
    );
  }

  if (requiredDimensions.size !== ISOLATION_DIMENSIONS.length) {
    const missing = ISOLATION_DIMENSIONS.filter((dimension) => !requiredDimensions.has(dimension));
    return rejectedEvidence(
      mode,
      "MISSING_DIMENSION",
      `SECURITY_BOUNDARY_REQUIRED must require every canonical dimension; missing: ${missing.join(", ")}.`,
      dimensions,
    );
  }

  return {
    verdict: "ADMITTED",
    mode,
    reasonCode: "REQUIREMENT_SATISFIED",
    detail: "All required isolation dimensions are guaranteed by the selected executor.",
    dimensions,
    unsupportedRequiredDimensions: [],
  };
}

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
  isolationRequirement: IsolationRequirement;
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
  isolationAdmission: IsolationAdmissionEvidence;
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
  readonly guaranteeProfile: IsolationGuaranteeProfile;
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
    isolationRequirement: createDefaultIsolationRequirement(),
  };
}

// --- Stub executor (deterministic, for testing / contract-only mode) ---
// The stub never executes a real command or touches the host, so it
// truthfully guarantees every isolation dimension by construction.

const STUB_GUARANTEE_PROFILE: IsolationGuaranteeProfile = Object.freeze({
  filesystem: true,
  network: true,
  process: true,
  environment: true,
  credential: true,
  ipc: true,
  persistence: true,
  host: true,
});

function createStubResult(
  sandboxId: string,
  command: SandboxCommand,
  config: SandboxConfig,
  now: string,
  isolationAdmission: IsolationAdmissionEvidence,
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
    isolationAdmission,
  };
}

const stubExecutor: SandboxExecutor = {
  platform: "stub",
  guaranteeProfile: STUB_GUARANTEE_PROFILE,
  async execute(
    command: SandboxCommand,
    config: SandboxConfig,
  ): Promise<SandboxResult> {
    return createStubResult(
      `stub-${command.taskId}`,
      command,
      config,
      new Date().toISOString(),
      evaluateIsolationAdmission(config.isolationRequirement, STUB_GUARANTEE_PROFILE),
    );
  },
};

// --- Contract ---

let idCounter = 0;

export class SandboxIsolationContract {
  private readonly executor: SandboxExecutor;
  private readonly executorGuaranteeProfile: IsolationGuaranteeProfile;
  private readonly now: () => string;
  private readonly generateId: () => string;
  private readonly auditLog: SandboxResult[] = [];

  constructor(dependencies: SandboxIsolationContractDependencies = {}) {
    this.executor = dependencies.executor ?? stubExecutor;
    let declaredProfile: unknown;
    try {
      declaredProfile = this.executor.guaranteeProfile;
    } catch {
      declaredProfile = null;
    }
    const profileSnapshot = snapshotIsolationGuaranteeProfile(declaredProfile);
    this.executorGuaranteeProfile = profileSnapshot.valid
      ? profileSnapshot.profile
      : ({} as IsolationGuaranteeProfile);
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
    const admission = evaluateIsolationAdmission(
      fullConfig.isolationRequirement,
      this.executorGuaranteeProfile,
      { requestedPlatform: fullConfig.platform, executorPlatform: this.executor.platform },
    );
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
        isolationAdmission: admission,
      };
      this.auditLog.push(failedResult);
      return failedResult;
    }

    // Fail closed: reject unsupported isolation requirements before the
    // executor, worker, or child process is ever created.
    if (admission.verdict === "REJECTED") {
      const now = this.now();
      const rejectedResult: SandboxResult = {
        sandboxId: this.generateId(),
        status: "FAILED",
        startedAt: now,
        completedAt: now,
        exitCode: -1,
        stdout: "",
        stderr: `Isolation admission rejected: ${admission.detail}`,
        containmentViolations: [],
        resourceUsage: { cpuTimeMs: 0, memoryPeakMb: 0, outputBytes: 0 },
        platform: fullConfig.platform,
        isolationAdmission: admission,
      };
      this.auditLog.push(rejectedResult);
      return rejectedResult;
    }

    const result = await this.executor.execute(command, fullConfig);

    const enrichedResult: SandboxResult = {
      ...result,
      sandboxId: result.sandboxId || this.generateId(),
      isolationAdmission: admission,
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
