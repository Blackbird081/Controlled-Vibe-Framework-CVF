import { existsSync, accessSync, constants } from 'fs';
import { basename, relative, resolve } from 'path';

export type SystemHealthStatus = 'ready' | 'warning' | 'blocked';
export type SystemHealthCheckStatus = 'pass' | 'warn' | 'fail' | 'info';
export type SystemHealthCheckClass =
    | 'install'
    | 'runtime'
    | 'provider'
    | 'governance-proof'
    | 'web';

export interface SystemHealthCheck {
    id: string;
    label: string;
    status: SystemHealthCheckStatus;
    classification: SystemHealthCheckClass;
    message: string;
    detail?: string;
}

export interface ProviderPresence {
    provider: 'alibaba' | 'deepseek';
    ready: boolean;
    detectedEnvVars: string[];
    requiredForReleaseProof: boolean;
}

export interface SystemHealthReport {
    status: SystemHealthStatus;
    generatedAt: string;
    runtime: {
        nodeVersion: string;
        appRoot: string;
        repoRoot: string;
        platform: NodeJS.Platform;
    };
    providers: ProviderPresence[];
    checks: SystemHealthCheck[];
    summary: {
        pass: number;
        warn: number;
        fail: number;
        info: number;
    };
}

interface SystemHealthOptions {
    appRoot?: string;
    repoRoot?: string;
    env?: NodeJS.ProcessEnv;
    now?: () => string;
}

const ALIBABA_KEY_ALIASES = [
    'DASHSCOPE_API_KEY',
    'ALIBABA_API_KEY',
    'CVF_ALIBABA_API_KEY',
    'CVF_BENCHMARK_ALIBABA_KEY',
] as const;

const DEEPSEEK_KEY_ALIASES = ['DEEPSEEK_API_KEY'] as const;

function hasWritableDirectory(path: string): boolean {
    try {
        accessSync(path, constants.W_OK);
        return true;
    } catch {
        return false;
    }
}

function detectedEnvVars(env: NodeJS.ProcessEnv, aliases: readonly string[]): string[] {
    return aliases.filter((name) => Boolean(env[name]));
}

function checkPath(
    repoRoot: string,
    id: string,
    label: string,
    classification: SystemHealthCheckClass,
    path: string,
    successMessage: string,
    failureMessage: string,
): SystemHealthCheck {
    const exists = existsSync(path);
    return {
        id,
        label,
        classification,
        status: exists ? 'pass' : 'fail',
        message: exists ? successMessage : failureMessage,
        detail: displayPath(repoRoot, path),
    };
}

function summarize(checks: SystemHealthCheck[]): SystemHealthReport['summary'] {
    return checks.reduce(
        (acc, check) => {
            acc[check.status] += 1;
            return acc;
        },
        { pass: 0, warn: 0, fail: 0, info: 0 },
    );
}

function overallStatus(summary: SystemHealthReport['summary']): SystemHealthStatus {
    if (summary.fail > 0) return 'blocked';
    if (summary.warn > 0) return 'warning';
    return 'ready';
}

function displayPath(repoRoot: string, path: string): string {
    const relativePath = relative(repoRoot, path);
    return relativePath && !relativePath.startsWith('..') ? relativePath : basename(path);
}

