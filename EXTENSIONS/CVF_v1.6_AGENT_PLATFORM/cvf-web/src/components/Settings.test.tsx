/**
 * @vitest-environment jsdom
 */
// Text Encoding Exception: bilingual Vietnamese/English UI copy for the governed-route provider note (operator language).
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useEffect } from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SettingsPage, SettingsButton, useSettings, migrateSettingsForGovernedRoute, type SettingsData } from './Settings';

/** Runs a callback once from an effect, right after the hook's own load effect of the same component. */
function useEffectOnce(run: () => void) { useEffect(() => { run(); // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); }

const mockLanguage = vi.hoisted(() => ({ value: 'vi' as 'vi' | 'en' }));
vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: mockLanguage.value, t: (key: string) => key }),
}));

function renderSettingsPage() {
    return render(<SettingsPage />);
}

describe('SettingsPage', () => {
    beforeEach(() => {
        localStorage.removeItem('cvf_settings');
        localStorage.removeItem('cvf_integrations');
        vi.unstubAllGlobals();
    });

    it('renders providers tab and updates api key', async () => {
        renderSettingsPage();

        await waitFor(() => expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy());
        const apiInput = screen.getByPlaceholderText(/OpenAI API Key/i);
        fireEvent.change(apiInput, { target: { value: 'abc' } });

        // Edits are a draft until "Lưu cài đặt" (operator request 2026-11-16).
        expect(screen.getByTestId('settings-save-status').textContent).toContain('Có thay đổi chưa lưu');
        expect(localStorage.getItem('cvf_settings') || '').not.toContain('"apiKey":"abc"');
        fireEvent.click(screen.getByRole('button', { name: 'Lưu cài đặt' }));
        expect(localStorage.getItem('cvf_settings') || '').toContain('"apiKey":"abc"');
        expect(screen.getByTestId('settings-save-status').textContent).toContain('Đã lưu lúc');
        expect((screen.getByRole('button', { name: 'Lưu cài đặt' }) as HTMLButtonElement).disabled).toBe(true);
    });

    it('discards an unsaved draft and asks before closing with unsaved changes', async () => {
        const onClose = vi.fn();
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
        render(<SettingsPage onClose={onClose} />);
        await waitFor(() => expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy());
        const apiInput = screen.getByPlaceholderText(/OpenAI API Key/i) as HTMLInputElement;
        fireEvent.change(apiInput, { target: { value: 'draft-key' } });
        expect(apiInput.value).toBe('draft-key');
        const closeButton = screen.getAllByRole('button').find(button => button.querySelector('svg path[d="M6 18L18 6M6 6l12 12"]'))!;
        fireEvent.click(closeButton);
        expect(confirmSpy).toHaveBeenCalledTimes(1);
        expect(onClose).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Hủy thay đổi' }));
        expect(apiInput.value).toBe('');
        expect(screen.getByTestId('settings-save-status').textContent).toContain('Không có thay đổi chưa lưu');
        expect(localStorage.getItem('cvf_settings') || '').not.toContain('draft-key');
        fireEvent.click(closeButton);
        expect(confirmSpy).toHaveBeenCalledTimes(1);
        expect(onClose).toHaveBeenCalledTimes(1);
        confirmSpy.mockRestore();
    });

    it('toggles provider enablement', async () => {
        renderSettingsPage();
        await waitFor(() => expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy());

        const toggle = screen.getAllByText(/Bật|Tắt/i)[0];
        const previous = toggle.textContent;
        fireEvent.click(toggle);
        expect(toggle.textContent).not.toBe(previous);
    });

    it('updates preferences and resets settings', async () => {
        renderSettingsPage();
        await waitFor(() => expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy());

        fireEvent.click(screen.getByText('🎨 Preferences'));
        const autoSaveLabel = screen.getByText('Tự động lưu history').closest('label');
        const autoSaveButton = autoSaveLabel?.querySelector('button');
        if (autoSaveButton) {
            fireEvent.click(autoSaveButton);
        }

        fireEvent.click(screen.getByText('💾 Data'));
        fireEvent.click(screen.getByRole('button', { name: /Reset tất cả/i }));

        expect(localStorage.getItem('cvf_settings')).toBeNull();
    });

    it('renders integrations tab and saves a Supabase runtime store', async () => {
        vi.stubGlobal('fetch', vi.fn(async () => Response.json({
            ok: true,
            status: 'connected',
            latencyMs: 12,
        })));

        renderSettingsPage();
        await waitFor(() => expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy());

        expect(screen.getByText('🔗 Integrations')).toBeTruthy();
        fireEvent.click(screen.getByText('🔗 Integrations'));
        fireEvent.click(screen.getByRole('button', { name: /Supabase/i }));

        fireEvent.change(screen.getByLabelText(/Project URL/i), {
            target: { value: 'https://example.supabase.co' },
        });
        fireEvent.change(screen.getByLabelText(/Anon Key/i), {
            target: { value: 'anon-key' },
        });
        fireEvent.click(screen.getByRole('button', { name: /Test Connection/i }));

        await waitFor(() => expect(screen.getByText(/Đã kết nối/i)).toBeTruthy());
        fireEvent.click(screen.getByRole('button', { name: /^Lưu$/i }));

        expect(localStorage.getItem('cvf_integrations')).toContain('supabase');
    });

    it('exports and imports settings', async () => {
        const createObjectURLMock = vi.fn(() => 'blob:mock');
        const revokeObjectURLMock = vi.fn();
        (URL as unknown as { createObjectURL: typeof createObjectURLMock }).createObjectURL = createObjectURLMock;
        (URL as unknown as { revokeObjectURL: typeof revokeObjectURLMock }).revokeObjectURL = revokeObjectURLMock;

        const clickMock = vi.fn();
        const originalCreate = document.createElement.bind(document);
        const createSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
            if (tagName === 'a') {
                return {
                    click: clickMock,
                    set href(_value: string) { },
                    set download(_value: string) { },
                } as unknown as HTMLAnchorElement;
            }
            return originalCreate(tagName);
        });

        renderSettingsPage();
        await waitFor(() => expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy());
        fireEvent.click(screen.getByText('💾 Data'));

        fireEvent.click(screen.getByText(/Xuất Settings/i));
        expect(createObjectURLMock).toHaveBeenCalled();
        expect(clickMock).toHaveBeenCalled();
        expect(revokeObjectURLMock).toHaveBeenCalled();

        const fileInput = screen.getByLabelText(/Nhập Settings/i) as HTMLInputElement;
        const file = new File([JSON.stringify({ preferences: { defaultProvider: 'openai' } })], 'settings.json', {
            type: 'application/json',
        });

        class MockFileReader {
            onload: null | ((e: { target: { result: string } }) => void) = null;
            readAsText(file: File) {
                void file;
                if (this.onload) {
                    this.onload({ target: { result: JSON.stringify({ preferences: { defaultProvider: 'openai' } }) } });
                }
            }
        }
        vi.stubGlobal('FileReader', MockFileReader as unknown as typeof FileReader);

        fireEvent.change(fileInput, { target: { files: [file] } });
        expect(localStorage.getItem('cvf_settings') || '').toContain('openai');

        createSpy.mockRestore();
    });

    it('shows and hides API key and clears it', async () => {
        renderSettingsPage();
        await waitFor(() => expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy());

        const apiInput = screen.getByPlaceholderText(/OpenAI API Key/i) as HTMLInputElement;
        fireEvent.change(apiInput, { target: { value: 'secret' } });
        expect(apiInput.value).toBe('secret');

        const showButton = screen.getByRole('button', { name: /Show|Hide|Hiện|Ẩn/i });
        fireEvent.click(showButton);
        expect(apiInput.getAttribute('type')).toBe('text');

        fireEvent.click(showButton);
        expect(apiInput.getAttribute('type')).toBe('password');

        const clearButton = screen.getByTitle('Clear API Key');
        fireEvent.click(clearButton);
        expect(apiInput.value).toBe('');
    });

    it('updates preferences toggles and switches model', async () => {
        renderSettingsPage();
        await waitFor(() => expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy());

        const modelSelect = screen.getByRole('combobox') as HTMLSelectElement;
        expect(modelSelect.value).toBe('gpt-4o-mini');
        fireEvent.change(modelSelect, { target: { value: 'gpt-4o' } });
        expect(modelSelect.value).toBe('gpt-4o');

        fireEvent.click(screen.getByText('🎨 Preferences'));

        const analyticsLabel = screen.getByText('Bật analytics (local-only)').closest('label');
        const analyticsButton = analyticsLabel?.querySelector('button');
        if (analyticsButton) {
            fireEvent.click(analyticsButton);
        }

        const tourLabel = screen.getByText('Hiện welcome tour').closest('label');
        const tourButton = tourLabel?.querySelector('button');
        if (tourButton) {
            fireEvent.click(tourButton);
        }

        fireEvent.click(screen.getByRole('button', { name: 'Lưu cài đặt' }));
        const saved = localStorage.getItem('cvf_settings') || '';
        expect(saved).toContain('"selectedModel":"gpt-4o"');
        expect(saved).toContain('analyticsEnabled');
        expect(saved).toContain('showWelcomeTour');
    });

    it('defaults a fresh user to OpenAI gpt-4o-mini and offers no reasoning models', async () => {
        renderSettingsPage();
        await waitFor(() => expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy());

        const modelSelect = screen.getByRole('combobox') as HTMLSelectElement;
        expect(modelSelect.value).toBe('gpt-4o-mini');
        const offered = Array.from(modelSelect.options).map(option => option.value);
        expect(offered).toEqual(['gpt-6-luna', 'gpt-6.1-terra', 'gpt-4o-mini', 'gpt-4o']);
        expect(offered).not.toContain('o1');

        fireEvent.click(screen.getByText('🎨 Preferences'));
        const defaultSelect = screen.getByText('Provider mặc định').parentElement!.querySelector('select') as HTMLSelectElement;
        expect(defaultSelect.value).toBe('openai');
        expect(screen.queryByRole('alert')).toBeNull();
    });

    it('marks providers the governed route cannot run as unavailable, and explains a saved choice that stays unsupported', async () => {
        // Claude is valid only on the native subscription lane, which this render has no server report for.
        localStorage.setItem('cvf_settings', JSON.stringify({ preferences: { defaultProvider: 'anthropic' } }));
        renderSettingsPage();
        await waitFor(() => expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy());
        fireEvent.click(screen.getByText('🎨 Preferences'));

        const defaultSelect = screen.getByText('Provider mặc định').parentElement!.querySelector('select') as HTMLSelectElement;
        const optionFor = (value: string) => Array.from(defaultSelect.options).find(option => option.value === value)!;
        for (const unsupported of ['gemini', 'openrouter', 'deepseek', 'anthropic']) {
            expect(optionFor(unsupported).disabled).toBe(true);
            expect(optionFor(unsupported).textContent).toContain('Chưa hỗ trợ trên đường kiểm soát / Not supported on the governed route');
        }
        for (const supported of ['openai', 'alibaba']) expect(optionFor(supported).disabled).toBe(false);
        // The saved native-lane choice is not crashed on or rewritten; it is explained instead.
        expect(defaultSelect.value).toBe('anthropic');
        expect(screen.getByRole('alert').textContent).toContain('Chưa hỗ trợ trên đường kiểm soát');
    });

    it('migrates saved unsupported providers and a retired OpenAI model to the governed defaults, persisted and idempotent', async () => {
        const saved = {
            providers: { openai: { apiKey: '', enabled: true, selectedModel: 'o1' } },
            preferences: {
                defaultProvider: 'gemini',
                agentProviders: { orchestrator: 'deepseek', architect: 'openrouter', builder: 'alibaba', reviewer: 'gemini' },
            },
        };
        localStorage.setItem('cvf_settings', JSON.stringify(saved));
        renderSettingsPage();
        await waitFor(() => expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy());

        const persisted = JSON.parse(localStorage.getItem('cvf_settings') || '{}');
        expect(persisted.preferences.defaultProvider).toBe('openai');
        expect(persisted.preferences.agentProviders).toEqual({ orchestrator: 'openai', architect: 'openai', builder: 'alibaba', reviewer: 'openai' });
        expect(persisted.providers.openai.selectedModel).toBe('gpt-4o-mini');
        // The page itself runs on the migrated values, so execute reads openai / gpt-4o-mini.
        expect((screen.getByRole('combobox') as HTMLSelectElement).value).toBe('gpt-4o-mini');
        fireEvent.click(screen.getByText('🎨 Preferences'));
        const defaultSelect = screen.getByText('Provider mặc định').parentElement!.querySelector('select') as HTMLSelectElement;
        expect(defaultSelect.value).toBe('openai');
        expect(screen.queryByRole('alert')).toBeNull();

        const { migrateSettingsForGovernedRoute } = await import('./Settings');
        const again = migrateSettingsForGovernedRoute(persisted);
        expect(again.changed).toBe(false);
        expect(again.settings).toEqual(persisted);
    });

    it('keeps valid saved providers and models untouched, and migrates partial imports safely', async () => {
        const { migrateSettingsForGovernedRoute } = await import('./Settings');
        const untouched = { providers: { openai: { apiKey: 'k', enabled: true, selectedModel: 'gpt-4o' } }, preferences: { defaultProvider: 'alibaba', agentProviders: { orchestrator: 'alibaba', architect: 'openai', builder: 'anthropic', reviewer: 'openai' } } };
        expect(migrateSettingsForGovernedRoute(untouched as never).changed).toBe(false);
        const partial = migrateSettingsForGovernedRoute({ preferences: { defaultProvider: 'gemini' } } as never);
        expect(partial.changed).toBe(true);
        expect(partial.settings.preferences.defaultProvider).toBe('openai');
    });

    it('does not reset when confirmation is cancelled', async () => {
        localStorage.setItem('cvf_settings', JSON.stringify({ preferences: { defaultProvider: 'openai' } }));
        const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);

        renderSettingsPage();
        await waitFor(() => expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy());
        fireEvent.click(screen.getByText('💾 Data'));
        fireEvent.click(screen.getByRole('button', { name: /Reset tất cả/i }));

        expect(localStorage.getItem('cvf_settings')).toContain('openai');
        confirmSpy.mockRestore();
    });

    it('handles invalid stored settings and import errors', async () => {
        localStorage.setItem('cvf_settings', 'not-json');
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        renderSettingsPage();
        await waitFor(() => expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy());
        fireEvent.click(screen.getByText('💾 Data'));

        const fileInput = screen.getByLabelText(/Nhập Settings/i) as HTMLInputElement;
        const file = new File(['bad-json'], 'settings.json', { type: 'application/json' });

        class MockFileReader {
            onload: null | ((e: { target: { result: string } }) => void) = null;
            readAsText(file: File) {
                void file;
                if (this.onload) {
                    this.onload({ target: { result: 'bad-json' } });
                }
            }
        }
        vi.stubGlobal('FileReader', MockFileReader as unknown as typeof FileReader);

        fireEvent.change(fileInput, { target: { files: [file] } });
        expect(consoleSpy).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it('migrates defaultExportMode to governance on first load with existing settings', async () => {
        // Set existing settings without migration flag
        localStorage.setItem('cvf_settings', JSON.stringify({
            preferences: { defaultExportMode: 'simple', defaultProvider: 'gemini' },
            providers: { gemini: { apiKey: '', enabled: true, selectedModel: 'gemini-2.5-flash' } },
        }));
        // Ensure migration key is NOT set
        localStorage.removeItem('cvf_settings_migrated_governance');

        renderSettingsPage();
        await waitFor(() => expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy());

        const saved = JSON.parse(localStorage.getItem('cvf_settings')!);
        expect(saved.preferences.defaultExportMode).toBe('governance');
        expect(localStorage.getItem('cvf_settings_migrated_governance')).toBe('1');
    });

    it('shows agent provider selectors in multi-agent mode', async () => {
        renderSettingsPage();
        await waitFor(() => expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy());

        // Switch to Preferences tab
        fireEvent.click(screen.getByText('🎨 Preferences'));

        // Find the multi-agent mode select and change to multi
        const allSelects = screen.getAllByRole('combobox') as HTMLSelectElement[];
        const multiAgentSelect = allSelects.find(s =>
            s.querySelector('option[value="multi"]') !== null
        );
        expect(multiAgentSelect).toBeTruthy();

        fireEvent.change(multiAgentSelect!, { target: { value: 'multi' } });
        fireEvent.click(screen.getByRole('button', { name: 'Lưu cài đặt' }));

        // After selecting multi mode, agent provider selects should appear
        await waitFor(() => {
            const saved = localStorage.getItem('cvf_settings') || '';
            expect(saved).toContain('"multiAgentMode":"multi"');
        });

        // Verify agent role provider selectors are visible (4 roles: orchestrator, architect, builder, reviewer)
        const updatedSelects = screen.getAllByRole('combobox') as HTMLSelectElement[];
        // Should have more selects now (original selects + 4 agent provider selects)
        expect(updatedSelects.length).toBeGreaterThan(allSelects.length);

        // Change one agent provider
        const agentProviderSelect = updatedSelects.find(s =>
            !allSelects.includes(s) && s.querySelector('option[value="openai"]') !== null
        );
        if (agentProviderSelect) {
            fireEvent.change(agentProviderSelect, { target: { value: 'openai' } });
            const saved2 = localStorage.getItem('cvf_settings') || '';
            expect(saved2).toContain('openai');
        }
    });
});

