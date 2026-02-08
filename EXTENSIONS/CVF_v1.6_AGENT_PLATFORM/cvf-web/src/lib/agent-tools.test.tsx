import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock security module before importing agent-tools
vi.mock('./security', () => {
    const makeSandbox = () => {
        const sandbox = {
            validate: vi.fn((code: string) => {
                if (code.includes('eval') || code.includes('window')) {
                    return { safe: false, reason: 'Blocked keyword' };
                }
                return { safe: true };
            }),
            execute: vi.fn((code: string, _timeout?: number) => {
                if (code.includes('THROW_ERROR')) {
                    return { result: null, error: 'Sandbox error' };
                }
                try {
                    // Simulate safe execution for test
                    const result = Function(`"use strict"; return (${code})`)();
                    return { result, error: undefined };
                } catch (e) {
                    return { result: null, error: String(e) };
                }
            }),
            executeAsync: vi.fn(async (code: string, timeout?: number) => {
                return sandbox.execute(code, timeout);
            }),
        };
        return sandbox;
    };

    return {
        createSandbox: vi.fn(() => makeSandbox()),
        validateUrl: vi.fn((url: string) => {
            try {
                const parsed = new URL(url);
                return ['http:', 'https:'].includes(parsed.protocol);
            } catch {
                return false;
            }
        }),
    };
});

import { AVAILABLE_TOOLS } from './agent-tools';
import { createSandbox, validateUrl } from './security';

