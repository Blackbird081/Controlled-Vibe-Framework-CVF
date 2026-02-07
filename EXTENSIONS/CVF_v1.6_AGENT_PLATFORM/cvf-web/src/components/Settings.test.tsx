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
});

describe('SettingsButton', () => {
    it('calls onClick', () => {
        const onClick = vi.fn();
        render(<SettingsButton onClick={onClick} />);
        fireEvent.click(screen.getByTitle('Settings'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });
});
