import { describe, expect, it, vi } from 'vitest';
import nextConfig from '../../next.config';
import RootPage from './page';

const redirect = vi.hoisted(() => vi.fn((url: string): never => { throw new Error(`redirect:${url}`); }));
vi.mock('next/navigation', () => ({ redirect }));
vi.mock('./(dashboard)/landing/page', () => ({ default: () => null }));

describe('root entry', () => {
    it('leaves the root entry to the authentication proxy and page', async () => {
        const redirects = await nextConfig.redirects?.() ?? [];
        expect(redirects.filter(rule => rule.source === '/')).toEqual([]);
    });

    it('sends the default entry directly to Home', async () => {
        await expect(RootPage({ searchParams: Promise.resolve({}) })).rejects.toThrow('redirect:/home');
    });

    it('preserves template and category redirects', async () => {
        await expect(RootPage({ searchParams: Promise.resolve({ template: 'a b' }) })).rejects.toThrow('redirect:/home?template=a%20b');
        await expect(RootPage({ searchParams: Promise.resolve({ category: 'a b' }) })).rejects.toThrow('redirect:/home?category=a%20b');
    });
});
