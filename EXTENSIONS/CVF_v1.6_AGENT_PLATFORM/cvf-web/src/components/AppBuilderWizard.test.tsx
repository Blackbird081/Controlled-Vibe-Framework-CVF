/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AppBuilderWizard } from './AppBuilderWizard';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'vi', t: (key: string) => key }),
}));

vi.mock('@/lib/spec-gate', () => ({
    evaluateSpecGate: () => ({ status: 'PASS', missing: [], score: 1 }),
}));

vi.mock('./SpecExport', () => ({
    SpecExport: ({ onClose }: { onClose: () => void }) => (
        <div>
            <p>SpecExportMock</p>
            <button onClick={onClose}>CloseExportMock</button>
        </div>
    ),
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

function fillStep1(appType: 'Desktop App' | 'CLI Tool' = 'Desktop App') {
    fireEvent.change(screen.getByPlaceholderText('VD: TaskFlow'), { target: { value: 'TaskFlow' } });
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: appType } });
    fireEvent.change(screen.getByPlaceholderText('Mô tả vấn đề user đang gặp phải...'), { target: { value: 'Need better task tracking' } });
    fireEvent.change(screen.getByPlaceholderText('Ai sẽ dùng app này?'), { target: { value: 'Small teams' } });
    fireEvent.change(screen.getByPlaceholderText(/Feature A/i), { target: { value: 'Task CRUD' } });
}

function fillStep2(dataStorage: 'Không cần' | 'Local Database (SQLite)' = 'Không cần') {
    fireEvent.change(screen.getByPlaceholderText('Windows, macOS, Linux...'), { target: { value: 'Windows, macOS' } });
    const selects = screen.getAllByRole('combobox');
    fireEvent.change(selects[0], { target: { value: 'High' } }); // performancePriority
    fireEvent.change(selects[2], { target: { value: dataStorage } }); // dataStorage
}

function fillStep3() {
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Monolithic' } });
}

function fillStep4() {
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'SQLite' } });
    fireEvent.change(screen.getByPlaceholderText(/VD: User, Task, Category, Tag/i), { target: { value: 'User, Task' } });
}

function fillStep5(apiStyle: 'REST API' | 'None' = 'REST API') {
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: apiStyle } });
}

