import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join, resolve } from 'path';
import { afterEach, describe, expect, it } from 'vitest';
import { getRuntimeModuleRegistry } from './runtime-modules';

const roots: string[] = [];

const MODULE_PATHS = [
    'EXTENSIONS/CVF_v1.6_AGENT_PLATFORM/cvf-web',
    'EXTENSIONS/CVF_GUARD_CONTRACT',
    'EXTENSIONS/CVF_v1.1.1_PHASE_GOVERNANCE_PROTOCOL',
    'EXTENSIONS/CVF_CONTROL_PLANE_FOUNDATION',
    'EXTENSIONS/CVF_EXECUTION_PLANE_FOUNDATION',
    'EXTENSIONS/CVF_GOVERNANCE_EXPANSION_FOUNDATION',
    'EXTENSIONS/CVF_LEARNING_PLANE_FOUNDATION',
    'EXTENSIONS/CVF_MODEL_GATEWAY',
    'EXTENSIONS/CVF_POLICY_ENGINE',
    'EXTENSIONS/CVF_TRUST_SANDBOX',
];

function makeWorkspace(options: { omitPackageFor?: string; omitPathFor?: string } = {}) {
    const repoRoot = mkdtempSync(join(tmpdir(), 'cvf-modules-'));
    roots.push(repoRoot);

    for (const modulePath of MODULE_PATHS) {
        if (modulePath === options.omitPathFor) continue;
        const absoluteModulePath = resolve(repoRoot, modulePath);
        mkdirSync(absoluteModulePath, { recursive: true });
        if (modulePath !== options.omitPackageFor) {
            const pathParts = modulePath.split('/');
            writeFileSync(resolve(absoluteModulePath, 'package.json'), JSON.stringify({
                name: pathParts[pathParts.length - 1],
                version: '1.0.0',
                scripts: {
                    check: 'tsc --noEmit',
                    test: 'vitest run',
                },
            }));
        }
    }

    return repoRoot;
}

describe('getRuntimeModuleRegistry', () => {
    afterEach(() => {
        for (const root of roots.splice(0)) {
            rmSync(root, { recursive: true, force: true });
        }
    });

    it('enumerates all ten core modules with honest exposure state', () => {
        const repoRoot = makeWorkspace();

        const report = getRuntimeModuleRegistry({
            repoRoot,
            now: () => '2026-05-08T00:00:00.000Z',
        });

        expect(report.generatedAt).toBe('2026-05-08T00:00:00.000Z');
        expect(report.summary).toMatchObject({
            total: 10,
            available: 10,
            partial: 0,
            missing: 0,
            webRunnable: 1,
            readOnlyVisible: 2,
            notExposed: 7,
        });
        expect(report.modules.find((module) => module.id === 'cvf-web')).toMatchObject({
            runtimeClass: 'WEB_RUNNABLE',
            webExposureState: 'WEB_RUNNABLE',
        });
        expect(report.modules.find((module) => module.id === 'model-gateway')).toMatchObject({
            runtimeClass: 'HAS_RUNTIME_CODE',
            webExposureState: 'NOT_EXPOSED',
        });
    });

    it('marks module as partial when package metadata is not readable', () => {
        const repoRoot = makeWorkspace({
            omitPackageFor: 'EXTENSIONS/CVF_POLICY_ENGINE',
        });

        const report = getRuntimeModuleRegistry({ repoRoot });

        expect(report.modules.find((module) => module.id === 'policy-engine')).toMatchObject({
            healthStatus: 'partial',
            sourceMarker: 'path_present',
        });
        expect(report.summary.partial).toBe(1);
    });

    it('marks module as missing when the module path is absent', () => {
        const repoRoot = makeWorkspace({
            omitPathFor: 'EXTENSIONS/CVF_TRUST_SANDBOX',
        });

        const report = getRuntimeModuleRegistry({ repoRoot });

        expect(report.modules.find((module) => module.id === 'trust-sandbox')).toMatchObject({
            healthStatus: 'missing',
            sourceMarker: 'path_missing',
        });
        expect(report.summary.missing).toBe(1);
    });
});
