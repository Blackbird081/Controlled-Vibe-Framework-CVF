// tests/adapters.test.ts
// Runtime adapter behavior tests

import { describe, it, expect } from 'vitest'
import fs from 'fs'
import os from 'os'
import path from 'path'
import { OpenClawAdapter } from '../adapters/openclaw.adapter.js'
import { PicoClawAdapter } from '../adapters/picoclaw.adapter.js'
import { ZeroClawAdapter } from '../adapters/zeroclaw.adapter.js'
import { NanoAdapter } from '../adapters/nano.adapter.js'
import { ReleaseEvidenceAdapter } from '../adapters/release.evidence.adapter.js'
import { executeFilesystemAction, executeHttpAction } from '../adapters/base.adapter.js'
import type { RuntimeRequest } from '../contracts/runtime.adapter.interface.js'
import {
    WorkerThreadSandboxAdapter,
    WORKER_THREAD_GUARANTEE_PROFILE,
} from '../adapters/worker.thread.sandbox.adapter.js'
import {
    createDefaultSandboxConfig,
    evaluateIsolationAdmission,
    isCompleteIsolationGuaranteeProfile,
    ISOLATION_DIMENSIONS,
} from '../adapters/sandbox.types.js'
import type {
    IsolationDimension,
    IsolationGuaranteeProfile,
    SandboxCommand,
    SandboxConfig,
} from '../adapters/sandbox.types.js'

/** Explicit best-effort worker_threads config: the only mode this platform may satisfy. */
function bestEffortWorkerThreadConfig(overrides?: Partial<SandboxConfig>): SandboxConfig {
    return {
        ...createDefaultSandboxConfig('worker_threads'),
        isolationRequirement: { mode: 'BEST_EFFORT_EXPLICIT', requiredDimensions: [] },
        ...overrides,
    }
}

describe('Base Adapter Helpers', () => {

    it('filesystem read returns error for missing path', () => {
        const req: RuntimeRequest = { capability: 'filesystem', action: 'read', payload: {} }
        const result = executeFilesystemAction(req)
        expect(result.success).toBe(false)
        expect(result.error).toContain('Missing required field')
    })

    it('filesystem read returns error for non-existent file', () => {
        const req: RuntimeRequest = {
            capability: 'filesystem', action: 'read',
            payload: { path: '/nonexistent/file.txt' },
        }
        const result = executeFilesystemAction(req)
        expect(result.success).toBe(false)
        expect(result.error).toContain('File not found')
    })

    it('filesystem write returns error for missing content', () => {
        const req: RuntimeRequest = {
            capability: 'filesystem', action: 'write',
            payload: { path: '/tmp/test.txt' },
        }
        const result = executeFilesystemAction(req)
        expect(result.success).toBe(false)
        expect(result.error).toContain('Missing required field')
    })

    it('filesystem unsupported action returns error', () => {
        const req: RuntimeRequest = {
            capability: 'filesystem', action: 'rename',
            payload: { path: '/tmp/test.txt' },
        }
        const result = executeFilesystemAction(req)
        expect(result.success).toBe(false)
        expect(result.error).toContain('Unsupported filesystem action')
    })

    it('filesystem write and read succeeds', () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cvf173-'))
        try {
            const filePath = path.join(root, 'sub', 'file.txt')
            const writeResult = executeFilesystemAction({
                capability: 'filesystem',
                action: 'write',
                payload: { path: filePath, content: 'hello' },
            })
            expect(writeResult.success).toBe(true)

            const readResult = executeFilesystemAction({
                capability: 'filesystem',
                action: 'read',
                payload: { path: filePath },
            })
            expect(readResult.success).toBe(true)
            expect(readResult.data).toBe('hello')
        } finally {
            fs.rmSync(root, { recursive: true, force: true })
        }
    })

    it('http helper returns error when url is missing', async () => {
        const result = await executeHttpAction({
            capability: 'http',
            action: 'get',
            payload: {},
        })
        expect(result.success).toBe(false)
        expect(result.error).toContain('payload.url')
    })

    it('http helper handles non-ok response', async () => {
        const oldFetch = globalThis.fetch
        globalThis.fetch = (async () =>
            new Response('denied', { status: 403, statusText: 'Forbidden' })) as typeof fetch
        try {
            const result = await executeHttpAction({
                capability: 'http',
                action: 'get',
                payload: { url: 'https://example.com' },
            })
            expect(result.success).toBe(false)
            expect(result.error).toContain('HTTP 403')
        } finally {
            globalThis.fetch = oldFetch
        }
    })
})

