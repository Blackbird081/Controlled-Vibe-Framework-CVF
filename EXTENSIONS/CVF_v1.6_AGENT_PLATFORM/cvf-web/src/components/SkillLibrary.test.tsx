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
let mockLanguage = 'en';
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
            language: mockLanguage,
            t: (key: string) => mockLanguage === 'vi' && key === 'skills.searchPlaceholder'
                ? 'T\u00ecm ki\u1ebfm skill...'
                : enTranslations[key] ?? key,
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
        mockLanguage = 'en';
        trackEventMock.mockClear();
        routerPushMock.mockClear();
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

        await waitFor(() => expect(screen.getByText(/Fixture Skill One/i)).toBeTruthy());
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

    it('renders ASSF projection metadata only for projected package records', async () => {
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('CVF Dispatch Quality Reviewer')).toBeTruthy());

        fireEvent.click(screen.getByText('CVF Dispatch Quality Reviewer'));

        await waitFor(() => {
            expect(screen.getByText('Certified ASSF')).toBeTruthy();
            expect(screen.getByText('ASSF package projection')).toBeTruthy();
            expect(screen.getByText('Certification: CERTIFIED')).toBeTruthy();
            expect(screen.getByText('UAT: PASSED')).toBeTruthy();
            expect(screen.getByText('Adapter: DEFERRED_WITH_REASON')).toBeTruthy();
        });
    });

    it('renders runtime package projection metadata from the Skill Control Plane', async () => {
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('CVF Engineering API And Interface Design')).toBeTruthy());

        fireEvent.click(screen.getByText('CVF Engineering API And Interface Design'));

        await waitFor(() => {
            expect(screen.getByText('Runtime package')).toBeTruthy();
            expect(screen.getByText('Runtime eligible: YES')).toBeTruthy();
            expect(screen.getByText('Activation: ACTIVATION_READY')).toBeTruthy();
            expect(screen.getByText('Domain: api-interface-design')).toBeTruthy();
            expect(screen.getByText('Adapter: IMPLEMENTED')).toBeTruthy();
        });
    });
    it('filters by group name or id while preserving skill matches, counts, and reset', async () => {
        setCategories([
            { id: 'design', name: 'Design', skills: [
                { id: 'alpha-id', title: 'Alpha', domain: 'Design', difficulty: 'Easy', summary: '', path: '', content: '' },
                { id: 'other-id', title: 'Other', domain: 'Design', difficulty: 'Easy', summary: '', path: '', content: '' },
            ] },
            { id: 'ops-code', name: 'Operations', skills: [
                { id: 'beta-id', title: 'Beta', domain: 'Operations', difficulty: 'Easy', summary: '', path: '', content: '' },
            ] },
        ]);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Alpha')).toBeTruthy());
        const input = screen.getByRole('textbox', { name: 'Search skills...' });
        fireEvent.change(input, { target: { value: 'OPERATIONS' } });
        expect(screen.getByText('Beta')).toBeTruthy();
        expect(screen.getByText('1/1')).toBeTruthy();
        expect(screen.queryByText('Alpha')).toBeNull();
        fireEvent.change(input, { target: { value: 'OPS-CODE' } });
        expect(screen.getByText('Beta')).toBeTruthy();
        fireEvent.change(input, { target: { value: 'AlPhA' } });
        expect(screen.getByText('Alpha')).toBeTruthy();
        expect(screen.getByText('1/2')).toBeTruthy();
        expect(screen.queryByText('Other')).toBeNull();
        fireEvent.change(input, { target: { value: 'OTHER-ID' } });
        expect(screen.getByText('Other')).toBeTruthy();
        fireEvent.change(input, { target: { value: 'no-such-skill' } });
        expect(screen.getByText(/No skills found matching/)).toBeTruthy();
        fireEvent.change(input, { target: { value: '' } });
        expect(screen.getByText('Alpha')).toBeTruthy();
        expect(screen.getByText('Beta')).toBeTruthy();
    });

    it('exposes the existing localized Vietnamese search label', async () => {
        mockLanguage = 'vi';
        render(<SkillLibrary />);
        expect(await screen.findByRole('textbox', { name: 'T\u00ecm ki\u1ebfm skill...' })).toBeTruthy();
    });

    it('keeps category identity for duplicate ids and pointer and keyboard navigation', async () => {
        setCategories([
            { id: 'dev', name: 'Development', skills: [
                { id: 's1', title: 'First Skill', domain: 'App Development', difficulty: 'Easy', summary: '', path: '', content: '# First body' },
            ] },
            { id: 'other', name: 'Other Group', skills: [
                { id: 's1', title: 'Second Skill', domain: 'App Development', difficulty: 'Easy', summary: '', path: '', content: '# Second body' },
            ] },
        ]);
        render(<SkillLibrary />);
        const first = await screen.findByRole('button', { name: /First Skill/ });
        const second = screen.getByRole('button', { name: /Second Skill/ });
        fireEvent.click(first);
        fireEvent.click(screen.getByTitle('Open'));
        expect(routerPushMock).toHaveBeenLastCalledWith('/skills/dev/s1');
        expect(getTemplatesForSkillMock).toHaveBeenCalledWith('app_development', 's1');
        expect(first.className).toContain('bg-blue-50/50');
        expect(second.className).not.toContain('bg-blue-50/50');
        fireEvent.keyDown(second, { key: 'Enter' });
        expect(screen.getByText('Second body')).toBeTruthy();
        fireEvent.click(screen.getByTitle('Open'));
        expect(routerPushMock).toHaveBeenLastCalledWith('/skills/other/s1');
        expect(first.className).not.toContain('bg-blue-50/50');
        expect(second.className).toContain('bg-blue-50/50');
        fireEvent.keyDown(first, { key: ' ' });
        fireEvent.click(screen.getByTitle('Open'));
        expect(routerPushMock).toHaveBeenLastCalledWith('/skills/dev/s1');
        expect(screen.getByText('First body')).toBeTruthy();
    });

});
