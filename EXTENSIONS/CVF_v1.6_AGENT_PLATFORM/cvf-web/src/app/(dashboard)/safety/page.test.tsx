/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SafetyPage from './page';

const updatePreferencesMock = vi.fn();
const executeToolMock = vi.fn();

let mockedSettings: any;
let mockLanguage: 'en' | 'vi' = 'en';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: mockLanguage, t: (key: string) => key }),
}));

vi.mock('@/components/Settings', () => ({
    useSettings: () => ({
        settings: mockedSettings,
        updatePreferences: updatePreferencesMock,
    }),
}));

vi.mock('@/lib/agent-tools', () => ({
    AVAILABLE_TOOLS: [],
    useTools: () => ({
        executeTool: executeToolMock,
        isExecuting: false,
    }),
}));

type TelemetryInput = {
    traces?: Array<{
        requestId: string;
        domain: string;
        riskLevel: string;
        decisionCode: string;
        traceHash: string;
        policyVersion: string;
        timestamp: number;
        action?: string;
        latencyMs?: number;
    }>;
    riskHistory?: Array<{ level: string; timestamp: number; score: number }>;
    stats?: {
        totalRequests?: number;
        refusalCount?: number;
        avgLatencyMs?: number;
        p95LatencyMs?: number;
        domainLockActive?: boolean;
        currentRiskLevel?: string;
        policyVersion?: string;
    };
};

function makeKernelTelemetry(overrides: TelemetryInput = {}) {
    return {
        traces: overrides.traces ?? [],
        riskHistory: overrides.riskHistory ?? [],
        stats: {
            totalRequests: overrides.stats?.totalRequests ?? 0,
            refusalCount: overrides.stats?.refusalCount ?? 0,
            avgLatencyMs: overrides.stats?.avgLatencyMs ?? 0,
            p95LatencyMs: overrides.stats?.p95LatencyMs ?? 0,
            domainLockActive: overrides.stats?.domainLockActive ?? true,
            currentRiskLevel: overrides.stats?.currentRiskLevel ?? 'R0',
            policyVersion: overrides.stats?.policyVersion ?? 'cvf-1.7.1',
        },
    };
}

function setupFetchMock(fetchMock: ReturnType<typeof vi.fn>, options?: {
    kernelTelemetry?: ReturnType<typeof makeKernelTelemetry>;
    kernelOk?: boolean;
    proposals?: any[];
    postResult?: any;
}) {
    const kernelTelemetry = options?.kernelTelemetry ?? makeKernelTelemetry();
    const kernelOk = options?.kernelOk ?? true;
    const proposals = options?.proposals ?? [];
    const postResult = options?.postResult ?? {
        response: '✅ Approved. Execution ID: exec-100',
        decision: { status: 'approved' },
        proposal: {
            action: 'deploy_auth_system',
            confidence: 0.85,
            riskLevel: 'low',
        },
        mode: 'real',
        guard: {},
    };

    fetchMock.mockImplementation(async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = typeof input === 'string'
            ? input
            : (input instanceof URL
                ? input.toString()
                : ((input as Request).url ?? input.toString()));

        if (url.endsWith('/api/kernel-telemetry')) {
            return {
                ok: kernelOk,
                json: async () => kernelTelemetry,
            };
        }

        if (url.endsWith('/api/openclaw') && init?.method === 'POST') {
            return {
                ok: true,
                json: async () => postResult,
            };
        }

        if (url.endsWith('/api/openclaw')) {
            return {
                ok: true,
                json: async () => ({ proposals }),
            };
        }

        return {
            ok: false,
            json: async () => ({}),
        };
    });
}

