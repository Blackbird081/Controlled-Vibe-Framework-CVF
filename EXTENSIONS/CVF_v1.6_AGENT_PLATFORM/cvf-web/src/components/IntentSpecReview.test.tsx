// Text Encoding Exception: Vietnamese user-facing copy and matching localization fixtures.
/** @vitest-environment jsdom */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
const auth = vi.hoisted(() => ({
    session: { status: 'authenticated', data: { user: { userId: 'user_a', orgId: 'org_a', teamId: 'team_a' }, expires: '2999-01-01T00:00:00.000Z' } } as
        { status: string; data: { user: { userId: string; orgId: string; teamId: string }; expires: string } | null },
}));
vi.mock('next-auth/react', () => ({ useSession: () => auth.session }));
import { IntentSpecReview, useIntentSpecReview } from './IntentSpecReview';
import type { ReviewLanguage } from '@/lib/intent-spec-review';

afterEach(cleanup);
const values = { targetUsers: 'Team leads', dataNeeds: 'Synthetic report entries', coreFeatures: 'Compile weekly reports' };

function Harness({ input = values, language = 'en', packet = 'Initial packet', templateId = 'app_builder_complete' }: {
    input?: Record<string, string>; language?: ReviewLanguage; packet?: string; templateId?: string;
}) {
    const draft = useIntentSpecReview(templateId, input, packet, language);
    return <>
        {draft.review && <IntentSpecReview review={draft.review} language={language}
            onUpdate={draft.update} onAcknowledge={draft.acknowledge} />}
        <textarea aria-label="Exported draft" readOnly value={draft.spec} />
        <button disabled={!draft.canContinue}>Continue draft handoff</button>
    </>;
}