describe('OpenClawAdapter', () => {
    const adapter = new OpenClawAdapter()

    it('has correct name and capabilities', () => {
        expect(adapter.name).toBe('openclaw')
        expect(adapter.capabilities).toEqual(['filesystem', 'shell', 'http'])
    })

    it('returns error for unsupported capability', async () => {
        const result = await adapter.execute({
            capability: 'database', action: 'query', payload: {},
        })
        expect(result.success).toBe(false)
        expect(result.error).toContain('Unsupported capability')
    })

    it('returns error for shell without command', async () => {
        const result = await adapter.execute({
            capability: 'shell', action: 'execute', payload: {},
        })
        expect(result.success).toBe(false)
        expect(result.error).toContain('Missing required field')
    })

    it('executes filesystem actions through adapter', async () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cvf173-open-'))
        try {
            const filePath = path.join(root, 'data.txt')
            const writeResult = await adapter.execute({
                capability: 'filesystem',
                action: 'write',
                payload: { path: filePath, content: 'abc' },
            })
            expect(writeResult.success).toBe(true)

            const readResult = await adapter.execute({
                capability: 'filesystem',
                action: 'read',
                payload: { path: filePath },
            })
            expect(readResult.success).toBe(true)
            expect(readResult.data).toBe('abc')
        } finally {
            fs.rmSync(root, { recursive: true, force: true })
        }
    })

    it('executes http actions through adapter', async () => {
        const oldFetch = globalThis.fetch
        globalThis.fetch = (async () =>
            new Response('ok', { status: 200 })) as typeof fetch
        try {
            const result = await adapter.execute({
                capability: 'http',
                action: 'get',
                payload: { url: 'https://example.com' },
            })
            expect(result.success).toBe(true)
            expect(result.data).toBe('ok')
        } finally {
            globalThis.fetch = oldFetch
        }
    })
})

describe('PicoClawAdapter', () => {
    const adapter = new PicoClawAdapter()

    it('has correct name and capabilities', () => {
        expect(adapter.name).toBe('picoclaw')
        expect(adapter.capabilities).toEqual(['filesystem'])
    })

    it('rejects non-filesystem capability', async () => {
        const result = await adapter.execute({
            capability: 'http', action: 'get', payload: {},
        })
        expect(result.success).toBe(false)
        expect(result.error).toContain('only supports filesystem')
    })
})

describe('ZeroClawAdapter', () => {
    const adapter = new ZeroClawAdapter()

    it('has correct name and capabilities', () => {
        expect(adapter.name).toBe('zeroclaw')
        expect(adapter.capabilities).toEqual(['http'])
    })

    it('rejects non-http capability', async () => {
        const result = await adapter.execute({
            capability: 'filesystem', action: 'read', payload: {},
        })
        expect(result.success).toBe(false)
        expect(result.error).toContain('only supports HTTP')
    })

    it('supports http capability', async () => {
        const oldFetch = globalThis.fetch
        globalThis.fetch = (async () =>
            new Response('z', { status: 200 })) as typeof fetch
        try {
            const result = await adapter.execute({
                capability: 'http',
                action: 'get',
                payload: { url: 'https://example.com' },
            })
            expect(result.success).toBe(true)
            expect(result.data).toBe('z')
        } finally {
            globalThis.fetch = oldFetch
        }
    })
})

describe('NanoAdapter', () => {
    const adapter = new NanoAdapter()

    it('has correct name and capabilities', () => {
        expect(adapter.name).toBe('nano')
        expect(adapter.capabilities).toEqual(['custom'])
    })

    it('delegates to sandbox (does not execute directly)', async () => {
        const result = await adapter.execute({
            capability: 'custom', action: 'process', payload: {},
        })
        expect(result.success).toBe(true)
        expect((result.data as any).status).toBe('DELEGATED_TO_SANDBOX')
    })
})

