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

let mockLanguage = 'en';

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
    const translations: Record<string, Record<string, string>> = {
        en: {
            'skills.library': 'Skill Library',
            'skills.searchPlaceholder': 'Search skills...',
            'skills.noResults': 'No skills found matching',
            'skills.selectSkill': 'Select a skill to explore',
            'skills.selectSkillDesc': 'Browse the governed catalog',
            'skills.useTemplate': 'Use Template',
            'skills.browseTemplates': 'Browse templates',
            'skills.copyRaw': 'Copy Raw',
        },
        vi: {
            'skills.library': 'Thư viện Skill',
            'skills.searchPlaceholder': 'Tìm kiếm skill...',
            'skills.noResults': 'Không tìm thấy kết quả cho',
            'skills.selectSkill': 'Chọn một skill để xem',
            'skills.selectSkillDesc': 'Duyệt danh mục governed ở cột bên trái',
            'skills.useTemplate': 'Dùng Mẫu',
            'skills.browseTemplates': 'Duyệt các mẫu',
            'skills.copyRaw': 'Sao Chép Cấu Trúc',
        }
    };
    return {
        useLanguage: () => ({
            language: mockLanguage,
            t: (key: string) => translations[mockLanguage][key] ?? key,
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

const sampleSkill = {
    id: 's1',
    title: 'Test Skill',
    domain: 'App Development',
    domainId: 'app-dev',
    difficulty: 'Easy',
    summary: 'A test skill',
    path: 's1',
    content: '# Test Content\n\nMD body',
    riskLevel: 'Medium',
    autonomy: 'Supervised',
    allowedRoles: 'Developer',
    allowedPhases: 'Development',
    authorityScope: 'Local',
};

const sampleCategories = [
    {
        id: 'dev',
        name: 'Development',
        skills: [sampleSkill],
    },
];

describe('SkillLibrary i18n - EN mode', () => {
    beforeEach(() => {
        mockLanguage = 'en';
        trackEventMock.mockClear();
        getSkillCategoriesMock.mockReset();
        setFetchPayload(fixtureCategories);
    });

    it('renders sidebar header and search in English', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Skill Library')).toBeTruthy());
        expect(screen.getByPlaceholderText('Search skills...')).toBeTruthy();
    });

    it('renders empty state in English', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Select a skill to explore')).toBeTruthy());
    });

    it('renders skill detail actions in English', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Test Skill')).toBeTruthy());
        fireEvent.click(screen.getByText('Test Skill'));
        expect(screen.getByText(/Copy Raw/)).toBeTruthy();
    });
});

describe('SkillLibrary i18n - VI mode', () => {
    beforeEach(() => {
        mockLanguage = 'vi';
        trackEventMock.mockClear();
        getSkillCategoriesMock.mockReset();
        setFetchPayload(fixtureCategories);
    });

    it('renders sidebar header and search in Vietnamese', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Thư viện Skill')).toBeTruthy());
        expect(screen.getByPlaceholderText('Tìm kiếm skill...')).toBeTruthy();
    });

    it('renders empty state in Vietnamese', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Chọn một skill để xem')).toBeTruthy());
    });

    it('renders skill detail actions in Vietnamese', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => fireEvent.click(screen.getByText('Test Skill')));
        expect(screen.getByText(/Sao Chép Cấu Trúc/)).toBeTruthy();
    });
});
