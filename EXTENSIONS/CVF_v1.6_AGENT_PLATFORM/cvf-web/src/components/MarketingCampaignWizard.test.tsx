/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MarketingCampaignWizard } from './MarketingCampaignWizard';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'vi', t: (key: string) => key }),
}));

vi.mock('@/lib/spec-gate', () => ({
    evaluateSpecGate: () => ({ status: 'PASS', missing: [], score: 1 }),
}));

vi.mock('./ProcessingScreen', () => ({
    ProcessingScreen: ({
        templateName,
        executionOverrides,
        onComplete,
        onCancel,
    }: {
        templateName: string;
        executionOverrides?: {
            cvfPhase?: string;
            cvfRiskLevel?: string;
            skillPreflightDeclaration?: string;
        };
        onComplete: (output: string) => void;
        onCancel: () => void;
    }) => (
        <div>
            <p>ProcessingScreenMock:{templateName}</p>
            <p>Phase:{executionOverrides?.cvfPhase}</p>
            <p>Risk:{executionOverrides?.cvfRiskLevel}</p>
            <p>Skill:{executionOverrides?.skillPreflightDeclaration}</p>
            <button onClick={() => onComplete('Live governed marketing output')}>CompleteProcessingMock</button>
            <button onClick={onCancel}>CancelProcessingMock</button>
        </div>
    ),
}));

function fillAll() {
    screen.getAllByRole('textbox').forEach(tb => fireEvent.change(tb, { target: { value: 'Test data' } }));
    screen.queryAllByRole('combobox').forEach(sel => {
        const opts = sel.querySelectorAll('option');
        if (opts.length > 1) fireEvent.change(sel, { target: { value: opts[1].getAttribute('value') } });
    });
}
function clickNext() { fireEvent.click(screen.getByText('Tiếp tục →')); }

describe('MarketingCampaignWizard', () => {
    beforeEach(() => { localStorage.clear(); });

    it('requires campaign goal fields before advancing', () => {
        render(<MarketingCampaignWizard onBack={vi.fn()} />);
        const nextButton = screen.getByText('Tiếp tục →') as HTMLButtonElement;
        expect(nextButton.disabled).toBe(true);
        fireEvent.change(screen.getByPlaceholderText(/Q1 Product Launch/i), { target: { value: 'Q1 Product Launch' } });
        fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Lead Generation' } });
        fireEvent.change(screen.getByPlaceholderText(/Tăng 20% traffic/i), { target: { value: 'Increase traffic' } });
        fireEvent.change(screen.getByPlaceholderText(/Traffic: \+20%/i), { target: { value: 'Traffic +20%' } });
        fireEvent.change(screen.getByPlaceholderText(/01\/02\/2026/i), { target: { value: '01/02/2026' } });
        expect(nextButton.disabled).toBe(false);
    });

    it('navigates step 1→2 and back', () => {
        render(<MarketingCampaignWizard onBack={vi.fn()} />);
        fillAll(); clickNext();
        expect(document.body.textContent).toContain('Target Audience');
        fireEvent.click(screen.getByText('← Trước'));
        expect(document.body.textContent).toContain('Campaign Goals');
    });

    it('navigates through all steps to review', () => {
        render(<MarketingCampaignWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        expect(document.body.textContent).toContain('MARKETING CAMPAIGN');
    });

    it('shows and opens export on review', () => {
        render(<MarketingCampaignWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        const exportBtn = screen.getByText(/Xuất Campaign Brief/);
        fireEvent.click(exportBtn);
        expect(document.body.textContent).toMatch(/Copy to Clipboard|Sao chép/);
    });

    it('loads draft from localStorage', () => {
        localStorage.setItem('cvf_marketing_campaign_wizard_draft', JSON.stringify({ data: { campaignName: 'X' }, step: 1, savedAt: Date.now() }));
        render(<MarketingCampaignWizard onBack={vi.fn()} />);
        expect(document.body.textContent).toMatch(/draft|nháp/i);
    });

    it('loads draft when Continue is clicked', () => {
        localStorage.setItem('cvf_marketing_campaign_wizard_draft', JSON.stringify({ data: { campaignName: 'Draft C' }, step: 2, savedAt: new Date().toISOString() }));
        render(<MarketingCampaignWizard onBack={vi.fn()} />);
        fireEvent.click(screen.getByText('Tiếp tục'));
        expect(document.body.textContent).toContain('Target Audience');
    });

    it('clears draft when Start New is clicked', () => {
        localStorage.setItem('cvf_marketing_campaign_wizard_draft', JSON.stringify({ data: { campaignName: 'X' }, step: 2, savedAt: new Date().toISOString() }));
        render(<MarketingCampaignWizard onBack={vi.fn()} />);
        fireEvent.click(screen.getByText('Bắt đầu mới'));
        expect(document.body.textContent).toContain('Campaign Goals');
        expect(localStorage.getItem('cvf_marketing_campaign_wizard_draft')).toBeNull();
    });

    it('jumps to completed step via indicator', () => {
        render(<MarketingCampaignWizard onBack={vi.fn()} />);
        fillAll(); clickNext();
        fillAll(); clickNext();
        fireEvent.click(screen.getByText('Campaign Goals').closest('button')!);
        expect(document.body.textContent).toContain('Step 1');
    });

    it('copies spec to clipboard from export', () => {
        const spy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue();
        vi.spyOn(window, 'alert').mockImplementation(() => {});
        render(<MarketingCampaignWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        fireEvent.click(screen.getByText(/Xuất Campaign Brief/));
        fireEvent.click(screen.getByText(/Copy to Clipboard/));
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('downloads .md from export', () => {
        const spy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test');
        render(<MarketingCampaignWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();
        fireEvent.click(screen.getByText(/Xuất Campaign Brief/));
        fireEvent.click(screen.getByText(/Download .md/));
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('shows governed packet on review step', async () => {
        render(<MarketingCampaignWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();

        fireEvent.click(screen.getByText('Governed demo packet'));

        expect(await screen.findByText(/Governed campaign packet cho non-coder/i)).toBeTruthy();
        expect(screen.getAllByText(/Approval checkpoints/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Freeze receipt/i).length).toBeGreaterThan(0);
        expect(screen.getAllByText(/Execution handoff/i).length).toBeGreaterThan(0);
    });

    it('launches live governed path from review step', async () => {
        render(<MarketingCampaignWizard onBack={vi.fn()} />);
        fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext(); fillAll(); clickNext();

        fireEvent.click(screen.getByText('Chạy live governed path'));

        expect(await screen.findByText(/ProcessingScreenMock:Marketing Campaign Wizard/i)).toBeTruthy();
        expect(screen.getByText('Phase:BUILD')).toBeTruthy();
        expect(screen.getByText('Risk:R1')).toBeTruthy();
        expect(screen.getByText(/Skill:NONCODER_REFERENCE_PACKET:marketing-test-data/i)).toBeTruthy();

        fireEvent.click(screen.getByText('CompleteProcessingMock'));

        expect(await screen.findByText(/Live Governed Run đã hoàn tất/i)).toBeTruthy();
        expect(screen.getByText(/Live governed marketing output/i)).toBeTruthy();
        expect(screen.getAllByText(/Freeze receipt/i).length).toBeGreaterThan(0);
    });
});
