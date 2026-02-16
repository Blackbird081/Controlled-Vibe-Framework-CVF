/**
 * @vitest-environment jsdom
 * Test: SkillDetailView i18n — all translated strings render via t() 
 */
import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SkillDetailView } from './SkillDetailView';

let mockLanguage = 'en';
const translations: Record<string, Record<string, string>> = {
    en: {
        'skills.skillTab': 'Skill',
        'skills.uatTab': 'UAT',
        'skills.copyRaw': '📋 Copy Raw',
        'skills.risk': 'Risk',
        'skills.autonomy': 'Autonomy',
        'skills.roles': 'Roles',
        'skills.phases': 'Phases',
        'skills.scope': 'Scope',
        'skills.specGate': 'Spec Gate',
        'skills.outputUatLabel': 'Output UAT',
        'skills.notRun': 'Not Run',
        'skills.scoreLabel': 'Score',
        'skills.outputQuality': 'Output Quality',
        'skills.specLabel': 'Spec',
        'skills.specQualityLabel': 'Spec Quality',
        'skills.noUat': 'No UAT record found for this skill.',
    },
    vi: {
        'skills.skillTab': 'Skill',
        'skills.uatTab': 'UAT',
        'skills.copyRaw': '📋 Sao chép',
        'skills.risk': 'Rủi ro',
        'skills.autonomy': 'Tự chủ',
        'skills.roles': 'Vai trò',
        'skills.phases': 'Giai đoạn',
        'skills.scope': 'Phạm vi',
        'skills.specGate': 'Spec Gate',
        'skills.outputUatLabel': 'Output UAT',
        'skills.notRun': 'Chưa chạy',
        'skills.scoreLabel': 'Điểm',
        'skills.outputQuality': 'Chất lượng Output',
        'skills.specLabel': 'Spec',
        'skills.specQualityLabel': 'Chất lượng Spec',
        'skills.noUat': 'Không tìm thấy bản ghi UAT cho skill này.',
    },
};

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({
        language: mockLanguage,
        t: (key: string) => translations[mockLanguage]?.[key] ?? key,
    }),
}));

const fullSkill = {
    id: 'test-skill',
    title: 'Test Skill',
    domain: 'Test Domain',
    difficulty: 'Easy' as const,
    summary: 'Test summary',
    path: 'test-skill',
    content: '# Test content',
    uatContent: '## UAT content',
    uatStatus: 'PASS',
    uatScore: 90,
    uatQuality: 'Excellent',
    specScore: 85,
    specQuality: 'Good',
    specGate: 'PASS',
    riskLevel: 'High',
    autonomy: 'Full',
    allowedRoles: 'Admin',
    allowedPhases: 'All',
    authorityScope: 'Global',
};

const minimalSkill = {
    id: 'minimal',
    title: 'Minimal Skill',
    domain: 'Domain',
    difficulty: 'Easy' as const,
    summary: 'test',
    path: 'minimal',
    content: '# Minimal',
};

describe('SkillDetailView i18n — EN mode', () => {
    beforeAll(() => { mockLanguage = 'en'; });

    it('renders tab labels in English', () => {
        render(<SkillDetailView skill={fullSkill} />);
        expect(screen.getByText('Skill')).toBeTruthy();
        expect(screen.getByText('UAT')).toBeTruthy();
    });

    it('renders copy button in English', () => {
        render(<SkillDetailView skill={fullSkill} />);
        expect(screen.getByText(/Copy Raw/)).toBeTruthy();
    });

    it('renders badge labels in English', () => {
        render(<SkillDetailView skill={fullSkill} />);
        expect(screen.getByText(/Risk: High/)).toBeTruthy();
        expect(screen.getByText(/Autonomy: Full/)).toBeTruthy();
        expect(screen.getByText(/Roles: Admin/)).toBeTruthy();
        expect(screen.getByText(/Phases: All/)).toBeTruthy();
        expect(screen.getByText(/Scope: Global/)).toBeTruthy();
        expect(screen.getByText(/Spec Gate: PASS/)).toBeTruthy();
        expect(screen.getByText(/Output UAT: PASS/)).toBeTruthy();
        expect(screen.getByText(/Score: 90%/)).toBeTruthy();
        expect(screen.getByText(/Output Quality: Excellent/)).toBeTruthy();
        expect(screen.getByText(/Spec: 85%/)).toBeTruthy();
        expect(screen.getByText(/Spec Quality: Good/)).toBeTruthy();
    });

    it('shows "Not Run" for missing UAT status in English', () => {
        render(<SkillDetailView skill={minimalSkill} />);
        expect(screen.getByText(/Output UAT: Not Run/)).toBeTruthy();
    });

    it('shows no UAT message in English', () => {
        render(<SkillDetailView skill={minimalSkill} />);
        fireEvent.click(screen.getByText('UAT'));
        expect(screen.getByText('No UAT record found for this skill.')).toBeTruthy();
    });
});

