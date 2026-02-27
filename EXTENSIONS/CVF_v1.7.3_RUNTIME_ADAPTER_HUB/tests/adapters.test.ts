// tests/adapters.test.ts
// Runtime adapter behavior tests

import { describe, it, expect } from 'vitest'
import { OpenClawAdapter } from '../adapters/openclaw.adapter.js'
import { PicoClawAdapter } from '../adapters/picoclaw.adapter.js'
import { ZeroClawAdapter } from '../adapters/zeroclaw.adapter.js'
import { NanoAdapter } from '../adapters/nano.adapter.js'
import { executeFilesystemAction } from '../adapters/base.adapter.js'
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
