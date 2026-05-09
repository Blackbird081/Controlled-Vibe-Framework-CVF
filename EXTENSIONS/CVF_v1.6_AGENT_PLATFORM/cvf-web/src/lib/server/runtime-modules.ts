import { existsSync, readFileSync } from 'fs';
import { basename, resolve } from 'path';

export type RuntimeModuleClass =
    | 'PRESENT_DOCS_ONLY'
    | 'HAS_RUNTIME_CODE'
    | 'RUNNABLE_CLI_ONLY'
    | 'WEB_VISIBLE_READ_ONLY'
    | 'WEB_RUNNABLE';

export type WebExposureState = 'WEB_RUNNABLE' | 'WEB_VISIBLE_READ_ONLY' | 'PARTIAL_INHERITED' | 'NOT_EXPOSED';
export type RuntimeModuleHealth = 'available' | 'partial' | 'missing';

export interface RuntimeModuleRegistryEntry {
    id: string;
    name: string;
    repoPath: string;
    sourceMarker: string;
    runtimeClass: RuntimeModuleClass;
    webExposureState: WebExposureState;
    healthStatus: RuntimeModuleHealth;
    healthMessage: string;
    exposedActions: string[];
    evidenceOwner: string;
    packageScripts: string[];
    notes: string;
}

export interface RuntimeModuleRegistryReport {
    generatedAt: string;
    modules: RuntimeModuleRegistryEntry[];
    summary: {
        total: number;
        available: number;
        partial: number;
        missing: number;
        webRunnable: number;
        readOnlyVisible: number;
        notExposed: number;
    };
    boundary: string;
}

interface ModuleDefinition {
    id: string;
    name: string;
    repoPath: string;
    runtimeClass: RuntimeModuleClass;
    webExposureState: WebExposureState;
    exposedActions: string[];
    evidenceOwner: string;
    notes: string;
}

interface RuntimeModuleRegistryOptions {
    repoRoot?: string;
    now?: () => string;
}

const MODULES: ModuleDefinition[] = [
    {
        id: 'cvf-web',
        name: 'CVF Web',
        repoPath: 'EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web',
        runtimeClass: 'WEB_RUNNABLE',
        webExposureState: 'WEB_RUNNABLE',
        exposedActions: ['read_system_health', 'read_module_registry', 'governed_execute_path'],
        evidenceOwner: 'W141/W149 live Web matrices and RC2-B1 health surface',
        notes: 'Only current Web-runnable module surface.',
    },
    {
        id: 'guard-contract',
        name: 'Guard Contract',
        repoPath: 'EXTENSIONS/CVF_GUARD_CONTRACT',
        runtimeClass: 'RUNNABLE_CLI_ONLY',
        webExposureState: 'NOT_EXPOSED',
        exposedActions: [],
        evidenceOwner: 'RC2-B0 module runtime classification audit',
        notes: 'Runnable package/check/test surface; no Web control surface.',
    },
    {
        id: 'phase-governance-runtime',
        name: 'Phase Governance Runtime',
        repoPath: 'EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL',
        runtimeClass: 'RUNNABLE_CLI_ONLY',
        webExposureState: 'NOT_EXPOSED',
        exposedActions: [],
        evidenceOwner: 'RC2-B0 module runtime classification audit',
        notes: 'Governance runtime and adapters exist; no Web facade until a specific action is proven.',
    },
    {
        id: 'control-plane-foundation',
        name: 'Control Plane Foundation',
        repoPath: 'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION',
        runtimeClass: 'RUNNABLE_CLI_ONLY',
        webExposureState: 'PARTIAL_INHERITED',
        exposedActions: [],
        evidenceOwner: 'RC2-B0 module runtime classification audit',
        notes: 'Web may inherit parts indirectly, but there is no operator module surface yet.',
    },
    {
        id: 'execution-plane-foundation',
        name: 'Execution Plane Foundation',
        repoPath: 'EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION',
        runtimeClass: 'RUNNABLE_CLI_ONLY',
        webExposureState: 'NOT_EXPOSED',
        exposedActions: [],
        evidenceOwner: 'RC2-B0 module runtime classification audit',
        notes: 'CLI/package runnable first; Web registry is read-only.',
    },
    {
        id: 'governance-expansion-foundation',
        name: 'Governance Expansion Foundation',
        repoPath: 'EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION',
        runtimeClass: 'RUNNABLE_CLI_ONLY',
        webExposureState: 'NOT_EXPOSED',
        exposedActions: [],
        evidenceOwner: 'RC2-B0 module runtime classification audit',
        notes: 'CLI/package runnable first; Web registry is read-only.',
    },
    {
        id: 'learning-plane-foundation',
        name: 'Learning Plane Foundation',
        repoPath: 'EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION',
        runtimeClass: 'RUNNABLE_CLI_ONLY',
        webExposureState: 'PARTIAL_INHERITED',
        exposedActions: [],
        evidenceOwner: 'RC2-B0 module runtime classification audit',
        notes: 'Knowledge features may use related ideas; no dedicated module surface yet.',
    },
    {
        id: 'model-gateway',
        name: 'Model Gateway',
        repoPath: 'EXTENSIONS/CVF_MODEL_GATEWAY',
        runtimeClass: 'HAS_RUNTIME_CODE',
        webExposureState: 'NOT_EXPOSED',
        exposedActions: [],
        evidenceOwner: 'RC2-B0 module runtime classification audit',
        notes: 'Wrapper/coordination package, not a full gateway UI.',
    },
    {
        id: 'policy-engine',
        name: 'Policy Engine',
        repoPath: 'EXTENSIONS/CVF_POLICY_ENGINE',
        runtimeClass: 'HAS_RUNTIME_CODE',
        webExposureState: 'NOT_EXPOSED',
        exposedActions: [],
        evidenceOwner: 'RC2-B0 module runtime classification audit',
        notes: 'Coordination package until a direct policy surface exists.',
    },
    {
        id: 'trust-sandbox',
        name: 'Trust Sandbox',
        repoPath: 'EXTENSIONS/CVF_TRUST_SANDBOX',
        runtimeClass: 'HAS_RUNTIME_CODE',
        webExposureState: 'NOT_EXPOSED',
        exposedActions: [],
        evidenceOwner: 'RC2-B0 module runtime classification audit',
        notes: 'Coordination package until a sandbox action is proven.',
    },
];