export function getSystemHealth(options: SystemHealthOptions = {}): SystemHealthReport {
    const appRoot = options.appRoot ?? process.cwd();
    const repoRoot = options.repoRoot ?? resolve(appRoot, '..', '..', '..');
    const env = options.env ?? process.env;
    const now = options.now ?? (() => new Date().toISOString());

    const webRoot = appRoot;
    const envExamplePath = resolve(webRoot, '.env.example');
    const envLocalPath = resolve(webRoot, '.env.local');
    const nodeModulesPath = resolve(webRoot, 'node_modules');
    const alibabaKeys = detectedEnvVars(env, ALIBABA_KEY_ALIASES);
    const deepseekKeys = detectedEnvVars(env, DEEPSEEK_KEY_ALIASES);
    const providers: ProviderPresence[] = [
        {
            provider: 'alibaba',
            ready: alibabaKeys.length > 0,
            detectedEnvVars: alibabaKeys,
            requiredForReleaseProof: true,
        },
        {
            provider: 'deepseek',
            ready: deepseekKeys.length > 0,
            detectedEnvVars: deepseekKeys,
            requiredForReleaseProof: false,
        },
    ];

    const checks: SystemHealthCheck[] = [
        checkPath(
            repoRoot,
            'repo-root',
            'Repository root',
            'install',
            repoRoot,
            'Repository root is reachable from the web app.',
            'Repository root cannot be resolved from the web app.',
        ),
        checkPath(
            repoRoot,
            'web-package',
            'Web package manifest',
            'install',
            resolve(webRoot, 'package.json'),
            'Web package manifest is present.',
            'Web package manifest is missing.',
        ),
        checkPath(
            repoRoot,
            'web-lockfile',
            'Web lockfile',
            'install',
            resolve(webRoot, 'package-lock.json'),
            'Web lockfile is present for repeatable install.',
            'Web lockfile is missing.',
        ),
        checkPath(
            repoRoot,
            'env-template',
            'Environment template',
            'install',
            envExamplePath,
            'Environment template is tracked.',
            'Environment template is missing.',
        ),
        {
            id: 'env-local',
            label: 'Local environment file',
            classification: 'install',
            status: existsSync(envLocalPath) ? 'pass' : 'warn',
            message: existsSync(envLocalPath)
                ? 'Local environment file is present.'
                : 'Local environment file has not been created.',
            detail: displayPath(repoRoot, envLocalPath),
        },
        {
            id: 'node-modules',
            label: 'Installed dependencies',
            classification: 'install',
            status: existsSync(nodeModulesPath) ? 'pass' : 'warn',
            message: existsSync(nodeModulesPath)
                ? 'Web dependencies are installed.'
                : 'Web dependencies are not installed in this workspace.',
            detail: displayPath(repoRoot, nodeModulesPath),
        },
        {
            id: 'repo-writable',
            label: 'Workspace write access',
            classification: 'runtime',
            status: hasWritableDirectory(repoRoot) ? 'pass' : 'warn',
            message: hasWritableDirectory(repoRoot)
                ? 'Repository root is writable by the current process.'
                : 'Repository root is not writable by the current process.',
            detail: basename(repoRoot),
        },
        checkPath(
            repoRoot,
            'doctor-script',
            'Runtime doctor',
            'runtime',
            resolve(repoRoot, 'scripts', 'cvf_doctor.py'),
            'Runtime doctor script is available.',
            'Runtime doctor script is missing.',
        ),
        checkPath(
            repoRoot,
            'provider-check-script',
            'Provider check',
            'provider',
            resolve(repoRoot, 'scripts', 'cvf_provider_check.py'),
            'Provider check script is available.',
            'Provider check script is missing.',
        ),
        checkPath(
            repoRoot,
            'setup-script',
            'Guided setup',
            'install',
            resolve(repoRoot, 'scripts', 'cvf_setup.py'),
            'Guided setup script is available.',
            'Guided setup script is missing.',
        ),
        checkPath(
            repoRoot,
            'release-gate-script',
            'Release gate bundle',
            'governance-proof',
            resolve(repoRoot, 'scripts', 'run_cvf_release_gate_bundle.py'),
            'Release gate bundle is available for live governance proof.',
            'Release gate bundle is missing.',
        ),
        {
            id: 'alibaba-key-presence',
            label: 'DashScope-compatible provider key',
            classification: 'provider',
            status: alibabaKeys.length > 0 ? 'pass' : 'warn',
            message: alibabaKeys.length > 0
                ? 'A DashScope-compatible key is present in process environment.'
                : 'No DashScope-compatible key is visible to the web process.',
            detail: alibabaKeys.length > 0 ? alibabaKeys.join(', ') : ALIBABA_KEY_ALIASES.join(', '),
        },
        {
            id: 'deepseek-key-presence',
            label: 'DeepSeek provider key',
            classification: 'provider',
            status: deepseekKeys.length > 0 ? 'pass' : 'info',
            message: deepseekKeys.length > 0
                ? 'DeepSeek key is present in process environment.'
                : 'DeepSeek key is not configured.',
            detail: deepseekKeys.length > 0 ? deepseekKeys.join(', ') : DEEPSEEK_KEY_ALIASES.join(', '),
        },
        {
            id: 'health-surface-boundary',
            label: 'Web visibility boundary',
            classification: 'web',
            status: 'info',
            message: 'This surface is read-only and does not trigger governance jobs.',
            detail: '/api/system/health',
        },
    ];

    const summary = summarize(checks);

    return {
        status: overallStatus(summary),
        generatedAt: now(),
        runtime: {
            nodeVersion: process.version,
            appRoot: displayPath(repoRoot, appRoot),
            repoRoot: basename(repoRoot),
            platform: process.platform,
        },
        providers,
        checks,
        summary,
    };
}