describe('SkillDetailView i18n — VI mode', () => {
    beforeAll(() => { mockLanguage = 'vi'; });

    it('renders badge labels in Vietnamese', () => {
        render(<SkillDetailView skill={fullSkill} />);
        expect(screen.getByText(/Rủi ro: High/)).toBeTruthy();
        expect(screen.getByText(/Tự chủ: Full/)).toBeTruthy();
        expect(screen.getByText(/Vai trò: Admin/)).toBeTruthy();
        expect(screen.getByText(/Giai đoạn: All/)).toBeTruthy();
        expect(screen.getByText(/Phạm vi: Global/)).toBeTruthy();
        expect(screen.getByText(/Điểm: 90%/)).toBeTruthy();
        expect(screen.getByText(/Chất lượng Output: Excellent/)).toBeTruthy();
        expect(screen.getByText(/Chất lượng Spec: Good/)).toBeTruthy();
    });

    it('shows "Chưa chạy" for missing UAT status in Vietnamese', () => {
        render(<SkillDetailView skill={minimalSkill} />);
        expect(screen.getByText(/Output UAT: Chưa chạy/)).toBeTruthy();
    });

    it('renders copy button in Vietnamese', () => {
        render(<SkillDetailView skill={fullSkill} />);
        expect(screen.getByText(/Sao chép/)).toBeTruthy();
    });

    it('shows no UAT message in Vietnamese', () => {
        render(<SkillDetailView skill={minimalSkill} />);
        fireEvent.click(screen.getByText('UAT'));
        expect(screen.getByText('Không tìm thấy bản ghi UAT cho skill này.')).toBeTruthy();
    });
});

describe('SkillDetailView — uncovered branches', () => {
    beforeAll(() => { mockLanguage = 'en'; });

    it('shows specGate badge with CLARIFY status', () => {
        render(<SkillDetailView skill={{ ...fullSkill, specGate: 'CLARIFY' }} />);
        expect(screen.getByText(/Spec Gate: CLARIFY/)).toBeTruthy();
    });

    it('shows specGate badge with FAIL status', () => {
        render(<SkillDetailView skill={{ ...fullSkill, specGate: 'FAIL' }} />);
        expect(screen.getByText(/Spec Gate: FAIL/)).toBeTruthy();
    });

    it('shows specGate badge with unknown status (default)', () => {
        render(<SkillDetailView skill={{ ...fullSkill, specGate: 'UNKNOWN' }} />);
        expect(screen.getByText(/Spec Gate: UNKNOWN/)).toBeTruthy();
    });

    it('shows uatBadge with SOFT FAIL status', () => {
        render(<SkillDetailView skill={{ ...fullSkill, uatStatus: 'SOFT FAIL' }} />);
        expect(screen.getByText(/Output UAT: SOFT FAIL/)).toBeTruthy();
    });

    it('shows uatBadge with FAIL status', () => {
        render(<SkillDetailView skill={{ ...fullSkill, uatStatus: 'FAIL' }} />);
        expect(screen.getByText(/Output UAT: FAIL/)).toBeTruthy();
    });

    it('copies skill content when in skill view mode', async () => {
        const writeTextMock = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

        render(<SkillDetailView skill={fullSkill} />);
        fireEvent.click(screen.getByText(/Copy Raw/));
        expect(writeTextMock).toHaveBeenCalledWith('# Test content');
        writeTextMock.mockRestore();
    });

    it('copies UAT content when in UAT view mode', async () => {
        const writeTextMock = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

        render(<SkillDetailView skill={fullSkill} />);
        fireEvent.click(screen.getByText('UAT'));
        fireEvent.click(screen.getByText(/Copy Raw/));
        expect(writeTextMock).toHaveBeenCalledWith('## UAT content');
        writeTextMock.mockRestore();
    });

    it('handles clipboard write error gracefully', async () => {
        const writeTextMock = vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));

        render(<SkillDetailView skill={fullSkill} />);
        // Should not throw
        fireEvent.click(screen.getByText(/Copy Raw/));
        writeTextMock.mockRestore();
    });

    it('switches back to skill view from UAT view', () => {
        render(<SkillDetailView skill={fullSkill} />);
        // Switch to UAT
        fireEvent.click(screen.getByText('UAT'));
        // Switch back to Skill
        fireEvent.click(screen.getByText('Skill'));
        // Should show skill content, not UAT
        expect(screen.queryByText('No UAT record found for this skill.')).toBeNull();
    });

    it('renders without optional badge fields', () => {
        render(<SkillDetailView skill={minimalSkill} />);
        expect(screen.queryByText(/Risk:/)).toBeNull();
        expect(screen.queryByText(/Autonomy:/)).toBeNull();
        expect(screen.queryByText(/Roles:/)).toBeNull();
        expect(screen.queryByText(/Phases:/)).toBeNull();
        expect(screen.queryByText(/Scope:/)).toBeNull();
        expect(screen.queryByText(/Spec Gate:/)).toBeNull();
        expect(screen.queryByText(/Score:/)).toBeNull();
        expect(screen.queryByText(/Spec Quality:/)).toBeNull();
    });
});
