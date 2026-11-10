// Text Encoding Exception: assertions preserve the exact Vietnamese UI copy under test.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import SkillSuggestionPage from './page';

afterEach(() => { cleanup(); sessionStorage.clear(); vi.unstubAllGlobals(); });

const trialDisclosure = {
  configured: true, admitted: true, trialStatus: 'ACTIVE', observed: false,
  provider: 'OpenRouter / TypeSafe Jev', connection: 'openrouter-systemone',
  destination: 'https://openrouter.ai/api/v1/systemone', rosterMetadataEgress: true,
  requestedModel: 'typesafe/jev-1.14', costStatus: 'UNKNOWN',
};

it.each(['expired', 'missing', 'network', 'pending'])('recovers history independently when current configuration is %s', async failure => {
  sessionStorage.setItem('cvf-jev-run-id', 'retained-run');
  let resolveStatus: ((response: Response) => void) | undefined;
  const pending = new Promise<Response>(resolve => { resolveStatus = resolve; });
  const transport = vi.fn((input: unknown, init?: RequestInit) => {
    expect(init?.method).toBeUndefined();
    if (String(input).includes('?runId=')) return Promise.resolve(new Response(JSON.stringify({
      provider: 'TypeSafe Jev', providerContact: 'RESPONSE_OBSERVED',
      result: { status: 'no_match', reason: 'NATIVE_NO_WORKFLOW' },
    })));
    if (failure === 'pending') return pending;
    if (failure === 'network') return Promise.reject(new Error('synthetic status failure'));
    return Promise.resolve(new Response(JSON.stringify({ error: failure === 'expired' ? 'EXPIRED' : 'JEV_EXECUTION_BLOCKED' }), { status: failure === 'expired' ? 403 : 503 }));
  });
  vi.stubGlobal('fetch', transport);
  render(<SkillSuggestionPage />);
  expect(await screen.findByText('Chưa có gợi ý phù hợp')).toBeTruthy();
  expect(screen.getByText('Đã nhận phản hồi từ TypeSafe Jev cho yêu cầu này.')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Gợi ý kỹ năng' }).hasAttribute('disabled')).toBe(true);
  expect(transport).toHaveBeenCalledTimes(2);
  resolveStatus?.(new Response('{}', { status: 503 }));
});

it.each(['STOPPED', 'IN_FLIGHT'])('disables new actions after a POST reports durable trial %s', async trialStatus => {
  const transport = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(trialDisclosure)))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ...trialDisclosure, admitted: false, trialStatus,
      error: 'COMMIT_UNKNOWN', runId: 'retained-run', providerContact: 'POSSIBLE',
    }), { status: 503 }));
  vi.stubGlobal('fetch', transport);
  render(<SkillSuggestionPage />);
  await screen.findByText('Jev sẵn sàng theo quyền đã cấp');
  fireEvent.change(screen.getByLabelText('Bạn muốn đạt kết quả gì?'), { target: { value: 'A bounded synthetic task' } });
  fireEvent.click(screen.getByRole('button', { name: 'Gợi ý kỹ năng' }));
  await screen.findByRole('alert');
  expect(screen.getByRole('button', { name: 'Gợi ý kỹ năng' }).hasAttribute('disabled')).toBe(true);
  expect(screen.queryByText('Jev sẵn sàng theo quyền đã cấp')).toBeNull();
  expect(screen.getByText(trialStatus === 'STOPPED' ? 'Lượt thử Jev đã dừng. CVF không gửi thêm yêu cầu.' : 'Lượt thử Jev đang xử lý; chưa nhận yêu cầu mới.')).toBeTruthy();
  expect(transport).toHaveBeenCalledTimes(2);
});

it('describes action refusal without claiming that the authenticated session expired', async () => {
  const transport = vi.fn()
    .mockResolvedValueOnce(new Response(JSON.stringify(trialDisclosure)))
    .mockResolvedValueOnce(new Response(JSON.stringify({ ...trialDisclosure, error: 'ACTION_REFUSED' }), { status: 403 }));
  vi.stubGlobal('fetch', transport);
  render(<SkillSuggestionPage />);
  await screen.findByText('Jev sẵn sàng theo quyền đã cấp');
  fireEvent.change(screen.getByLabelText('Bạn muốn đạt kết quả gì?'), { target: { value: 'A bounded synthetic task' } });
  fireEvent.click(screen.getByRole('button', { name: 'Gợi ý kỹ năng' }));
  expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('chưa được cấp quyền'));
  expect(screen.queryByText(/Phiên CVF đã hết hạn/)).toBeNull();
  expect(screen.queryByRole('link', { name: 'đăng nhập CVF' })).toBeNull();
  expect(transport).toHaveBeenCalledTimes(2);
});

