/**
 * @vitest-environment jsdom
 * Test: SkillLibrary i18n — all translated strings render via t() in both EN and VI modes
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { SkillLibrary } from './SkillLibrary';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const trackEventMock = vi.fn();
const getSkillCategoriesMock = vi.fn();
const saveUatContentMock = vi.fn();
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

// i18n mock — toggle between en/vi
let mockLanguage = 'en';
const translations: Record<string, Record<string, string>> = {
    en: {
        'skills.library': '📚 Skill Library',
        'skills.searchPlaceholder': 'Search skills...',
        'skills.noResults': 'No skills found matching',
        'skills.open': '↗ Open',
        'skills.easy': 'Easy',
        'skills.med': 'Med',
        'skills.adv': 'Adv',
        'skills.notRun': 'Not Run',
        'skills.domainReport': '📊 Domain Report',
        'skills.domainReportDesc': 'Quantity + quality of inputs by domain (Spec score/quality) + Output UAT coverage.',
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
        'skills.editorHint': 'UAT editor saves directly to the .md file. Use standard markdown.',
        'skills.noUat': 'No UAT record found for this skill.',
        'skills.selectSkill': 'Select a skill to view',
        'skills.selectSkillDesc': 'Browse the library on the left to view detailed skill documentation, inputs, and expected outputs.',
        'skills.useTemplate': '📝 Use Template',
        'skills.useTemplateTitle': 'Use template',
        'skills.browseTemplates': '📝 Browse templates',
    },
    vi: {
        'skills.library': '📚 Thư viện Skill',
        'skills.searchPlaceholder': 'Tìm kiếm skill...',
        'skills.noResults': 'Không tìm thấy skill khớp với',
        'skills.open': '↗ Mở',
        'skills.easy': 'Dễ',
        'skills.med': 'TB',
        'skills.adv': 'Nâng cao',
        'skills.notRun': 'Chưa chạy',
        'skills.domainReport': '📊 Báo cáo Domain',
        'skills.domainReportDesc': 'Số lượng + chất lượng input theo domain (Spec score/quality) + Output UAT coverage.',
        'skills.totalSkills': 'Tổng skill',
        'skills.uatCoverage': 'Output UAT coverage',
        'skills.uatCompleted': 'Output UAT hoàn thành',
        'skills.specAvgLabel': 'Spec TB',
        'skills.uatNotRunHint': 'UAT chưa chạy → Output UAT score = 0',
        'skills.sort': 'Sắp xếp',
        'skills.countOption': 'Số lượng',
        'skills.coverageOption': 'Coverage',
        'skills.specAvgOption': 'Spec TB',
        'skills.nameOption': 'Tên',
        'skills.sortDir': 'Thứ tự',
        'skills.desc': 'Giảm',
        'skills.asc': 'Tăng',
        'skills.minCount': 'Số lượng tối thiểu',
        'skills.minCoverage': 'Coverage tối thiểu',
        'skills.minSpecScore': 'Spec Score tối thiểu',
        'skills.onlyWithUat': 'Chỉ domain có Output UAT',
        'skills.showing': 'Hiển thị',
        'skills.rows': 'Dòng',
        'skills.prev': 'Trước',
        'skills.page': 'Trang',
        'skills.next': 'Tiếp',
        'skills.domain': 'Domain',
        'skills.outputUat': 'Output UAT',
        'skills.uatCoverageCol': 'Output UAT Coverage',
        'skills.specQualityCol': 'Chất lượng Spec',
        'skills.excellent': 'Xuất sắc',
        'skills.good': 'Tốt',
        'skills.needsReview': 'Cần xem lại',
        'skills.notReady': 'Chưa sẵn sàng',
        'skills.risk': 'Rủi ro',
        'skills.autonomy': 'Tự chủ',
        'skills.roles': 'Vai trò',
        'skills.phases': 'Giai đoạn',
        'skills.scope': 'Phạm vi',
        'skills.specGate': 'Spec Gate',
        'skills.outputUatLabel': 'Output UAT',
        'skills.scoreLabel': 'Điểm',
        'skills.outputQuality': 'Chất lượng Output',
        'skills.specLabel': 'Spec',
        'skills.specQualityLabel': 'Chất lượng Spec',
        'skills.skillTab': 'Skill',
        'skills.uatTab': 'UAT',
        'skills.viewTab': 'Xem',
        'skills.editTab': 'Sửa',
        'skills.copyRaw': '📋 Sao chép',
        'skills.copied': 'Đã sao chép markdown gốc!',
        'skills.specGateWarning': 'Spec Gate = FAIL. UAT chỉ được chỉnh sửa khi Spec đạt chuẩn.',
        'skills.editPlaceholder': 'Chỉnh sửa UAT markdown...',
        'skills.saveUat': 'Lưu UAT',
        'skills.cancel': 'Hủy',
        'skills.editorHint': 'UAT editor lưu trực tiếp vào file .md. Dùng markdown chuẩn.',
        'skills.noUat': 'Không tìm thấy bản ghi UAT cho skill này.',
        'skills.selectSkill': 'Chọn một skill để xem',
        'skills.selectSkillDesc': 'Duyệt thư viện bên trái để xem tài liệu skill chi tiết, đầu vào và đầu ra mong đợi.',
        'skills.useTemplate': '📝 Dùng Template',
        'skills.useTemplateTitle': 'Dùng template',
        'skills.browseTemplates': '📝 Duyệt templates',
    },
};

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({
        language: mockLanguage,
        t: (key: string) => translations[mockLanguage]?.[key] ?? key,
    }),
}));

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

const sampleSkill = {
    id: 'skill-1',
    title: 'Test Skill',
    domain: 'App Development',
    difficulty: 'Easy',
    summary: 'Summary',
    path: 'skill-1',
    content: '# Test Skill',
    uatContent: '## UAT Test',
    uatStatus: 'PASS',
    uatScore: 85,
    uatQuality: 'Good',
    specScore: 90,
    specQuality: 'Excellent',
    specGate: 'PASS',
    riskLevel: 'Medium',
    autonomy: 'Supervised',
    allowedRoles: 'Developer',
    allowedPhases: 'Development',
    authorityScope: 'Local',
};

const sampleCategories = [{
    id: 'dev',
    name: 'Development',
    skills: [sampleSkill],
}];

describe('SkillLibrary i18n — EN mode', () => {
    beforeEach(() => {
        mockLanguage = 'en';
        trackEventMock.mockClear();
        getSkillCategoriesMock.mockReset();
        saveUatContentMock.mockReset();
        setFetchPayload(fixtureCategories);
    });

    it('renders sidebar header and search in English', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('📚 Skill Library')).toBeTruthy());
        expect(screen.getByPlaceholderText('Search skills...')).toBeTruthy();
    });

    it('renders domain report section in English', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('📊 Domain Report')).toBeTruthy());
        expect(screen.getByText(/Total skills/)).toBeTruthy();
        expect(screen.getAllByText(/Output UAT coverage/).length).toBeGreaterThanOrEqual(1);
        expect(screen.getByText(/Output UAT completed/)).toBeTruthy();
    });

    it('renders filter labels in English', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Sort')).toBeTruthy());
        expect(screen.getByText('Sort Dir')).toBeTruthy();
        expect(screen.getByText('Min Count')).toBeTruthy();
    });

    it('renders difficulty badges in English', async () => {
        setCategories([{
            id: 'dev',
            name: 'Development',
            skills: [
                { ...sampleSkill, id: 's1', title: 'S1', difficulty: 'Easy' },
                { ...sampleSkill, id: 's2', title: 'S2', difficulty: 'Medium' },
                { ...sampleSkill, id: 's3', title: 'S3', difficulty: 'Advanced' },
            ],
        }]);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Easy')).toBeTruthy());
        expect(screen.getByText('Med')).toBeTruthy();
        expect(screen.getByText('Adv')).toBeTruthy();
    });

    it('renders skill detail badges in English after selecting', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Test Skill')).toBeTruthy());
        fireEvent.click(screen.getByText('Test Skill'));

        expect(screen.getByText(/Risk: Medium/)).toBeTruthy();
        expect(screen.getByText(/Autonomy: Supervised/)).toBeTruthy();
        expect(screen.getByText(/Roles: Developer/)).toBeTruthy();
        expect(screen.getByText(/Phases: Development/)).toBeTruthy();
        expect(screen.getByText(/Scope: Local/)).toBeTruthy();
        expect(screen.getByText(/Score: 85%/)).toBeTruthy();
    });

    it('renders view tabs in English', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => fireEvent.click(screen.getByText('Test Skill')));
        expect(screen.getByText('Skill')).toBeTruthy();
        expect(screen.getByText('UAT')).toBeTruthy();
        expect(screen.getByText(/Copy Raw/)).toBeTruthy();
    });

    it('renders UAT editor labels in English', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => fireEvent.click(screen.getByText('Test Skill')));
        fireEvent.click(screen.getByText('UAT'));
        fireEvent.click(screen.getByText('Edit'));

        expect(screen.getByPlaceholderText('Edit UAT markdown...')).toBeTruthy();
        expect(screen.getByText('Save UAT')).toBeTruthy();
        expect(screen.getByText('Cancel')).toBeTruthy();
    });

    it('renders empty state in English', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Select a skill to view')).toBeTruthy());
    });

    it('renders pagination labels in English', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText(/Showing/)).toBeTruthy());
        expect(screen.getByText(/Rows/)).toBeTruthy();
        expect(screen.getByText('Prev')).toBeTruthy();
        expect(screen.getByText('Next')).toBeTruthy();
    });

    it('renders table headers in English', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => {
            const table = screen.getByRole('table');
            const scope = within(table);
            expect(scope.getByText('Domain')).toBeTruthy();
            expect(scope.getByText('Count')).toBeTruthy();
            expect(scope.getByText('Spec Avg')).toBeTruthy();
            expect(scope.getByText('Output UAT Coverage')).toBeTruthy();
            expect(scope.getByText('Spec Quality')).toBeTruthy();
        });
    });
});

describe('SkillLibrary i18n — VI mode', () => {
    beforeEach(() => {
        mockLanguage = 'vi';
        trackEventMock.mockClear();
        getSkillCategoriesMock.mockReset();
        saveUatContentMock.mockReset();
        setFetchPayload(fixtureCategories);
    });

    it('renders sidebar header and search in Vietnamese', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('📚 Thư viện Skill')).toBeTruthy());
        expect(screen.getByPlaceholderText('Tìm kiếm skill...')).toBeTruthy();
    });

    it('renders domain report section in Vietnamese', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('📊 Báo cáo Domain')).toBeTruthy());
        expect(screen.getByText(/Tổng skill/)).toBeTruthy();
        expect(screen.getByText(/Output UAT hoàn thành/)).toBeTruthy();
    });

    it('renders filter labels in Vietnamese', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Sắp xếp')).toBeTruthy());
        expect(screen.getByText('Thứ tự')).toBeTruthy();
        expect(screen.getByText('Số lượng tối thiểu')).toBeTruthy();
    });

    it('renders difficulty badges in Vietnamese', async () => {
        setCategories([{
            id: 'dev',
            name: 'Development',
            skills: [
                { ...sampleSkill, id: 's1', title: 'S1', difficulty: 'Easy' },
                { ...sampleSkill, id: 's2', title: 'S2', difficulty: 'Medium' },
                { ...sampleSkill, id: 's3', title: 'S3', difficulty: 'Advanced' },
            ],
        }]);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Dễ')).toBeTruthy());
        expect(screen.getByText('TB')).toBeTruthy();
        expect(screen.getByText('Nâng cao')).toBeTruthy();
    });

    it('renders skill detail badges in Vietnamese', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => fireEvent.click(screen.getByText('Test Skill')));

        expect(screen.getByText(/Rủi ro: Medium/)).toBeTruthy();
        expect(screen.getByText(/Tự chủ: Supervised/)).toBeTruthy();
        expect(screen.getByText(/Vai trò: Developer/)).toBeTruthy();
        expect(screen.getByText(/Giai đoạn: Development/)).toBeTruthy();
        expect(screen.getByText(/Phạm vi: Local/)).toBeTruthy();
        expect(screen.getByText(/Điểm: 85%/)).toBeTruthy();
    });

    it('renders view tabs in Vietnamese', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => fireEvent.click(screen.getByText('Test Skill')));
        expect(screen.getByText('Skill')).toBeTruthy();
        expect(screen.getByText('UAT')).toBeTruthy();
        expect(screen.getByText(/Sao chép/)).toBeTruthy();
    });

    it('renders UAT editor labels in Vietnamese', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => fireEvent.click(screen.getByText('Test Skill')));
        fireEvent.click(screen.getByText('UAT'));
        fireEvent.click(screen.getByText('Xem'));

        // Switch to edit mode
        fireEvent.click(screen.getByText('Sửa'));
        expect(screen.getByPlaceholderText('Chỉnh sửa UAT markdown...')).toBeTruthy();
        expect(screen.getByText('Lưu UAT')).toBeTruthy();
        expect(screen.getByText('Hủy')).toBeTruthy();
    });

    it('renders empty state in Vietnamese', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText('Chọn một skill để xem')).toBeTruthy());
    });

    it('renders pagination in Vietnamese', async () => {
        setCategories(sampleCategories);
        render(<SkillLibrary />);
        await waitFor(() => expect(screen.getByText(/Hiển thị/)).toBeTruthy());
        expect(screen.getByText(/Dòng/)).toBeTruthy();
        expect(screen.getByText('Trước')).toBeTruthy();
        expect(screen.getByText('Tiếp')).toBeTruthy();
    });

    it('renders quality badges in Vietnamese', async () => {
        setCategories([{
            id: 'dev',
            name: 'Development',
            skills: [
                { ...sampleSkill, id: 's1', title: 'S1', specQuality: 'Excellent' },
                { ...sampleSkill, id: 's2', title: 'S2', specQuality: 'Good' },
                { ...sampleSkill, id: 's3', title: 'S3', specQuality: 'Needs Review' },
                { ...sampleSkill, id: 's4', title: 'S4', specQuality: 'Not Ready' },
            ],
        }]);
        render(<SkillLibrary />);
        await waitFor(() => {
            expect(screen.getAllByText(/Xuất sắc/).length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText(/Tốt/).length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText(/Cần xem lại/).length).toBeGreaterThanOrEqual(1);
            expect(screen.getAllByText(/Chưa sẵn sàng/).length).toBeGreaterThanOrEqual(1);
        });
    });
});