describe('WorkerThreadSandboxAdapter', () => {
    const adapter = new WorkerThreadSandboxAdapter()

    it('has worker_threads platform', () => {
        expect(adapter.platform).toBe('worker_threads')
    })

    it('blocks unrestricted network egress as CONTAINMENT_VIOLATION', async () => {
        const config: SandboxConfig = {
            ...bestEffortWorkerThreadConfig(),
            networkPolicy: { allowEgress: true, allowedHosts: [] },
        }
        const command: SandboxCommand = { taskId: 'net-test', command: 'curl' }

        const result = await adapter.execute(command, config)

        expect(result.status).toBe('CONTAINMENT_VIOLATION')
        expect(result.containmentViolations.length).toBeGreaterThan(0)
        expect(result.containmentViolations[0].type).toBe('NETWORK_EGRESS')
    })

    it('blocks write args when allowWrite=false', async () => {
        const config: SandboxConfig = {
            ...bestEffortWorkerThreadConfig(),
            filesystemPolicy: {
                allowRead: true, readPaths: [],
                allowWrite: false, writePaths: [],
                allowTempDir: true,
            },
        }
        const command: SandboxCommand = {
            taskId: 'write-test', command: 'node',
            args: ['script.js', '--write', 'out.txt'],
        }

        const result = await adapter.execute(command, config)

        expect(result.status).toBe('CONTAINMENT_VIOLATION')
        expect(result.containmentViolations.some(v => v.type === 'FILESYSTEM_BREACH')).toBe(true)
    })

    it('blocks empty command as UNAUTHORIZED_SYSCALL', async () => {
        const config = bestEffortWorkerThreadConfig()
        const command: SandboxCommand = { taskId: 'empty-test', command: '' }

        const result = await adapter.execute(command, config)

        expect(result.status).toBe('CONTAINMENT_VIOLATION')
        expect(result.containmentViolations.some(v => v.type === 'UNAUTHORIZED_SYSCALL')).toBe(true)
    })

    it('blocks workingDir when filesystem access is fully denied', async () => {
        const config: SandboxConfig = {
            ...bestEffortWorkerThreadConfig(),
            filesystemPolicy: {
                allowRead: false, readPaths: [],
                allowWrite: false, writePaths: [],
                allowTempDir: false,
            },
        }
        const command: SandboxCommand = {
            taskId: 'cwd-test', command: 'ls',
            workingDir: '/tmp/sensitive',
        }

        const result = await adapter.execute(command, config)

        expect(result.status).toBe('CONTAINMENT_VIOLATION')
        expect(result.containmentViolations.some(v => v.type === 'FILESYSTEM_BREACH')).toBe(true)
    })

    it('executes a valid echo command successfully', async () => {
        const config = bestEffortWorkerThreadConfig()
        const isWindows = process.platform === 'win32'
        const command: SandboxCommand = {
            taskId: 'echo-test',
            command: isWindows ? 'cmd' : 'echo',
            args: isWindows ? ['/c', 'echo', 'hello sandbox'] : ['hello sandbox'],
        }

        const result = await adapter.execute(command, config)

        expect(result.status).toBe('COMPLETED')
        expect(result.exitCode).toBe(0)
        expect(result.stdout).toContain('hello sandbox')
        expect(result.platform).toBe('worker_threads')
        expect(result.isolationAdmission.verdict).toBe('ADMITTED')
        expect(result.isolationAdmission.mode).toBe('BEST_EFFORT_EXPLICIT')
    })

    it('returns FAILED for non-existent command', async () => {
        const config = bestEffortWorkerThreadConfig()
        const command: SandboxCommand = {
            taskId: 'bad-cmd', command: 'nonexistent_binary_xyz_123',
        }

        const result = await adapter.execute(command, config)

        expect(['FAILED', 'TIMEOUT']).toContain(result.status)
        expect(result.exitCode).not.toBe(0)
    })

    describe('isolation guarantee profile (RFR-R5 / F9)', () => {
        it('declares a complete, all-false guarantee profile', () => {
            expect(isCompleteIsolationGuaranteeProfile(WORKER_THREAD_GUARANTEE_PROFILE)).toBe(true)
            expect(Object.isFrozen(WORKER_THREAD_GUARANTEE_PROFILE)).toBe(true)
            for (const dimension of ISOLATION_DIMENSIONS) {
                expect(WORKER_THREAD_GUARANTEE_PROFILE[dimension]).toBe(false)
            }
            expect(adapter.guaranteeProfile).toBe(WORKER_THREAD_GUARANTEE_PROFILE)
        })

        it('rejects the default SECURITY_BOUNDARY_REQUIRED config before any worker is created', async () => {
            const config = createDefaultSandboxConfig('worker_threads')
            const command: SandboxCommand = { taskId: 'default-security-test', command: 'echo' }

            const result = await adapter.execute(command, config)

            expect(result.status).toBe('CONTAINMENT_VIOLATION')
            expect(result.isolationAdmission.verdict).toBe('REJECTED')
            expect(result.isolationAdmission.reasonCode).toBe('UNSUPPORTED_DIMENSION')
            expect(result.isolationAdmission.unsupportedRequiredDimensions).toEqual(
                expect.arrayContaining([...ISOLATION_DIMENSIONS]),
            )
        })

        it.each(ISOLATION_DIMENSIONS)(
            'rejects a lone required dimension `%s` before any worker is created',
            async (dimension) => {
                const config: SandboxConfig = {
                    ...bestEffortWorkerThreadConfig(),
                    isolationRequirement: {
                        mode: 'SECURITY_BOUNDARY_REQUIRED',
                        requiredDimensions: [dimension],
                    },
                }
                const command: SandboxCommand = { taskId: `dim-${dimension}`, command: 'echo' }

                const result = await adapter.execute(command, config)

                expect(result.status).toBe('CONTAINMENT_VIOLATION')
                expect(result.isolationAdmission.verdict).toBe('REJECTED')
                expect(result.isolationAdmission.unsupportedRequiredDimensions).toEqual([dimension])
            },
        )

        it('rejects BEST_EFFORT_EXPLICIT with a non-empty requiredDimensions set as inconsistent', async () => {
            const config: SandboxConfig = {
                ...bestEffortWorkerThreadConfig(),
                isolationRequirement: {
                    mode: 'BEST_EFFORT_EXPLICIT',
                    requiredDimensions: ['filesystem'],
                },
            }
            const command: SandboxCommand = { taskId: 'inconsistent-best-effort', command: 'echo' }

            const result = await adapter.execute(command, config)

            expect(result.status).toBe('CONTAINMENT_VIOLATION')
            expect(result.isolationAdmission.verdict).toBe('REJECTED')
            expect(result.isolationAdmission.reasonCode).toBe('INCONSISTENT_BEST_EFFORT_REQUIREMENT')
        })

        it('admits explicit best-effort with empty required dimensions and marks the result non-security', async () => {
            const config = bestEffortWorkerThreadConfig()
            const command: SandboxCommand = { taskId: 'explicit-best-effort', command: 'echo' }

            const result = await adapter.execute(command, config)

            expect(result.isolationAdmission.verdict).toBe('ADMITTED')
            expect(result.isolationAdmission.mode).toBe('BEST_EFFORT_EXPLICIT')
            expect(result.isolationAdmission.detail).not.toMatch(/guarantee(d)? containment/i)
        })

        it('rejects unknown, duplicate, and missing-dimension requirements deterministically', async () => {
            const command: SandboxCommand = { taskId: 'malformed-dims', command: 'echo' }

            const unknown: SandboxConfig = {
                ...bestEffortWorkerThreadConfig(),
                isolationRequirement: {
                    mode: 'SECURITY_BOUNDARY_REQUIRED',
                    requiredDimensions: ['filesystem', 'not_a_real_dimension' as IsolationDimension],
                },
            }
            const unknownResult = await adapter.execute(command, unknown)
            expect(unknownResult.isolationAdmission.reasonCode).toBe('UNKNOWN_DIMENSION')

            const duplicate: SandboxConfig = {
                ...bestEffortWorkerThreadConfig(),
                isolationRequirement: {
                    mode: 'SECURITY_BOUNDARY_REQUIRED',
                    requiredDimensions: ['filesystem', 'filesystem'],
                },
            }
            const duplicateResult = await adapter.execute(command, duplicate)
            expect(duplicateResult.isolationAdmission.reasonCode).toBe('DUPLICATE_DIMENSION')

            const missing: SandboxConfig = {
                ...bestEffortWorkerThreadConfig(),
                isolationRequirement: {
                    mode: 'SECURITY_BOUNDARY_REQUIRED',
                    requiredDimensions: ['filesystem', 'network', 'process', 'environment', 'credential', 'ipc', 'persistence'],
                },
            }
            const missingResult = await adapter.execute(command, missing)
            expect(missingResult.isolationAdmission.verdict).toBe('REJECTED')
        })

        it('never calls into the worker for any rejected isolation admission', async () => {
            const rejectingCommand: SandboxCommand = {
                taskId: 'never-worker-test',
                command: 'this-must-never-run-if-rejected',
            }
            const config = createDefaultSandboxConfig('worker_threads')

            const result = await adapter.execute(rejectingCommand, config)

            // A real worker attempt to run a nonexistent binary would surface
            // FAILED/TIMEOUT with a nonzero exit; CONTAINMENT_VIOLATION with
            // exitCode -1 and empty stdout proves the worker path was never reached.
            expect(result.status).toBe('CONTAINMENT_VIOLATION')
            expect(result.exitCode).toBe(-1)
            expect(result.stdout).toBe('')
        })

        it('rejects a malformed (incomplete) executor guarantee profile', () => {
            const incompleteProfile = { filesystem: false } as unknown as IsolationGuaranteeProfile
            const admission = evaluateIsolationAdmission(
                { mode: 'BEST_EFFORT_EXPLICIT', requiredDimensions: [] },
                incompleteProfile,
            )
            expect(admission.verdict).toBe('REJECTED')
            expect(admission.reasonCode).toBe('MALFORMED_GUARANTEE_PROFILE')
            expect(admission.dimensions).toHaveLength(ISOLATION_DIMENSIONS.length)
        })

        it('fails closed without throwing for accessor, symbol-keyed, and revoked-proxy profiles', () => {
            const accessorProfile = Object.defineProperty(
                { ...WORKER_THREAD_GUARANTEE_PROFILE },
                'filesystem',
                { enumerable: true, get: () => { throw new Error('must not execute getter') } },
            ) as IsolationGuaranteeProfile
            const symbolProfile = {
                ...WORKER_THREAD_GUARANTEE_PROFILE,
                [Symbol('hidden')]: false,
            } as IsolationGuaranteeProfile
            const { proxy, revoke } = Proxy.revocable({ ...WORKER_THREAD_GUARANTEE_PROFILE }, {})
            revoke()

            for (const hostileProfile of [accessorProfile, symbolProfile, proxy as IsolationGuaranteeProfile]) {
                expect(() => evaluateIsolationAdmission(
                    { mode: 'BEST_EFFORT_EXPLICIT', requiredDimensions: [] },
                    hostileProfile,
                )).not.toThrow()
                const result = evaluateIsolationAdmission(
                    { mode: 'BEST_EFFORT_EXPLICIT', requiredDimensions: [] },
                    hostileProfile,
                )
                expect(result.reasonCode).toBe('MALFORMED_GUARANTEE_PROFILE')
                expect(result.dimensions).toHaveLength(ISOLATION_DIMENSIONS.length)
            }
        })

        it('fails closed without throwing for accessor-backed requirements', () => {
            const hostile = Object.defineProperty(
                { requiredDimensions: [] },
                'mode',
                { enumerable: true, get: () => { throw new Error('must not execute getter') } },
            ) as unknown as SandboxConfig['isolationRequirement']
            const result = evaluateIsolationAdmission(hostile, WORKER_THREAD_GUARANTEE_PROFILE)
            expect(result.reasonCode).toBe('MALFORMED_REQUIREMENT')
            expect(result.dimensions).toHaveLength(ISOLATION_DIMENSIONS.length)
        })

        it('rejects a config platform that does not match the adapter platform', async () => {
            const result = await adapter.execute(
                { taskId: 'platform-mismatch', command: 'this-must-not-run' },
                { ...bestEffortWorkerThreadConfig(), platform: 'docker' },
            )
            expect(result.isolationAdmission.verdict).toBe('REJECTED')
            expect(result.isolationAdmission.reasonCode).toBe('PLATFORM_MISMATCH')
            expect(result.exitCode).toBe(-1)
        })
    })

    describe('environment non-inheritance (RFR-R5 / F9)', () => {
        it('does not leak an ambient host environment variable into the child when command omits env', async () => {
            const sentinelName = 'CVF_RFR_R5_HOST_ENV_SENTINEL'
            const originalValue = process.env[sentinelName]
            process.env[sentinelName] = 'host-only-must-not-cross'
            try {
                const config = bestEffortWorkerThreadConfig()
                const isWindows = process.platform === 'win32'
                const command: SandboxCommand = {
                    taskId: 'env-sentinel-test',
                    command: isWindows ? 'cmd' : 'node',
                    args: isWindows
                        ? ['/c', `if defined ${sentinelName} (echo LEAKED) else (echo CLEAN)`]
                        : ['-e', `process.stdout.write(process.env.${sentinelName} ? 'LEAKED' : 'CLEAN')`],
                }

                const result = await adapter.execute(command, config)

                expect(result.status).toBe('COMPLETED')
                expect(result.stdout).toContain('CLEAN')
                expect(result.stdout).not.toContain('LEAKED')
            } finally {
                if (originalValue === undefined) {
                    delete process.env[sentinelName]
                } else {
                    process.env[sentinelName] = originalValue
                }
            }
        })

        it('passes only the explicitly supplied command env into the child', async () => {
            const config = bestEffortWorkerThreadConfig()
            const isWindows = process.platform === 'win32'
            const command: SandboxCommand = {
                taskId: 'env-explicit-test',
                command: isWindows ? 'cmd' : 'node',
                args: isWindows
                    ? ['/c', 'echo %CVF_EXPLICIT_VAR%']
                    : ['-e', 'process.stdout.write(process.env.CVF_EXPLICIT_VAR || "")'],
                env: { CVF_EXPLICIT_VAR: 'explicit-value-crossed' },
            }

            const result = await adapter.execute(command, config)

            expect(result.status).toBe('COMPLETED')
            expect(result.stdout).toContain('explicit-value-crossed')
        })
    })
})

