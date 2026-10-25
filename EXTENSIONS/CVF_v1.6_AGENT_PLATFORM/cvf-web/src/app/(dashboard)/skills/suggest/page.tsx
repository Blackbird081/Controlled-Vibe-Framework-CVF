'use client';
// Text Encoding Exception: Vietnamese product copy is required for the noncoder flow.

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, CircleHelp, Sparkles } from 'lucide-react';

type Result =
  | { status: 'suggested'; title: string; domain: string; href: string; reason: string }
  | { status: 'no_match'; reason: string };

export default function SkillSuggestionPage() {
  const [goal, setGoal] = useState('');
  const [connection, setConnection] = useState<'checking' | 'connected' | 'not_connected' | 'sign_in' | 'unavailable'>('checking');
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void fetch('/api/skills/suggest', { cache: 'no-store' })
      .then(async response => {
        if (response.status === 401 || response.status === 403) return 'sign_in' as const;
        if (!response.ok) return 'unavailable' as const;
        const data = await response.json();
        return data.connected === true ? 'connected' as const : 'not_connected' as const;
      })
      .then(status => { if (active) setConnection(status); })
      .catch(() => { if (active) setConnection('unavailable'); });
    return () => { active = false; };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setResult(null);
    setError('');
    if (goal.trim().length < 8) { setError('Hãy mô tả mục tiêu rõ hơn một chút.'); return; }
    setWorking(true);
    try {
      const response = await fetch('/api/skills/suggest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: goal.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          setConnection('sign_in');
          setError('Phiên CVF đã hết hạn. Hãy đăng nhập lại trước khi tìm kỹ năng.');
        } else if (data.error === 'JEV_NOT_CONNECTED') {
          setConnection('not_connected');
          setError('Jev chưa được kết nối với CVF. Bạn có thể xem thư viện kỹ năng trong lúc chờ kết nối.');
        } else {
          setError('Chưa nhận được gợi ý. CVF chưa chọn kỹ năng nào và chưa thực hiện công việc.');
        }
        return;
      }
      if (data.provider !== 'TypeSafe Jev' || !data.result || !['suggested', 'no_match'].includes(data.result.status)) {
        setError('Kết quả chưa thể kiểm tra. Vui lòng thử lại sau.');
        return;
      }
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
          <p className="text-xs leading-5 text-slate-500 dark:text-slate-400">Khi bấm tìm, mô tả này được gửi đến TypeSafe để đánh giá. Đừng nhập mật khẩu, khóa API hoặc dữ liệu riêng tư. Gợi ý chưa chạy kỹ năng và chưa thay đổi dự án.</p>
          <div className="flex flex-wrap items-center gap-3">
            <button type="submit" disabled={working || connection !== 'connected'}
              className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 disabled:cursor-not-allowed disabled:opacity-50">
              {working ? 'Đang tìm...' : 'Gợi ý kỹ năng'}
            </button>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {connection === 'checking' ? 'Đang kiểm tra kết nối Jev' : connection === 'connected' ? 'Jev đã kết nối' : connection === 'not_connected' ? 'Jev chưa kết nối' : connection === 'sign_in' ? 'Cần đăng nhập CVF' : 'Chưa kiểm tra được kết nối Jev'}
            </span>
          </div>
        </form>
      </section>
      {connection === 'not_connected' && <div role="status" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        CVF chưa có kết nối TypeSafe. Bạn vẫn có thể <Link className="underline" href="/skills">xem thư viện kỹ năng</Link>; gợi ý Jev sẽ dùng được sau khi kết nối tài khoản.
      </div>}
      {connection === 'sign_in' && <div role="status" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        Hãy <Link className="underline" href="/login?from=/skills/suggest">đăng nhập CVF</Link> để kiểm tra kết nối và dùng gợi ý kỹ năng.
      </div>}
      {connection === 'unavailable' && <div role="status" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
        Chưa kiểm tra được kết nối Jev. Bạn có thể <Link className="underline" href="/skills">xem thư viện kỹ năng</Link> trong lúc chờ.
      </div>}
      {error && <p role="alert" className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800 dark:border-rose-500/25 dark:bg-rose-500/10 dark:text-rose-200">{error}</p>}
      {result && <section aria-live="polite" className="mt-5 rounded-2xl border border-indigo-200 bg-indigo-50/50 p-5 dark:border-indigo-500/25 dark:bg-indigo-500/10">
        {result.status === 'suggested' ? <>
          <div className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Gợi ý từ TypeSafe Jev</div>
          <h2 className="mt-2 text-xl font-semibold">{result.title}</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{result.domain}</p>
          <p className="mt-4 text-sm leading-6">{result.reason}</p>
          <Link href={result.href} className="mt-5 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500">Xem kỹ năng <ArrowRight size={15} /></Link>
        </> : <>
          <div className="flex items-center gap-2 text-sm font-semibold"><CircleHelp size={18} /> Chưa có gợi ý phù hợp</div>
          <p className="mt-3 text-sm leading-6">{result.reason}</p>
          <p className="mt-2 text-xs text-slate-600 dark:text-slate-300">Bạn có thể mô tả cụ thể hơn hoặc tự xem thư viện.</p>
        </>}
        <p className="mt-5 border-t border-indigo-200 pt-3 text-xs text-slate-600 dark:border-indigo-500/20 dark:text-slate-300">Đây là đề xuất để bạn xem xét. CVF chưa chạy kỹ năng; việc bạn thích hay chưa thích kết quả sẽ được ghi riêng với đánh giá kỹ thuật của repo.</p>
      </section>}
    </main>
  );
}
