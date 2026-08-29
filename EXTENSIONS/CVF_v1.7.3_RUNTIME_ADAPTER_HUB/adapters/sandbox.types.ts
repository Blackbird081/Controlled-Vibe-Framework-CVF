// adapters/sandbox.types.ts
// CVF v1.7.3 — Local type mirror for SandboxIsolationContract interface.
// Source of truth: CVF_v1.7.1_SAFETY_RUNTIME/simulation/sandbox.isolation.contract.ts
// Rationale: rootDir is locked to this package; relative cross-package imports cause TS6059.
// TypeScript structural typing guarantees compatibility — these interfaces are shape-identical
// to those in the Safety Runtime package. Keep in sync when Safety Runtime types change.

export type SandboxPlatform = "worker_threads" | "docker" | "v8_isolate" | "stub";

// --- Isolation dimension admission (RFR-R5 / F9) ---
// Mirrors Safety Runtime sandbox.isolation.contract.ts exactly; see that
// file for the authoritative documentation of each type/function.

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
        return { valid: true, profile: Object.freeze(snapshot) as IsolationGuaranteeProfile };
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

export interface SandboxExecutor {
    readonly platform: SandboxPlatform;
    readonly guaranteeProfile: IsolationGuaranteeProfile;
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
        isolationRequirement: createDefaultIsolationRequirement(),
    };
}
