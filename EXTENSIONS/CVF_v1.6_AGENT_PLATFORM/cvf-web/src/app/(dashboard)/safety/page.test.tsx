/**
 * @vitest-environment jsdom
 */
// Text Encoding Exception: the test checks the Vietnamese empty-state message.
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, render, screen, fireEvent, waitFor } from '@testing-library/react';
import SafetyPage from './page';

const updatePreferencesMock = vi.fn();
const executeToolMock = vi.fn();

let mockedSettings: Record<string, unknown>;
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
        stats: overrides.stats ?? null,
    };
}

function setupFetchMock(fetchMock: ReturnType<typeof vi.fn>, options?: {
    kernelTelemetry?: ReturnType<typeof makeKernelTelemetry> | { traces: []; riskHistory: []; stats: null };
    kernelOk?: boolean;
    proposals?: Array<Record<string, unknown>>;
    postResult?: Record<string, unknown>;
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

    it.each([
        ['en', 'No proposals to show yet', '0 proposals'],
        ['vi', 'Chưa có dữ liệu đề xuất để hiển thị', '0 đề xuất'],
    ] as const)('shows an honest empty proposal section in %s', async (language, empty, count) => {
        mockLanguage = language;
        setupFetchMock(fetchMock, { proposals: [] });
        render(<SafetyPage />);

        expect(screen.queryByText('Deploy auth system', { exact:true })).toBeNull();
        await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/openclaw'));
        expect(await screen.findByText(empty)).toBeTruthy();
        expect(screen.getByText(count)).toBeTruthy();
    });

    it('removes a previously visible proposal when the latest response is empty', async () => {
        setupFetchMock(fetchMock, { proposals: [{
            id:'p-existing', action:'Previously visible proposal', source:'api', riskLevel:'low', state:'approved', time:'now',
        }] });
        render(<SafetyPage />);
        expect(await screen.findByText('Previously visible proposal')).toBeTruthy();

        setupFetchMock(fetchMock, { proposals:[] });
        fireEvent.change(screen.getByPlaceholderText(/e\.g\. Deploy auth system/i), { target:{value:'Run a local safety check'} });
        fireEvent.click(screen.getByRole('button', { name:/Submit OpenClaw/i }));

        expect(await screen.findByText('No proposals to show yet')).toBeTruthy();
        expect(screen.queryByText('Previously visible proposal')).toBeNull();
    });

    it('ignores an older empty response after a newer proposal is shown', async () => {
        setupFetchMock(fetchMock, { proposals: [{
            id:'p-new', action:'Newest proposal', source:'api', riskLevel:'low', state:'approved', time:'now',
        }] });
        const respond = fetchMock.getMockImplementation()!;
        let releaseInitial!: () => void;
        const initial = new Promise<Response>(resolve => {
            releaseInitial = () => resolve(Response.json({proposals:[]}));
        });
        let initialGet = false;
        fetchMock.mockImplementation((url, init) => {
            if (url === '/api/openclaw' && !init?.method && !initialGet) {
                initialGet = true;
                return initial;
            }
            return respond(url, init);
        });
        render(<SafetyPage />);
        await waitFor(() => expect(initialGet).toBe(true));
        fireEvent.change(screen.getByPlaceholderText(/e\.g\. Deploy auth system/i), { target:{value:'Run a local safety check'} });
        fireEvent.click(screen.getByRole('button', { name:/Submit OpenClaw/i }));
        expect(await screen.findByText('Newest proposal')).toBeTruthy();
        await act(async () => releaseInitial());
        expect(screen.getByText('Newest proposal')).toBeTruthy();
    });

    it.each([
        ['en', 'No monitoring data to show yet'],
        ['vi', 'Chưa có dữ liệu giám sát để hiển thị'],
    ] as const)('uses an empty monitoring state with no assumed values in %s', async (language, empty) => {
        mockLanguage = language;
        setupFetchMock(fetchMock, { kernelTelemetry: { traces: [], riskHistory: [], stats: null } });
        render(<SafetyPage />);
        await waitFor(() => expect(fetchMock).toHaveBeenCalledWith('/api/kernel-telemetry'));
        expect(await screen.findByText(empty)).toBeTruthy();
        expect(screen.queryByText(/75\.0%|0\.45ms|Domain Lock|Policy Version|Tổng yêu cầu|Total Requests/)).toBeNull();
        expect(screen.queryByText(/v2 — Strict Mode|Domain Drift Warning/)).toBeNull();
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
        expect(screen.queryByText('85%')).toBeNull();
        expect(screen.getByText('AI configured')).toBeTruthy();
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

    it('renders received telemetry, with its trace details and risk history', async () => {
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

        render(<SafetyPage />);

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

        expect(screen.queryByText(/v2 — Strict Mode|Domain Drift Warning/)).toBeNull();
        expect(screen.queryByText('0ms')).toBeNull();
        expect(screen.getByText('P95: 280ms')).toBeTruthy();
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
        expect(await screen.findByText('Simulation')).toBeTruthy();
        expect(screen.queryByText('70%')).toBeNull();
    });
});
