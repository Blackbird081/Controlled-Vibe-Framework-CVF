/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AppBuilderWizard } from './AppBuilderWizard';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'vi', t: (key: string) => key }),
}));

vi.mock('@/lib/spec-gate', () => ({
    evaluateSpecGate: () => ({ status: 'PASS', missing: [], score: 1 }),
}));

function fillAll() {
    screen.queryAllByRole('textbox').forEach(tb => fireEvent.change(tb, { target: { value: 'Test data' } }));
    screen.queryAllByRole('combobox').forEach(sel => {
        const opts = sel.querySelectorAll('option');
        if (opts.length > 1) fireEvent.change(sel, { target: { value: opts[1].getAttribute('value') } });
    });
}
function clickNext() { fireEvent.click(screen.getByText('Next →')); }
function clickBack() { fireEvent.click(screen.getByText('← Back')); }

describe('AppBuilderWizard', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    it('enables next button when required fields are filled', () => {
        render(<AppBuilderWizard onBack={vi.fn()} />);
        const nextButton = screen.getByText('Next →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);
        fireEvent.change(screen.getByPlaceholderText('VD: TaskFlow'), { target: { value: 'TaskFlow' } });
        const appTypeSelect = screen.getAllByRole('combobox')[0];
        fireEvent.change(appTypeSelect, { target: { value: 'Desktop App' } });
        fireEvent.change(screen.getByPlaceholderText('Mô tả vấn đề user đang gặp phải...'), { target: { value: 'User lacks task tracking' } });
        fireEvent.change(screen.getByPlaceholderText('Ai sẽ dùng app này?'), { target: { value: 'Small teams' } });
        fireEvent.change(screen.getByPlaceholderText(/Feature A/i), { target: { value: 'Create tasks' } });
        expect(nextButton.disabled).toBe(false);
    });

    it('navigates step 1→2 and back', () => {
        render(<AppBuilderWizard onBack={vi.fn()} />);
        fillAll(); clickNext();
        expect(document.body.textContent).toContain('Tech Stack');
        clickBack();
        expect(document.body.textContent).toContain('Requirements');
    });

    it('navigates through all steps to review (step 4 skipped)', () => {
        render(<AppBuilderWizard onBack={vi.fn()} />);
        // Step 4 (Database) is skipped when dataStorage='Không cần' (first option)
        // Navigation: 1→2→3→5→6→7→8 = 6 clicks
        for (let i = 0; i < 6; i++) {
            fillAll(); clickNext();
        }
        expect(document.body.textContent).toContain('Review');
    });

    it('loads draft from localStorage', () => {
        localStorage.setItem('cvf_wizard_draft', JSON.stringify({ data: { appName: 'X' }, step: 1, savedAt: Date.now() }));
        render(<AppBuilderWizard onBack={vi.fn()} />);
        expect(document.body.textContent).toMatch(/draft|nháp/i);
    });

    it('loads draft when Continue is clicked', () => {
        localStorage.setItem('cvf_wizard_draft', JSON.stringify({ data: { appName: 'DraftApp' }, step: 2, savedAt: new Date().toISOString() }));
        render(<AppBuilderWizard onBack={vi.fn()} />);
        fireEvent.click(screen.getByText('Continue'));
        expect(document.body.textContent).toContain('Tech Stack');
    });

    it('clears draft when Start New is clicked', () => {
        localStorage.setItem('cvf_wizard_draft', JSON.stringify({ data: { appName: 'X' }, step: 2, savedAt: new Date().toISOString() }));
        render(<AppBuilderWizard onBack={vi.fn()} />);
        fireEvent.click(screen.getByText('Start New'));
        expect(document.body.textContent).toContain('Requirements');
        expect(localStorage.getItem('cvf_wizard_draft')).toBeNull();
    });

    it('jumps to completed step via indicator', () => {
        render(<AppBuilderWizard onBack={vi.fn()} />);
        fillAll(); clickNext();
        fillAll(); clickNext();
        fireEvent.click(screen.getByText('Requirements').closest('button')!);
        expect(document.body.textContent).toContain('Step 1');
    });
});