function readPackageJson(path: string): { name?: string; version?: string; scripts?: Record<string, string> } | null {
    try {
        return JSON.parse(readFileSync(path, 'utf8')) as { name?: string; version?: string; scripts?: Record<string, string> };
    } catch {
        return null;
    }
}

function moduleHealth(repoRoot: string, definition: ModuleDefinition): Pick<RuntimeModuleRegistryEntry, 'healthStatus' | 'healthMessage' | 'sourceMarker' | 'packageScripts'> {
    const absolutePath = resolve(repoRoot, definition.repoPath);
    const packagePath = resolve(absolutePath, 'package.json');
    const pathExists = existsSync(absolutePath);
    const packageJson = pathExists ? readPackageJson(packagePath) : null;

    if (!pathExists) {
        return {
            healthStatus: 'missing',
            healthMessage: 'Module path is missing from this workspace.',
            sourceMarker: 'path_missing',
            packageScripts: [],
        };
    }

    if (!packageJson) {
        return {
            healthStatus: 'partial',
            healthMessage: 'Module path exists, but package metadata is not readable.',
            sourceMarker: 'path_present',
            packageScripts: [],
        };
    }

    return {
        healthStatus: 'available',
        healthMessage: 'Module path and package metadata are readable.',
        sourceMarker: `${packageJson.name ?? basename(absolutePath)}@${packageJson.version ?? 'unversioned'}`,
        packageScripts: Object.keys(packageJson.scripts ?? {}).sort(),
    };
}

function summarize(modules: RuntimeModuleRegistryEntry[]): RuntimeModuleRegistryReport['summary'] {
    return modules.reduce(
        (acc, module) => {
            acc.total += 1;
            acc[module.healthStatus] += 1;
            if (module.webExposureState === 'WEB_RUNNABLE') acc.webRunnable += 1;
            if (module.webExposureState === 'WEB_VISIBLE_READ_ONLY' || module.webExposureState === 'PARTIAL_INHERITED') {
                acc.readOnlyVisible += 1;
            }
            if (module.webExposureState === 'NOT_EXPOSED') acc.notExposed += 1;
            return acc;
        },
        {
            total: 0,
            available: 0,
            partial: 0,
            missing: 0,
            webRunnable: 0,
            readOnlyVisible: 0,
            notExposed: 0,
        },
    );
}

export function getRuntimeModuleRegistry(options: RuntimeModuleRegistryOptions = {}): RuntimeModuleRegistryReport {
    const repoRoot = options.repoRoot ?? resolve(process.cwd(), '..', '..', '..');
    const now = options.now ?? (() => new Date().toISOString());
    const modules = MODULES.map((definition) => ({
        ...definition,
        ...moduleHealth(repoRoot, definition),
    }));

    return {
        generatedAt: now(),
        modules,
        summary: summarize(modules),
        boundary: 'Read-only module registry. It does not trigger module actions or widen Web authority.',
    };
}
