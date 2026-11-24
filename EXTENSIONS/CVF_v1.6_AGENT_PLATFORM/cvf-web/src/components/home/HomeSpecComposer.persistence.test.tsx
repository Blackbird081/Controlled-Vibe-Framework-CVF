// Text Encoding Exception: the locale-switch tests use the Vietnamese New Work action.
import { act, cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';
import { HomeSpecAccountScope } from '@/lib/hooks/useHomeSpecInput';
import { HomeSpecComposer } from './HomeSpecComposer';

const fixture = vi.hoisted(() => ({
    scope: 'persistence-account',
    choose: vi.fn(),
}));

vi.mock('@/components/Settings', () => ({
    useSettings: () => ({ settings: { providers: { openai: {} }, preferences: { defaultProvider: 'openai' } } }),
}));
vi.mock('@/lib/home-spec-jev-client', () => ({
    requestHomeSpecJev: fixture.choose,
}));

function composer(language: 'en' | 'vi', props?: Partial<ComponentProps<typeof HomeSpecComposer>>) {
    return <HomeSpecAccountScope.Provider value={{ accountScope: fixture.scope, canUseSettings: false }}>
        <HomeSpecComposer language={language} library={<p>Library</p>} providers={[]} {...props} />
    </HomeSpecAccountScope.Provider>;
}

function renderComposer(language: 'en' | 'vi', props?: Partial<ComponentProps<typeof HomeSpecComposer>>) {
    return render(composer(language, props));
}

function enterDescription(value: string) {
    fireEvent.change(screen.getByRole('textbox', { name: 'What do you want to create?' }), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
    const newTask = screen.queryByRole('button', { name: 'Continue with the new task' });
    if (newTask) fireEvent.click(newTask);
}

function readDownload(blob: Blob) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result));
        reader.onerror = () => reject(reader.error);
        reader.readAsText(blob);
    });
}

