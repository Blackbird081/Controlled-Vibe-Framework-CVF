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
import { executeFilesystemAction, executeHttpAction } from '../adapters/base.adapter.js'
import type { RuntimeRequest } from '../contracts/runtime.adapter.interface.js'

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