describe('ReleaseEvidenceAdapter', () => {
    const adapter = new ReleaseEvidenceAdapter()

    it('has correct name and capabilities', () => {
        expect(adapter.name).toBe('release-evidence')
        expect(adapter.capabilities).toEqual(['filesystem', 'custom'])
    })

    it('emits remediation evidence in both json and markdown form', async () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cvf173-release-evidence-'))
        try {
            const artifactPath = path.join(root, 'receipts.json')
            const markdownLogPath = path.join(root, 'receipts.md')
            const result = await adapter.execute({
                capability: 'custom',
                action: 'emit_remediation_evidence',
                payload: {
                    artifactPath,
                    markdownLogPath,
                    receipts: [
                        {
                            receiptId: 'RESUMED:proposal-001:persist_resume_evidence',
                            action: 'RESUMED',
                            sourceProposalId: 'proposal-001',
                            step: 'persist_resume_evidence',
                            recordedAt: 1709802300000,
                        },
                        {
                            receiptId: 'INTERRUPTED:proposal-001:verify_checkpoint_integrity',
                            action: 'INTERRUPTED',
                            sourceProposalId: 'proposal-001',
                            step: 'verify_checkpoint_integrity',
                            recordedAt: 1709802301000,
                        },
                    ],
                },
            })

            expect(result.success).toBe(true)
            expect(fs.existsSync(artifactPath)).toBe(true)
            expect(fs.existsSync(markdownLogPath)).toBe(true)
            expect(fs.readFileSync(markdownLogPath, 'utf-8')).toContain('## Action Summary')
            expect(fs.readFileSync(markdownLogPath, 'utf-8')).toContain('- RESUMED: `1`')
            expect(fs.readFileSync(markdownLogPath, 'utf-8')).toContain('- INTERRUPTED: `1`')
        } finally {
            fs.rmSync(root, { recursive: true, force: true })
        }
    })

    it('fails closed for invalid remediation payload', async () => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'cvf173-release-evidence-invalid-'))
        try {
            const artifactPath = path.join(root, 'receipts.json')
            const markdownLogPath = path.join(root, 'receipts.md')
            const result = await adapter.execute({
                capability: 'custom',
                action: 'emit_remediation_evidence',
                payload: {
                    artifactPath,
                    markdownLogPath,
                    receipts: [{ invalid: true }],
                },
            })

            expect(result.success).toBe(false)
            expect(result.error).toContain('payload.receipts')
            expect(fs.existsSync(artifactPath)).toBe(false)
            expect(fs.existsSync(markdownLogPath)).toBe(false)
        } finally {
            fs.rmSync(root, { recursive: true, force: true })
        }
    })
})