describe('SettingsButton', () => {
    it('calls onClick', () => {
        const onClick = vi.fn();
        render(<SettingsButton onClick={onClick} />);
        fireEvent.click(screen.getByTitle('Settings'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});

describe('native subscription Settings card', () => {
    it('labels native alias and inactive API model, without altering persisted API selection or offering API-key input', async () => {
        localStorage.setItem('cvf_settings', JSON.stringify({ providers: { anthropic: { enabled: true, apiKey: 'private-api-key', selectedModel: 'claude-haiku-5-5' } }, preferences: { defaultProvider: 'anthropic' } }));
        vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ providers: [{ provider: 'claude', configured: true, executionSurface: 'claude_cli_subscription', nativeAuthState: 'available', model: 'sonnet', readiness: 'live_task_ready' }], anyConfigured: true }) }));
        renderSettingsPage(); await waitFor(() => expect(screen.getByText(/sonnet.*API/i)).toBeTruthy());
        expect(screen.queryByLabelText('Anthropic Claude API key')).toBeNull();
        expect(document.body.textContent).not.toContain('private-api-key');
        expect(localStorage.getItem('cvf_settings')).toContain('claude-haiku-5-5');
    });
});

describe('default provider transparency note', () => {
    beforeEach(() => { localStorage.removeItem('cvf_settings'); localStorage.removeItem('cvf_integrations'); vi.unstubAllGlobals(); });
    afterEach(() => { mockLanguage.value = 'vi'; });
    it('shows the Vietnamese note under the default provider select on the Preferences tab', async () => {
        renderSettingsPage();
        await waitFor(() => expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy());
        fireEvent.click(screen.getByText('🎨 Preferences'));
        const note = screen.getByTestId('default-provider-note');
        expect(note.textContent).toContain('Lưu cài đặt');
        expect(note.textContent).toContain('trình duyệt này');
        expect(note.textContent).toContain('thay thế mặc định của máy chủ');
        expect(screen.getByText('Provider mặc định').parentElement?.contains(note)).toBe(true);
    });
    it('shows the English note when the language is English', async () => {
        mockLanguage.value = 'en';
        renderSettingsPage();
        await waitFor(() => expect(screen.getByText(/Settings/)).toBeTruthy());
        fireEvent.click(screen.getByText('🎨 Preferences'));
        const note = screen.getByTestId('default-provider-note');
        expect(note.textContent).toBe('Press "Save settings" to apply changes. The default provider chosen here is used for runs from this browser and overrides the server default.');
    });
});