describe('requirements review UI structure and local interactions', () => {
    it('shows three prompts without discarding the remaining unknowns', () => {
        render(<Harness />);
        expect(screen.getAllByRole('textbox')).toHaveLength(4);
        expect(screen.getByRole('status').textContent).toContain('6 items need a decision');
        expect((screen.getByLabelText('Exported draft') as HTMLTextAreaElement).value).toContain('exceptions');
        fireEvent.click(screen.getByRole('button', { name: 'Show all 6 questions' }));
        expect(screen.getAllByRole('textbox')).toHaveLength(7);
        fireEvent.click(screen.getByRole('button', { name: 'Show fewer' }));
        expect(screen.getByRole('status').textContent).toContain('6 items need a decision');
    });

    it('keeps partial viewing separate from complete answers and resets viewing after an edit', () => {
        render(<Harness />);
        fireEvent.click(screen.getByRole('button', { name: 'I have viewed this draft' }));
        expect(screen.getByRole('status').textContent).toContain('Viewed this revision');
        expect((screen.getByRole('button', { name: 'Continue draft handoff' }) as HTMLButtonElement).disabled).toBe(true);
        fireEvent.change(screen.getByLabelText('Who may view, edit or export information, and who may not?'), { target: { value: 'Only leads may export.' } });
        expect(screen.getByRole('status').textContent).toContain('Not viewed yet');
        expect((screen.getByLabelText('Exported draft') as HTMLTextAreaElement).value).toContain('Only leads may export.');
    });

    it('retains a stale answer visibly when related brief fields change', () => {
        const { rerender } = render(<Harness />);
        fireEvent.change(screen.getByLabelText('Who may view, edit or export information, and who may not?'), { target: { value: 'Lead-only access.' } });
        fireEvent.click(screen.getByRole('button', { name: 'I have viewed this draft' }));
        rerender(<Harness input={{ ...values, targetUsers: 'All employees' }} packet="Updated packet" />);
        expect(screen.getByRole('status').textContent).toContain('Not viewed yet');
        expect((screen.getByLabelText('Who may view, edit or export information, and who may not?') as HTMLTextAreaElement).value).toBe('Lead-only access.');
        expect(screen.getByText('Related brief information changed. The old answer is kept for you to review.')).toBeDefined();
        fireEvent.click(screen.getByRole('button', { name: 'Keep answer for new revision' }));
        expect(screen.queryByText('Related brief information changed. The old answer is kept for you to review.')).toBeNull();
    });

    it('requires a not-applicable reason, preserves conflicts and localizes the controls', () => {
        const { rerender } = render(<Harness />);
        const section = screen.getByRole('region', { name: 'Requirements review' });
        fireEvent.change(within(section).getAllByRole('combobox')[0], { target: { value: 'NOT_APPLICABLE' } });
        expect(screen.getByText('Please give a reason why this does not apply.')).toBeDefined();
        fireEvent.change(screen.getByLabelText('What steps does the user take from start to completion?'), { target: { value: 'This fixture uses manual review only.' } });
        expect(screen.queryByText('Please give a reason why this does not apply.')).toBeNull();
        fireEvent.change(within(section).getAllByRole('combobox')[1], { target: { value: 'CONFLICT' } });
        fireEvent.change(screen.getByLabelText('Who may view, edit or export information, and who may not?'), { target: { value: 'Two owners disagree.' } });
        expect((screen.getByLabelText('Exported draft') as HTMLTextAreaElement).value).toContain('Status: Conflicting');
        rerender(<Harness language="vi" packet="Bản tiếng Việt" />);
        expect(screen.getByRole('region', { name: 'Review yêu cầu' })).toBeDefined();
        expect(screen.getByRole('button', { name: 'Tôi đã xem bản nháp này' })).toBeDefined();
        expect(screen.getByText(/Bản review chỉ nằm trong phiên này/)).toBeDefined();
    });

    it('requires all explicit decisions and current viewing before draft continuation', () => {
        render(<Harness />);
        fireEvent.click(screen.getByRole('button', { name: 'Show all 6 questions' }));
        const region = screen.getByRole('region', { name: 'Requirements review' });
        within(region).getAllByRole('textbox').forEach((input, index) => {
            fireEvent.change(input, { target: { value: `User decision ${index}` } });
        });
        const button = screen.getByRole('button', { name: 'Continue draft handoff' }) as HTMLButtonElement;
        expect(button.disabled).toBe(true);
        fireEvent.click(screen.getByRole('button', { name: 'I have viewed this draft' }));
        expect(button.disabled).toBe(false);
    });

    it('leaves unrelated templates and their packet untouched', () => {
        render(<Harness templateId="unrelated" packet="Legacy packet exactly" />);
        expect(screen.queryByRole('region')).toBeNull();
        expect((screen.getByLabelText('Exported draft') as HTMLTextAreaElement).value).toBe('Legacy packet exactly');
        expect((screen.getByRole('button', { name: 'Continue draft handoff' }) as HTMLButtonElement).disabled).toBe(false);
    });
});

