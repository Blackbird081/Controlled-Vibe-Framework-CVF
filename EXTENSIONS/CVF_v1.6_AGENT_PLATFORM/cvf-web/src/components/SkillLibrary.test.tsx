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

// Mock i18n to return English translations (pass-through t function)
vi.mock('@/lib/i18n', () => {
    const enTranslations: Record<string, string> = {
        'skills.library': '📚 Skill Library',
        'skills.searchPlaceholder': 'Search skills...',
        'skills.noResults': 'No skills found matching',
        'skills.open': '↗ Open',
        'skills.easy': 'Easy',
        'skills.med': 'Med',
        'skills.adv': 'Adv',
        'skills.notRun': 'Not Run',
        'skills.domainReport': '📊 Domain Report',
        'skills.domainReportDesc': 'Quantity + quality of inputs by domain',
        'skills.totalSkills': 'Total skills',
        'skills.uatCoverage': 'Output UAT coverage',
        'skills.uatCompleted': 'Output UAT completed',
        'skills.specAvgLabel': 'Spec avg',
        'skills.uatNotRunHint': 'UAT not run → Output UAT score = 0',
        'skills.sort': 'Sort',
        'skills.countOption': 'Count',
        'skills.coverageOption': 'Coverage',
        'skills.specAvgOption': 'Spec Avg',
        'skills.nameOption': 'Name',
        'skills.sortDir': 'Sort Dir',
        'skills.desc': 'Desc',
        'skills.asc': 'Asc',
        'skills.minCount': 'Min Count',
        'skills.minCoverage': 'Min Coverage',
        'skills.minSpecScore': 'Min Spec Score',
        'skills.onlyWithUat': 'Only domains with Output UAT',
        'skills.showing': 'Showing',
        'skills.rows': 'Rows',
        'skills.prev': 'Prev',
        'skills.page': 'Page',
        'skills.next': 'Next',
        'skills.domain': 'Domain',
        'skills.outputUat': 'Output UAT',
        'skills.uatCoverageCol': 'Output UAT Coverage',
        'skills.specQualityCol': 'Spec Quality',
        'skills.excellent': 'Excellent',
        'skills.good': 'Good',
        'skills.needsReview': 'Needs Review',
        'skills.notReady': 'Not Ready',
        'skills.risk': 'Risk',
        'skills.autonomy': 'Autonomy',
        'skills.roles': 'Roles',
        'skills.phases': 'Phases',
        'skills.scope': 'Scope',
        'skills.specGate': 'Spec Gate',
        'skills.outputUatLabel': 'Output UAT',
        'skills.scoreLabel': 'Score',
        'skills.outputQuality': 'Output Quality',
        'skills.specLabel': 'Spec',
        'skills.specQualityLabel': 'Spec Quality',
        'skills.skillTab': 'Skill',
        'skills.uatTab': 'UAT',
        'skills.viewTab': 'View',
        'skills.editTab': 'Edit',
        'skills.copyRaw': '📋 Copy Raw',
        'skills.copied': 'Copied raw markdown!',
        'skills.specGateWarning': 'Spec Gate = FAIL. UAT can only be edited when the Spec meets standard.',
        'skills.editPlaceholder': 'Edit UAT markdown...',
        'skills.saveUat': 'Save UAT',
        'skills.cancel': 'Cancel',
        'skills.editorHint': 'UAT editor saves directly to the .md file.',
        'skills.noUat': 'No UAT record found for this skill.',
        'skills.selectSkill': 'Select a skill to view',
        'skills.selectSkillDesc': 'Browse the library on the left to view detailed skill documentation, inputs, and expected outputs.',
        'skills.useTemplate': '📝 Use Template',
        'skills.useTemplateTitle': 'Use template',
        'skills.browseTemplates': '📝 Browse templates',
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
    saveUatContent: (...args: unknown[]) => saveUatContentMock(...args),
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
        saveUatContentMock.mockReset();
        fetchMock.mockReset();
        fetchMock.mockRejectedValue(new Error('fetch failed'));
        getTemplatesForSkillMock.mockReset().mockReturnValue([]);
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

    it('renders linked templates when getTemplatesForSkill returns IDs', async () => {
        getTemplatesForSkillMock.mockReturnValue(['tmpl-1']);
        getSkillCategoriesMock.mockResolvedValue([{
            id: 'dev', name: 'Development',
            skills: [{
                id: 'skill-1', title: 'Skill One', domain: 'App Development',
                difficulty: 'Easy', summary: 'Summary', path: 'skill-1', content: '# Skill One',
            }],
        }]);

        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Skill One')).toBeTruthy());
        fireEvent.click(screen.getByText('Skill One'));

        await waitFor(() => expect(screen.getByText(/Template One/)).toBeTruthy());
    });

    it('shows browse templates link when no linked templates but domain has category', async () => {
        getTemplatesForSkillMock.mockReturnValue([]);
        // Dynamically set a mapping value for this test
        const stm = await import('@/lib/skill-template-map');
        (stm.domainToCategoryMap as Record<string, string>)['app_development'] = 'App';

        getSkillCategoriesMock.mockResolvedValue([{
            id: 'dev', name: 'Development',
            skills: [{
                id: 'skill-1', title: 'Skill One', domain: 'App Development',
                difficulty: 'Easy', summary: 'Summary', path: 'skill-1', content: '# Skill One',
            }],
        }]);

        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Skill One')).toBeTruthy());
        fireEvent.click(screen.getByText('Skill One'));

        await waitFor(() => expect(screen.getByText(/Browse templates.*App/)).toBeTruthy());
        delete (stm.domainToCategoryMap as Record<string, string>)['app_development'];
    });

    it('toggles view mode between Skill and UAT', async () => {
        getSkillCategoriesMock.mockResolvedValue([{
            id: 'dev', name: 'Development',
            skills: [{
                id: 'skill-1', title: 'Skill One', domain: 'App Development',
                difficulty: 'Easy', summary: 'Summary', path: 'skill-1', content: '# Skill One',
                uatContent: '## UAT', uatStatus: 'PASS', uatScore: 80, specGate: 'PASS',
            }],
        }]);

        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Skill One')).toBeTruthy());
        fireEvent.click(screen.getByText('Skill One'));

        // Default is Skill mode
        expect(screen.getByText('Skill')).toBeTruthy();
        // Switch to UAT
        fireEvent.click(screen.getByText('UAT'));
        // Switch back to Skill
        fireEvent.click(screen.getByText('Skill'));
        // Skill mode shows the raw content
        expect(screen.getByText(/Copy Raw/)).toBeTruthy();
    });

    it('cancels UAT edit and reverts draft', async () => {
        getSkillCategoriesMock.mockResolvedValue([{
            id: 'app', name: 'App Development',
            skills: [{
                id: 'skill-a', title: 'Skill A', domain: 'App Development',
                difficulty: 'Easy', summary: 'Summary', path: 'skill-a', content: '# Skill A',
                uatContent: '## UAT Original', uatStatus: 'PASS', uatScore: 80, specGate: 'PASS',
            }],
        }]);

        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Skill A')).toBeTruthy());
        fireEvent.click(screen.getByText('Skill A'));
        fireEvent.click(screen.getByText('UAT'));
        fireEvent.click(screen.getByText('Edit'));

        const textarea = screen.getByPlaceholderText(/Edit UAT markdown/i);
        fireEvent.change(textarea, { target: { value: '## Modified' } });
        fireEvent.click(screen.getByText('Cancel'));

        // After cancel, edit mode should exit (no textarea visible)
        expect(screen.queryByPlaceholderText(/Edit UAT markdown/i)).toBeNull();
    });

    it('filters domain report by min count and min coverage', async () => {
        getSkillCategoriesMock.mockResolvedValue([
            { id: 'app', name: 'App Development', skills: [
                { id: 's1', title: 'S1', domain: 'App Development', difficulty: 'Easy', summary: 'S', path: 's1', content: '#', uatStatus: 'PASS', uatScore: 80, specScore: 90 },
                { id: 's2', title: 'S2', domain: 'App Development', difficulty: 'Easy', summary: 'S', path: 's2', content: '#', uatStatus: 'PASS', uatScore: 70, specScore: 85 },
                { id: 's3', title: 'S3', domain: 'App Development', difficulty: 'Easy', summary: 'S', path: 's3', content: '#', uatStatus: 'PASS', uatScore: 60, specScore: 80 },
                { id: 's4', title: 'S4', domain: 'App Development', difficulty: 'Easy', summary: 'S', path: 's4', content: '#', uatStatus: 'PASS', uatScore: 50, specScore: 75 },
                { id: 's5', title: 'S5', domain: 'App Development', difficulty: 'Easy', summary: 'S', path: 's5', content: '#', uatStatus: 'PASS', uatScore: 40, specScore: 70 },
            ]},
            { id: 'web', name: 'Web Development', skills: [
                { id: 's6', title: 'S6', domain: 'Web Development', difficulty: 'Easy', summary: 'S', path: 's6', content: '#', uatStatus: 'Not Run', uatScore: 0, specScore: 50 },
            ]},
        ]);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getAllByText('App Development').length).toBeGreaterThan(0));
        const reportTable = screen.getByRole('table');
        const tableScope = within(reportTable);

        // Change Min Count to 5 → hides Web (only 1 skill), keeps App (5 skills)
        const minCountSelect = screen.getByLabelText(/Min Count/i);
        fireEvent.change(minCountSelect, { target: { value: '5' } });
        expect(tableScope.getByText('App Development')).toBeTruthy();
        expect(tableScope.queryByText('Web Development')).toBeNull();

        // Reset and test Min Coverage
        fireEvent.change(minCountSelect, { target: { value: '0' } });
        const minCoverageSelect = screen.getByLabelText(/Min Coverage/i);
        fireEvent.change(minCoverageSelect, { target: { value: '50' } });
        expect(tableScope.getByText('App Development')).toBeTruthy();
        expect(tableScope.queryByText('Web Development')).toBeNull(); // 0% coverage
    });

    it('paginates domain report with next/prev and page size', async () => {
        const cats = Array.from({ length: 12 }, (_, i) => ({
            id: `cat${i}`, name: `Grp ${String.fromCharCode(65 + i)}`,
            skills: [{ id: `s${i}`, title: `Sk${i}`, domain: `Grp ${String.fromCharCode(65 + i)}`, difficulty: 'Easy', summary: 'S', path: `s${i}`, content: '#', uatStatus: 'Not Run', uatScore: 0, specScore: 50 }],
        }));
        getSkillCategoriesMock.mockResolvedValue(cats);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getAllByText('Grp A').length).toBeGreaterThan(0));

        // Check page indicator shows page 1 of 2
        expect(screen.getByText(/Page 1 \/ 2/)).toBeTruthy();

        // Click Next → page 2
        fireEvent.click(screen.getByText('Next'));
        expect(screen.getByText(/Page 2 \/ 2/)).toBeTruthy();

        // Click Prev → page 1
        fireEvent.click(screen.getByText('Prev'));
        expect(screen.getByText(/Page 1 \/ 2/)).toBeTruthy();

        // Change page size to 20 → all fit on 1 page
        const allSelects = screen.getAllByRole('combobox');
        const pageSizeSelect = allSelects.find(s => {
            const opts = Array.from(s.querySelectorAll('option'));
            return opts.some(opt => opt.getAttribute('value') === '50');
        })!;
        fireEvent.change(pageSizeSelect, { target: { value: '20' } });
        expect(screen.getByText(/Page 1 \/ 1/)).toBeTruthy();
    });
});
