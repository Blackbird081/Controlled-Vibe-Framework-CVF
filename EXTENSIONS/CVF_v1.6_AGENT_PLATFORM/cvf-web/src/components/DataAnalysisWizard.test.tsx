/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataAnalysisWizard } from './DataAnalysisWizard';

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

describe('DataAnalysisWizard', () => {
    beforeEach(() => { localStorage.clear(); });

    it('enables next button after required fields are completed', () => {
        render(<DataAnalysisWizard onBack={vi.fn()} />);
        const nextButton = screen.getByText('Tiếp tục →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);
        fireEvent.change(screen.getByPlaceholderText(/Identify factors affecting customer churn/i), { target: { value: 'Identify churn drivers' } });
        fireEvent.change(screen.getByPlaceholderText(/What drives customer churn/i), { target: { value: 'What drives churn?' } });
        fireEvent.change(screen.getByPlaceholderText(/Customer database/i), { target: { value: 'Customer DB' } });
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Descriptive' } });
        expect(nextButton.disabled).toBe(false);
    });

    it('navigates step 1→2 and back', () => {
        render(<DataAnalysisWizard onBack={vi.fn()} />);
        fillAll(); clickNext();
        expect(document.body.textContent).toContain('Data Understanding');
        fireEvent.click(screen.getByText('← Trước'));
        expect(document.body.textContent).toContain('Problem & Data');
    });

    it('navigates through all steps to review', () => {
        render(<DataAnalysisWizard onBack={vi.fn()} />);
        fillAll(); clickNext();
        fillAll(); clickNext();
        fillAll(); clickNext();
        fillAll(); clickNext();
        expect(document.body.textContent).toContain('DATA ANALYSIS');
    });

    it('shows export on review and opens export view', () => {
        render(<DataAnalysisWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        const exportBtn = screen.getByText(/Xuất Data Analysis/);
        fireEvent.click(exportBtn);
        expect(document.body.textContent).toMatch(/Copy to Clipboard|Sao chép/);
    });

    it('loads draft from localStorage', () => {
        localStorage.setItem('cvf_data_analysis_wizard_draft', JSON.stringify({ data: { analysisGoal: 'X' }, step: 1, savedAt: Date.now() }));
        render(<DataAnalysisWizard onBack={vi.fn()} />);
        expect(document.body.textContent).toMatch(/draft|nháp/i);
    });

    it('loads draft when Continue is clicked', () => {
        localStorage.setItem('cvf_data_analysis_wizard_draft', JSON.stringify({ data: { analysisGoal: 'Draft G' }, step: 2, savedAt: new Date().toISOString() }));
        render(<DataAnalysisWizard onBack={vi.fn()} />);
        fireEvent.click(screen.getByText('Tiếp tục'));
        expect(document.body.textContent).toContain('Data Understanding');
    });

    it('clears draft when Start New is clicked', () => {
        localStorage.setItem('cvf_data_analysis_wizard_draft', JSON.stringify({ data: { analysisGoal: 'X' }, step: 2, savedAt: new Date().toISOString() }));
        render(<DataAnalysisWizard onBack={vi.fn()} />);
        fireEvent.click(screen.getByText('Bắt đầu mới'));
        expect(document.body.textContent).toContain('Problem & Data');
        expect(localStorage.getItem('cvf_data_analysis_wizard_draft')).toBeNull();
    });

    it('jumps to completed step via indicator', () => {
        render(<DataAnalysisWizard onBack={vi.fn()} />);
        fillAll(); clickNext();
        fillAll(); clickNext();
        fireEvent.click(screen.getByText('Problem & Data').closest('button')!);
        expect(document.body.textContent).toContain('Step 1');
    });

    it('copies spec to clipboard from export', () => {
        const spy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
        vi.spyOn(window, 'alert').mockImplementation(() => {});
        render(<DataAnalysisWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        fireEvent.click(screen.getByText(/Xuất Data Analysis Plan/));
        fireEvent.click(screen.getByText(/Copy to Clipboard/));
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('downloads .md from export', () => {
        const spy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
        render(<DataAnalysisWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        fireEvent.click(screen.getByText(/Xuất Data Analysis Plan/));
        fireEvent.click(screen.getByText(/Download .md/));
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