// NIS T1E: explicit open points in the review UI. Synthetic input; local component state only, no network.
describe('NIS T1E open points in the requirements review UI', () => {
    const richValues = { ...values, lookAndFeel: 'Plain table' };
    const addPoint = (text: string, options: { fields?: string[]; status?: string; extra?: string } = {}) => {
        fireEvent.click(screen.getAllByRole('button', { name: 'Add an open point' })[0]);
        fireEvent.change(screen.getByLabelText('What is unknown or in conflict'), { target: { value: text } });
        for (const field of options.fields ?? []) fireEvent.click(screen.getByLabelText(({ lookAndFeel: '10. Look and feel', coreFeatures: '5. The most important things the app must do', dataNeeds: '9. What data does the app need to remember or process?', targetUsers: '4. Who will use this product?' } as Record<string, string>)[field]));
        if (options.status) fireEvent.change(screen.getByLabelText('Open point status'), { target: { value: options.status } });
        if (options.extra !== undefined) {
            fireEvent.change(screen.getByLabelText(options.status === 'DELEGATED' ? 'What the builder may decide' : 'Decision that applies'), { target: { value: options.extra } });
        }
        fireEvent.click(screen.getByRole('button', { name: 'Save open point' }));
    };

    it('AC-U1: stores a valid open point, shows it with its status, and puts it in the exported draft without any network call', () => {
        const fetchSpy = vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('no network in this test'));
        render(<Harness />);
        expect(screen.queryByRole('list')).toBeNull();
        addPoint('How long raw entries are kept is not decided.', { fields: ['dataNeeds'] });
        expect(screen.getByRole('list', { name: 'Open points for this question' }).textContent).toContain('U1 · Unknown · Open');
        const draft = (screen.getByLabelText('Exported draft') as HTMLTextAreaElement).value;
        expect(draft).toContain('User-declared open items: 1 open, 0 delegated, 0 resolved.');
        expect(draft).toContain('> How long raw entries are kept is not decided.');
        expect(draft).toContain('> dataNeeds: Synthetic report entries');
        expect(fetchSpy).not.toHaveBeenCalled();
        fetchSpy.mockRestore();
    });

    it('AC-U1: invalid input shows the reason and stores nothing', () => {
        render(<Harness />);
        addPoint('   ');
        expect(screen.getByRole('alert').textContent).toBe('Describe what is unknown or in conflict (up to 2000 characters).');
        expect(screen.queryByRole('list')).toBeNull();
        expect((screen.getByLabelText('Exported draft') as HTMLTextAreaElement).value).not.toContain('User-declared open items');
        fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(screen.queryByRole('alert')).toBeNull();
        fireEvent.click(screen.getAllByRole('button', { name: 'Add an open point' })[0]);
        fireEvent.change(screen.getByLabelText('Kind'), { target: { value: 'CONFLICT' } });
        fireEvent.change(screen.getByLabelText('What is unknown or in conflict'), { target: { value: 'Two brief fields disagree.' } });
        fireEvent.click(screen.getByLabelText('4. Who will use this product?'));
        fireEvent.click(screen.getByRole('button', { name: 'Save open point' }));
        expect(screen.getByRole('alert').textContent).toBe('A conflict needs at least two brief fields.');
    });

    it('AC-U2: counts of open points show apart from items needing a decision and from viewing; resolved and delegated need their text', () => {
        render(<Harness />);
        addPoint('A point.', { status: 'RESOLVED', extra: '' });
        expect(screen.getByRole('alert').textContent).toBe('Write the decision that applies.');
        fireEvent.change(screen.getByLabelText('Decision that applies'), { target: { value: 'Keep six months.' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save open point' }));
        const status = screen.getByRole('status').textContent ?? '';
        expect(status).toContain('6 items need a decision');
        expect(status).toContain('Not viewed yet');
        expect(status).toContain('Open points you declared: 0 open, 0 delegated, 1 resolved');
        addPoint('Second point.', { status: 'DELEGATED', extra: '' });
        expect(screen.getByRole('alert').textContent).toBe('Write the boundary the builder may decide within.');
        fireEvent.change(screen.getByLabelText('What the builder may decide'), { target: { value: 'Any plain label.' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save open point' }));
        expect(screen.getByRole('status').textContent).toContain('Open points you declared: 0 open, 1 delegated, 1 resolved');
        expect(screen.getByText(/Builder may decide within: Any plain label\./)).toBeDefined();
    });

    it('AC-U3/U4: a stale point blocks continuation until it is explicitly checked again; open points alone never block', () => {
        const { rerender } = render(<Harness input={richValues} />);
        fireEvent.click(screen.getByRole('button', { name: 'Show all 6 questions' }));
        within(screen.getByRole('region', { name: 'Requirements review' })).getAllByRole('textbox').forEach((input, index) => {
            fireEvent.change(input, { target: { value: `User decision ${index}` } });
        });
        addPoint('The look is not decided.', { fields: ['lookAndFeel'] });
        const next = screen.getByRole('button', { name: 'Continue draft handoff' }) as HTMLButtonElement;
        fireEvent.click(screen.getByRole('button', { name: 'I have viewed this draft' }));
        expect(next.disabled).toBe(false);
        rerender(<Harness input={{ ...richValues, lookAndFeel: 'Dark theme' }} packet="Updated packet" />);
        expect(screen.getAllByText('Related brief information changed. Check this point again.')).toHaveLength(1);
        while (screen.queryAllByRole('button', { name: 'Keep answer for new revision' }).length) {
            fireEvent.click(screen.queryAllByRole('button', { name: 'Keep answer for new revision' })[0]);
        }
        fireEvent.click(screen.getByRole('button', { name: 'I have viewed this draft' }));
        // Every decision is kept and viewed, but the stale point still holds the decision pending.
        expect(next.disabled).toBe(true);
        fireEvent.click(screen.getByRole('button', { name: 'Check U1 again' }));
        expect(screen.queryByText('Related brief information changed. Check this point again.')).toBeNull();
        expect(screen.getByRole('status').textContent).toContain('Not viewed yet');
        fireEvent.click(screen.getByRole('button', { name: 'I have viewed this draft' }));
        expect(next.disabled).toBe(false);
        expect((screen.getByLabelText('Exported draft') as HTMLTextAreaElement).value).toContain('> lookAndFeel: Dark theme');
    });

    it('edits and removes a point, each clearing the viewed state', () => {
        render(<Harness />);
        addPoint('First wording.');
        fireEvent.click(screen.getByRole('button', { name: 'I have viewed this draft' }));
        expect(screen.getByRole('status').textContent).toContain('Viewed this revision');
        fireEvent.click(screen.getByRole('button', { name: 'Edit U1' }));
        expect(screen.queryByLabelText('Kind')).toBeNull();
        fireEvent.change(screen.getByLabelText('What is unknown or in conflict'), { target: { value: 'Second wording.' } });
        fireEvent.click(screen.getByRole('button', { name: 'Save open point' }));
        expect(screen.getByRole('status').textContent).toContain('Not viewed yet');
        expect(screen.getByText('Second wording.')).toBeDefined();
        fireEvent.click(screen.getByRole('button', { name: 'Remove U1' }));
        expect(screen.queryByRole('list')).toBeNull();
        expect((screen.getByLabelText('Exported draft') as HTMLTextAreaElement).value).not.toContain('User-declared open items');
    });

    it('localizes the open point controls and counts in Vietnamese', () => {
        render(<Harness language="vi" />);
        fireEvent.click(screen.getAllByRole('button', { name: 'Thêm điểm mở' })[0]);
        fireEvent.change(screen.getByLabelText('Điều chưa biết hoặc mâu thuẫn'), { target: { value: 'Thời gian lưu chưa quyết.' } });
        fireEvent.click(screen.getByRole('button', { name: 'Lưu điểm mở' }));
        expect(screen.getByRole('list', { name: 'Điểm mở của câu hỏi này' }).textContent).toContain('U1 · Chưa biết · Còn mở');
        expect(screen.getByRole('status').textContent).toContain('Điểm mở bạn khai báo: 1 còn mở, 0 đã ủy quyền, 0 đã giải quyết');
        expect((screen.getByLabelText('Exported draft') as HTMLTextAreaElement).value).toContain('## Mục chưa giải quyết và quyết định có hiệu lực');
    });

    it('leaves unrelated templates without any open point control', () => {
        render(<Harness templateId="unrelated" packet="Legacy packet exactly" />);
        expect(screen.queryByRole('button', { name: 'Add an open point' })).toBeNull();
        expect((screen.getByLabelText('Exported draft') as HTMLTextAreaElement).value).toBe('Legacy packet exactly');
    });
});

// Local reviewer regression: reuse the existing brief labels in the new field controls.
it.each(['en', 'vi'] as const)('Local uses readable brief labels in %s rather than internal field keys', language => {
    render(<Harness language={language} />);
    fireEvent.click(screen.getAllByRole('button', { name: language === 'en' ? 'Add an open point' : 'Thêm điểm mở' })[0]);
    expect(screen.queryByRole('checkbox', { name: 'coreFeatures' })).toBeNull();
    expect(screen.getByRole('checkbox', { name: language === 'en'
        ? '5. The most important things the app must do' : '5. Những việc quan trọng nhất app phải làm được' })).toBeTruthy();
});