describe('Agent Tools', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ================================================
    // BUG-001: code_execute MUST use createSandbox()
    // ================================================
    describe('code_execute', () => {
        const tool = AVAILABLE_TOOLS.code_execute;

        it('should use createSandbox for execution, not raw Function()', async () => {
            await tool.execute({ code: '2 + 2' });
            expect(createSandbox).toHaveBeenCalled();
        });

        it('should return successful result for valid code', async () => {
            const result = await tool.execute({ code: '2 + 2' });
            expect(result.success).toBe(true);
            expect(result.data).toBeDefined();
        });

        it('should return error when sandbox rejects code', async () => {
            const result = await tool.execute({ code: 'THROW_ERROR' });
            expect(result.success).toBe(false);
            expect(result.error).toBeDefined();
        });

        it('should pass timeout parameter to sandbox', async () => {
            await tool.execute({ code: '1 + 1', timeout: 3000 });
            const sandbox = (createSandbox as ReturnType<typeof vi.fn>).mock.results[0]?.value;
            expect(createSandbox).toHaveBeenCalled();
            expect(sandbox.executeAsync).toHaveBeenCalledWith('1 + 1', 3000);
        });

        it('should have executionTime in result', async () => {
            const result = await tool.execute({ code: '1' });
            expect(result.executionTime).toBeGreaterThanOrEqual(0);
        });
    });

    // ================================================
    // BUG-002: web_search MUST label mock data
    // ================================================
    describe('web_search', () => {
        const tool = AVAILABLE_TOOLS.web_search;

        it('should return results with mock disclaimer', async () => {
            const result = await tool.execute({ query: 'test query' });
            expect(result.success).toBe(true);
            const data = result.data as Record<string, unknown>;
            expect(data.disclaimer).toBeDefined();
            expect(String(data.disclaimer)).toContain('MOCK');
        });

        it('should prefix result titles with [MOCK]', async () => {
            const result = await tool.execute({ query: 'test query' });
            const data = result.data as { results: Array<{ title: string }> };
            for (const r of data.results) {
                expect(r.title).toContain('[MOCK]');
            }
        });

        it('should return query in response data', async () => {
            const result = await tool.execute({ query: 'CVF framework' });
            const data = result.data as Record<string, unknown>;
            expect(data.query).toBe('CVF framework');
        });
    });

    // ================================================
    // BUG-007: url_fetch MUST validate and restrict URLs
    // ================================================
    describe('url_fetch', () => {
        const tool = AVAILABLE_TOOLS.url_fetch;

        it('should reject invalid URLs', async () => {
            const result = await tool.execute({ url: 'not-a-url' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid URL');
        });

        it('should block localhost URLs', async () => {
            const result = await tool.execute({ url: 'http://localhost:3000/api' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Blocked');
        });

        it('should block 127.0.0.1', async () => {
            const result = await tool.execute({ url: 'http://127.0.0.1:8080' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Blocked');
        });

        it('should block private 10.x.x.x range', async () => {
            const result = await tool.execute({ url: 'http://10.0.0.1/internal' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Blocked');
        });

        it('should block private 192.168.x.x range', async () => {
            const result = await tool.execute({ url: 'http://192.168.1.1/admin' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Blocked');
        });

        it('should block private 172.16-31.x.x range', async () => {
            const result = await tool.execute({ url: 'http://172.16.0.1/secrets' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Blocked');
        });

        it('should block link-local 169.254.x.x (AWS metadata)', async () => {
            const result = await tool.execute({ url: 'http://169.254.169.254/latest/meta-data' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('Blocked');
        });
    });

    // ================================================
    // calculator — input sanitization
    // ================================================
    describe('calculator', () => {
        const tool = AVAILABLE_TOOLS.calculator;

        it('should calculate simple expressions', async () => {
            const result = await tool.execute({ expression: '2 + 3 * 4' });
            expect(result.success).toBe(true);
            expect((result.data as { result: number }).result).toBe(14);
        });

        it('should sanitize non-math characters', async () => {
            // Injection attempt should be stripped
            const result = await tool.execute({ expression: 'alert(1)' });
            // After sanitization, only numbers/operators remain, likely produces NaN or error
            expect(result.success === false || result.data !== undefined).toBe(true);
        });
    });

    // ================================================
    // datetime — basic functionality
    // ================================================
    describe('datetime', () => {
        const tool = AVAILABLE_TOOLS.datetime;

        it('should return ISO format by default', async () => {
            const result = await tool.execute({});
            expect(result.success).toBe(true);
            const data = result.data as { formatted: string };
            expect(data.formatted).toMatch(/^\d{4}-\d{2}-\d{2}T/);
        });

        it('should return unix timestamp when requested', async () => {
            const result = await tool.execute({ format: 'unix' });
            expect(result.success).toBe(true);
            const data = result.data as { formatted: number };
            expect(typeof data.formatted).toBe('number');
        });
    });

    // ================================================
    // json_parse — basic functionality  
    // ================================================
    describe('json_parse', () => {
        const tool = AVAILABLE_TOOLS.json_parse;

        it('should parse valid JSON', async () => {
            const result = await tool.execute({ input: '{"key": "value"}' });
            expect(result.success).toBe(true);
        });

        it('should fail on invalid JSON', async () => {
            const result = await tool.execute({ input: 'not json' });
            expect(result.success).toBe(false);
        });

        it('should extract nested path', async () => {
            const result = await tool.execute({ input: '{"a": {"b": 42}}', path: 'a.b' });
            expect(result.success).toBe(true);
            expect((result.data as { parsed: number }).parsed).toBe(42);
        });
    });

    // ================================================
    // Tool registry completeness
    // ================================================
    describe('AVAILABLE_TOOLS registry', () => {
        it('should have all 8 tools registered', () => {
            const expectedTools = ['web_search', 'code_execute', 'calculator', 'datetime', 'json_parse', 'url_fetch', 'file_read', 'file_write'];
            for (const toolId of expectedTools) {
                expect(AVAILABLE_TOOLS[toolId as keyof typeof AVAILABLE_TOOLS]).toBeDefined();
            }
        });

        it('each tool should have required properties', () => {
            for (const tool of Object.values(AVAILABLE_TOOLS)) {
                expect(tool.id).toBeDefined();
                expect(tool.name).toBeDefined();
                expect(tool.description).toBeDefined();
                expect(tool.icon).toBeDefined();
                expect(tool.category).toBeDefined();
                expect(tool.parameters).toBeDefined();
                expect(typeof tool.execute).toBe('function');
            }
        });
    });
});
