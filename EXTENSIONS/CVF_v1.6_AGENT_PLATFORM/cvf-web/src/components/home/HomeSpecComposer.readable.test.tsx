// Text Encoding Exception: operator-facing Vietnamese copy.
import { fireEvent, render, screen } from '@testing-library/react';
import { expect, it, vi } from 'vitest';
import { HomeSpecComposer } from './HomeSpecComposer';
const request = vi.hoisted(() => vi.fn());
vi.mock('@/components/Settings', () => ({ useSettings: () => ({ settings: { preferences: { defaultProvider: 'openai' }, providers: { openai: {} } } }) }));
vi.mock('@/lib/home-spec-jev-client', () => ({ requestHomeSpecJev: request }));
it('shows a readable specification with copy and guidance while retaining download', async () => {
 request.mockImplementation(async p => p.action === 'choose' ? { decision:'preselect', templateId:'documentation', runId:'fixture' } : p.action === 'fields' ? {missing: []} : {});
 render(<HomeSpecComposer language="en" providers={[]} library={null} />);
 fireEvent.change(screen.getByLabelText('What do you want to create?'), {target:{value:'Write an order handoff procedure ![logo](https://example.invalid/logo.png)'}});
 fireEvent.click(screen.getByRole('button',{name:'Continue'}));
 fireEvent.click(await screen.findByRole('button',{name:'Use this outcome'}));
 fireEvent.click(await screen.findByRole('button',{name:'Review specification'}));
 expect(screen.getByRole('heading',{name:'Work description'})).toBeTruthy();
 expect(screen.getByRole('article').querySelector('img')).toBeNull();
 expect(screen.getByRole('article').textContent).toContain('![logo]');
 expect(screen.getByRole('button',{name:'Copy'})).toBeTruthy();
 expect(screen.getByText('How to use this file')).toBeTruthy();
 expect(screen.getByText('Suggest a skill for the assistant doing the work')).toBeTruthy();
 expect(screen.getByRole('button',{name:'Download specification'}).getAttribute('aria-describedby')).toBe(screen.getByText('Use this file to hand the work over to your assistant.').id);
});
it('uses plain language on the English home screen before any input', () => {
 render(<HomeSpecComposer language="en" providers={[]} library={null} />);
 expect(screen.getByText('Describe what you need, then review and download the specification for your assistant.')).toBeTruthy();
 expect(screen.queryByText(/\bagent\b|CVF Toolkit|Governance|Streaming/i)).toBeNull();
});
it('describes the Vietnamese handoff without specialist vocabulary', async () => {
 request.mockImplementation(async p => p.action === 'choose' ? { decision:'preselect', templateId:'documentation', runId:'fixture' } : p.action === 'fields' ? {missing: []} : {});
 render(<HomeSpecComposer language="vi" providers={[]} library={null} />);
 fireEvent.change(screen.getByLabelText('Bạn muốn tạo gì?'), {target:{value:'Viết tài liệu bàn giao công việc cho nhân viên mới'}});
 fireEvent.click(screen.getByRole('button',{name:'Tiếp tục'}));
 fireEvent.click(await screen.findByRole('button',{name:'Dùng loại kết quả này'}));
 fireEvent.click(await screen.findByRole('button',{name:'Xem lại đặc tả'}));
 expect(screen.getByText('Gợi ý kỹ năng cho trợ lý nhận việc')).toBeTruthy();
 expect(screen.getByRole('button',{name:'Tải bản đặc tả'}).getAttribute('aria-describedby')).toBe(screen.getByText('Dùng tệp này để giao việc cho trợ lý của bạn.').id);
});
it('asks for additional detail instead of repeating the requested result and reuses the description in a general draft', async () => {
 request.mockResolvedValue({ decision:'clarify', runId:'fixture', candidates:[] });
 render(<HomeSpecComposer language="en" providers={[]} library={null} />);
 const goal='Write a short message to welcome new customers';
 fireEvent.change(screen.getByLabelText('What do you want to create?'), {target:{value:goal}});
 fireEvent.click(screen.getByRole('button',{name:'Continue'}));
 expect(await screen.findByLabelText('What other details should the assistant know?')).toBeTruthy();
 expect(screen.queryByLabelText('What specific document or result do you want?')).toBeNull();
});
it('opens the existing assistant with the entered draft', () => {
 const listener=vi.fn(); window.addEventListener('cvf:openAgent', listener);
 render(<HomeSpecComposer language="en" providers={[]} library={null} />);
 fireEvent.change(screen.getByLabelText('What do you want to create?'), {target:{value:'Help draft a short note'}});
 fireEvent.click(screen.getByRole('button',{name:'Work directly with AI assistant'}));
 expect(listener.mock.calls[0][0].detail.draft).toBe('Help draft a short note');
 window.removeEventListener('cvf:openAgent',listener);
});
