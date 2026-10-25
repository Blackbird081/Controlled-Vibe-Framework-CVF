// Text Encoding Exception: assertions preserve the exact Vietnamese UI copy under test.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SkillSuggestionPage from './page';

afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

describe('noncoder skill suggestion view', () => {
  it('explains an unconnected Jev state without fabricating a result', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ connected: false }), { status: 200 })));
    render(<SkillSuggestionPage />);
    expect(await screen.findByText('Jev chưa kết nối')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Gợi ý kỹ năng' }).hasAttribute('disabled')).toBe(true);
    expect(screen.queryByText('Gợi ý từ TypeSafe Jev')).toBeNull();
  });

  it('asks for CVF sign-in when the status request is unauthenticated', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 })));
    render(<SkillSuggestionPage />);
    expect(await screen.findByText('Cần đăng nhập CVF')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'đăng nhập CVF' }).getAttribute('href')).toBe('/login?from=/skills/suggest');
    expect(screen.getByRole('button', { name: 'Gợi ý kỹ năng' }).hasAttribute('disabled')).toBe(true);
    expect(screen.queryByText('Jev chưa kết nối')).toBeNull();
  });

  it('shows a real adapter-labelled suggestion and its CVF skill link after submission', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ connected: true }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ provider: 'TypeSafe Jev', result: {
        status: 'suggested', title: 'App Requirements Spec', domain: 'App Development',
        href: '/skills/app_development/01_app_requirements_spec', reason: 'Fits app planning.',
      } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    render(<SkillSuggestionPage />);
    await screen.findByText('Jev đã kết nối');
    fireEvent.change(screen.getByLabelText('Bạn muốn đạt kết quả gì?'), { target: { value: 'Tôi muốn lập yêu cầu cho một ứng dụng nhỏ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gợi ý kỹ năng' }));
    await screen.findByText('Gợi ý từ TypeSafe Jev');
    expect(screen.getByRole('link', { name: /Xem kỹ năng/ }).getAttribute('href')).toBe('/skills/app_development/01_app_requirements_spec');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
