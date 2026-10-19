// Text Encoding Exception: exact Vietnamese UI selectors in bounded clipboard tests.
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { SpecExport } from './SpecExport';
import type { Template } from '@/types';

vi.mock('@/lib/i18n', () => ({ useLanguage: () => ({ language: 'en', t: (key: string) => key }) }));
vi.mock('./Settings', () => ({ useSettings: () => ({ settings: { preferences: { defaultExportMode: 'simple' } }, isLoaded: true }) }));
vi.mock('./UserContext', () => ({ useUserContext: () => ({ getContextPrompt: () => '' }) }));
vi.mock('./WorkflowVisualizer', () => ({ WorkflowVisualizer: () => null }));
// Fixed rendering leaves; these tests assert no AI governance behavior.
vi.mock('@/lib/enforcement', () => ({ evaluateEnforcement: () => ({ status: 'ALLOW', reasons: [] }) }));
vi.mock('@/lib/enforcement-log', () => ({ logEnforcementDecision: () => undefined }));

const template: Template = { id: 'copy-lifecycle', name: 'Copy lifecycle', icon: 'C', category: 'business',
    difficulty: 'easy', description: 'Synthetic clipboard presentation test', intentPattern: 'Describe [goal]',
    outputExpected: ['Brief'], fields: [{ id: 'goal', type: 'text', label: 'Goal', placeholder: 'Goal', required: true }] };
const values = { goal: 'CLIPBOARD_LIFECYCLE_MARKER' };
const deferred = () => {
    let resolve!: () => void;
    let reject!: (reason: Error) => void;
    const promise = new Promise<void>((yes, no) => { resolve = yes; reject = no; });
    return { promise, resolve, reject };
};
const clipboard = vi.fn();
const copy = () => fireEvent.click(screen.getByRole('button', { name: 'Sao chép Working Brief' }));
const exportBrief = () => fireEvent.click(screen.getByRole('button', { name: /(?:Xác nhận ý tưởng và xuất cho agent|Xuất Working Brief cho agent)/ }));
beforeEach(() => {
    clipboard.mockReset();
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: clipboard } });
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: vi.fn(() => 'blob:copy-lifecycle') });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: vi.fn() });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    vi.stubGlobal('fetch', vi.fn(() => { throw new Error('Network denied by clipboard UI test'); }));
});
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.unstubAllGlobals(); });

it('keeps newer success when an older same-packet copy rejects', async () => {
    const first = deferred(), second = deferred();
    clipboard.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    render(<SpecExport template={template} values={values} />);
    exportBrief(); copy(); copy();
    expect(clipboard.mock.calls[0][0]).toBe(clipboard.mock.calls[1][0]);
    expect(clipboard.mock.calls[0][0]).toContain(values.goal);
    await act(async () => second.resolve());
    await act(async () => first.reject(new Error('OLD_FAILURE')));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: 'Đã sao chép!' })).toBeTruthy();
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
});

it('keeps newer failure when an older same-packet copy succeeds', async () => {
    const first = deferred(), second = deferred();
    clipboard.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    render(<SpecExport template={template} values={values} />);
    exportBrief(); copy(); copy();
    await act(async () => second.reject(new Error('LATEST_FAILURE')));
    await act(async () => first.resolve());
    expect(screen.getByRole('alert').textContent).toContain('Chưa sao chép được');
    expect(screen.queryByRole('button', { name: 'Đã sao chép!' })).toBeNull();
    expect((screen.getByRole('button', { name: 'Sao chép Working Brief' }) as HTMLButtonElement).disabled).toBe(false);
});

it('invalidates a pending copy across source A-B-A without losing the new packet', async () => {
    const first = deferred();
    clipboard.mockReturnValueOnce(first.promise);
    const view = render(<SpecExport template={template} values={values} />);
    exportBrief(); copy();
    view.rerender(<SpecExport template={template} values={{ goal: 'OTHER_SOURCE' }} />);
    view.rerender(<SpecExport template={template} values={values} />);
    exportBrief();
    await act(async () => first.reject(new Error('OLD_SOURCE_FAILURE')));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('status', { name: 'Trạng thái ý tưởng' }).textContent).toContain('Phiên bản ý tưởng 3');
    expect((screen.getByRole('button', { name: 'Sao chép Working Brief' }) as HTMLButtonElement).disabled).toBe(false);
});

it('invalidates pending copy success across mode A-B-A', async () => {
    const first = deferred();
    clipboard.mockReturnValueOnce(first.promise);
    render(<SpecExport template={template} values={values} />);
    exportBrief(); copy();
    fireEvent.click(screen.getByRole('button', { name: 'Handoff cho Agent' }));
    fireEvent.click(screen.getByRole('button', { name: /^Brief$/ }));
    await act(async () => first.resolve());
    expect(screen.queryByRole('button', { name: 'Đã sao chép!' })).toBeNull();
    expect((screen.getByRole('button', { name: 'Sao chép Working Brief' }) as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByRole('status', { name: 'Trạng thái ý tưởng' }).textContent).toContain('Đã xác nhận ý tưởng');
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
});

it('retries after failure with the same packet and clears old feedback while pending', async () => {
    const second = deferred();
    clipboard.mockRejectedValueOnce(new Error('FIRST_FAILURE')).mockReturnValueOnce(second.promise);
    render(<SpecExport template={template} values={values} />);
    exportBrief();
    await act(async () => copy());
    expect(screen.getByRole('alert')).toBeTruthy();
    copy();
    expect(screen.queryByRole('alert')).toBeNull();
    expect(clipboard.mock.calls[0][0]).toBe(clipboard.mock.calls[1][0]);
    await act(async () => second.resolve());
    expect(screen.getByRole('button', { name: 'Đã sao chép!' })).toBeTruthy();
    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
});

it('does not leak an old instance result into a remounted confirmed brief', async () => {
    const first = deferred();
    clipboard.mockReturnValueOnce(first.promise).mockResolvedValueOnce(undefined);
    const view = render(<SpecExport template={template} values={values} />);
    exportBrief(); copy(); view.unmount();
    render(<SpecExport template={template} values={values} />);
    exportBrief();
    await act(async () => copy());
    await act(async () => first.reject(new Error('UNMOUNTED_FAILURE')));
    expect(screen.queryByRole('alert')).toBeNull();
    expect(screen.getByRole('button', { name: 'Đã sao chép!' })).toBeTruthy();
});
