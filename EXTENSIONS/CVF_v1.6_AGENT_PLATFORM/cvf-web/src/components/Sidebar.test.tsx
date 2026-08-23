/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import en from '@/lib/i18n/en.json';
import Sidebar from './Sidebar';

vi.mock('next/navigation', () => ({
    usePathname: () => '/home',
}));

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({
        language: 'en' as const,
        setLanguage: vi.fn(),
        t: (key: string) => (en as Record<string, string>)[key] ?? key,
    }),
}));

const ALL_PERMISSIONS = {
    canUseAgent: true,
    canUseMultiAgent: true,
    canUseTools: true,
    canUseSettings: true,
    canUseAIUsage: true,
    canUseContext: true,
};

function renderSidebar(overrides: Partial<Parameters<typeof Sidebar>[0]> = {}) {
    const props = {
        appState: 'home',
        onNavigate: vi.fn(),
        executionsCount: 0,
        userRole: 'owner',
        permissions: ALL_PERMISSIONS,
        onShowUserContext: vi.fn(),
        onShowSettings: vi.fn(),
        onShowAIUsage: vi.fn(),
        onLogout: vi.fn(),
        isOpen: true,
        onClose: vi.fn(),
        user: 'Test User',
        ...overrides,
    };
    return render(<Sidebar {...props} />);
}

describe('Sidebar task-first navigation groups', () => {
    it('renders exactly five task-oriented navigation groups with translated labels', () => {
        renderSidebar();

        const nav = screen.getByLabelText('Main navigation', { selector: 'nav' });
        const groups = nav.querySelectorAll('[data-sidebar-group]');
        expect(groups).toHaveLength(5);

        const groupTitles = Array.from(groups).map((group) => group.querySelector('button')?.textContent ?? '');
        expect(groupTitles).toEqual([
            en['sidebar.home'],
            en['sidebar.aiWork'],
            en['sidebar.knowledgeReview'],
            en['sidebar.advancedOperations'],
            en['sidebar.account'],
        ]);
    });

    it('preserves every existing route href for an owner role', () => {
        renderSidebar({ userRole: 'owner' });

        const expectedHrefs = [
            '/workspace',
            '/governance/knowledge',
            '/knowledge/intake',
            '/artifacts',
            '/work-transfer',
            '/admin/team',
        ];

        const anchorHrefs = Array.from(document.querySelectorAll('a[href]')).map(
            (a) => a.getAttribute('href'),
        );
        for (const href of expectedHrefs) {
            expect(anchorHrefs).toContain(href);
        }
    });

    it('preserves every existing state-driven nav target via onNavigate', () => {
        const onNavigate = vi.fn();
        renderSidebar({ onNavigate, userRole: 'owner' });

        const expectedStates = [
            'home',
            'landing',
            'agent',
            'multi-agent',
            'tools',
            'simulation',
            'skills',
            'skill-search',
            'help',
            'docs',
            'history',
            'analytics',
            'runtime',
            'marketplace',
            'governance',
            'safety',
        ];

        const labelByState: Record<string, string> = {
            home: en['nav.home'],
            landing: en['nav.landing'],
            agent: en['nav.aiAgent'],
            'multi-agent': en['nav.multiAgent'],
            tools: en['nav.tools'],
            simulation: en['nav.simulation'],
            skills: en['nav.skills'],
            'skill-search': en['nav.skillSearch'],
            help: en['nav.help'],
            docs: en['nav.docs'],
            history: en['nav.history'],
            analytics: en['nav.analytics'],
            runtime: en['nav.runtime'],
            marketplace: en['nav.marketplace'],
            governance: en['nav.governance'],
            safety: en['nav.safety'],
        };

        for (const state of expectedStates) {
            onNavigate.mockClear();
            screen.getByRole('button', { name: labelByState[state] }).click();
            expect(onNavigate).toHaveBeenCalledWith(state);
        }
    });

    it('hides permission-gated items when permissions are false and role is viewer', () => {
        renderSidebar({
            userRole: 'viewer',
            permissions: {
                canUseAgent: false,
                canUseMultiAgent: false,
                canUseTools: false,
                canUseSettings: false,
                canUseAIUsage: false,
                canUseContext: false,
            },
        });

        expect(screen.queryByText(en['nav.aiAgent'])).toBeNull();
        expect(screen.queryByText(en['nav.multiAgent'])).toBeNull();
        expect(screen.queryByText(en['nav.tools'])).toBeNull();
        expect(screen.queryByText(en['nav.simulation'])).toBeNull();
        expect(screen.queryByText(en['nav.knowledge'])).toBeNull();
        expect(screen.queryByText(en['nav.history'])).toBeNull();
        expect(screen.queryByText(en['nav.enterprise'])).toBeNull();
        expect(screen.queryByText(en['nav.context'])).toBeNull();
        expect(screen.queryByText(en['nav.settings'])).toBeNull();
        expect(screen.queryByText(en['nav.aiUsage'])).toBeNull();

        // AI Safety and CVF Workspace remain unconditional for every role.
        expect(screen.getByText(en['nav.safety'])).toBeTruthy();
        expect(screen.getByText('CVF Workspace')).toBeTruthy();
    });

    it('shows Enterprise only for admin/owner roles', () => {
        renderSidebar({ userRole: 'developer' });
        expect(screen.queryByText(en['nav.enterprise'])).toBeNull();
    });
});
