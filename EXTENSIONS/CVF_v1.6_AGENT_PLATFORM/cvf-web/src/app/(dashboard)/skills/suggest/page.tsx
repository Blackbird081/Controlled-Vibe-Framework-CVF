'use client';
// Text Encoding Exception: Vietnamese product copy is required for the noncoder flow.

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CircleHelp, Sparkles } from 'lucide-react';

type Result =
  | { status: 'suggested'; title: string; domain: string; href: string; reason: string }
  | { status: 'no_match'; reason: string };

type TransportDisclosure = {
  provider: 'TypeSafe Jev' | 'OpenRouter / TypeSafe Jev';
  connection: 'direct' | 'openrouter-systemone';
  destination: string;
  requestedModel: 'jev-latest' | 'typesafe/jev-1.14';
  rosterMetadataEgress: boolean;
  costStatus: 'UNKNOWN' | 'REPORTED';
};
const OPENROUTER_DESTINATION = 'https://openrouter.ai/api/v1/systemone';
const DIRECT: TransportDisclosure = {
  provider: 'TypeSafe Jev', connection: 'direct', destination: 'TypeSafe', requestedModel: 'jev-latest',
  rosterMetadataEgress: true, costStatus: 'UNKNOWN',
};
function disclosure(data: Record<string, unknown>): TransportDisclosure | null {
  if (data.provider === 'TypeSafe Jev' && data.connection === undefined) return DIRECT;
  if (data.provider !== 'OpenRouter / TypeSafe Jev' || data.connection !== 'openrouter-systemone' ||
      data.destination !== OPENROUTER_DESTINATION || data.rosterMetadataEgress !== true ||
      data.requestedModel !== 'typesafe/jev-1.14' ||
      !['UNKNOWN', 'REPORTED'].includes(String(data.costStatus))) return null;
  return { provider: data.provider, connection: data.connection, destination: data.destination,
    requestedModel: data.requestedModel, rosterMetadataEgress: true, costStatus: data.costStatus as 'UNKNOWN' | 'REPORTED' };
}

