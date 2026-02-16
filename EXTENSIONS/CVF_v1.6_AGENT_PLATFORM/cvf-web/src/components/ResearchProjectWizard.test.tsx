/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResearchProjectWizard } from './ResearchProjectWizard';

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

describe('ResearchProjectWizard', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('unlocks next step after required research fields are filled', () => {
        render(<ResearchProjectWizard onBack={vi.fn()} />);
        const nextButton = screen.getByText('Tiếp tục →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);
        fireEvent.change(screen.getByPlaceholderText(/Impact of AI on Software Development/i), { target: { value: 'Impact of AI' } });
        fireEvent.change(screen.getByPlaceholderText(/RQ1:/i), { target: { value: 'RQ1: How?' } });
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Survey' } });
        fireEvent.change(screen.getByPlaceholderText(/Why is this research important/i), { target: { value: 'Important.' } });
        expect(nextButton.disabled).toBe(false);
    });

    it('navigates step 1→2 and back', () => {
        render(<ResearchProjectWizard onBack={vi.fn()} />);
        fillAll(); clickNext();
        expect(document.body.textContent).toContain('Methodology');
        clickBack();
        expect(document.body.textContent).toContain('Research Question');
    });

    it('navigates through all 4 steps to review', () => {
        render(<ResearchProjectWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); // → 2
        fillAll(); clickNext(); // → 3
        fillAll(); clickNext(); // → 4 (Review)
        expect(document.body.textContent).toContain('RESEARCH PROJECT');
    });

    it('shows export and opens export view', () => {
        render(<ResearchProjectWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        const exportBtn = screen.getByText(/Xuất Research Proposal/);
        fireEvent.click(exportBtn);
        expect(document.body.textContent).toMatch(/Copy to Clipboard|Sao chép/);
    });

    it('loads draft from localStorage', () => {
        localStorage.setItem('cvf_research_project_wizard_draft', JSON.stringify({ data: { researchTopic: 'X' }, step: 1, savedAt: Date.now() }));
        render(<ResearchProjectWizard onBack={vi.fn()} />);
        expect(document.body.textContent).toMatch(/draft|nháp/i);
    });

    it('loads draft when Continue is clicked', () => {
        localStorage.setItem('cvf_research_project_wizard_draft', JSON.stringify({ data: { researchTopic: 'AI Ethics' }, step: 2, savedAt: new Date().toISOString() }));
        render(<ResearchProjectWizard onBack={vi.fn()} />);
        fireEvent.click(screen.getByText('Tiếp tục'));
        expect(document.body.textContent).toContain('Methodology');
    });

    it('clears draft when Start New is clicked', () => {
        localStorage.setItem('cvf_research_project_wizard_draft', JSON.stringify({ data: { researchTopic: 'X' }, step: 2, savedAt: new Date().toISOString() }));
        render(<ResearchProjectWizard onBack={vi.fn()} />);
        fireEvent.click(screen.getByText('Bắt đầu mới'));
        expect(document.body.textContent).toContain('Research Question');
        expect(localStorage.getItem('cvf_research_project_wizard_draft')).toBeNull();
    });

    it('jumps to completed step via indicator', () => {
        render(<ResearchProjectWizard onBack={vi.fn()} />);
        fillAll(); clickNext();
        fillAll(); clickNext();
        fireEvent.click(screen.getByText('Research Question').closest('button')!);
        expect(document.body.textContent).toContain('Step 1');
    });

    it('copies spec to clipboard from export', () => {
        const spy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
        vi.spyOn(window, 'alert').mockImplementation(() => {});
        render(<ResearchProjectWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        fireEvent.click(screen.getByText(/Xuất Research Proposal/));
        fireEvent.click(screen.getByText(/Copy to Clipboard/));
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('downloads .md from export', () => {
        const spy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
        render(<ResearchProjectWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        fireEvent.click(screen.getByText(/Xuất Research Proposal/));
        fireEvent.click(screen.getByText(/Download .md/));
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
