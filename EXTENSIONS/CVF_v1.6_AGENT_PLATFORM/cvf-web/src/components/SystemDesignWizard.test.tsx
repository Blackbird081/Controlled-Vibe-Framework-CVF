/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SystemDesignWizard } from './SystemDesignWizard';

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

describe('SystemDesignWizard', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('enables next button when requirement fields are completed', () => {
        render(<SystemDesignWizard onBack={vi.fn()} />);
        const nextButton = screen.getByText('Tiếp tục →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);
        fireEvent.change(screen.getByPlaceholderText(/URL Shortener Service/i), { target: { value: 'URL Shortener' } });
        fireEvent.change(screen.getByPlaceholderText(/Build a scalable URL shortening service/i), { target: { value: 'URL shortener like bit.ly' } });
        fireEvent.change(screen.getByPlaceholderText(/Shorten URL/i), { target: { value: 'Shorten URL' } });
        fireEvent.change(screen.getByPlaceholderText(/99.99% availability/i), { target: { value: '99.99% availability' } });
        expect(nextButton.disabled).toBe(false);
    });

    it('navigates step 1→2 and back', () => {
        render(<SystemDesignWizard onBack={vi.fn()} />);
        fillAll(); clickNext();
        expect(document.body.textContent).toContain('Estimations');
        clickBack();
        expect(document.body.textContent).toContain('Requirements');
    });

    it('navigates through all 5 steps to review', () => {
        render(<SystemDesignWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); // → 2
        fillAll(); clickNext(); // → 3
        fillAll(); clickNext(); // → 4
        fillAll(); clickNext(); // → 5 (Review)
        expect(document.body.textContent).toContain('SYSTEM DESIGN');
    });

    it('shows export and opens export view', () => {
        render(<SystemDesignWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        const exportBtn = screen.getByText(/Xuất System Design Document/);
        fireEvent.click(exportBtn);
        expect(document.body.textContent).toMatch(/Copy to Clipboard|Sao chép/);
    });

    it('loads draft from localStorage', () => {
        localStorage.setItem('cvf_system_design_wizard_draft', JSON.stringify({ data: { systemName: 'X' }, step: 1, savedAt: Date.now() }));
        render(<SystemDesignWizard onBack={vi.fn()} />);
        expect(document.body.textContent).toMatch(/draft|nháp/i);
    });

    it('loads draft when Continue is clicked', () => {
        localStorage.setItem('cvf_system_design_wizard_draft', JSON.stringify({ data: { systemName: 'SysD' }, step: 2, savedAt: new Date().toISOString() }));
        render(<SystemDesignWizard onBack={vi.fn()} />);
        fireEvent.click(screen.getByText('Tiếp tục'));
        expect(document.body.textContent).toContain('Estimations');
    });

    it('clears draft when Start New is clicked', () => {
        localStorage.setItem('cvf_system_design_wizard_draft', JSON.stringify({ data: { systemName: 'X' }, step: 2, savedAt: new Date().toISOString() }));
        render(<SystemDesignWizard onBack={vi.fn()} />);
        fireEvent.click(screen.getByText('Bắt đầu mới'));
        expect(document.body.textContent).toContain('Requirements');
        expect(localStorage.getItem('cvf_system_design_wizard_draft')).toBeNull();
    });

    it('jumps to completed step via indicator', () => {
        render(<SystemDesignWizard onBack={vi.fn()} />);
        fillAll(); clickNext();
        fillAll(); clickNext();
        fireEvent.click(screen.getByText('Requirements').closest('button')!);
        expect(document.body.textContent).toContain('Step 1');
    });

    it('copies spec to clipboard from export', () => {
        const spy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
        vi.spyOn(window, 'alert').mockImplementation(() => {});
        render(<SystemDesignWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        fireEvent.click(screen.getByText(/Xuất System Design Document/));
        fireEvent.click(screen.getByText(/Copy to Clipboard/));
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('downloads .md from export', () => {
        const spy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
        render(<SystemDesignWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        fireEvent.click(screen.getByText(/Xuất System Design Document/));
        fireEvent.click(screen.getByText(/Download .md/));
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