describe('noncoder skill suggestion view', () => {
  it('discloses OpenRouter as the intermediary, metadata egress and unknown cost without claiming an observed call', async () => {
    const transport = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        configured: true, admitted: true, observed: false, provider: 'OpenRouter / TypeSafe Jev',
        connection: 'openrouter-systemone', destination: 'https://openrouter.ai/api/v1/systemone',
        rosterMetadataEgress: true, costStatus: 'UNKNOWN', requestedModel: 'typesafe/jev-1.14',
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: 'OpenRouter / TypeSafe Jev', connection: 'openrouter-systemone',
        destination: 'https://openrouter.ai/api/v1/systemone', rosterMetadataEgress: true,
        costStatus: 'UNKNOWN', requestedModel: 'typesafe/jev-1.14', providerContact: 'RESPONSE_OBSERVED',
        result: { status: 'no_match', reason: 'NATIVE_NO_WORKFLOW' },
      })));
    vi.stubGlobal('fetch', transport);
    render(<SkillSuggestionPage />);
    expect(await screen.findByText('Kết nối qua OpenRouter System One đến TypeSafe Jev')).toBeTruthy();
    expect(screen.getByText('Đích gửi: https://openrouter.ai/api/v1/systemone')).toBeTruthy();
    expect(screen.getByText('Thông tin danh sách kỹ năng được gửi cùng yêu cầu.')).toBeTruthy();
    expect(screen.getByText('Chi phí: chưa xác định')).toBeTruthy();
    expect(screen.getByText('Mô hình yêu cầu: typesafe/jev-1.14')).toBeTruthy();
    expect(screen.getByText(/chưa có phản hồi trực tiếp được ghi nhận/)).toBeTruthy();
    fireEvent.change(screen.getByLabelText('Bạn muốn đạt kết quả gì?'), { target: { value: 'Tôi muốn tìm kỹ năng phù hợp' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gợi ý kỹ năng' }));
    expect(await screen.findByText('Chưa có gợi ý phù hợp')).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Xem kỹ năng/ })).toBeNull();
    expect(await screen.findByText('Đã nhận phản hồi từ OpenRouter / TypeSafe Jev cho yêu cầu này.')).toBeTruthy();
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it('refuses a malformed historical transport instead of labelling its result with the current transport', async () => {
    sessionStorage.setItem('cvf-jev-run-id', 'fixture-run');
    const transport = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        configured: true, admitted: false, trialStatus: 'STOPPED', observed: false,
        provider: 'OpenRouter / TypeSafe Jev', connection: 'openrouter-systemone',
        destination: 'https://openrouter.ai/api/v1/systemone', rosterMetadataEgress: true, costStatus: 'UNKNOWN', requestedModel: 'typesafe/jev-1.14',
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: 'OpenRouter / TypeSafe Jev', connection: 'direct',
        destination: 'https://openrouter.ai/api/v1/systemone', rosterMetadataEgress: true, costStatus: 'REPORTED', requestedModel: 'typesafe/jev-1.14',
        providerContact: 'RESPONSE_OBSERVED',
        result: { status: 'suggested', title: 'False result', domain: 'App Development', href: '/skills/fake/fake', reason: 'CATALOG_TASK_FIT' },
      })));
    vi.stubGlobal('fetch', transport);
    render(<SkillSuggestionPage />);
    expect(await screen.findByText('Lượt thử Jev đã dừng. CVF không gửi thêm yêu cầu.')).toBeTruthy();
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('không có thông tin kết nối hợp lệ'));
    expect(screen.queryByText('False result')).toBeNull();
    expect(screen.queryByRole('link', { name: /Xem kỹ năng/ })).toBeNull();
    expect(screen.getByRole('button', { name: 'Gợi ý kỹ năng' }).hasAttribute('disabled')).toBe(true);
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it('rejects a wrong OpenRouter model in current admission and historical recovery', async () => {
    const status = {
      configured: true, admitted: true, observed: false, provider: 'OpenRouter / TypeSafe Jev',
      connection: 'openrouter-systemone', destination: 'https://openrouter.ai/api/v1/systemone',
      rosterMetadataEgress: true, costStatus: 'UNKNOWN', requestedModel: 'typesafe/wrong-model',
    };
    const first = vi.fn(async () => new Response(JSON.stringify(status)));
    vi.stubGlobal('fetch', first);
    const firstView = render(<SkillSuggestionPage />);
    expect(await screen.findByText('Jev chưa được cấp đủ điều kiện')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Gợi ý kỹ năng' }).hasAttribute('disabled')).toBe(true);
    expect(screen.queryByText('Kết nối qua OpenRouter System One đến TypeSafe Jev')).toBeNull();
    expect(first).toHaveBeenCalledTimes(1);
    firstView.unmount();

    sessionStorage.setItem('cvf-jev-run-id', 'wrong-model-run');
    const saved = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...status, requestedModel: 'typesafe/jev-1.14' })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        ...status, result: { status: 'suggested', title: 'Wrong model result', domain: 'App Development',
          href: '/skills/fake/fake', reason: 'CATALOG_TASK_FIT' },
      })));
    vi.stubGlobal('fetch', saved);
    render(<SkillSuggestionPage />);
    expect(await screen.findByRole('alert')).toHaveProperty('textContent', expect.stringContaining('không có thông tin kết nối hợp lệ'));
    expect(screen.queryByText('Wrong model result')).toBeNull();
    expect(saved).toHaveBeenCalledTimes(2);
  });

  it('labels an older direct TypeSafe result from its own record while current routing uses OpenRouter', async () => {
    sessionStorage.setItem('cvf-jev-run-id', 'old-run');
    const transport = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        configured: false, admitted: false, trialStatus: 'UNAVAILABLE', observed: false,
        provider: 'OpenRouter / TypeSafe Jev', connection: 'openrouter-systemone',
        destination: 'https://openrouter.ai/api/v1/systemone', rosterMetadataEgress: true, costStatus: 'UNKNOWN', requestedModel: 'typesafe/jev-1.14',
      })))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        provider: 'TypeSafe Jev', providerContact: 'RESPONSE_OBSERVED',
        result: { status: 'no_match', reason: 'NATIVE_NO_WORKFLOW' },
      })));
    vi.stubGlobal('fetch', transport);
    render(<SkillSuggestionPage />);
    expect(await screen.findByText('Chưa có gợi ý phù hợp')).toBeTruthy();
    expect(screen.getByText('Đã nhận phản hồi từ TypeSafe Jev cho yêu cầu này.')).toBeTruthy();
    expect(screen.getByText(/Kết quả này dùng kết nối TypeSafe trực tiếp/)).toBeTruthy();
    expect(screen.getByText('Kết nối qua OpenRouter System One đến TypeSafe Jev')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Gợi ý kỹ năng' }).hasAttribute('disabled')).toBe(true);
    expect(transport).toHaveBeenCalledTimes(2);
  });

  it('explains an unconnected Jev state without fabricating a result', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ connected: false }), { status: 200 })));
    render(<SkillSuggestionPage />);
    expect(await screen.findByText('Jev chưa được cấp đủ điều kiện')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Gợi ý kỹ năng' }).hasAttribute('disabled')).toBe(true);
    expect(screen.queryByText('Gợi ý từ TypeSafe Jev')).toBeNull();
  });

  it('asks for CVF sign-in when the status request is unauthenticated', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 })));
    render(<SkillSuggestionPage />);
    expect(await screen.findByText('Cần đăng nhập CVF')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'đăng nhập CVF' }).getAttribute('href')).toBe('/login?from=/skills/suggest');
    expect(screen.getByRole('button', { name: 'Gợi ý kỹ năng' }).hasAttribute('disabled')).toBe(true);
    expect(screen.queryByText('Jev chưa được cấp đủ điều kiện')).toBeNull();
  });

  it('shows a real adapter-labelled suggestion and its CVF skill link after submission', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ configured: true, admitted: true, observed: false, provider: 'TypeSafe Jev' }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ provider: 'TypeSafe Jev', result: {
        status: 'suggested', title: 'App Requirements Spec', domain: 'App Development',
        href: '/skills/app_development/01_app_requirements_spec', reason: 'Fits app planning.',
      } }), { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    render(<SkillSuggestionPage />);
    await screen.findByText('Jev sẵn sàng theo quyền đã cấp');
    fireEvent.change(screen.getByLabelText('Bạn muốn đạt kết quả gì?'), { target: { value: 'Tôi muốn lập yêu cầu cho một ứng dụng nhỏ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Gợi ý kỹ năng' }));
    await screen.findByText('Gợi ý từ TypeSafe Jev');
    expect(screen.getByRole('link', { name: /Xem kỹ năng/ }).getAttribute('href')).toBe('/skills/app_development/01_app_requirements_spec');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});


