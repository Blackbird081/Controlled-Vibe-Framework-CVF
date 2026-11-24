/**
 * @vitest-environment jsdom
 */
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import en from '@/lib/i18n/en.json';
import Sidebar from './Sidebar';

let pathname = '/home';
vi.mock('next/navigation', () => ({
    usePathname: () => pathname,
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

describe('Sidebar task-first navigation', () => {
    beforeEach(() => {
        localStorage.clear();
        pathname = '/home';
    });

    it('renders the seven main destinations and an expanded developer group for an owner', () => {
        renderSidebar();

        const nav = screen.getByLabelText('Main navigation', { selector: 'nav' });
        const main = nav.querySelector('[data-sidebar-group="main"]') as HTMLElement;
        const mainLabels = Array.from(main.querySelectorAll(':scope > button, :scope > a, :scope > [data-sidebar-group="account"] > button'))
            .map(item => item.textContent);
        expect(mainLabels).toEqual([
            en['nav.home'], en['nav.aiAgent'], en['nav.skills'], en['nav.workspace'],
            en['nav.help'], en['nav.landing'], en['sidebar.account'],
        ]);
        expect(within(nav).getByRole('button', { name: en['sidebar.developer'] }).getAttribute('aria-expanded')).toBe('true');
    });

    it('opens the legacy starter from the Developer group', () => {
        const onNavigate = vi.fn();
        renderSidebar({ onNavigate });
        const group = document.querySelector('[data-sidebar-group="developer"]') as HTMLElement;
        const starter = within(group).getByRole('button', { name: 'Governed starter path' });
        fireEvent.click(starter);
        expect(onNavigate).toHaveBeenCalledWith('quickStart');
    });

    it('remembers the developer disclosure across mounts without changing admin defaults', () => {
        const developer = renderSidebar({ userRole: 'developer' });
        const toggle = () => screen.getByRole('button', { name: en['sidebar.developer'] });
        expect(toggle().getAttribute('aria-expanded')).toBe('false');
        fireEvent.click(toggle());
        expect(toggle().getAttribute('aria-expanded')).toBe('true');
        developer.unmount();

        const admin = renderSidebar({ userRole: 'admin' });
        expect(toggle().getAttribute('aria-expanded')).toBe('true');
        fireEvent.click(toggle());
        admin.unmount();

        renderSidebar({ userRole: 'developer' });
        expect(toggle().getAttribute('aria-expanded')).toBe('true');
    });

    it('keeps the existing account actions reachable from the main area', () => {
        const onShowSettings = vi.fn();
        const onShowAIUsage = vi.fn();
        const onShowUserContext = vi.fn();
        renderSidebar({ onShowSettings, onShowAIUsage, onShowUserContext });
        fireEvent.click(screen.getByRole('button', { name: en['sidebar.account'] }));
        fireEvent.click(screen.getByRole('button', { name: en['nav.settings'] }));
        fireEvent.click(screen.getByRole('button', { name: en['nav.aiUsage'] }));
        fireEvent.click(screen.getByRole('button', { name: en['nav.context'] }));
        expect(onShowSettings).toHaveBeenCalledTimes(1);
        expect(onShowAIUsage).toHaveBeenCalledTimes(1);
        expect(onShowUserContext).toHaveBeenCalledTimes(1);
    });

    it('marks only the actual route current when the shell uses Home as its fallback state', () => {
        pathname = '/artifacts';
        renderSidebar({ appState: 'home' });
        expect(screen.getByRole('button', { name: en['nav.home'] }).hasAttribute('aria-current')).toBe(false);
        expect(screen.getByRole('link', { name: en['nav.artifacts'] }).getAttribute('aria-current')).toBe('page');
    });

    it('preserves every existing route href for an owner role', () => {
        renderSidebar({ userRole: 'owner' });

        const expectedHrefs = [
            '/workspace',
            '/governance/knowledge',
            '/governance/mao-runs',
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

        fireEvent.click(screen.getByRole('button', { name: en['sidebar.developer'] }));
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
        expect(screen.getByText(en['nav.workspace'])).toBeTruthy();
    });

    it('does not display admin or privileged links without a verified role', () => {
        renderSidebar({ userRole: null, permissions: {
            canUseAgent: false, canUseMultiAgent: false, canUseTools: false,
            canUseSettings: false, canUseAIUsage: false, canUseContext: false,
        } });
        expect(screen.queryByText('admin')).toBeNull();
        expect(screen.queryByText(en['nav.enterprise'])).toBeNull();
        expect(screen.queryByText(en['nav.history'])).toBeNull();
    });

    it('shows Enterprise only for admin/owner roles', () => {
        renderSidebar({ userRole: 'developer' });
        fireEvent.click(screen.getByRole('button', { name: en['sidebar.developer'] }));
        expect(screen.queryByText(en['nav.enterprise'])).toBeNull();
    });
});