function fillStep7() {
    fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'GitHub Releases' } });
}

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

    it('navigates through all steps to review (step 4 skipped)', async () => {
        render(<AppBuilderWizard onBack={vi.fn()} />);

        // Step 1: Requirements
        fireEvent.change(screen.getByPlaceholderText('VD: TaskFlow'), { target: { value: 'TaskFlow' } });
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Desktop App' } });
        fireEvent.change(screen.getByPlaceholderText('Mô tả vấn đề user đang gặp phải...'), { target: { value: 'Need better task tracking' } });
        fireEvent.change(screen.getByPlaceholderText('Ai sẽ dùng app này?'), { target: { value: 'Small teams' } });
        fireEvent.change(screen.getByPlaceholderText(/Feature A/i), { target: { value: 'Task CRUD' } });
        clickNext();

        await waitFor(() => {
            expect(document.body.textContent).toContain('Tech Stack');
        });

        // Step 2: Tech Stack (set dataStorage = "Không cần" to skip step 4)
        fireEvent.change(screen.getByPlaceholderText('Windows, macOS, Linux...'), { target: { value: 'Windows, macOS' } });
        const step2Selects = screen.getAllByRole('combobox');
        fireEvent.change(step2Selects[0], { target: { value: 'High' } }); // performancePriority
        fireEvent.change(step2Selects[2], { target: { value: 'Không cần' } }); // dataStorage
        clickNext();

        await waitFor(() => {
            expect(document.body.textContent).toContain('Architecture');
        });

        // Step 3: Architecture
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'Monolithic' } });
        clickNext();

        // Step 4 should be skipped -> Step 5
        await waitFor(() => {
            expect(document.body.textContent).toContain('API Design');
        });

        // Step 5: API Design
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'REST API' } });
        clickNext();

        await waitFor(() => {
            expect(document.body.textContent).toContain('App Spec');
        });

        // Step 6: App Spec (no required fields)
        clickNext();

        await waitFor(() => {
            expect(document.body.textContent).toContain('Deployment');
        });

        // Step 7: Deployment
        fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: 'GitHub Releases' } });
        clickNext();

        await waitFor(() => {
            expect(document.body.textContent).toContain('Review');
        });
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

    it('does not jump to locked future step before completing required fields', () => {
        render(<AppBuilderWizard onBack={vi.fn()} />);
        const reviewButton = screen.getByText('Review').closest('button') as HTMLButtonElement;
        expect(reviewButton.disabled).toBe(true);
        fireEvent.click(reviewButton);
        expect(document.body.textContent).toContain('Step 1: Requirements');
    });

    it('shows database step when dataStorage requires it', async () => {
        render(<AppBuilderWizard onBack={vi.fn()} />);

        fillStep1('Desktop App');
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Tech Stack'));

        fillStep2('Local Database (SQLite)');
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Architecture'));

        fillStep3();
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Database'));
    });

    it('shows CLI-specific fields in App Spec step', async () => {
        render(<AppBuilderWizard onBack={vi.fn()} />);

        fillStep1('CLI Tool');
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Tech Stack'));
        fillStep2('Không cần');
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Architecture'));
        fillStep3();
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('API Design'));
        fillStep5('REST API');
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('App Spec'));

        expect(screen.getByPlaceholderText(/VD: add, list, done, delete, search/i)).toBeTruthy();
        expect(screen.queryByPlaceholderText(/VD: 1200x800/i)).toBeNull();
    });

    it('generates review spec with database section and without API section when API style is None', async () => {
        render(<AppBuilderWizard onBack={vi.fn()} />);

        fillStep1('Desktop App');
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Tech Stack'));
        fillStep2('Local Database (SQLite)');
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Architecture'));
        fillStep3();
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Database'));
        fillStep4();
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('API Design'));
        fillStep5('None');
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('App Spec'));
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Deployment'));
        fillStep7();
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Review'));

        const specText = document.body.textContent || '';
        expect(specText).toContain('## 4️⃣ DATABASE SCHEMA');
        expect(specText).not.toContain('## 5️⃣ API DESIGN');
    });

    it('generates CLI defaults in review spec when optional fields are empty', async () => {
        render(<AppBuilderWizard onBack={vi.fn()} />);

        fillStep1('CLI Tool');
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Tech Stack'));
        fillStep2('Không cần');
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Architecture'));
        fillStep3();
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('API Design'));
        fillStep5('None');
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('App Spec'));
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Deployment'));
        fillStep7();
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Review'));

        const specText = document.body.textContent || '';
        expect(specText).toContain('### CLI Tool Config');
        expect(specText).toContain('Output Formats:** text, json');
        expect(specText).toContain('**UI Style:** Modern Dark');
    });

    it('opens and closes export panel from review step', async () => {
        render(<AppBuilderWizard onBack={vi.fn()} />);

        fillStep1('Desktop App');
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Tech Stack'));
        fillStep2('Không cần');
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Architecture'));
        fillStep3();
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('API Design'));
        fillStep5('REST API');
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('App Spec'));
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Deployment'));
        fillStep7();
        clickNext();
        await waitFor(() => expect(document.body.textContent).toContain('Review'));

        fireEvent.click(screen.getByText('Xuất Spec'));
        expect(screen.getByText('SpecExportMock')).toBeTruthy();
        fireEvent.click(screen.getByText('CloseExportMock'));
        await waitFor(() => expect(document.body.textContent).toContain('Review'));
    });

    it('ignores invalid draft JSON from localStorage', () => {
        localStorage.setItem('cvf_wizard_draft', '{invalid json');
        render(<AppBuilderWizard onBack={vi.fn()} />);
        expect(screen.queryByText(/You have an unfinished draft/i)).toBeNull();
    });
});