it('preserves submission nonce on ambiguous failure and never persists goal text',async()=>{
  const transport=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({configured:true,admitted:true,observed:false,provider:'TypeSafe Jev'})))
    .mockImplementation(async()=>new Response(JSON.stringify({error:'POSSIBLE_SEND',runId:'fixture-run',providerContact:'POSSIBLE'}),{status:502}));vi.stubGlobal('fetch',transport);
  render(<SkillSuggestionPage/>);await screen.findByText('Jev sẵn sàng theo quyền đã cấp');
  fireEvent.change(screen.getByLabelText('Bạn muốn đạt kết quả gì?'),{target:{value:'A bounded nonsecret task'}});
  fireEvent.click(screen.getByRole('button',{name:'Gợi ý kỹ năng'}));await screen.findByRole('alert');
  fireEvent.click(screen.getByRole('button',{name:'Gợi ý kỹ năng'}));await waitFor(()=>expect(transport).toHaveBeenCalledTimes(3));
  expect(JSON.parse(transport.mock.calls[1][1].body).nonce).toBe(JSON.parse(transport.mock.calls[2][1].body).nonce);
  expect(await screen.findByText('Yêu cầu có thể đã được gửi đến Jev; chưa xác nhận được kết quả. CVF không tự gửi lại.')).toBeTruthy();
  expect(sessionStorage.getItem('cvf-jev-run-id')).toBe('fixture-run');expect(JSON.stringify({...sessionStorage})).not.toContain('nonsecret');
});
it('recovers an existing result with GET only on reload',async()=>{
  sessionStorage.setItem('cvf-jev-run-id','fixture-run');
  const transport=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({configured:true,admitted:false,observed:false,provider:'TypeSafe Jev'})))
    .mockResolvedValueOnce(new Response(JSON.stringify({provider:'TypeSafe Jev',providerContact:'RESPONSE_OBSERVED',result:{status:'no_match',reason:'NATIVE_NO_WORKFLOW'}})));vi.stubGlobal('fetch',transport);
  render(<SkillSuggestionPage/>);await screen.findByText('Chưa có gợi ý phù hợp');expect(screen.getByText('Đã nhận phản hồi từ TypeSafe Jev cho yêu cầu này.')).toBeTruthy();expect(transport).toHaveBeenCalledTimes(2);
  expect(transport.mock.calls[1][0]).toBe('/api/skills/suggest?runId=fixture-run');expect(transport.mock.calls[1][1].method).toBeUndefined();
});


it('reuses persisted nonce after an interrupted browser session without persisting the goal',async()=>{
  sessionStorage.setItem('cvf-jev-submission-nonce','pending_nonce_001');
  const transport=vi.fn().mockResolvedValueOnce(new Response(JSON.stringify({configured:true,admitted:true,provider:'TypeSafe Jev'}))).mockResolvedValueOnce(new Response(JSON.stringify({error:'COMMIT_UNKNOWN'}),{status:503}));vi.stubGlobal('fetch',transport);
  render(<SkillSuggestionPage/>);await screen.findByText('Jev sẵn sàng theo quyền đã cấp');fireEvent.change(screen.getByLabelText('Bạn muốn đạt kết quả gì?'),{target:{value:'Continue the same bounded goal'}});fireEvent.click(screen.getByRole('button',{name:'Gợi ý kỹ năng'}));await screen.findByRole('alert');
  expect(JSON.parse(transport.mock.calls[1][1].body).nonce).toBe('pending_nonce_001');expect(sessionStorage.getItem('cvf-jev-submission-nonce')).toBe('pending_nonce_001');
});
