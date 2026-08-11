import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { getSystemHealth } from './system-health';
import { resolveHostedConfigLifecycle } from '@/lib/lpci/release-policy';

const roots: string[] = [];

function makeWorkspace(options: { withEnvLocal?: boolean; withNodeModules?: boolean; withProviderKey?: boolean } = {}) {
    const root = mkdtempSync(join(tmpdir(), 'cvf-health-'));
    roots.push(root);

    const repoRoot = root;
    const appRoot = resolve(repoRoot, 'EXTENSIONS', 'CVF_v1.6_AGENT_PLATFORM', 'cvf-web');
    const scriptsRoot = resolve(repoRoot, 'scripts');

    mkdirSync(appRoot, { recursive: true });
    mkdirSync(scriptsRoot, { recursive: true });
    writeFileSync(resolve(appRoot, 'package.json'), '{}');
    writeFileSync(resolve(appRoot, 'package-lock.json'), '{}');
    writeFileSync(resolve(appRoot, '.env.example'), 'DASHSCOPE_API_KEY=\n');
    writeFileSync(resolve(scriptsRoot, 'cvf_doctor.py'), '');
    writeFileSync(resolve(scriptsRoot, 'cvf_provider_check.py'), '');
    writeFileSync(resolve(scriptsRoot, 'cvf_setup.py'), '');
    writeFileSync(resolve(scriptsRoot, 'run_cvf_release_gate_bundle.py'), '');

    if (options.withEnvLocal) writeFileSync(resolve(appRoot, '.env.local'), 'DASHSCOPE_API_KEY=test\n');
    if (options.withNodeModules) mkdirSync(resolve(appRoot, 'node_modules'));

    const env = {
        NODE_ENV: 'test',
        ...(options.withProviderKey ? { DASHSCOPE_API_KEY: 'redacted' } : {}),
    } as NodeJS.ProcessEnv;

    return {
        repoRoot,
        appRoot,
        env,
    };
}

describe('getSystemHealth', () => {
    afterEach(() => {
        for (const root of roots.splice(0)) {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('reports ready when install, scripts, and required provider key are present', () => {
        const workspace = makeWorkspace({
            withEnvLocal: true,
            withNodeModules: true,
            withProviderKey: true,
        });

        const report = getSystemHealth({
            ...workspace,
            now: () => '2026-05-08T00:00:00.000Z',
        });

        expect(report.status).toBe('ready');
        expect(report.generatedAt).toBe('2026-05-08T00:00:00.000Z');
        expect(report.summary.fail).toBe(0);
        expect(report.summary.warn).toBe(0);
        expect(report.providers[0]).toMatchObject({
            provider: 'alibaba',
            ready: true,
            detectedEnvVars: ['DASHSCOPE_API_KEY'],
            requiredForReleaseProof: true,
        });
    });

    it('reports warning when local env, node_modules, and live proof key are missing', () => {
        const workspace = makeWorkspace();

        const report = getSystemHealth({
            ...workspace,
            now: () => '2026-05-08T00:00:00.000Z',
        });

        expect(report.status).toBe('warning');
        expect(report.summary.fail).toBe(0);
        expect(report.checks.find((check) => check.id === 'env-local')?.status).toBe('warn');
        expect(report.checks.find((check) => check.id === 'node-modules')?.status).toBe('warn');
        expect(report.checks.find((check) => check.id === 'alibaba-key-presence')?.status).toBe('warn');
    });

    it('reports blocked when a required runtime script is missing', () => {
        const workspace = makeWorkspace({
            withEnvLocal: true,
            withNodeModules: true,
            withProviderKey: true,
        });
        rmSync(resolve(workspace.repoRoot, 'scripts', 'run_cvf_release_gate_bundle.py'));

        const report = getSystemHealth({
            ...workspace,
            now: () => '2026-05-08T00:00:00.000Z',
        });

        expect(report.status).toBe('blocked');
        expect(report.checks.find((check) => check.id === 'release-gate-script')?.status).toBe('fail');
    });

    it('projects injected LPCI static health without external status claims', () => {
        const workspace = makeWorkspace();
        const report = getSystemHealth({
            ...workspace,
            lpciReleaseInput: {
                authPolicy: { actualVersion: 'p1', acceptedVersion: 'p1' },
                config: resolveHostedConfigLifecycle({
                    apiKeyAvailable: true,
                    model: 'openai/gpt-4o',
                    endpoint: 'https://api.openai.com/v1/chat/completions',
                    bundleVersion: 'b1',
                }),
                limiter: {
                    backend: {
                        schemaVersion: 'cvf.rateLimitBackend.v1', configuredStore: 'redis', activeStore: 'redis',
                        distributed: true, configurationStatus: 'ACTIVE_REDIS_REST', claimBoundary: 'static only',
                    },
                    implementationCapable: true,
                },
                audit: { configured: true, distributed: true, atomicAppend: true, retentionDays: 30 },
                routeComposition: { actualVersion: 'r1', acceptedVersion: 'r1' },
                providerCapability: { exactPairRegistered: true, executableAdapterRegistered: true },
            },
        });

        expect(report.lpciRelease?.state).toBe('STATIC_READY');
        expect(report.lpciRelease?.claimBoundary).toBe('static_prerequisites_only_external_status_unproven');
    });
});