describe('Home specification input retention', () => {
    beforeEach(() => {
        fixture.scope = 'persistence-account';
        fixture.choose.mockReset();
        sessionStorage.clear();
    });
    afterEach(() => {
        cleanup();
        vi.restoreAllMocks();
    });

    it('offers a top New Work action and keeps an unfinished draft until the user confirms', async () => {
        const confirm = vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
        const first = renderComposer('en');
        const start = within(screen.getByRole('banner')).getByRole('button', { name: 'Start new work' });
        const previous = '  A private draft for the bakery.  ';
        fireEvent.change(screen.getByRole('textbox'), { target: { value: previous } });
        fireEvent.click(start);
        expect(confirm).toHaveBeenCalledWith(expect.stringMatching(/discard.*draft/i));
        expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(previous);
        fireEvent.click(start);
        expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
        await waitFor(() => expect(screen.getByRole('textbox')).toBe(document.activeElement));
        first.unmount();
        renderComposer('vi');
        expect(screen.getByRole('button', { name: 'Bắt đầu việc mới' })).toBeTruthy();
        expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
    });

    it('shows the next-work action near a successful download and keeps a failed download unsaved', async () => {
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
        const createUrl = vi.spyOn(URL, 'createObjectURL').mockImplementationOnce(() => {
            throw Error('Synthetic failed download preparation');
        }).mockReturnValue('blob:home-reset');
        const anchor = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        const mounted = renderComposer('en', { initialTemplate: 'web_build_handoff' });
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Build a bakery preorder site.' } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Use this outcome' }));
        fireEvent.change(await screen.findByRole('textbox', { name: 'Who will use this website?' }), { target: { value: 'Previous customers' } });
        fireEvent.click(await screen.findByRole('button', { name: 'Review specification' }));
        expect(screen.getAllByRole('button', { name: 'Start new work' })).toHaveLength(1);
        fireEvent.click(screen.getByRole('button', { name: 'Download specification' }));
        expect(screen.getByRole('alert')).toBeTruthy();
        expect(anchor).not.toHaveBeenCalled();
        fireEvent.click(screen.getByRole('button', { name: 'Start new work' }));
        expect(confirm).toHaveBeenCalledOnce();
        expect(screen.getByRole('article')).toBeTruthy();

        fireEvent.click(screen.getByRole('button', { name: 'Download specification' }));
        expect(createUrl).toHaveBeenCalledTimes(2);
        expect(anchor).toHaveBeenCalledOnce();
        fireEvent.click(screen.getAllByRole('button', { name: 'Start new work' })[1]);
        expect(confirm).toHaveBeenCalledOnce();
        expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
        mounted.unmount();
        renderComposer('en');
        expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
        expect(JSON.stringify([...Object.values(sessionStorage)])).not.toContain('Previous customers');
    });

    it('never carries a mounted journey across account changes', async () => {
        const mounted = renderComposer('en', { initialTemplate: 'web_build_handoff' });
        fireEvent.change(screen.getByRole('textbox'), { target: { value: 'Account one workshop details' } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Use this outcome' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Review specification' }));
        expect(screen.getByRole('article').textContent).toContain('Account one workshop details');
        fixture.scope = 'replacement-account';
        mounted.rerender(composer('en'));
        expect(screen.queryByRole('article')).toBeNull();
        expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
        fixture.scope = 'persistence-account';
        mounted.rerender(composer('vi'));
        expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('Account one workshop details');
    });

    it('marks an edited download as unsaved across a reload', async () => {
        const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);
        vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:home-dirty');
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        const goal = 'Build a site for the Saturday market.';
        const original = renderComposer('en', { initialTemplate: 'web_build_handoff' });
        fireEvent.change(screen.getByRole('textbox'), { target: { value: goal } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Use this outcome' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Review specification' }));
        fireEvent.click(screen.getByRole('button', { name: 'Download specification' }));
        fireEvent.click(screen.getByRole('button', { name: 'Edit entered information' }));
        fireEvent.change(screen.getByRole('textbox', { name: 'Who will use this website?' }), { target: { value: 'First-time buyers' } });
        original.unmount();
        renderComposer('vi');
        fireEvent.click(screen.getByRole('button', { name: 'Bắt đầu việc mới' }));
        expect(confirm).toHaveBeenCalledOnce();
        expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(goal);
    });

    it('preserves an unscoped in-memory draft when a Home outcome is selected', async () => {
        const view = (selectionRequest: { id: string; revision: number } | null) =>
            <HomeSpecAccountScope.Provider value={{ accountScope: undefined, canUseSettings: false }}>
                <HomeSpecComposer language="en" library={<p>Library</p>} providers={[]} selectionRequest={selectionRequest} />
            </HomeSpecAccountScope.Provider>;
        const mounted = render(view(null));
        const goal = 'Unfinished bakery order details';
        fireEvent.change(screen.getByRole('textbox', { name: 'What do you want to create?' }), { target: { value: goal } });
        mounted.rerender(view({ id: 'short_message', revision: 1 }));
        await act(async () => { await Promise.resolve(); });
        expect((screen.getByRole('textbox', { name: 'What do you want to create?' }) as HTMLTextAreaElement).value).toBe(goal);
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        expect(await screen.findByText('Short message')).toBeTruthy();
    });

    it('retains exact input after leaving the page and changing language, and isolates another account', () => {
        const goal = '  A bakery site with weekend preorders.  ';
        const original = renderComposer('en');
        fireEvent.change(screen.getByRole('textbox', { name: 'What do you want to create?' }), { target: { value: goal } });
        original.unmount();

        const sameAccount = renderComposer('vi');
        expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe(goal);
        sameAccount.unmount();

        fixture.scope = 'another-account';
        renderComposer('en');
        expect((screen.getByRole('textbox') as HTMLTextAreaElement).value).toBe('');
    });

    it('retains a field answer after unmounting and selecting the same result again', async () => {
        fixture.choose.mockImplementation(async payload => payload.action === 'choose'
            ? { runId: 'fixture-run', templateId: 'web_build_handoff', decision: 'preselect', probability: 0.94 }
            : payload.action === 'fields'
                ? { missing: [{ id: 'audience', label: 'Audience' }] }
                : { enabled: true });
        const first = renderComposer('en');
        fireEvent.change(screen.getByRole('textbox', { name: 'What do you want to create?' }), { target: { value: 'A bakery preorder site' } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Use this outcome' }));
        const field = await screen.findByRole('textbox', { name: 'Who will use this website?' });
        fireEvent.change(field, { target: { value: 'Weekend customers' } });
        first.unmount();

        renderComposer('en');
        await waitFor(() => expect((screen.getByRole('textbox', { name: 'What do you want to create?' }) as HTMLTextAreaElement).value).toBe('A bakery preorder site'));
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Use this outcome' }));
        expect((await screen.findByRole('textbox', { name: 'Who will use this website?' }) as HTMLTextAreaElement).value).toBe('Weekend customers');
    });

    it('downloads H9.1, H9.2 and H9.3 in one session without mixing the three briefs', async () => {
        const blob = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:home-wave-five');
        vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        fixture.choose.mockImplementation(async ({ action, goal }) => {
            if (action !== 'choose') return { enabled: true };
            if (goal.includes('next 12 months of marketing')) {
                return { runId: 'h93', decision: 'preselect', templateId: 'operator_plan' };
            }
            if (goal.includes("I'm a freelance wedding photographer in Victoria")) {
                return { runId: 'h92', decision: 'preselect', templateId: 'home_contract_review' };
            }
            return goal.includes('portfolio website')
                ? { runId: 'h91', decision: 'clarify', topNoMatch: true }
                : { runId: 'h92', decision: 'clarify' };
        });
        const h91 = renderComposer('en');
        enterDescription('I need a portfolio website that shows my best galleries, lists my three packages with prices, and has an enquiry form that emails me');
        fireEvent.click(await screen.findByRole('button', { name: 'Create a general specification' }));
        fireEvent.change(screen.getByRole('textbox', { name: 'Context' }), { target: { value: 'Freelance wedding photographer in Melbourne. I have about 12 galleries, three packages at AUD 2,400 / 3,600 / 5,200, and I already have a domain but no hosting. Images are already compressed.' } });
        fireEvent.change(screen.getByRole('textbox', { name: 'Deliverable' }), { target: { value: 'A portfolio website showing my best galleries, a page listing my three packages with prices, and an enquiry form that emails hello@ (generic address, I have no real address to give).' } });
        fireEvent.click(screen.getByRole('button', { name: 'Review specification' }));
        fireEvent.click(screen.getByRole('button', { name: 'Download specification' }));
        h91.unmount();

        const h92 = renderComposer('en');
        enterDescription("I need a client contract template for wedding shoots - deposit, cancellation, image rights, what happens if I'm sick on the day");
        fireEvent.change(await screen.findByRole('textbox', { name: 'What other details should the assistant know?' }), { target: { value: "I'm a freelance wedding photographer in Victoria, Australia. Deposit is 30%. If the client cancels 30+ days before the wedding, 50% of the deposit is refunded. I haven't thought about insurance yet. I'm not a lawyer and don't have one." } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(await screen.findByRole('button', { name: 'No suitable template' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Create a general specification' }));
        fireEvent.change(screen.getByRole('textbox', { name: 'Constraints' }), { target: { value: "Victoria, Australia law. 30% deposit. Cancellation 30+ days before the wedding = 50% of the deposit refunded. I haven't thought about insurance, and I'm not a lawyer and have none." } });
        fireEvent.click(screen.getByRole('button', { name: 'Review specification' }));
        fireEvent.click(screen.getByRole('button', { name: 'Download specification' }));
        h92.unmount();

        renderComposer('en');
        enterDescription('plan the next 12 months of marketing for me, I want more autumn weddings and I only have about 5 hours a week');
        fireEvent.click(await screen.findByRole('button', { name: 'No suitable template' }));
        fireEvent.change(await screen.findByRole('textbox', { name: 'What other details should the assistant know?' }), { target: { value: "I'm a freelance wedding photographer in Melbourne. My ad budget is AUD 0 to 150 a month. I'm strongest on Instagram. I have no email list. Last year I shot 6 autumn weddings and I want 12." } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(await screen.findByRole('button', { name: 'No suitable template' }));
        fireEvent.click(await screen.findByRole('button', { name: 'Create a general specification' }));
        fireEvent.change(screen.getByRole('textbox', { name: 'What will tell you the work is done?' }), { target: { value: 'Booking 12 autumn weddings in the next year, up from 6 last year.' } });
        fireEvent.click(screen.getByRole('button', { name: 'Review specification' }));
        fireEvent.click(screen.getByRole('button', { name: 'Download specification' }));

        expect(blob).toHaveBeenCalledTimes(3);
        const downloads = await Promise.all(blob.mock.calls.map(([file]) => {
            if (!(file instanceof Blob)) throw new Error('Expected a downloaded specification Blob.');
            return readDownload(file);
        }));
        expect(downloads[0]).toContain('AUD 2,400 / 3,600 / 5,200');
        expect(downloads[1]).toContain('Victoria, Australia law');
        expect(downloads[2]).toContain('Instagram');
        expect(downloads[2]).toContain('Booking 12 autumn weddings');
        for (const content of [downloads[2], screen.getByRole('article').textContent]) {
            expect(content).not.toMatch(/portfolio website|AUD 2,400|Victoria, Australia law|30% deposit|cancellation/i);
        }
        expect(downloads[1]).not.toMatch(/portfolio website|AUD 2,400/i);
    });

    it('keeps a prior task downloadable as a draft after switching, and keeps answers on a typo', async () => {
        const original = 'Build a bakery preodrer site.';
        const first = renderComposer('en', { initialTemplate: 'web_build_handoff' });
        enterDescription(original);
        fireEvent.click(await screen.findByRole('button', { name: 'Use this outcome' }));
        fireEvent.change(await screen.findByRole('textbox', { name: 'Who will use this website?' }), { target: { value: 'Weekend customers' } });
        first.unmount();

        const second = renderComposer('en', { initialTemplate: 'web_build_handoff' });
        const corrected = 'Build a bakery preorder site!';
        enterDescription(corrected);
        expect(screen.queryByText('Is this a new task?')).toBeNull();
        fireEvent.click(await screen.findByRole('button', { name: 'Use this outcome' }));
        expect((await screen.findByRole('textbox', { name: 'Who will use this website?' }) as HTMLTextAreaElement).value).toBe('Weekend customers');
        second.unmount();

        const third = renderComposer('en', { initialTemplate: 'web_build_handoff' });
        enterDescription('Build an online application for new volunteers.');
        fireEvent.click(await screen.findByRole('button', { name: 'Use this outcome' }));
        expect((await screen.findByRole('textbox', { name: 'Who will use this website?' }) as HTMLTextAreaElement).value).toBe('');
        third.unmount();

        renderComposer('en');
        fireEvent.click(screen.getByText('Unfinished drafts'));
        fireEvent.click(screen.getByRole('button', { name: corrected }));
        expect((await screen.findByRole('textbox', { name: 'Who will use this website?' }) as HTMLTextAreaElement).value).toBe('Weekend customers');
        fireEvent.click(screen.getByRole('button', { name: 'Review specification' }));
        expect(screen.getByRole('article').textContent).toContain(corrected);
    });

    it('keeps both the edited goal and answers when the user says it is still the same task', async () => {
        const initialTemplate = 'web_build_handoff';
        const original = 'Build a bakery preorder site.';
        const edited = 'Build a bakery preorder site for weekend pickup.';
        const first = renderComposer('en', { initialTemplate });
        enterDescription(original);
        fireEvent.click(await screen.findByRole('button', { name: 'Use this outcome' }));
        fireEvent.change(await screen.findByRole('textbox', { name: 'Who will use this website?' }), {
            target: { value: 'Neighborhood customers' },
        });
        first.unmount();

        const resumed = renderComposer('en', { initialTemplate });
        fireEvent.change(screen.getByRole('textbox', { name: 'What do you want to create?' }), { target: { value: edited } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        const dialog = screen.getByRole('group', { name: 'Is this a new task?' });
        const choices = within(dialog).getAllByRole('button');
        expect(choices).toHaveLength(3);
        expect(choices[0].textContent).toBe('Continue with the new task');
        await waitFor(() => expect(document.activeElement).toBe(choices[0]));

        fireEvent.click(within(dialog).getByRole('button', { name: 'Same task, keep my answers' }));
        expect((await screen.findByRole<HTMLTextAreaElement>('textbox', { name: 'Who will use this website?' })).value).toBe('Neighborhood customers');
        fireEvent.click(screen.getByRole('button', { name: 'Review specification' }));
        expect(screen.getByRole('article').textContent).toContain(edited);
        expect(screen.getByRole('article').textContent).toContain('Neighborhood customers');
        resumed.unmount();

        renderComposer('en', { initialTemplate });
        expect(screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'What do you want to create?' }).value).toBe(edited);
    });

    it.each([
        { outcome: 'web_build_handoff', label: 'Who will use this website?', answer: 'Neighborhood customers' },
        { outcome: 'home-general', label: 'Context', answer: 'The bakery has a pickup counter' },
    ])('downloads the saved $outcome answers after reopening Home and editing the same task', async ({ outcome, label, answer }) => {
        const makeBlob = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:same-task');
        const downloadLink = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
        fixture.choose.mockResolvedValue(outcome === 'home-general'
            ? { decision: 'clarify', topNoMatch: true }
            : { decision: 'preselect', templateId: outcome });
        const original = 'Build a bakery preorder site.';
        const edited = 'Build a bakery preorder site for weekend pickup.';
        const first = renderComposer('en');
        enterDescription(original);
        const confirm = outcome === 'home-general' ? 'Create a general specification' : 'Use this outcome';
        fireEvent.click(await screen.findByRole('button', { name: confirm }));
        fireEvent.change(await screen.findByRole('textbox', { name: label }), { target: { value: answer } });
        first.unmount();

        fixture.choose.mockClear().mockResolvedValue({ decision: 'preselect', templateId: 'operator_plan' });
        renderComposer('en');
        const goal = screen.getByRole('textbox', { name: 'What do you want to create?' });
        fireEvent.change(goal, { target: { value: edited } });
        fireEvent.click(screen.getByRole('button', { name: 'Continue' }));
        fireEvent.click(screen.getByRole('button', { name: 'Same task, keep my answers' }));

        const nextActions = await screen.findAllByRole('button', { name: /review specification|use this outcome/i });
        if (nextActions[0].textContent === 'Use this outcome') fireEvent.click(nextActions[0]);
        fireEvent.click(await screen.findByRole('button', { name: 'Review specification' }));
        fireEvent.click(screen.getByRole('button', { name: 'Download specification' }));
        const [file] = makeBlob.mock.calls[0];
        if (!(file instanceof Blob)) throw new Error('Expected a downloaded specification Blob.');
        const downloaded = await readDownload(file);
        expect(downloaded).toContain(edited);
        expect(downloaded).toContain(answer);
        expect((downloadLink.mock.instances[0] as HTMLAnchorElement).download).toContain(`cvf-spec-${outcome}-`);
        expect(screen.getByRole('article').textContent).toContain(answer);
        expect(fixture.choose).not.toHaveBeenCalled();
    });

    it('imports the starter input once and retains both descriptions after remounting', () => {
        const starter = 'Existing notes from the starter';
        const goal = 'My new draft';
        const imported = vi.fn();
        const original = renderComposer('en');
        fireEvent.change(screen.getByRole('textbox', { name: 'What do you want to create?' }), { target: { value: goal } });
        original.rerender(composer('en', { starterGoal: starter, onStarterGoalImported: imported }));
        expect(imported).toHaveBeenCalled();
        original.unmount();

        renderComposer('en', { starterGoal: starter, onStarterGoalImported: imported });
        expect((screen.getByRole('textbox', { name: 'What do you want to create?' }) as HTMLTextAreaElement).value).toBe(`${goal}\n\n${starter}`);
    });
});
