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
import { WorkerThreadSandboxAdapter } from '../adapters/worker.thread.sandbox.adapter.js'
import { createDefaultSandboxConfig } from '../adapters/sandbox.types.js'
import type { SandboxCommand, SandboxConfig } from '../adapters/sandbox.types.js'

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
            ...createDefaultSandboxConfig('worker_threads'),
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
            ...createDefaultSandboxConfig('worker_threads'),
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
        const config = createDefaultSandboxConfig('worker_threads')
        const command: SandboxCommand = { taskId: 'empty-test', command: '' }

        const result = await adapter.execute(command, config)

        expect(result.status).toBe('CONTAINMENT_VIOLATION')
        expect(result.containmentViolations.some(v => v.type === 'UNAUTHORIZED_SYSCALL')).toBe(true)
    })

    it('blocks workingDir when filesystem access is fully denied', async () => {
        const config: SandboxConfig = {
            ...createDefaultSandboxConfig('worker_threads'),
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
        const config = createDefaultSandboxConfig('worker_threads')
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
    })

    it('returns FAILED for non-existent command', async () => {
        const config = createDefaultSandboxConfig('worker_threads')
        const command: SandboxCommand = {
            taskId: 'bad-cmd', command: 'nonexistent_binary_xyz_123',
        }

        const result = await adapter.execute(command, config)

        expect(['FAILED', 'TIMEOUT']).toContain(result.status)
        expect(result.exitCode).not.toBe(0)
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
