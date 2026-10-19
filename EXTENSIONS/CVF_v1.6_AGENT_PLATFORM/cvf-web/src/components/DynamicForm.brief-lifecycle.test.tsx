/**
 * @vitest-environment jsdom
 *
 * Offline parent/child panel-lifetime proof. DynamicForm and SpecExport stay real;
 * local settings, enforcement decisions, context and browser export adapters are
 * synthetic seams only. No AI governance behavior is asserted.
 *
 * Text Encoding Exception: Vietnamese labels are asserted verbatim because they
 * are the user-facing confirmation and close controls in this surface.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DynamicForm } from './DynamicForm';
import type { Template } from '@/types';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

vi.mock('@/lib/skill-template-map', () => ({ getSkillForTemplate: () => null }));

vi.mock('./Settings', () => ({
    useSettings: () => ({
        settings: { preferences: { defaultExportMode: 'simple', defaultLanguage: 'vi' } },
        isLoaded: true,
    }),
}));

vi.mock('./UserContext', () => ({
    useUserContext: () => ({ getContextPrompt: () => '' }),
}));

vi.mock('./WorkflowVisualizer', () => ({
    WorkflowVisualizer: ({ mode }: { mode: string }) => <div data-testid="workflow-visualizer">{mode}</div>,
}));

vi.mock('@/lib/spec-gate', () => ({
    evaluateSpecGate: vi.fn(() => ({ status: 'PASS', missing: [], providedCount: 1, requiredCount: 1 })),
}));

vi.mock('@/lib/enforcement', () => ({
    evaluateEnforcement: vi.fn(() => ({
        status: 'ALLOW', reasons: [], governanceStateSnapshot: {}, source: 'client',
    })),
}));

vi.mock('@/lib/enforcement-log', () => ({ logEnforcementDecision: vi.fn() }));

vi.mock('@/lib/governance-context', () => ({
    autoDetectGovernance: vi.fn(() => ({ phase: 'INTAKE', role: 'ANALYST', riskLevel: 'R1' })),
    buildGovernanceSpecBlock: vi.fn(() => ''),
    isRiskAllowed: vi.fn(() => true),
}));

const template = {
    id: 'brief-lifecycle-test',
    name: 'Brief lifecycle test',
    icon: '📝',
    description: 'A local idea brief for panel lifecycle regression coverage.',
    category: 'business',
    difficulty: 'easy',
    fields: [
        { id: 'idea', type: 'textarea', label: 'Idea', placeholder: 'Describe the idea', required: true },
    ],
    intentPattern: 'Idea: [idea]',
    outputExpected: ['A Working Brief'],
} as Template;

const SOURCE_A = 'ALPHA-IDEA-4017 preserve the confirmed source packet';
const SOURCE_B = 'BRAVO-IDEA-9026 temporary replacement idea';

let createObjectUrl: ReturnType<typeof vi.fn>;
let revokeObjectUrl: ReturnType<typeof vi.fn>;
let clipboardWrite: ReturnType<typeof vi.fn>;
let anchorClick: ReturnType<typeof vi.fn>;

const ideaField = () => screen.getByPlaceholderText('Describe the idea');
const status = () => screen.getByRole('status', { name: 'Trạng thái ý tưởng' });
const confirmButton = () => screen.getByRole('button', { name: 'Xác nhận ý tưởng và xuất cho agent' });
const englishPacket = () => screen.getByRole('region', { name: 'English Working Brief' }).querySelector('pre')?.textContent ?? '';

beforeEach(() => {
    createObjectUrl = vi.fn(() => 'blob:brief-lifecycle');
    revokeObjectUrl = vi.fn();
    clipboardWrite = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(URL, 'createObjectURL', { configurable: true, value: createObjectUrl });
    Object.defineProperty(URL, 'revokeObjectURL', { configurable: true, value: revokeObjectUrl });
    Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: { writeText: clipboardWrite },
    });
    anchorClick = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
});

afterEach(() => vi.restoreAllMocks());

describe('DynamicForm brief panel voluntary-close lifetime', () => {
    it('keeps the same confirmed packet through both open controls and invalidates hidden A -> B -> A edits', async () => {
        const onSubmit = vi.fn();
        const onSendToAgent = vi.fn();
        const { container } = render(
            <DynamicForm template={template} onSubmit={onSubmit} onBack={vi.fn()} onSendToAgent={onSendToAgent} />,
        );

        expect(screen.queryByRole('status', { name: 'Trạng thái ý tưởng' })).toBeNull();
        expect(createObjectUrl).not.toHaveBeenCalled();
        expect(anchorClick).not.toHaveBeenCalled();
        expect(clipboardWrite).not.toHaveBeenCalled();
        expect(onSendToAgent).not.toHaveBeenCalled();

        fireEvent.change(ideaField(), { target: { value: SOURCE_A } });
        fireEvent.click(screen.getByRole('button', { name: /Export Spec/ }));
        expect(status().textContent).toContain('Phiên bản ý tưởng 1');
        expect(createObjectUrl).not.toHaveBeenCalled();

        fireEvent.click(confirmButton());
        await waitFor(() => expect(createObjectUrl).toHaveBeenCalledOnce());
        expect(anchorClick).toHaveBeenCalledOnce();
        fireEvent.click(screen.getByRole('button', { name: 'Xem English Working Brief (tùy chọn)' }));
        const confirmedPacket = englishPacket();
        expect(confirmedPacket).toContain(SOURCE_A);
        expect(status().textContent).toContain('Đã xác nhận ý tưởng');

        fireEvent.click(screen.getByRole('button', { name: 'Đóng phần xuất brief' }));
        expect(screen.queryByRole('status', { name: 'Trạng thái ý tưởng' })).toBeNull();
        fireEvent.click(screen.getByRole('button', { name: /Create Agent Spec/ }));

        expect(status().textContent).toContain('Phiên bản ý tưởng 1');
        expect(status().textContent).toContain('Đã xác nhận ý tưởng');
        expect(englishPacket()).toBe(confirmedPacket);
        expect(createObjectUrl).toHaveBeenCalledOnce();
        expect(anchorClick).toHaveBeenCalledOnce();
        expect(clipboardWrite).not.toHaveBeenCalled();
        expect(onSendToAgent).not.toHaveBeenCalled();

        // The form's Export Spec button is also a close toggle. Edits continue to
        // reach the mounted child while hidden, so returning to A cannot revive r1.
        fireEvent.click(screen.getByRole('button', { name: /Export Spec/ }));
        expect(screen.queryByRole('status', { name: 'Trạng thái ý tưởng' })).toBeNull();
        fireEvent.change(ideaField(), { target: { value: SOURCE_B } });
        fireEvent.change(ideaField(), { target: { value: SOURCE_A } });
        expect(screen.queryByRole('status', { name: 'Trạng thái ý tưởng' })).toBeNull();

        fireEvent.click(screen.getByRole('button', { name: /Export Spec/ }));

        expect(status().textContent).toContain('Phiên bản ý tưởng 3');
        expect(status().textContent).toContain('Chưa xác nhận ý tưởng');
        expect(status().textContent).toContain('Working Brief chưa tạo');
        expect(screen.getByRole('region', { name: 'English Working Brief' }).querySelector('pre')).toBeNull();
        expect((screen.getByRole('button', { name: 'Gửi Working Brief cho Agent INTAKE' }) as HTMLButtonElement).disabled).toBe(true);
        expect(createObjectUrl).toHaveBeenCalledOnce();
        expect(anchorClick).toHaveBeenCalledOnce();
        expect(clipboardWrite).not.toHaveBeenCalled();
        expect(onSendToAgent).not.toHaveBeenCalled();
        expect(onSubmit).not.toHaveBeenCalled();
        expect(container.querySelector('[hidden]')).toBeNull();
    });
});
