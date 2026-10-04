import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: vi.fn() }),
  useSearchParams: () => new URLSearchParams(),
}));
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
  useSession: () => ({ status: 'unauthenticated' }),
}));
vi.mock('@/lib/i18n', () => ({
  useLanguage: () => ({ language: 'en' }),
  LanguageToggle: () => null,
}));

import LoginPage from './page';

const originalNodeEnv = process.env.NODE_ENV;
const originalProvider = process.env.CVF_OAUTH_PROVIDER;

afterEach(() => {
  vi.stubEnv('NODE_ENV', originalNodeEnv ?? 'test');
  vi.stubEnv('CVF_OAUTH_PROVIDER', originalProvider ?? '');
});

describe('login surface environment boundary', () => {
  it('offers only the selected provider without exposing mock credentials in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CVF_OAUTH_PROVIDER', 'github');
    render(<LoginPage />);

    expect(screen.getByRole('button', { name: 'Sign in with GitHub' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Sign in with Google' })).toBeNull();
    expect(screen.queryByText('Enterprise Mock Accounts')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sign in' })).toBeNull();
  });

  it('shows no sign-in action when production provider selection is absent', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CVF_OAUTH_PROVIDER', '');
    render(<LoginPage />);

    expect(screen.getByText('No sign-in provider is configured.')).toBeDefined();
    expect(screen.queryByRole('button', { name: /Sign in/ })).toBeNull();
  });

  it('offers Google alone when Google is selected', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CVF_OAUTH_PROVIDER', 'google');
    render(<LoginPage />);

    expect(screen.getByRole('button', { name: 'Sign in with Google' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Sign in with GitHub' })).toBeNull();
  });

  it('retains the documented local mock login in development', () => {
    vi.stubEnv('NODE_ENV', 'development');
    render(<LoginPage />);

    expect(screen.getByText('Enterprise Mock Accounts:')).toBeDefined();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Sign in with GitHub' })).toBeNull();
  });
});
