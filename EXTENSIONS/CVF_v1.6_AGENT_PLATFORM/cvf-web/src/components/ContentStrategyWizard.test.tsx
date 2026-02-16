/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ContentStrategyWizard } from './ContentStrategyWizard';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'vi', t: (key: string) => key }),
}));

vi.mock('@/lib/spec-gate', () => ({
    evaluateSpecGate: () => ({ status: 'PASS', missing: [], score: 1 }),
}));

function fillAll() {
    screen.getAllByRole('textbox').forEach(tb => fireEvent.change(tb, { target: { value: 'Test data' } }));
    screen.queryAllByRole('combobox').forEach(sel => {
        const opts = sel.querySelectorAll('option');
        if (opts.length > 1) fireEvent.change(sel, { target: { value: opts[1].getAttribute('value') } });
    });
}
function clickNext() { fireEvent.click(screen.getByText('Tiếp tục →')); }
function clickBack() { fireEvent.click(screen.getByText('← Trước')); }

describe('ContentStrategyWizard', () => {
    beforeEach(() => { localStorage.clear(); });

    it('unlocks next step when required fields are filled', () => {
        render(<ContentStrategyWizard onBack={vi.fn()} />);
        const nextButton = screen.getByText('Tiếp tục →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);
        fireEvent.change(screen.getByPlaceholderText(/TechStartup Blog/i), { target: { value: 'TechStartup Blog' } });
        fireEvent.change(screen.getByPlaceholderText(/Tone: Professional/i), { target: { value: 'Professional but friendly' } });
        fireEvent.change(screen.getByPlaceholderText(/Increase organic traffic/i), { target: { value: 'Increase organic traffic 50%' } });
        expect(nextButton.disabled).toBe(false);
    });

    it('navigates step 1→2 and back', () => {
        render(<ContentStrategyWizard onBack={vi.fn()} />);
        fillAll(); clickNext();
        expect(document.body.textContent).toContain('Audience');
        clickBack();
        expect(document.body.textContent).toContain('Brand & Goals');
    });

    it('navigates through all steps to review', () => {
        render(<ContentStrategyWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); // → step 2
        fillAll(); clickNext(); // → step 3
        fillAll(); clickNext(); // → step 4
        fillAll(); clickNext(); // → step 5 (Review)
        expect(document.body.textContent).toContain('CONTENT STRATEGY');
    });

    it('shows export on review step', () => {
        render(<ContentStrategyWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        expect(screen.getByText(/Xuất Content Strategy/)).toBeTruthy();
    });

    it('opens export view', () => {
        render(<ContentStrategyWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        fireEvent.click(screen.getByText(/Xuất Content Strategy/));
        expect(document.body.textContent).toMatch(/Copy to Clipboard|Sao chép/);
    });

    it('loads draft from localStorage', () => {
        localStorage.setItem('cvf_content_strategy_wizard_draft', JSON.stringify({ data: { brandName: 'X' }, step: 1, savedAt: Date.now() }));
        render(<ContentStrategyWizard onBack={vi.fn()} />);
        expect(document.body.textContent).toMatch(/draft|nháp/i);
    });

    it('loads draft when Continue is clicked', () => {
        localStorage.setItem('cvf_content_strategy_wizard_draft', JSON.stringify({ data: { brandName: 'Draft B' }, step: 2, savedAt: new Date().toISOString() }));
        render(<ContentStrategyWizard onBack={vi.fn()} />);
        fireEvent.click(screen.getByText('Tiếp tục'));
        expect(document.body.textContent).toContain('Audience');
    });

    it('clears draft when Start New is clicked', () => {
        localStorage.setItem('cvf_content_strategy_wizard_draft', JSON.stringify({ data: { brandName: 'X' }, step: 2, savedAt: new Date().toISOString() }));
        render(<ContentStrategyWizard onBack={vi.fn()} />);
        fireEvent.click(screen.getByText('Bắt đầu mới'));
        expect(document.body.textContent).toContain('Brand & Goals');
        expect(localStorage.getItem('cvf_content_strategy_wizard_draft')).toBeNull();
    });

    it('jumps to completed step via indicator', () => {
        render(<ContentStrategyWizard onBack={vi.fn()} />);
        fillAll(); clickNext();
        fillAll(); clickNext();
        fireEvent.click(screen.getByText('Brand & Goals').closest('button')!);
        expect(document.body.textContent).toContain('Step 1');
    });

    it('copies spec to clipboard from export', () => {
        const spy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
        vi.spyOn(window, 'alert').mockImplementation(() => {});
        render(<ContentStrategyWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        fireEvent.click(screen.getByText(/Xuất Content Strategy/));
        fireEvent.click(screen.getByText(/Copy to Clipboard/));
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('downloads .md from export', () => {
        const spy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
        render(<ContentStrategyWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        fireEvent.click(screen.getByText(/Xuất Content Strategy/));
        fireEvent.click(screen.getByText(/Download .md/));
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
