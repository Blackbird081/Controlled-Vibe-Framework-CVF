/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkillLibrary } from './SkillLibrary';

const trackEventMock = vi.fn();
const getSkillCategoriesMock = vi.fn();

vi.mock('@/lib/analytics', () => ({
    trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

vi.mock('../actions/skills', () => ({
    getSkillCategories: () => getSkillCategoriesMock(),
}));

describe('SkillLibrary', () => {
    beforeEach(() => {
        trackEventMock.mockClear();
        getSkillCategoriesMock.mockReset();
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
});
