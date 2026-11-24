import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

const login = vi.hoisted(() => ({
  from: null as string | null,
  status: 'unauthenticated',
  replace: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ replace: login.replace }),
  useSearchParams: () => new URLSearchParams(login.from === null ? {} : { from: login.from }),
}));
vi.mock('next-auth/react', () => ({
  signIn: login.signIn,
  useSession: () => ({ status: login.status }),
}));
vi.mock('@/lib/i18n', () => ({
  useLanguage: () => ({ language: 'en', mounted: true }),
  LanguageToggle: () => null,
}));

import LoginPage from './page';

const originalNodeEnv = process.env.NODE_ENV;
const originalProvider = process.env.CVF_OAUTH_PROVIDER;

afterEach(() => {
  login.from = null;
  login.status = 'unauthenticated';
  login.replace.mockReset();
  login.signIn.mockReset();
  vi.stubEnv('NODE_ENV', originalNodeEnv ?? 'test');
  vi.stubEnv('CVF_OAUTH_PROVIDER', originalProvider ?? '');
});

describe('internal return path after login', () => {
  it.each([
    ['//evil.example', '/home'],
    ['https://evil.example', '/home'],
    ['/\\evil.example', '/home'],
    ['javascript:...', '/home'],
    ['/%2F%2Fevil.example', '/home'],
    ['/line\nbreak', '/home'],
    ['/line%0Abreak', '/home'],
    ['/?template=x', '/?template=x'],
    ['/skills', '/skills'],
  ])('resolves %j to %j', (from, expected) => {
    login.from = from;
    login.status = 'authenticated';
    render(<LoginPage />);
    expect(login.replace).toHaveBeenCalledWith(expected);
  });

  it('uses the checked path for OAuth sign-in', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('CVF_OAUTH_PROVIDER', 'github');
    login.from = '//evil.example';
    render(<LoginPage />);
    fireEvent.click(screen.getByRole('button', { name: 'Sign in with GitHub' }));
    expect(login.signIn).toHaveBeenCalledWith('github', { callbackUrl: '/home' });
  });

  it('uses the same checked path for credentials sign-in and navigation', async () => {
    vi.stubEnv('NODE_ENV', 'development');
    login.from = '/?template=x';
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText('Username'), { target: { value: 'test-user' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await waitFor(() => expect(login.replace).toHaveBeenCalledWith('/?template=x'));
    expect(login.signIn).toHaveBeenCalledWith('credentials', expect.objectContaining({ callbackUrl: '/?template=x' }));
  });
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

    expect(screen.getByText('Local practice accounts')).toBeDefined();
    expect(screen.getByLabelText('Username').getAttribute('placeholder')).toBeNull();
    expect(screen.getByLabelText('Password').getAttribute('placeholder')).toBeNull();
    expect(screen.queryByText(/\bR2\b/)).toBeNull();
    expect(screen.getByRole('button', { name: 'Sign in' })).toBeDefined();
    expect(screen.queryByRole('button', { name: 'Sign in with GitHub' })).toBeNull();
  });
});
