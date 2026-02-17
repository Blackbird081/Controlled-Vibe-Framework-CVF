/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SettingsPage, SettingsButton } from './Settings';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'vi', t: (key: string) => key }),
}));

function renderSettingsPage() {
    return render(<SettingsPage />);
}

describe('SettingsPage', () => {
    beforeEach(() => {
        localStorage.removeItem('cvf_settings');
    });

    it('renders providers tab and updates api key', async () => {
        renderSettingsPage();

        await waitFor(() => expect(screen.getByText('⚙️ Cài đặt')).toBeTruthy());
        const apiInput = screen.getByPlaceholderText(/Google Gemini API Key/i);
        fireEvent.change(apiInput, { target: { value: 'abc' } });

        expect(screen.getByText(/Đã lưu/i)).toBeTruthy();
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
            readAsText(_file: File) {
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

        const apiInput = screen.getByPlaceholderText(/Google Gemini API Key/i) as HTMLInputElement;
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
        fireEvent.change(modelSelect, { target: { value: 'gemini-2.5-pro' } });
        expect(modelSelect.value).toBe('gemini-2.5-pro');

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

        const saved = localStorage.getItem('cvf_settings') || '';
        expect(saved).toContain('analyticsEnabled');
        expect(saved).toContain('showWelcomeTour');
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
            readAsText(_file: File) {
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
