/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en', t: (key: string) => key }),
}));

vi.mock('@/components', () => ({
    SurfaceTopBar: () => <div data-testid="surface-top-bar" />,
    SurfaceStatCard: () => <div data-testid="stat-card" />,
    IntentEntry: () => <div data-testid="intent-entry" />,
    CategoryTabs: () => <div data-testid="category-tabs" />,
    TemplateCard: () => <div data-testid="template-card" />,
    OnboardingTour: () => <div data-testid="onboarding-tour" />,
    DynamicForm: () => <div data-testid="dynamic-form" />,
    TemplatePreviewModal: () => <div data-testid="template-preview-modal" />,
}));

vi.mock('@/components/home/HomeBrowseExperience', () => ({
    HomeBrowseExperience: () => <div data-testid="home-browse-experience" />,
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    useSearchParams: () => new URLSearchParams(),
}));

describe('HomePage', () => {
    it('renders the browse experience by default', () => {
        render(<HomePage />);
        expect(screen.getByTestId('home-browse-experience')).toBeTruthy();
    });
});
