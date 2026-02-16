/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProductDesignWizard } from './ProductDesignWizard';

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
function clickNext() {
    const btn = screen.queryByText('Tiếp tục →') || screen.getByText(/Bỏ qua/);
    fireEvent.click(btn!);
}
function clickBack() { fireEvent.click(screen.getByText('← Trước')); }

describe('ProductDesignWizard', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('enables next step when problem definition is filled', () => {
        render(<ProductDesignWizard onBack={vi.fn()} />);
        const nextButton = screen.getByText(/Tiếp tục/ ) as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);
        fireEvent.change(screen.getByPlaceholderText(/TaskFlow Mobile/i), { target: { value: 'TaskFlow Mobile' } });
        const typeSelect = screen.getByRole('combobox');
        fireEvent.change(typeSelect, { target: { value: 'Web App' } });
        fireEvent.change(screen.getByPlaceholderText(/Người dùng gặp khó khăn/i), { target: { value: 'Users struggle.' } });
        fireEvent.change(screen.getByPlaceholderText(/Người dùng đang làm gì/i), { target: { value: 'Spreadsheets.' } });
        expect(nextButton.disabled).toBe(false);
    });

    it('navigates step 1→2 and back', () => {
        render(<ProductDesignWizard onBack={vi.fn()} />);
        fillAll(); clickNext();
        expect(document.body.textContent).toContain('User Research');
        clickBack();
        expect(document.body.textContent).toContain('Problem Definition');
    });

    it('navigates through all 6 steps to review', () => {
        render(<ProductDesignWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); // → 2
        fillAll(); clickNext(); // → 3
        fillAll(); clickNext(); // → 4
        fillAll(); clickNext(); // → 5
        fillAll(); clickNext(); // → 6 (Review)
        expect(document.body.textContent).toContain('PRODUCT DESIGN');
    });

    it('shows export button on review', () => {
        render(<ProductDesignWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        expect(screen.getByText(/Xuất Product Design Spec/)).toBeTruthy();
    });

    it('opens export view', () => {
        render(<ProductDesignWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        fireEvent.click(screen.getByText(/Xuất Product Design Spec/));
        expect(document.body.textContent).toMatch(/Copy to Clipboard|Sao chép/);
    });

    it('loads draft from localStorage', () => {
        localStorage.setItem('cvf_product_design_wizard_draft', JSON.stringify({ data: { productName: 'X' }, step: 1, savedAt: Date.now() }));
        render(<ProductDesignWizard onBack={vi.fn()} />);
        expect(document.body.textContent).toMatch(/draft|nháp/i);
    });

    it('loads draft when Continue is clicked', () => {
        localStorage.setItem('cvf_product_design_wizard_draft', JSON.stringify({ data: { productName: 'Draft P' }, step: 2, savedAt: new Date().toISOString() }));
        render(<ProductDesignWizard onBack={vi.fn()} />);
        fireEvent.click(screen.getByText('Tiếp tục'));
        expect(document.body.textContent).toContain('User Research');
    });

    it('clears draft when Start New is clicked', () => {
        localStorage.setItem('cvf_product_design_wizard_draft', JSON.stringify({ data: { productName: 'X' }, step: 2, savedAt: new Date().toISOString() }));
        render(<ProductDesignWizard onBack={vi.fn()} />);
        fireEvent.click(screen.getByText('Bắt đầu mới'));
        expect(document.body.textContent).toContain('Problem Definition');
        expect(localStorage.getItem('cvf_product_design_wizard_draft')).toBeNull();
    });

    it('jumps to completed step via indicator', () => {
        render(<ProductDesignWizard onBack={vi.fn()} />);
        fillAll(); clickNext();
        fillAll(); clickNext();
        fireEvent.click(screen.getByText('Problem Definition').closest('button')!);
        expect(document.body.textContent).toContain('Step 1');
    });

    it('copies spec to clipboard from export', () => {
        const spy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
        vi.spyOn(window, 'alert').mockImplementation(() => {});
        render(<ProductDesignWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        fireEvent.click(screen.getByText(/Xuất Product Design Spec/));
        fireEvent.click(screen.getByText(/Copy to Clipboard/));
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('downloads .md from export', () => {
        const spy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
        render(<ProductDesignWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        fireEvent.click(screen.getByText(/Xuất Product Design Spec/));
        fireEvent.click(screen.getByText(/Download .md/));
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
