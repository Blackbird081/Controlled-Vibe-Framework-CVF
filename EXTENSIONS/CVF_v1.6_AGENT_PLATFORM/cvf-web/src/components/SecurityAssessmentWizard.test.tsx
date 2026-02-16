/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SecurityAssessmentWizard } from './SecurityAssessmentWizard';

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

describe('SecurityAssessmentWizard', () => {
    beforeEach(() => { localStorage.clear(); });

    it('blocks next step when required fields are missing', () => {
        render(<SecurityAssessmentWizard onBack={vi.fn()} />);
        const nextButton = screen.getByText('Tiếp tục →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);
    });

    it('allows progressing when required fields are filled', () => {
        render(<SecurityAssessmentWizard onBack={vi.fn()} />);
        const textboxes = screen.getAllByRole('textbox');
        fireEvent.change(textboxes[0], { target: { value: 'Portal' } });
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Web Application' } });
        fireEvent.change(textboxes[1], { target: { value: 'User DB' } });
        fireEvent.change(textboxes[2], { target: { value: 'In scope: Web app' } });
        const nextButton = screen.getByText('Tiếp tục →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(false);
        fireEvent.click(nextButton);
        expect(document.body.textContent).toContain('Threat Modeling');
    });

    it('navigates step 1→2 and back', () => {
        render(<SecurityAssessmentWizard onBack={vi.fn()} />);
        fillAll(); clickNext();
        expect(document.body.textContent).toContain('Threat Modeling');
        clickBack();
        expect(document.body.textContent).toContain('Scope & Assets');
    });

    it('navigates through all 5 steps to review', () => {
        render(<SecurityAssessmentWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); // → 2
        fillAll(); clickNext(); // → 3
        fillAll(); clickNext(); // → 4
        fillAll(); clickNext(); // → 5 (Review)
        expect(document.body.textContent).toContain('SECURITY ASSESSMENT');
    });

    it('shows export and opens export view', () => {
        render(<SecurityAssessmentWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        const exportBtn = screen.getByText(/Xuất Security Assessment/);
        fireEvent.click(exportBtn);
        expect(document.body.textContent).toMatch(/Copy to Clipboard|Sao chép/);
    });

    it('loads draft from localStorage', () => {
        localStorage.setItem('cvf_security_assessment_wizard_draft', JSON.stringify({ data: { systemName: 'X' }, step: 1, savedAt: Date.now() }));
        render(<SecurityAssessmentWizard onBack={vi.fn()} />);
        expect(document.body.textContent).toMatch(/draft|nháp/i);
    });

    it('loads draft when Continue is clicked', () => {
        localStorage.setItem('cvf_security_assessment_wizard_draft', JSON.stringify({ data: { systemName: 'SecApp' }, step: 2, savedAt: new Date().toISOString() }));
        render(<SecurityAssessmentWizard onBack={vi.fn()} />);
        fireEvent.click(screen.getByText('Tiếp tục'));
        expect(document.body.textContent).toContain('Threat Modeling');
    });

    it('clears draft when Start New is clicked', () => {
        localStorage.setItem('cvf_security_assessment_wizard_draft', JSON.stringify({ data: { systemName: 'X' }, step: 2, savedAt: new Date().toISOString() }));
        render(<SecurityAssessmentWizard onBack={vi.fn()} />);
        fireEvent.click(screen.getByText('Bắt đầu mới'));
        expect(document.body.textContent).toContain('Scope & Assets');
        expect(localStorage.getItem('cvf_security_assessment_wizard_draft')).toBeNull();
    });

    it('jumps to completed step via indicator', () => {
        render(<SecurityAssessmentWizard onBack={vi.fn()} />);
        fillAll(); clickNext();
        fillAll(); clickNext();
        fireEvent.click(screen.getByText('Scope & Assets').closest('button')!);
        expect(document.body.textContent).toContain('Step 1');
    });

    it('copies spec to clipboard from export', () => {
        const spy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
        vi.spyOn(window, 'alert').mockImplementation(() => {});
        render(<SecurityAssessmentWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        fireEvent.click(screen.getByText(/Xuất Security Assessment Report/));
        fireEvent.click(screen.getByText(/Copy to Clipboard/));
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('downloads .md from export', () => {
        const spy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
        render(<SecurityAssessmentWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        fireEvent.click(screen.getByText(/Xuất Security Assessment Report/));
        fireEvent.click(screen.getByText(/Download .md/));
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });
});
