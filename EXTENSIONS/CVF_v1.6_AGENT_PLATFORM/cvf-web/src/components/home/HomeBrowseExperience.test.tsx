/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HomeBrowseExperience } from './HomeBrowseExperience';

vi.mock('@/components', () => ({
    SurfaceTopBar: ({ title }: { title: string }) => <div data-testid="surface-top-bar">{title}</div>,
    OutcomeQuickActions: () => <div data-testid="outcome-quick-actions" />,
    IntentEntry: () => <div data-testid="intent-entry" />,
    CategoryTabs: () => <div data-testid="category-tabs" />,
    TemplateCard: ({ template }: { template: { name: string } }) => <div data-testid="template-card">{template.name}</div>,
    SurfaceStatCard: ({ label }: { label: string }) => <div data-testid="stat-card">{label}</div>,
}));

vi.mock('@/components/OutcomeQuickActions', () => ({
    OutcomeQuickActions: () => <div data-testid="outcome-quick-actions" />,
}));

describe('HomeBrowseExperience', () => {
    const defaultProps = {
        language: 'en',
        t: (key: string) => key,
        currentFolder: null,
        setCurrentFolder: vi.fn(),
        templates: [],
        categoryCounts: { all: 0 },
        selectedCategory: 'all',
        setSelectedCategory: vi.fn(),
        filteredTemplates: [],
        searchQuery: '',
        setSearchQuery: vi.fn(),
        handleOutcomeQuickAction: vi.fn(),
        handleSelectTemplate: vi.fn(),
        handleTryTemplate: vi.fn(),
        QUICK_TRY_CONFIGS: {},
        setPreviewTemplate: vi.fn(),
        statCards: [],
        isIntentFirstEnabled: () => false,
        handleIntentRoute: vi.fn(),
        starterHandoff: null,
        handleOpenGovernedStarter: vi.fn(),
        handleDismissGovernedStarter: vi.fn(),
        mockAiEnabled: false,
        hasAnyApiKey: false,
        bannerDismissed: true,
        handleDismissBanner: vi.fn(),
        handleDemoRun: vi.fn(),
        setupConfidence: {
            liveTaskReady: true,
            workspaceReady: true,
            label: 'Ready',
            description: '',
            nextAction: '',
            tone: 'emerald',
        },
    };

    it('renders top bar and outcome quick actions', () => {
        render(<HomeBrowseExperience {...defaultProps} />);
        expect(screen.getByTestId('surface-top-bar')).toBeTruthy();
        expect(screen.getByTestId('outcome-quick-actions')).toBeTruthy();
        expect(screen.getByTestId('category-tabs')).toBeTruthy();
    });

    it('hides outcome quick actions when currentFolder is set', () => {
        render(<HomeBrowseExperience {...defaultProps} currentFolder="some-folder" />);
        expect(screen.queryByTestId('outcome-quick-actions')).toBeNull();
    });

    it('renders intent entry if enabled', () => {
        render(<HomeBrowseExperience {...defaultProps} isIntentFirstEnabled={() => true} />);
        expect(screen.getByTestId('intent-entry')).toBeTruthy();
    });
});
