/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BusinessStrategyWizard } from './BusinessStrategyWizard';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'vi', t: (key: string) => key }),
}));

vi.mock('@/lib/spec-gate', () => ({
    evaluateSpecGate: () => ({ status: 'PASS', missing: [], score: 1 }),
}));

function fillAllRequired() {
    const textboxes = screen.getAllByRole('textbox');
    textboxes.forEach(tb => fireEvent.change(tb, { target: { value: 'Test data' } }));
}

function clickNext() {
    const btn = screen.getByText('Tiếp tục →') as HTMLButtonElement;
    if (!btn.disabled) fireEvent.click(btn);
}

function clickBack() {
    fireEvent.click(screen.getByText('← Trước'));
}

describe('BusinessStrategyWizard', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('requires mandatory fields before advancing', () => {
        render(<BusinessStrategyWizard onBack={vi.fn()} />);

        const nextButton = screen.getByText('Tiếp tục →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);

        fireEvent.change(
            screen.getByPlaceholderText('VD: Có nên mở rộng thị trường miền Trung?'),
            { target: { value: 'Should we enter a new market?' } }
        );
        fireEvent.change(
            screen.getByPlaceholderText('Mô tả về công ty, ngành, thị trường hiện tại...'),
            { target: { value: 'We are a SaaS company in APAC.' } }
        );
        fireEvent.change(
            screen.getByPlaceholderText(/Tăng revenue 30%/i),
            { target: { value: 'Increase revenue 30%' } }
        );

        expect(nextButton.disabled).toBe(false);
    });

    it('navigates from step 1 to step 2 and back', () => {
        render(<BusinessStrategyWizard onBack={vi.fn()} />);
        fillAllRequired();
        clickNext();
        // Should be on step 2 - look for Options Analysis field
        expect(document.body.textContent).toContain('Options Analysis');
        // Click Back
        clickBack();
        // Should be back on step 1
        expect(document.body.textContent).toContain('Context & Goals');
    });

    it('navigates through all steps to review', () => {
        render(<BusinessStrategyWizard onBack={vi.fn()} />);
        // Step 1
        fillAllRequired();
        clickNext();
        // Step 2
        fillAllRequired();
        clickNext();
        // Step 3
        fillAllRequired();
        clickNext();
        // Step 4 - Review
        expect(document.body.textContent).toContain('STRATEGIC DECISION DOCUMENT');
    });

    it('shows export button on review step', () => {
        render(<BusinessStrategyWizard onBack={vi.fn()} />);
        fillAllRequired(); clickNext();
        fillAllRequired(); clickNext();
        fillAllRequired(); clickNext();
        expect(screen.getByText(/Xuất Strategy Document/)).toBeTruthy();
    });

    it('opens export view when export button clicked', () => {
        render(<BusinessStrategyWizard onBack={vi.fn()} />);
        fillAllRequired(); clickNext();
        fillAllRequired(); clickNext();
        fillAllRequired(); clickNext();
        fireEvent.click(screen.getByText(/Xuất Strategy Document/));
        // Export view should show copy / download buttons
        expect(document.body.textContent).toMatch(/Sao chép|Copy/);
    });

    it('loads draft from localStorage', () => {
        const draft = {
            data: { strategicQuestion: 'Saved question' },
            step: 1,
            savedAt: Date.now(),
        };
        localStorage.setItem('cvf_business_strategy_wizard_draft', JSON.stringify(draft));
        render(<BusinessStrategyWizard onBack={vi.fn()} />);
        expect(document.body.textContent).toMatch(/draft|bản nháp/i);
    });

    it('clears draft when clear button clicked', () => {
        const draft = {
            data: { strategicQuestion: 'Saved question' },
            step: 1,
            savedAt: Date.now(),
        };
        localStorage.setItem('cvf_business_strategy_wizard_draft', JSON.stringify(draft));
        render(<BusinessStrategyWizard onBack={vi.fn()} />);
        const clearBtn = screen.getByText('Bắt đầu mới');
        fireEvent.click(clearBtn);
        expect(localStorage.getItem('cvf_business_strategy_wizard_draft')).toBeNull();
    });

    it('loads draft when Continue is clicked', () => {
        localStorage.setItem('cvf_business_strategy_wizard_draft', JSON.stringify({ data: { strategicQuestion: 'Draft Q' }, step: 2, savedAt: new Date().toISOString() }));
        render(<BusinessStrategyWizard onBack={vi.fn()} />);
        fireEvent.click(screen.getByText('Tiếp tục'));
        expect(document.body.textContent).toContain('Options Analysis');
    });

    it('jumps to completed step via indicator', () => {
        render(<BusinessStrategyWizard onBack={vi.fn()} />);
        fillAllRequired(); clickNext();
        fillAllRequired(); clickNext();
        fireEvent.click(screen.getByText('Context & Goals').closest('button')!);
        expect(document.body.textContent).toContain('Step 1');
    });

    it('copies spec to clipboard from export', () => {
        const spy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
        vi.spyOn(window, 'alert').mockImplementation(() => {});
        render(<BusinessStrategyWizard onBack={vi.fn()} />);
        fillAllRequired(); clickNext(); fillAllRequired(); clickNext(); fillAllRequired(); clickNext();
        fireEvent.click(screen.getByText(/Xuất Strategy Document/));
        fireEvent.click(screen.getByText(/Copy to Clipboard/));
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('downloads .md from export', () => {
        const spy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
        render(<BusinessStrategyWizard onBack={vi.fn()} />);
        fillAllRequired(); clickNext(); fillAllRequired(); clickNext(); fillAllRequired(); clickNext();
        fireEvent.click(screen.getByText(/Xuất Strategy Document/));
        fireEvent.click(screen.getByText(/Download .md/));
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
