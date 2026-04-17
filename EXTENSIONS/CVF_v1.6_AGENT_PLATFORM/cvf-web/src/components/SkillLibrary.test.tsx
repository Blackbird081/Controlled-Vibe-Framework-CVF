/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SkillLibrary } from './SkillLibrary';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const trackEventMock = vi.fn();
const getSkillCategoriesMock = vi.fn();
const routerPushMock = vi.fn();
const fetchMock = vi.fn();
const fixturePath = resolve(dirname(fileURLToPath(import.meta.url)), '__fixtures__/skills-index.fixture.json');
const fixtureCategories = JSON.parse(readFileSync(fixturePath, 'utf-8'));

const setFetchPayload = (payload: unknown) => {
    fetchMock.mockReset();
    fetchMock.mockResolvedValue({
        ok: true,
        json: async () => payload,
    });
    vi.stubGlobal('fetch', fetchMock);
};

const setCategories = (categories: unknown) => {
    setFetchPayload(categories);
    getSkillCategoriesMock.mockResolvedValue(categories);
};

vi.mock('@/lib/analytics', () => ({
    trackEvent: (...args: unknown[]) => trackEventMock(...args),
}));

vi.mock('@/lib/i18n', () => {
    const enTranslations: Record<string, string> = {
        'skills.library': 'Skill Library',
        'skills.searchPlaceholder': 'Search skills...',
        'skills.noResults': 'No skills found matching',
        'skills.selectSkill': 'Select a skill to explore',
        'skills.selectSkillDesc': 'Browse the governed catalog',
        'skills.open': 'Open',
        'skills.copyRaw': 'Copy Raw',
        'skills.useTemplate': 'Use Template',
        'skills.browseTemplates': 'Browse templates',
    };
    return {
        useLanguage: () => ({
            language: 'en',
            t: (key: string) => enTranslations[key] ?? key,
        }),
    };
});

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
}));

const getTemplatesForSkillMock = vi.fn().mockReturnValue([]);
vi.mock('@/lib/skill-template-map', () => ({
    getTemplatesForSkill: (...args: unknown[]) => getTemplatesForSkillMock(...args),
    domainToCategoryMap: {},
}));
vi.mock('@/lib/template-loader', () => ({
    templates: [
        { id: 'tmpl-1', name: 'Template One', description: 'desc', steps: [] },
    ],
}));

describe('SkillLibrary', () => {
    beforeEach(() => {
        trackEventMock.mockClear();
        getSkillCategoriesMock.mockReset();
        getTemplatesForSkillMock.mockReset().mockReturnValue([]);
        setFetchPayload(fixtureCategories);
    });

    it('renders loading state initially', () => {
        render(<SkillLibrary />);
    });

    it('loads skills from public index.json without calling server action', async () => {
        render(<SkillLibrary />);
        // Wait for UI to update
        await waitFor(() => expect(screen.getByText('Skill Library')).toBeTruthy());

        // Assuming fixture has 'Write Code'
        await waitFor(() => expect(screen.getByText(/Write Code/i)).toBeTruthy());
        expect(getSkillCategoriesMock).not.toHaveBeenCalled();
    });

    it('falls back to server action if public index fails', async () => {
        fetchMock.mockRejectedValueOnce(new Error('Network error'));
        getSkillCategoriesMock.mockResolvedValueOnce([
            {
                id: 'fallback-cat',
                name: 'Fallback Category',
                skills: [
                    {
                        id: 'fallback-1',
                        title: 'Fallback Skill',
                        domain: 'Fallback Category',
                        difficulty: 'Easy',
                        summary: 'Summary',
                        path: 'fallback-1',
                        content: '# Content',
                    },
                ],
            },
        ]);

        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Fallback Category')).toBeTruthy());
        expect(getSkillCategoriesMock).toHaveBeenCalledTimes(1);
    });

    it('renders empty state hero when no skill is selected', async () => {
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Select a skill to explore')).toBeTruthy());
        expect(screen.getByText(/Browse the governed catalog/)).toBeTruthy();
    });

    it('filters skills by search term', async () => {
        setCategories([
            {
                id: 'cat',
                name: 'Category',
                skills: [
                    { id: 's1', title: 'Find Me', domain: 'Category', difficulty: 'Easy', summary: '', path: '', content: '' },
                    { id: 's2', title: 'Hide Me', domain: 'Category', difficulty: 'Easy', summary: '', path: '', content: '' },
                ],
            },
        ]);

        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Find Me')).toBeTruthy());

        const searchInput = screen.getByPlaceholderText('Search skills...');
        fireEvent.change(searchInput, { target: { value: 'hide' } });

        await waitFor(() => {
            expect(screen.queryByText('Find Me')).toBeNull();
            expect(screen.getByText('Hide Me')).toBeTruthy();
        });
    });

    it('selects a skill and shows its details', async () => {
        setCategories([
            {
                id: 'cat',
                name: 'Category',
                skills: [
                    {
                        id: 's1',
                        title: 'Test Skill',
                        domain: 'Category',
                        difficulty: 'Easy',
                        summary: '',
                        path: '',
                        content: '# Markdown Content',
                    },
                ],
            },
        ]);

        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Test Skill')).toBeTruthy());

        // Click the skill in sidebar
        fireEvent.click(screen.getByText('Test Skill'));

        // The Empty State should disappear, and Skill Details should appear
        await waitFor(() => {
            expect(screen.queryByText('Select a skill to explore')).toBeNull();
            expect(screen.getAllByText('Test Skill').length).toBeGreaterThan(1); // One in sidebar, one in header
            expect(screen.getByText('Markdown Content')).toBeTruthy();
        });

        // Analytics tracking should have been called
        expect(trackEventMock).toHaveBeenCalledWith('skill_viewed', expect.objectContaining({
            skillId: 's1',
            skillTitle: 'Test Skill',
        }));
    });
});
