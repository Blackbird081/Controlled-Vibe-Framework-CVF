/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import DashboardLayout from './layout';

const pushMock = vi.fn();
const replaceMock = vi.fn();
const closeAllModalsMock = vi.fn();

let mockOpenParam: string | null = null;

vi.mock('next/navigation', () => ({
    usePathname: () => '/help',
    useRouter: () => ({ push: pushMock, replace: replaceMock }),
    useSearchParams: () => ({
        get: (key: string) => (key === 'open' ? mockOpenParam : null),
        toString: () => (mockOpenParam ? `open=${mockOpenParam}` : ''),
    }),
}));

vi.mock('@/lib/hooks/useAuth', () => ({
    useAuth: () => ({
        userRole: 'admin',
        userName: 'Test User',
        permissions: {
            canUseSettings: true,
            canUseAIUsage: true,
            canUseContext: true,
        },
        handleLogout: vi.fn(),
        impersonation: null,
        endImpersonation: vi.fn(),
    }),
}));

vi.mock('@/lib/hooks/useModals', () => ({
    useModals: () => ({
        showUserContext: false,
        showSettings: false,
        showAIUsage: false,
        showApiKeyWizard: false,
        showOnboarding: false,
        showQuickStart: false,
        closeAllModals: closeAllModalsMock,
        openModal: vi.fn(),
        closeModal: vi.fn(),
        handleOnboardingComplete: vi.fn(),
    }),
}));

vi.mock('@/lib/store', () => ({
    useExecutionStore: () => ({
        executions: [],
    }),
}));

vi.mock('@/components/Settings', () => ({
    useSettings: () => ({
        settings: {
            providers: {},
            preferences: {},
        },
        updateProvider: vi.fn(),
        updatePreferences: vi.fn(),
    }),
}));

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({
        language: 'en',
        t: (key: string) => key,
    }),
}));

vi.mock('@/lib/governed-starter-path', () => ({
    buildGovernedStarterHandoff: vi.fn(),
    saveGovernedStarterHandoff: vi.fn(),
}));

vi.mock('@/components', () => ({
    Sidebar: () => <div data-testid="sidebar" />,
    OnboardingWizard: () => <div>OnboardingWizard</div>,
    QuickStart: () => <div>QuickStart</div>,
    UserContextForm: () => <div>UserContextForm</div>,
    SettingsPage: () => <div>SettingsPage</div>,
    AIUsagePanel: () => <div>AIUsagePanel</div>,
    ApiKeyWizard: () => <div>ApiKeyWizard</div>,
    AgentChatWithHistory: ({ onClose }: { onClose: () => void }) => (
        <div>
            <div>Agent Chat Modal</div>
            <button type="button" onClick={onClose}>Close Agent Modal</button>
        </div>
    ),
    MultiAgentPanel: ({ onClose }: { onClose: () => void }) => (
        <div>
            <div>Multi Agent Modal</div>
            <button type="button" onClick={onClose}>Close Multi Agent Modal</button>
        </div>
    ),
    ToolsPage: () => <div>Tools Modal</div>,
}));

vi.mock('@/components/CompactHeader', () => ({
    default: () => <div>CompactHeader</div>,
}));

describe('DashboardLayout', () => {
    beforeEach(() => {
        mockOpenParam = null;
        pushMock.mockReset();
        replaceMock.mockReset();
        closeAllModalsMock.mockReset();
    });

    it('opens the agent modal when open=agent appears after client-side navigation', async () => {
        const { rerender } = render(
            <DashboardLayout>
                <div>Dashboard Child</div>
            </DashboardLayout>,
        );

        expect(screen.queryByText('Agent Chat Modal')).toBeNull();

        mockOpenParam = 'agent';
        rerender(
            <DashboardLayout>
                <div>Dashboard Child</div>
            </DashboardLayout>,
        );

        await waitFor(() => {
            expect(screen.getByText('Agent Chat Modal')).toBeTruthy();
        });
    });

    it('opens the multi-agent modal when open=multi-agent appears after client-side navigation', async () => {
        const { rerender } = render(
            <DashboardLayout>
                <div>Dashboard Child</div>
            </DashboardLayout>,
        );

        expect(screen.queryByText('Multi Agent Modal')).toBeNull();

        mockOpenParam = 'multi-agent';
        rerender(
            <DashboardLayout>
                <div>Dashboard Child</div>
            </DashboardLayout>,
        );

        await waitFor(() => {
            expect(screen.getByText('Multi Agent Modal')).toBeTruthy();
        });
    });

    it('removes the open query param when a query-driven modal closes', async () => {
        mockOpenParam = 'agent';

        render(
            <DashboardLayout>
                <div>Dashboard Child</div>
            </DashboardLayout>,
        );

        expect(await screen.findByText('Agent Chat Modal')).toBeTruthy();

        screen.getByRole('button', { name: 'Close Agent Modal' }).click();

        expect(replaceMock).toHaveBeenCalledWith('/help');
    });
});
