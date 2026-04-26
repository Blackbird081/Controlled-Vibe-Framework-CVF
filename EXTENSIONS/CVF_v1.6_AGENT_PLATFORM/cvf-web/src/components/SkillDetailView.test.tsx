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
        'skills.skillTab': 'Guide',
        'skills.uatTab': 'Result check',
        'skills.copyRaw': 'Copy',
        'skills.difficultyLabel': 'Difficulty',
        'skills.noUat': 'No result-check guide is available for this skill yet.',
    },
    vi: {
        'skills.skillTab': 'Hướng dẫn',
        'skills.uatTab': 'Kiểm tra kết quả',
        'skills.copyRaw': 'Sao chép',
        'skills.difficultyLabel': 'Độ khó',
        'skills.noUat': 'Chưa có hướng dẫn kiểm tra cho kỹ năng này.',
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
        expect(screen.getByText('Guide')).toBeTruthy();
        expect(screen.getByText('Result check')).toBeTruthy();
    });

    it('renders copy button in English', () => {
        render(<SkillDetailView skill={fullSkill} />);
        expect(screen.getByText(/Copy/)).toBeTruthy();
    });

    it('renders plain skill context in English', () => {
        render(<SkillDetailView skill={fullSkill} />);
        expect(screen.getByText(/Difficulty: Easy/)).toBeTruthy();
        expect(screen.getByText('Test summary')).toBeTruthy();
        expect(screen.queryByText(/Risk:/)).toBeNull();
        expect(screen.queryByText(/Spec Gate:/)).toBeNull();
    });

    it('shows no UAT message in English', () => {
        render(<SkillDetailView skill={minimalSkill} />);
        fireEvent.click(screen.getByText('Result check'));
        expect(screen.getByText('No result-check guide is available for this skill yet.')).toBeTruthy();
    });
});

describe('SkillDetailView i18n — VI mode', () => {
    beforeAll(() => { mockLanguage = 'vi'; });

    it('renders plain skill context in Vietnamese', () => {
        render(<SkillDetailView skill={fullSkill} />);
        expect(screen.getByText(/Độ khó: Easy/)).toBeTruthy();
        expect(screen.queryByText(/Rủi ro:/)).toBeNull();
        expect(screen.queryByText(/Spec Gate:/)).toBeNull();
    });

    it('renders copy button in Vietnamese', () => {
        render(<SkillDetailView skill={fullSkill} />);
        expect(screen.getByText(/Sao chép/)).toBeTruthy();
    });

    it('shows no UAT message in Vietnamese', () => {
        render(<SkillDetailView skill={minimalSkill} />);
        fireEvent.click(screen.getByText('Kiểm tra kết quả'));
        expect(screen.getByText('Chưa có hướng dẫn kiểm tra cho kỹ năng này.')).toBeTruthy();
    });
});

describe('SkillDetailView — uncovered branches', () => {
    beforeAll(() => { mockLanguage = 'en'; });

    it('copies skill content when in skill view mode', async () => {
        const writeTextMock = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

        render(<SkillDetailView skill={fullSkill} />);
        fireEvent.click(screen.getByText(/Copy/));
        expect(writeTextMock).toHaveBeenCalledWith('# Test content');
        writeTextMock.mockRestore();
    });

    it('copies UAT content when in UAT view mode', async () => {
        const writeTextMock = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);

        render(<SkillDetailView skill={fullSkill} />);
        fireEvent.click(screen.getByText('Result check'));
        fireEvent.click(screen.getByText(/Copy/));
        expect(writeTextMock).toHaveBeenCalledWith('## UAT content');
        writeTextMock.mockRestore();
    });

    it('handles clipboard write error gracefully', async () => {
        const writeTextMock = vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));

        render(<SkillDetailView skill={fullSkill} />);
        // Should not throw
        fireEvent.click(screen.getByText(/Copy/));
        writeTextMock.mockRestore();
    });

    it('switches back to skill view from UAT view', () => {
        render(<SkillDetailView skill={fullSkill} />);
        // Switch to UAT
        fireEvent.click(screen.getByText('Result check'));
        // Switch back to Skill
        fireEvent.click(screen.getByText('Guide'));
        // Should show skill content, not UAT
        expect(screen.queryByText('No result-check guide is available for this skill yet.')).toBeNull();
    });

    it('hides internal governance metadata even when present', () => {
        render(<SkillDetailView skill={fullSkill} />);
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