export default function SkillSuggestionPage() {
  const [goal, setGoal] = useState('');
  const [connection, setConnection] = useState<'checking' | 'connected' | 'not_connected' | 'sign_in' | 'unavailable'>('checking');
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');
  const submission = useRef<{goal:string;nonce:string}|null>(null);
  const [observed, setObserved] = useState(false);
  const [configured, setConfigured] = useState(false);
  const [admitted, setAdmitted] = useState(false);
  const [transport, setTransport] = useState<TransportDisclosure | null>(null);
  const [resultTransport, setResultTransport] = useState<TransportDisclosure | null>(null);
  const [trialStatus, setTrialStatus] = useState<string | null>(null);
  const [contact, setContact] = useState<'NOT_STARTED'|'POSSIBLE'|'RESPONSE_OBSERVED'|'UNKNOWN'>('NOT_STARTED');

  useEffect(() => {
    let active = true;
    async function checkConnection() {
      try {
        const response = await fetch('/api/skills/suggest', { cache: 'no-store' });
        const data = await response.json();
        if (!active) return;
        if (response.status === 401 || (response.status === 403 && data.error === 'SESSION_REFUSED')) {
          setConnection('sign_in');
          return;
        }
        if (!response.ok) { setConnection('unavailable'); return; }
        setTransport(disclosure(data));
        setTrialStatus(typeof data.trialStatus === 'string' ? data.trialStatus : null);
        setConfigured(data.configured === true);
        setAdmitted(data.admitted === true);
        setObserved(data.observed === true);
        setConnection(data.configured === true && data.admitted === true && disclosure(data) ? 'connected' : 'not_connected');
      } catch { if (active) setConnection('unavailable'); }
    }
    async function recover() {
      try {
        const runId = sessionStorage.getItem('cvf-jev-run-id');
        if (runId) {
          const recovery = await fetch(`/api/skills/suggest?runId=${encodeURIComponent(runId)}`, { cache: 'no-store' });
          if (recovery.ok) { const saved = await recovery.json(); if (active) {
            const savedTransport = disclosure(saved);
            if (!savedTransport) setError('Kết quả trước không có thông tin kết nối hợp lệ. CVF không hiển thị gợi ý và không tự gửi lại.');
            else {
              setResultTransport(savedTransport);
              if (saved.result && ['suggested', 'no_match'].includes(saved.result.status)) setResult(saved.result);
              setContact(['NOT_STARTED','POSSIBLE','RESPONSE_OBSERVED'].includes(saved.providerContact) ? saved.providerContact : 'UNKNOWN');
            }
          } }
          else if (active) setError('Kết quả trước chưa đọc được. CVF không tự gửi lại yêu cầu.');
        }
      } catch { if (active) setError('Kết quả trước chưa đọc được. CVF không tự gửi lại yêu cầu.'); }
    }
    void checkConnection();
    void recover();
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setResultTransport(null);
    setError('');
    if (goal.trim().length < 8) { setError('Hãy mô tả mục tiêu rõ hơn một chút.'); return; }
    if (!submission.current || submission.current.goal !== goal.trim()) {
      submission.current = { goal: goal.trim(), nonce: !submission.current ? sessionStorage.getItem('cvf-jev-submission-nonce') ?? crypto.randomUUID().replaceAll('-', '') : crypto.randomUUID().replaceAll('-', '') };
    }
    sessionStorage.setItem('cvf-jev-submission-nonce', submission.current.nonce);
    setContact('UNKNOWN');
    setWorking(true);
    try {
      const response = await fetch('/api/skills/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal.trim(), nonce: submission.current.nonce }),
      });
      const data = await response.json();
      const returnedTransport = disclosure(data);
      if (returnedTransport) setTransport(returnedTransport);
      if (typeof data.trialStatus === 'string') {
        setTrialStatus(data.trialStatus);
        setConfigured(data.configured === true);
        setAdmitted(data.admitted === true);
        setConnection(data.configured === true && data.admitted === true && returnedTransport ? 'connected' : 'not_connected');
      }
      setContact(['NOT_STARTED','POSSIBLE','RESPONSE_OBSERVED'].includes(data.providerContact) ? data.providerContact : 'UNKNOWN');
      if (typeof data.runId === 'string') sessionStorage.setItem('cvf-jev-run-id', data.runId);
      if (!response.ok) {
        if (response.status === 401 || (response.status === 403 && data.error === 'SESSION_REFUSED')) {
          setConnection('sign_in');
          setError('Phiên CVF đã hết hạn. Hãy đăng nhập lại trước khi tìm kỹ năng.');
        } else if (response.status === 403) {
          setError('Yêu cầu này chưa được cấp quyền thực hiện. CVF không gửi lại yêu cầu hoặc chạy kỹ năng.');
        } else if (data.error === 'JEV_NOT_CONNECTED') {
          setConnection('not_connected');
          setError('Jev chưa có đủ quyền và điều kiện thực hiện. Bạn có thể xem thư viện kỹ năng trong lúc chờ kết nối.');
        } else {
          setError('Chưa nhận được gợi ý. CVF chưa chọn kỹ năng nào và chưa thực hiện công việc.');
        }
        return;
      }
      if (!returnedTransport || !data.result || !['suggested', 'no_match'].includes(data.result.status)) {
        setError('Kết quả chưa thể kiểm tra. Vui lòng thử lại sau.');
        return;
      }
      setResultTransport(returnedTransport);
      setResult(data.result as Result);
    } catch {
      setError('Kết nối bị gián đoạn. Chưa có kỹ năng nào được chọn hoặc chạy.');
    } finally { setWorking(false); }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-7 text-slate-900 dark:text-slate-100 sm:px-7">
      <Link href="/skills" className="mb-6 inline-flex items-center gap-2 text-sm text-indigo-600 hover:underline dark:text-indigo-300">
        <ArrowLeft size={16} /> Thư viện kỹ năng
      </Link>
      <div className="mb-6 flex items-start gap-3">
        <div className="rounded-xl bg-indigo-100 p-3 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300"><Sparkles size={21} /></div>
        <div>
          <h1 className="text-2xl font-semibold">Tìm kỹ năng phù hợp</h1>
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Nói điều bạn muốn làm. CVF dùng Jev để gợi ý một kỹ năng trong thư viện, hoặc nói rõ khi chưa tìm thấy.</p>
        </div>
      </div>
      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-white/10 dark:bg-[#1c1d27]">
        <form onSubmit={submit} className="space-y-4">
          <label htmlFor="jev-goal" className="block text-sm font-semibold">Bạn muốn đạt kết quả gì?</label>
          <textarea id="jev-goal" value={goal} onChange={event => setGoal(event.target.value)} rows={4} maxLength={1000}
            placeholder="Ví dụ: Tôi muốn lập kế hoạch cho một ứng dụng bán hàng nhỏ và biết cần chuẩn bị gì trước khi viết code."
            className="w-full rounded-xl border border-slate-300 bg-white p-3 text-sm leading-6 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/30 dark:border-white/20 dark:bg-[#111218]" />
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Khi bấm tìm, mô tả này được gửi theo kết nối Jev hiển thị bên dưới để đánh giá. Đừng nhập mật khẩu, khóa API hoặc dữ liệu riêng tư. Gợi ý chưa chạy kỹ năng và chưa thay đổi dự án.</p>
          {transport && <div aria-label="Thông tin kết nối Jev" className="rounded-lg border border-slate-200 p-3 text-xs leading-5 text-slate-600 dark:border-white/10 dark:text-slate-300">
            <p>{transport.connection === 'openrouter-systemone' ? 'Kết nối qua OpenRouter System One đến TypeSafe Jev' : 'Kết nối trực tiếp đến TypeSafe Jev'}</p>
            <p>Đích gửi: {transport.destination}</p>
            <p>Mô hình yêu cầu: {transport.requestedModel}</p>
            <p>{transport.rosterMetadataEgress ? 'Thông tin danh sách kỹ năng được gửi cùng yêu cầu.' : 'Không gửi thông tin danh sách kỹ năng.'}</p>
            <p>Chi phí: {transport.costStatus === 'UNKNOWN' ? 'chưa xác định' : 'đã ghi nhận'}</p>
            <p>Cấu hình: {configured ? 'có' : 'chưa có'}; tiếp nhận: {admitted ? 'được chấp nhận' : 'chưa được chấp nhận'}.</p>
            <p>Quan sát: {observed || contact === 'RESPONSE_OBSERVED' ? 'đã có phản hồi được ghi nhận' : 'chưa có phản hồi trực tiếp được ghi nhận'}.</p>
          </div>}
          {trialStatus === 'STOPPED' && <p role="status" className="text-xs font-semibold text-rose-700 dark:text-rose-300">Lượt thử Jev đã dừng. CVF không gửi thêm yêu cầu.</p>}
          {trialStatus === 'IN_FLIGHT' && <p role="status" className="text-xs text-amber-700 dark:text-amber-300">Lượt thử Jev đang xử lý; chưa nhận yêu cầu mới.</p>}
          {trialStatus === 'EXPIRED' && <p role="status" className="text-xs text-amber-700 dark:text-amber-300">Lượt thử Jev đã hết hạn.</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={working || connection !== 'connected' || (trialStatus !== null && trialStatus !== 'ACTIVE')}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50">
              {working ? 'Đang tìm...' : 'Gợi ý kỹ năng'}
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {connection === 'checking' ? 'Đang kiểm tra kết nối Jev' : connection === 'connected' ? 'Jev sẵn sàng theo quyền đã cấp' : connection === 'not_connected' ? 'Jev chưa được cấp đủ điều kiện' : connection === 'sign_in' ? 'Cần đăng nhập CVF' : 'Chưa kiểm tra được kết nối Jev'}
            </span>
          </div>
        </form>
      </section>
      {connection === 'not_connected' && <div role="status" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        CVF chưa có đủ kết nối, quyền hoặc điều kiện dữ liệu/chi phí cho Jev. Bạn vẫn có thể <Link className="underline" href="/skills">xem thư viện kỹ năng</Link>; gợi ý Jev sẽ dùng được khi đủ điều kiện.
      </div>}
      {connection === 'sign_in' && <div role="status" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        Hãy <Link className="underline" href="/login?from=/skills/suggest">đăng nhập CVF</Link> để kiểm tra kết nối và dùng gợi ý kỹ năng.
      </div>}
      {connection === 'unavailable' && <div role="status" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        Chưa kiểm tra được kết nối Jev. Bạn có thể <Link className="underline" href="/skills">xem thư viện kỹ năng</Link> trong lúc chờ.
      </div>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">{error}</p>}
      <p role="status" className="mt-3 text-xs text-slate-600 dark:text-slate-300">{contact === 'RESPONSE_OBSERVED' ? `Đã nhận phản hồi từ ${resultTransport?.provider ?? transport?.provider ?? 'Jev'} cho yêu cầu này.` : contact === 'POSSIBLE' ? 'Yêu cầu có thể đã được gửi đến Jev; chưa xác nhận được kết quả. CVF không tự gửi lại.' : contact === 'NOT_STARTED' ? 'CVF chưa gọi Jev cho yêu cầu này.' : 'Chưa xác định được Jev đã được gọi hay chưa. CVF không tự gửi lại.'}</p>
      {observed && <p className="mt-3 text-xs">Có bằng chứng từ lần gọi trước; quyền lần này được kiểm tra riêng.</p>}
      {result && <section aria-live="polite" className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 dark:border-indigo-500/25 dark:bg-indigo-500/10">
        {result.status === 'suggested' ? <>
          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Gợi ý từ {resultTransport?.provider ?? 'Jev'}</div>
          <h2 className="mt-2 text-xl font-semibold">{result.title}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{result.domain}</p>
          <p className="mt-4 text-sm leading-6">{result.reason === 'CATALOG_TASK_FIT' ? 'Kỹ năng trong thư viện phù hợp với yêu cầu; hãy xem nội dung trước khi dùng.' : result.reason === 'NATIVE_NO_WORKFLOW' ? 'Yêu cầu này chưa cần một kỹ năng trong thư viện CVF.' : result.reason === 'NATIVE_LOW_FIT' ? 'Chưa tìm thấy kỹ năng đủ phù hợp.' : result.reason}</p>
          <Link href={result.href} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Xem kỹ năng <ArrowRight size={15} /></Link>
        </> : <>
          <div className="flex items-center gap-2 text-sm font-semibold"><CircleHelp size={18} /> Chưa có gợi ý phù hợp</div>
          <p className="mt-3 text-sm leading-6">{result.reason === 'CATALOG_TASK_FIT' ? 'Kỹ năng trong thư viện phù hợp với yêu cầu; hãy xem nội dung trước khi dùng.' : result.reason === 'NATIVE_NO_WORKFLOW' ? 'Yêu cầu này chưa cần một kỹ năng trong thư viện CVF.' : result.reason === 'NATIVE_LOW_FIT' ? 'Chưa tìm thấy kỹ năng đủ phù hợp.' : result.reason}</p>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Bạn có thể mô tả cụ thể hơn hoặc tự xem thư viện.</p>
        </>}
        {resultTransport && <p className="mt-4 text-xs text-slate-600 dark:text-slate-300">Kết quả này dùng {resultTransport.connection === 'openrouter-systemone' ? 'OpenRouter System One' : 'kết nối TypeSafe trực tiếp'}; đích gửi: {resultTransport.destination}; mô hình yêu cầu: {resultTransport.requestedModel}; thông tin danh sách kỹ năng {resultTransport.rosterMetadataEgress ? 'được gửi' : 'không được gửi'}; chi phí: {resultTransport.costStatus === 'UNKNOWN' ? 'chưa xác định' : 'đã ghi nhận'}.</p>}
        <p className="mt-5 border-t border-indigo-200 pt-3 text-xs text-slate-600 dark:border-indigo-500/20 dark:text-slate-300">Đây là đề xuất để bạn xem xét. CVF chưa chạy kỹ năng; việc bạn thích hay chưa thích kết quả sẽ được ghi riêng với đánh giá kỹ thuật của repo.</p>
      </section>}
    </main>
  );
}
