/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { SkillLibrary } from './SkillLibrary';

const trackEventMock = vi.fn();
const getSkillCategoriesMock = vi.fn();
const saveUatContentMock = vi.fn();
const routerPushMock = vi.fn();
const fetchMock = vi.fn();

vi.mock('@/lib/analytics', () => ({
    trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({
        push: routerPushMock,
        replace: vi.fn(),
        prefetch: vi.fn(),
        refresh: vi.fn(),
        back: vi.fn(),
        forward: vi.fn(),
    }),
}));

vi.mock('../actions/skills', () => ({
    getSkillCategories: () => getSkillCategoriesMock(),
    saveUatContent: (...args: unknown[]) => saveUatContentMock(...args),
}));

describe('SkillLibrary', () => {
    beforeEach(() => {
        trackEventMock.mockClear();
        getSkillCategoriesMock.mockReset();
        saveUatContentMock.mockReset();
        fetchMock.mockReset();
        fetchMock.mockRejectedValue(new Error('fetch failed'));
        // @ts-expect-error - assign test fetch
        global.fetch = fetchMock;
    });

    it('tracks skill view and copy actions', async () => {
        getSkillCategoriesMock.mockResolvedValue([
            {
                id: 'dev',
                name: 'Development',
                skills: [
                    {
                        id: 'skill-1',
                        title: 'Skill One',
                        domain: 'App Development',
                        difficulty: 'Easy',
                        summary: 'Summary',
                        path: 'skill-1',
                        content: '# Skill One',
                    },
                ],
            },
        ]);

        render(<SkillLibrary />);

        await waitFor(() => expect(screen.getByText('Skill One')).toBeTruthy());
        expect(screen.getByText('Select a skill to view')).toBeTruthy();
        fireEvent.click(screen.getByText('Skill One'));

        expect(trackEventMock).toHaveBeenCalledWith('skill_viewed', expect.objectContaining({
            skillId: 'skill-1',
            skillTitle: 'Skill One',
        }));

        const copyButton = screen.getByText(/Copy Raw/i);
        fireEvent.click(copyButton);
        expect(trackEventMock).toHaveBeenCalledWith('skill_copied', expect.objectContaining({
            skillId: 'skill-1',
            skillTitle: 'Skill One',
        }));
    });

    it('shows loading spinner and empty state when no skills exist', async () => {
        let resolve: (value: unknown) => void;
        const promise = new Promise((res) => { resolve = res; });
        getSkillCategoriesMock.mockReturnValue(promise);

        const { container } = render(<SkillLibrary />);
        expect(container.querySelector('.animate-spin')).toBeTruthy();

        resolve!([]);
        await waitFor(() => expect(screen.getByText(/No skills found matching/i)).toBeTruthy());
    });

    it('filters skills and renders difficulty badges', async () => {
        getSkillCategoriesMock.mockResolvedValue([
            {
                id: 'dev',
                name: 'Development',
                skills: [
                    {
                        id: 'skill-1',
                        title: 'Skill Easy',
                        domain: 'App Development',
                        difficulty: 'Easy',
                        summary: 'Summary',
                        path: 'skill-1',
                        content: '# Easy',
                    },
                    {
                        id: 'skill-2',
                        title: 'Skill Medium',
                        domain: 'App Development',
                        difficulty: 'Medium',
                        summary: 'Summary',
                        path: 'skill-2',
                        content: '# Medium',
                    },
                    {
                        id: 'skill-3',
                        title: 'Skill Advanced',
                        domain: 'App Development',
                        difficulty: 'Advanced',
                        summary: 'Summary',
                        path: 'skill-3',
                        content: '# Advanced',
                    },
                ],
            },
        ]);

        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Skill Easy')).toBeTruthy());

        expect(screen.getByText('Easy')).toBeTruthy();
        expect(screen.getByText('Med')).toBeTruthy();
        expect(screen.getByText('Adv')).toBeTruthy();

        const search = screen.getByPlaceholderText(/Search skills/i);
        fireEvent.change(search, { target: { value: 'zzz' } });
        expect(screen.getByText(/No skills found matching/i)).toBeTruthy();
    });

    it('handles failed skill loading gracefully', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        getSkillCategoriesMock.mockRejectedValue(new Error('fail'));

        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText(/No skills found matching/i)).toBeTruthy());

        consoleSpy.mockRestore();
    });

    it('renders domain report metrics and filters by UAT/spec criteria', async () => {
        getSkillCategoriesMock.mockResolvedValue([
            {
                id: 'app',
                name: 'App Development',
                skills: [
                    {
                        id: 'skill-a',
                        title: 'Skill A',
                        domain: 'App Development',
                        difficulty: 'Easy',
                        summary: 'Summary',
                        path: 'skill-a',
                        content: '# Skill A',
                        uatStatus: 'PASS',
                        uatScore: 80,
                        uatQuality: 'Good',
                        specScore: 90,
                        specQuality: 'Excellent',
                    },
                    {
                        id: 'skill-b',
                        title: 'Skill B',
                        domain: 'App Development',
                        difficulty: 'Medium',
                        summary: 'Summary',
                        path: 'skill-b',
                        content: '# Skill B',
                        uatStatus: 'Not Run',
                        uatScore: 0,
                        specScore: 0,
                        specQuality: 'Not Ready',
                    },
                ],
            },
            {
                id: 'web',
                name: 'Web Development',
                skills: [
                    {
                        id: 'skill-c',
                        title: 'Skill C',
                        domain: 'Web Development',
                        difficulty: 'Advanced',
                        summary: 'Summary',
                        path: 'skill-c',
                        content: '# Skill C',
                        uatStatus: 'SOFT FAIL',
                        uatScore: 40,
                        specScore: 70,
                        specQuality: 'Needs Review',
                    },
                ],
            },
            {
                id: 'finance',
                name: 'Finance Analytics',
                skills: [
                    {
                        id: 'skill-d',
                        title: 'Skill D',
                        domain: 'Finance Analytics',
                        difficulty: 'Easy',
                        summary: 'Summary',
                        path: 'skill-d',
                        content: '# Skill D',
                        uatStatus: 'Not Run',
                        uatScore: 0,
                        specScore: 0,
                        specQuality: 'Not Ready',
                    },
                ],
            },
        ]);

        render(<SkillLibrary />);

        await waitFor(() => expect(screen.getAllByText('App Development').length).toBeGreaterThan(0));
        const reportTable = screen.getByRole('table');
        const tableScope = within(reportTable);

        expect(tableScope.getByText('App Development')).toBeTruthy();
        expect(tableScope.getByText('Web Development')).toBeTruthy();
        expect(tableScope.getByText('Finance Analytics')).toBeTruthy();

        const onlyWithUatToggle = screen.getByLabelText(/Only domains with Output UAT/i);
        fireEvent.click(onlyWithUatToggle);
        expect(tableScope.queryByText('Finance Analytics')).toBeNull();

        const minSpecSelect = screen.getByLabelText(/Min Spec Score/i);
        fireEvent.change(minSpecSelect, { target: { value: '70' } });
        expect(tableScope.queryByText('App Development')).toBeNull();
        expect(tableScope.getByText('Web Development')).toBeTruthy();
    });

    it('allows editing UAT content and saves updates', async () => {
        getSkillCategoriesMock.mockResolvedValue([
            {
                id: 'app',
                name: 'App Development',
                skills: [
                    {
                        id: 'skill-a',
                        title: 'Skill A',
                        domain: 'App Development',
                        difficulty: 'Easy',
                        summary: 'Summary',
                        path: 'skill-a',
                        content: '# Skill A',
                        uatContent: '## UAT A',
                        uatStatus: 'PASS',
                        uatScore: 80,
                        uatQuality: 'Good',
                        specScore: 90,
                        specQuality: 'Excellent',
                        specGate: 'PASS',
                    },
                ],
            },
        ]);

        saveUatContentMock.mockResolvedValue({
            content: '## UAT Updated',
            status: 'PASS',
            score: 95,
            quality: 'Excellent',
        });

        render(<SkillLibrary />);

        await waitFor(() => expect(screen.getByText('Skill A')).toBeTruthy());
        fireEvent.click(screen.getByText('Skill A'));
        fireEvent.click(screen.getByText('UAT'));
        fireEvent.click(screen.getByText('Edit'));

        const textarea = screen.getByPlaceholderText(/Edit UAT markdown/i);
        fireEvent.change(textarea, { target: { value: '## UAT Updated' } });
        fireEvent.click(screen.getByText('Save UAT'));

        await waitFor(() => expect(screen.getByText('UAT Updated')).toBeTruthy());
        expect(saveUatContentMock).toHaveBeenCalledWith('skill-a', '## UAT Updated');
    });

    it('blocks UAT edit when Spec Gate fails', async () => {
        getSkillCategoriesMock.mockResolvedValue([
            {
                id: 'app',
                name: 'App Development',
                skills: [
                    {
                        id: 'skill-b',
                        title: 'Skill B',
                        domain: 'App Development',
                        difficulty: 'Medium',
                        summary: 'Summary',
                        path: 'skill-b',
                        content: '# Skill B',
                        uatContent: '## UAT B',
                        uatStatus: 'Not Run',
                        uatScore: 0,
                        specGate: 'FAIL',
                    },
                ],
            },
        ]);

        render(<SkillLibrary />);

        await waitFor(() => expect(screen.getByText('Skill B')).toBeTruthy());
        fireEvent.click(screen.getByText('Skill B'));
        fireEvent.click(screen.getByText('UAT'));

        expect(screen.getByText(/Spec Gate = FAIL/i)).toBeTruthy();
        const editButton = screen.getByText('Edit') as HTMLButtonElement;
        expect(editButton.disabled).toBe(true);
    });
});
