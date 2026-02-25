/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SafetyPage from './page';

const updatePreferencesMock = vi.fn();
let mockedSettings: any;

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

vi.mock('@/components/Settings', () => ({
    useSettings: () => ({
        settings: mockedSettings,
        updatePreferences: updatePreferencesMock,
    }),
}));

describe('SafetyPage OpenClaw integration UI', () => {
    const fetchMock = vi.fn();

    beforeEach(() => {
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
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('loads and renders live proposals when OpenClaw is enabled', async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: vi.fn().mockResolvedValue({
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
            }),
        });

        render(<SafetyPage />);

        await waitFor(() => {
            expect(fetchMock).toHaveBeenCalledWith('/api/openclaw');
        });

        expect(await screen.findByText('Live deploy action')).toBeTruthy();
        expect(screen.getByText('1 proposals')).toBeTruthy();
    });

    it('submits OpenClaw request with active provider settings and shows latest result', async () => {
        fetchMock.mockImplementation(async (input: string, init?: RequestInit) => {
            if (input === '/api/openclaw' && init?.method === 'POST') {
                return {
                    ok: true,
                    json: async () => ({
                        response: '✅ Approved. Execution ID: exec-100',
                        decision: { status: 'approved' },
                        proposal: {
                            action: 'deploy_auth_system',
                            confidence: 0.85,
                            riskLevel: 'low',
                        },
                        mode: 'real',
                        guard: {},
                    }),
                };
            }

            return {
                ok: true,
                json: async () => ({
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
                }),
            };
        });

        render(<SafetyPage />);

        const input = await screen.findByPlaceholderText(/e\.g\. Deploy auth system/i);
        fireEvent.change(input, { target: { value: 'Deploy auth system now' } });
        fireEvent.click(screen.getByRole('button', { name: /send/i }));

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
});
