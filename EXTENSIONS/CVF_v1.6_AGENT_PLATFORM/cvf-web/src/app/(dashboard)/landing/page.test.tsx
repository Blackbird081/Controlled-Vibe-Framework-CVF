import { readFileSync } from 'node:fs';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { templates } from '@/lib/template-loader';
import type { SkillIndexPayload } from '@/types/skill';
import LandingPage from './page';

vi.mock('@/components', () => ({ SurfaceTopBar: () => null }));
vi.mock('@/lib/i18n', () => ({
    useLanguage: () => ({ language: 'en', mounted: true }),
    LanguageToggle: () => null,
}));
vi.mock('@/app/landing/components/HeroVisualizer', () => ({ default: () => null }));
vi.mock('@/app/landing/components/InsideVibCode', () => ({ default: () => null }));
vi.mock('@/app/landing/components/SocialProof', () => ({ default: () => null }));
vi.mock('@/app/landing/components/TemplateShowcase', () => ({ default: () => null }));
vi.mock('@/app/landing/components/TestimonialCards', () => ({ default: () => null }));

afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
});

it('shows catalog counts from the template loader and published skill index', async () => {
    const index = JSON.parse(readFileSync('public/data/skills-index.json', 'utf8')) as SkillIndexPayload;
    const fetchIndex = vi.fn(async () => Response.json(index));
    vi.stubGlobal('fetch', fetchIndex);

    render(<LandingPage />);

    const templateLabel = screen.getByText('Templates', { selector: 'dt' });
    const skillLabel = await screen.findByText('AI skills', { selector: 'dt' });
    expect(templateLabel.nextElementSibling?.textContent).toBe(String(templates.length));
    expect(skillLabel.nextElementSibling?.textContent).toBe(
        String(index.categories.reduce((count, category) => count + category.skills.length, 0)),
    );
    expect(fetchIndex).toHaveBeenCalledWith('/data/skills-index.json', { cache: 'no-store' });
    expect(screen.queryByText('Teams', { selector: 'dt' })).toBeNull();
    expect(screen.queryByText('Models', { selector: 'dt' })).toBeNull();
});
