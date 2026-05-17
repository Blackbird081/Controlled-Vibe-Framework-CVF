// tests/contracts.test.ts
// Compile-time contract compliance tests

import { describe, it, expect } from 'vitest'
import type {
    LLMAdapter,
    LLMRequest,
    LLMResponse,
    RuntimeAdapter,
    RuntimeRequest,
    RuntimeResult,
    ToolAdapter,
    ToolRequest,
    ToolResult,
    MemoryAdapter,
    PolicyContract,
    PolicyDecision,
} from '../contracts/index.js'

describe('Contract Definitions', () => {

    it('LLMAdapter contract is implementable', () => {
        const adapter: LLMAdapter = {
            name: 'test-llm',
            async generate(req: LLMRequest): Promise<LLMResponse> {
                return { content: `Response to: ${req.prompt}` }
            },
        }

        expect(adapter.name).toBe('test-llm')
        expect(typeof adapter.generate).toBe('function')
    })

    it('RuntimeAdapter contract is implementable', () => {
        const adapter: RuntimeAdapter = {
            name: 'test-runtime',
            capabilities: ['filesystem', 'http'],
            async execute(req: RuntimeRequest): Promise<RuntimeResult> {
                return { success: true, data: req.action }
            },
        }

        expect(adapter.name).toBe('test-runtime')
        expect(adapter.capabilities).toContain('filesystem')
    })

    it('ToolAdapter contract is implementable', () => {
        const adapter: ToolAdapter = {
            name: 'test-tool',
            tools: ['search', 'calculate'],
            async execute(req: ToolRequest): Promise<ToolResult> {
                return { success: true, data: req.toolName }
            },
        }

        expect(adapter.tools).toHaveLength(2)
    })

    it('MemoryAdapter contract is implementable', () => {
        const store = new Map<string, unknown>()
        const adapter: MemoryAdapter = {
            name: 'test-memory',
            async set(req) { store.set(req.key, req.value) },
            async get(req) { return (store.get(req.key) ?? null) as any },
            async delete(req) { store.delete(req.key) },
        }

        expect(adapter.name).toBe('test-memory')
    })

    it('PolicyContract is implementable', () => {
        const policy: PolicyContract = {
            name: 'test-policy',
            async evaluate(req) {
                return { decision: 'allow' as PolicyDecision }
            },
        }

        expect(policy.name).toBe('test-policy')
    })

    it('PolicyDecision includes pending for safe default', async () => {
        const policy: PolicyContract = {
            name: 'safe-default',
            async evaluate() {
                return { decision: 'pending' as PolicyDecision, reason: 'No matching rule' }
            },
        }

        const result = await policy.evaluate({ action: 'unknown' })
        expect(result.decision).toBe('pending')
    })

    it('RuntimeAdapter capabilities can include custom', () => {
        const adapter: RuntimeAdapter = {
            name: 'custom-runtime',
            capabilities: ['custom'],
            async execute() { return { success: true } },
        }

        expect(adapter.capabilities).toContain('custom')
    })
})