// Outcome fidelity O7: attempts to reproduce the observed revert of the default provider to OpenAI after a restart.
describe('default provider persistence (O7 revert reproduction)', () => {
    const SAVED = { providers: { alibaba: { apiKey: '', enabled: true, selectedModel: 'qwen-plus-character' } }, preferences: { defaultProvider: 'alibaba', analyticsEnabled: true } };
    const stored = () => JSON.parse(localStorage.getItem('cvf_settings') ?? '{}') as { preferences?: { defaultProvider?: string; analyticsEnabled?: boolean; showWelcomeTour?: boolean } };
    type Hook = ReturnType<typeof useSettings>;
    function Probe({ onReady }: { onReady: (hook: Hook) => void }) {
        const hook = useSettings();
        onReady(hook);
        return <span data-testid={`default-provider-${hook.isLoaded ? 'loaded' : 'pending'}`}>{hook.settings.preferences.defaultProvider}</span>;
    }
    beforeEach(() => { localStorage.removeItem('cvf_settings'); localStorage.removeItem('cvf_settings_migrated_governance'); localStorage.setItem('cvf_settings_migrated_governance', '1'); });

    it('a saved Alibaba default provider survives a reload (new hook instance)', async () => {
        localStorage.setItem('cvf_settings', JSON.stringify(SAVED));
        let hook!: Hook; render(<Probe onReady={h => { hook = h; }} />);
        await waitFor(() => expect(screen.getByTestId('default-provider-loaded').textContent).toBe('alibaba'));
        expect(stored().preferences?.defaultProvider).toBe('alibaba'); expect(hook.settings.preferences.defaultProvider).toBe('alibaba');
    });
    it('the governed-route migration never remaps a supported saved provider (alibaba, openai, anthropic) and only remaps unsupported ones', () => {
        const base = { providers: {}, preferences: {} } as unknown as SettingsData;
        for (const provider of ['alibaba', 'openai', 'anthropic']) {
            const migrated = migrateSettingsForGovernedRoute({ ...base, preferences: { defaultProvider: provider, agentProviders: { orchestrator: provider, architect: provider, builder: provider, reviewer: provider } } } as unknown as SettingsData);
            expect(migrated.changed).toBe(false); expect(migrated.settings.preferences.defaultProvider).toBe(provider);
        }
        const remapped = migrateSettingsForGovernedRoute({ ...base, preferences: { defaultProvider: 'gemini' } } as unknown as SettingsData);
        expect(remapped.changed).toBe(true); expect(remapped.settings.preferences.defaultProvider).toBe('openai');
    });
    it('first-load migration marker handling keeps a saved Alibaba default provider', async () => {
        localStorage.setItem('cvf_settings', JSON.stringify(SAVED)); localStorage.removeItem('cvf_settings_migrated_governance');
        render(<Probe onReady={() => undefined} />);
        await waitFor(() => expect(screen.getByTestId('default-provider-loaded').textContent).toBe('alibaba'));
        expect(stored().preferences?.defaultProvider).toBe('alibaba');
    });
    it('a second hook instance with older state does not write the default provider back (stale writer)', async () => {
        localStorage.setItem('cvf_settings', JSON.stringify({ ...SAVED, preferences: { ...SAVED.preferences, defaultProvider: 'openai' } }));
        let a!: Hook; let b!: Hook;
        render(<><Probe onReady={h => { a = h; }} /><Probe onReady={h => { b = h; }} /></>);
        await waitFor(() => expect(screen.getAllByTestId('default-provider-loaded')).toHaveLength(2));
        act(() => { a.updatePreferences({ defaultProvider: 'alibaba' }); });
        expect(stored().preferences?.defaultProvider).toBe('alibaba');
        act(() => { b.updatePreferences({ analyticsEnabled: false }); });
        expect(stored().preferences?.analyticsEnabled).toBe(false);
        expect(stored().preferences?.defaultProvider).toBe('alibaba');
    });
    it('a writer that fires before the saved settings are applied does not persist the pre-load defaults', async () => {
        localStorage.setItem('cvf_settings', JSON.stringify(SAVED));
        function EarlyWriter() { const hook = useSettings(); const { updatePreferences } = hook; useEffectOnce(() => updatePreferences({ showWelcomeTour: false })); return <span data-testid="early">{hook.isLoaded ? hook.settings.preferences.defaultProvider : 'pending'}</span>; }
        render(<EarlyWriter />);
        await waitFor(() => expect(screen.getByTestId('early').textContent).toBe('alibaba'));
        expect(stored().preferences?.defaultProvider).toBe('alibaba'); expect(stored().preferences?.showWelcomeTour).toBe(false);
    });
    it('F8: updates keep the in-memory NEXT_PUBLIC_GEMINI_API_KEY injection instead of dropping it from state', async () => {
        vi.stubEnv('NEXT_PUBLIC_GEMINI_API_KEY', 'env-gemini-key');
        try {
            localStorage.setItem('cvf_settings', JSON.stringify(SAVED));
            let hook!: Hook; render(<Probe onReady={h => { hook = h; }} />);
            await waitFor(() => expect(screen.getByTestId('default-provider-loaded').textContent).toBe('alibaba'));
            expect(hook.settings.providers.gemini.apiKey).toBe('env-gemini-key');
            act(() => { hook.updatePreferences({ analyticsEnabled: false }); });
            expect(hook.settings.providers.gemini.apiKey).toBe('env-gemini-key');
            act(() => { hook.updateProvider('alibaba', { enabled: false }); });
            expect(hook.settings.providers.gemini.apiKey).toBe('env-gemini-key'); expect(hook.settings.providers.alibaba.enabled).toBe(false);
            expect(stored().preferences?.defaultProvider).toBe('alibaba');
            // A key the user saved is never overwritten by the environment key.
            localStorage.setItem('cvf_settings', JSON.stringify({ ...SAVED, providers: { ...SAVED.providers, gemini: { apiKey: 'user-key', enabled: true, selectedModel: 'gemini-2.0-flash' } } }));
            act(() => { hook.updatePreferences({ analyticsEnabled: true }); });
            expect(hook.settings.providers.gemini.apiKey).toBe('user-key');
        } finally { vi.unstubAllEnvs(); }
    });
});