describe('SafetyPage OpenClaw integration UI', () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
        mockLanguage = 'en';
        mockedSettings = {
            preferences: {
                openClawEnabled: true,
                openClawMode: 'proposal-only',
            },
            providers: {
                gemini: {
                    enabled: true,
                    apiKey: 'gemini-key',
                    selectedModel: 'gemini-2.5-flash',
                },
                openai: {
                    enabled: true,
                    apiKey: '',
                    selectedModel: 'gpt-4o',
                },
                anthropic: {
                    enabled: false,
                    apiKey: '',
                    selectedModel: 'claude-sonnet-4-20250514',
                },
            },
        };

        updatePreferencesMock.mockReset();
        executeToolMock.mockReset();
        executeToolMock.mockResolvedValue({ success: true, data: { summary: '0 required', checklist: [] } });
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('loads and renders live proposals when OpenClaw is enabled', async () => {
        setupFetchMock(fetchMock, {
            proposals: [
                {
                    id: 'p-live-1',
                    action: 'Live deploy action',
                    source: 'openclaw',
                    riskLevel: 'medium',
                    state: 'pending',
                    time: 'just now',
                },
            ],
        });

        render(<SafetyPage />);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/api/openclaw');
        });

        expect(await screen.findByText('Live deploy action')).toBeTruthy();
        expect(screen.getByText('1 proposals')).toBeTruthy();
    });

    it('submits OpenClaw request with active provider settings and shows latest result', async () => {
        setupFetchMock(fetchMock, {
            proposals: [
                {
                    id: 'p-after-1',
                    action: 'deploy_auth_system',
                    source: 'openclaw',
                    riskLevel: 'low',
                    state: 'approved',
                    time: 'now',
                },
            ],
        });

        render(<SafetyPage />);

        const input = await screen.findByPlaceholderText(/e\.g\. Deploy auth system/i);
        fireEvent.change(input, { target: { value: 'Deploy auth system now' } });
        fireEvent.click(screen.getByRole('button', { name: /Submit OpenClaw/i }));

        await waitFor(() => {
            const postCall = fetchMock.mock.calls.find(([, options]) => options?.method === 'POST');
            expect(postCall).toBeTruthy();
        });

        const postCall = fetchMock.mock.calls.find(([, options]) => options?.method === 'POST');
        const [, postOptions] = postCall!;
        const payload = JSON.parse(postOptions.body as string);

        expect(payload.message).toBe('Deploy auth system now');
        expect(payload.provider).toBe('gemini');
        expect(payload.apiKey).toBe('gemini-key');
        expect(payload.model).toBe('gemini-2.5-flash');

        expect(await screen.findByText(/Approved\. Execution ID: exec-100/i)).toBeTruthy();
        expect(screen.getAllByText('deploy_auth_system').length).toBeGreaterThan(0);
        expect(screen.getByText('85%')).toBeTruthy();
        expect(screen.getByText('🤖 AI')).toBeTruthy();
    });

    it('changes OpenClaw mode when mode selector updates', async () => {
        setupFetchMock(fetchMock, {
            proposals: [
                {
                    id: 'p-mode-1',
                    action: 'Mode switch action',
                    source: 'openclaw',
                    riskLevel: 'low',
                    state: 'pending',
                    time: 'now',
                },
            ],
        });

        render(<SafetyPage />);

        const modeSelect = await screen.findByRole('combobox');
        fireEvent.change(modeSelect, { target: { value: 'full' } });

        expect(updatePreferencesMock).toHaveBeenCalledWith({
            openClawEnabled: true,
            openClawMode: 'full',
        });
    });

    it('renders kernel telemetry widgets and interactive controls', async () => {
        setupFetchMock(fetchMock, {
            kernelTelemetry: makeKernelTelemetry({
                traces: [
                    {
                        requestId: 'req-001',
                        domain: 'code',
                        riskLevel: 'R3',
                        decisionCode: 'REFUSAL_APPROVAL',
                        traceHash: 'trace-hash-001',
                        policyVersion: 'v1',
                        timestamp: Date.now(),
                        action: 'Deploy worker',
                        latencyMs: 123,
                    },
                ],
                riskHistory: [
                    { level: 'R1', timestamp: Date.now() - 1000, score: 0.25 },
                    { level: 'R2', timestamp: Date.now() - 500, score: 0.55 },
                    { level: 'R3', timestamp: Date.now(), score: 0.8 },
                ],
                stats: {
                    totalRequests: 20,
                    refusalCount: 4,
                    avgLatencyMs: 120,
                    p95LatencyMs: 280,
                    domainLockActive: false,
                    currentRiskLevel: 'R3',
                    policyVersion: 'v1',
                },
            }),
            proposals: [
                {
                    id: 'p-kernel-1',
                    action: 'Kernel route',
                    source: 'openclaw',
                    riskLevel: 'high',
                    state: 'pending',
                    time: 'now',
                },
            ],
        });

        const { container } = render(<SafetyPage />);

        await waitFor(() => {
            const hasKernelCall = fetchMock.mock.calls.some(([input]) => {
                const url = typeof input === 'string' ? input : ((input as Request).url ?? String(input));
                return url.includes('kernel-telemetry');
            });
            expect(hasKernelCall).toBe(true);
        });
        expect(await screen.findByText(/Kernel Runtime Health/i, {}, { timeout: 5000 })).toBeTruthy();
        expect(screen.getByText('Deploy worker')).toBeTruthy();

        fireEvent.click(screen.getByText('Deploy worker'));
        expect(await screen.findByText('trace-hash-001')).toBeTruthy();

        fireEvent.click(screen.getByText(/v2 — Strict Mode/i));
        expect(await screen.findByText(/Saving\.\.\./i)).toBeTruthy();

        const creativeToggle = container.querySelector('button.relative.w-14.h-7') as HTMLButtonElement | null;
        expect(creativeToggle).toBeTruthy();
        fireEvent.click(creativeToggle!);

        expect(await screen.findByText(/Domain Drift Warning!/i)).toBeTruthy();
        expect(screen.getByText(/Samples: 3/i)).toBeTruthy();
    });

    it('supports vietnamese mode, toggle and governance checker action', async () => {
        mockLanguage = 'vi';
        mockedSettings = {
            ...mockedSettings,
            preferences: {
                openClawEnabled: false,
                openClawMode: 'disabled',
            },
        };

        executeToolMock.mockResolvedValueOnce({
            success: true,
            data: {
                summary: '1 required',
                checklist: [
                    { rule: 'Update test log', hint: 'Add coverage result', required: true },
                    { rule: 'Link issue', hint: 'Attach BUG ID', required: false },
                ],
            },
        });

        setupFetchMock(fetchMock, {
            kernelOk: false,
            proposals: [],
        });

        const { container } = render(<SafetyPage />);

        expect(await screen.findByText('Bảng Điều Khiển An Toàn AI')).toBeTruthy();
        expect(screen.getByText(/OpenClaw: TẮT/)).toBeTruthy();
        expect(screen.queryByPlaceholderText(/Ví dụ: Deploy auth system/i)).toBeNull();

        const toggleButton = container.querySelector('button.w-14.h-7') as HTMLButtonElement | null;
        expect(toggleButton).toBeTruthy();
        fireEvent.click(toggleButton!);

        expect(updatePreferencesMock).toHaveBeenCalledWith({
            openClawEnabled: true,
            openClawMode: 'proposal-only',
        });

        fireEvent.click(screen.getByText(/Chạy Test/i));
        const contextInput = screen.getByPlaceholderText(/Mô tả ngữ cảnh \(tùy chọn\)\.\.\./i);
        fireEvent.change(contextInput, { target: { value: 'test docs update' } });
        fireEvent.click(screen.getByRole('button', { name: /Kiểm tra Governance/i }));

        await waitFor(() => {
            expect(executeToolMock).toHaveBeenCalledWith('governance_check', {
                action: 'test_run',
                context: 'test docs update',
            });
        });

        expect(await screen.findByText('Update test log')).toBeTruthy();
        expect(screen.getByText('Link issue')).toBeTruthy();
    });

    it('submits request without provider when no active provider has api key', async () => {
        mockedSettings = {
            ...mockedSettings,
            providers: {
                gemini: { enabled: true, apiKey: '', selectedModel: 'gemini-2.5-flash' },
                openai: { enabled: true, apiKey: '', selectedModel: 'gpt-4o' },
                anthropic: { enabled: false, apiKey: '', selectedModel: 'claude-sonnet-4-20250514' },
            },
        };

        setupFetchMock(fetchMock, {
            proposals: [
                {
                    id: 'p-no-provider',
                    action: 'fallback_action',
                    source: 'openclaw',
                    riskLevel: 'low',
                    state: 'pending',
                    time: 'now',
                },
            ],
            postResult: {
                response: '✅ Approved. Execution ID: exec-200',
                decision: { status: 'approved' },
                proposal: {
                    action: 'fallback_action',
                    confidence: 0.7,
                    riskLevel: 'low',
                },
                mode: 'mock',
                guard: {},
            },
        });

        render(<SafetyPage />);

        const input = await screen.findByPlaceholderText(/e\.g\. Deploy auth system/i);
        fireEvent.change(input, { target: { value: 'Run fallback flow' } });
        fireEvent.click(screen.getByRole('button', { name: /Submit OpenClaw/i }));

        await waitFor(() => {
            const postCall = fetchMock.mock.calls.find(([, options]) => options?.method === 'POST');
            expect(postCall).toBeTruthy();
        });

        const postCall = fetchMock.mock.calls.find(([, options]) => options?.method === 'POST');
        const [, postOptions] = postCall!;
        const payload = JSON.parse(postOptions.body as string);

        expect(payload.message).toBe('Run fallback flow');
        expect(payload.provider).toBeUndefined();
        expect(payload.apiKey).toBeUndefined();
        expect(payload.model).toBeUndefined();
        expect(await screen.findByText('📋 Mock')).toBeTruthy();
    });
});
