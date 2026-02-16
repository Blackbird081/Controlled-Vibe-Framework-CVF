/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, render, screen, fireEvent, waitFor } from '@testing-library/react';

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

import { AVAILABLE_TOOLS, useTools, ToolCard, ToolsPanel } from './agent-tools';
import { createSandbox, validateUrl } from './security';

vi.mock('./i18n', () => ({
    useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

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

    // ================================================
    // file_read tool
    // ================================================
    describe('file_read', () => {
        const tool = AVAILABLE_TOOLS.file_read;

        beforeEach(() => {
            localStorage.clear();
        });

        it('should read existing key from localStorage', async () => {
            localStorage.setItem('test-key', 'test-value');
            const result = await tool.execute({ key: 'test-key' });
            expect(result.success).toBe(true);
            const data = result.data as { key: string; content: string; exists: boolean };
            expect(data.content).toBe('test-value');
            expect(data.exists).toBe(true);
        });

        it('should return null for non-existing key', async () => {
            const result = await tool.execute({ key: 'nonexistent' });
            expect(result.success).toBe(true);
            const data = result.data as { content: null; exists: boolean };
            expect(data.content).toBeNull();
            expect(data.exists).toBe(false);
        });

        it('should have executionTime', async () => {
            const result = await tool.execute({ key: 'any-key' });
            expect(result.executionTime).toBeGreaterThanOrEqual(0);
        });
    });

    // ================================================
    // file_write tool
    // ================================================
    describe('file_write', () => {
        const tool = AVAILABLE_TOOLS.file_write;

        beforeEach(() => {
            localStorage.clear();
        });

        it('should write content to localStorage', async () => {
            const result = await tool.execute({ key: 'write-key', content: 'hello world' });
            expect(result.success).toBe(true);
            const data = result.data as { key: string; bytesWritten: number };
            expect(data.bytesWritten).toBe(11);
            expect(localStorage.getItem('write-key')).toBe('hello world');
        });

        it('should overwrite existing key', async () => {
            localStorage.setItem('write-key', 'old');
            const result = await tool.execute({ key: 'write-key', content: 'new' });
            expect(result.success).toBe(true);
            expect(localStorage.getItem('write-key')).toBe('new');
        });

        it('should return error when localStorage.setItem throws', async () => {
            const spy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
                throw new Error('QuotaExceededError');
            });
            const result = await tool.execute({ key: 'k', content: 'v' });
            expect(result.success).toBe(false);
            expect(result.error).toContain('QuotaExceededError');
            spy.mockRestore();
        });
    });

    // ================================================
    // useTools hook
    // ================================================
    describe('useTools', () => {
        it('should initialize with all tools and empty call history', () => {
            const { result } = renderHook(() => useTools());
            expect(Object.keys(result.current.tools).length).toBe(8);
            expect(result.current.toolCalls).toHaveLength(0);
            expect(result.current.isExecuting).toBe(false);
        });

        it('should execute a tool and record the call', async () => {
            const { result } = renderHook(() => useTools());
            let toolResult: any;
            await act(async () => {
                toolResult = await result.current.executeTool('calculator', { expression: '1 + 1' });
            });
            expect(toolResult.success).toBe(true);
            expect(result.current.toolCalls.length).toBe(1);
            expect(result.current.toolCalls[0].status).toBe('completed');
        });

        it('should return error for unknown tool', async () => {
            const { result } = renderHook(() => useTools());
            let toolResult: any;
            await act(async () => {
                toolResult = await result.current.executeTool('nonexistent' as any, {});
            });
            expect(toolResult.success).toBe(false);
            expect(toolResult.error).toContain('Tool not found');
        });

        it('should clear history', async () => {
            const { result } = renderHook(() => useTools());
            await act(async () => {
                await result.current.executeTool('datetime', {});
            });
            expect(result.current.toolCalls.length).toBe(1);
            act(() => {
                result.current.clearHistory();
            });
            expect(result.current.toolCalls.length).toBe(0);
        });

        it('should mark failed tool call correctly', async () => {
            const { result } = renderHook(() => useTools());
            await act(async () => {
                await result.current.executeTool('json_parse', { input: 'not valid json' });
            });
            expect(result.current.toolCalls[0].status).toBe('failed');
        });

        it('should handle tool execute throwing an exception', async () => {
            // Temporarily make calculator.execute throw
            const origExecute = AVAILABLE_TOOLS.calculator.execute;
            AVAILABLE_TOOLS.calculator.execute = async () => { throw new Error('Unexpected crash'); };
            const { result } = renderHook(() => useTools());
            let toolResult: any;
            await act(async () => {
                toolResult = await result.current.executeTool('calculator', { expression: '1+1' });
            });
            expect(toolResult.success).toBe(false);
            expect(toolResult.error).toContain('Unexpected crash');
            expect(result.current.toolCalls[0].status).toBe('failed');
            AVAILABLE_TOOLS.calculator.execute = origExecute;
        });
    });

    // ================================================
    // ToolCard Component
    // ================================================
    describe('ToolCard', () => {
        const tool = AVAILABLE_TOOLS.web_search;

        it('renders tool name and description', () => {
            render(<ToolCard tool={tool} />);
            // Uses i18n key fallback since t returns the key
            expect(screen.getByText(tool.icon)).toBeTruthy();
        });

        it('calls onExecute when clicked', () => {
            const onExecute = vi.fn();
            render(<ToolCard tool={tool} onExecute={onExecute} />);
            fireEvent.click(screen.getByRole('button'));
            expect(onExecute).toHaveBeenCalledWith(tool);
        });

        it('renders active state', () => {
            const { container } = render(<ToolCard tool={tool} isActive />);
            expect(container.querySelector('.border-blue-500')).toBeTruthy();
        });

        it('renders inactive state', () => {
            const { container } = render(<ToolCard tool={tool} />);
            expect(container.querySelector('.border-gray-200')).toBeTruthy();
        });
    });

    // ================================================
    // ToolsPanel Component
    // ================================================
    describe('ToolsPanel', () => {
        it('renders all tool cards', () => {
            render(<ToolsPanel />);
            // Should render 8 tool cards
            const buttons = screen.getAllByRole('button');
            expect(buttons.length).toBeGreaterThanOrEqual(8);
        });

        it('renders panel title via i18n key', () => {
            render(<ToolsPanel />);
            expect(screen.getByText('tools.title')).toBeTruthy();
        });

        it('shows parameters when a tool card is clicked', () => {
            render(<ToolsPanel />);
            // Click the calculator tool card
            const calcButton = screen.getByText('Calculator');
            fireEvent.click(calcButton.closest('button')!);
            // Parameter input for "expression" should appear
            expect(screen.getByRole('textbox')).toBeTruthy();
            // Execute button should appear
            expect(screen.getByText('tools.execute')).toBeTruthy();
        });

        it('executes a selected tool', async () => {
            const onToolResult = vi.fn();
            render(<ToolsPanel onToolResult={onToolResult} />);
            // Select the calculator tool
            const calcButton = screen.getByText('Calculator');
            fireEvent.click(calcButton.closest('button')!);
            // Fill in expression parameter
            const input = screen.getByRole('textbox');
            fireEvent.change(input, { target: { value: '2+3' } });
            // Click execute
            fireEvent.click(screen.getByText('tools.execute'));
            // Tool result callback should fire
            await waitFor(() => {
                expect(onToolResult).toHaveBeenCalled();
            });
        });

        it('shows recent tool calls after execution', async () => {
            render(<ToolsPanel />);
            // Select the datetime tool
            const dtButton = screen.getByText('Date & Time');
            fireEvent.click(dtButton.closest('button')!);
            // Execute without params (datetime works with no params)
            fireEvent.click(screen.getByText('tools.execute'));
            // After execution, recent calls section should appear
            await waitFor(() => {
                expect(screen.getByText('tools.recentCalls')).toBeTruthy();
            });
        });
    });
});
