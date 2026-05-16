'use client';

import { useCallback, useMemo, useState } from 'react';
import { ArrowRight, BookOpenCheck, CheckCircle2, CircleCheck, Loader2, TriangleAlert } from 'lucide-react';

import { useLanguage } from '@/lib/i18n';

const COPY = {
  en: {
    label: 'Knowledge Intake',
    title: 'Bring new knowledge into CVF without hiding the trail',
    intro: 'Turn new notes, policies, customer facts, or product rules into a review-ready packet with a visible source, reason, and next step.',
    source: 'Source title',
    sourcePlaceholder: 'Example: Customer onboarding notes',
    path: 'Source path or link',
    pathPlaceholder: 'Example: docs/reviews/onboarding-notes.md',
    audience: 'Who should use this?',
    audiencePlaceholder: 'Example: Support team, product owner, reviewer',
    note: 'What changed?',
    notePlaceholder: 'Paste the approved note in plain words.',
    packet: 'Review packet preview',
    empty: 'Fill the fields to preview what the next reviewer should see.',
    submit: 'Submit for intake',
    submitting: 'Submitting',
    successTitle: 'Intake submitted',
    successBody: 'Your knowledge packet has been submitted for review.',
    collectionId: 'Collection ID',
    exportPrompt: 'Next: export this packet as a governed HTML artifact',
    goToExport: 'Open Artifact Export',
    errorTitle: 'Submission failed',
    reset: 'Submit another',
    stepsTitle: 'What new knowledge should become',
    benefitsTitle: 'What the user gets',
    boundary: 'This page prepares intake notes only. It does not prove live governance behavior by itself.',
    steps: ['Clear source', 'Named audience', 'Visible boundary'],
    benefits: [
      'A non-coder can see why the knowledge matters before it shapes an answer.',
      'The review packet keeps the original source and the visible receipt together.',
      'Future work starts with fewer hidden assumptions and clearer next steps.',
    ],
  },
  vi: {
    label: 'Nạp kiến thức',
    title: 'Đưa kiến thức mới vào CVF mà không làm mất dấu vết',
    intro: 'Biến ghi chú, chính sách, dữ kiện khách hàng hoặc quy tắc sản phẩm thành packet dễ review, có nguồn, lý do và bước tiếp theo.',
    source: 'Tiêu đề nguồn',
    sourcePlaceholder: 'Ví dụ: Ghi chú onboarding khách hàng',
    path: 'Đường dẫn hoặc link nguồn',
    pathPlaceholder: 'Ví dụ: docs/reviews/onboarding-notes.md',
    audience: 'Ai nên dùng phần này?',
    audiencePlaceholder: 'Ví dụ: đội support, product owner, reviewer',
    note: 'Điều gì đã thay đổi?',
    notePlaceholder: 'Dán ghi chú đã duyệt bằng ngôn ngữ dễ hiểu.',
    packet: 'Preview packet review',
    empty: 'Điền các trường để xem người review tiếp theo cần thấy gì.',
    submit: 'Gửi để nạp',
    submitting: 'Đang gửi',
    successTitle: 'Đã nạp thành công',
    successBody: 'Gói kiến thức đã được gửi để review.',
    collectionId: 'ID bộ sưu tập',
    exportPrompt: 'Tiếp theo: xuất gói này thành artifact HTML có quản trị',
    goToExport: 'Mở Artifact Export',
    errorTitle: 'Gửi thất bại',
    reset: 'Gửi gói khác',
    stepsTitle: 'Kiến thức mới nên trở thành gì',
    benefitsTitle: 'Người dùng nhận được gì',
    boundary: 'Trang này chỉ chuẩn bị ghi chú intake. Nó không tự chứng minh hành vi governance live.',
    steps: ['Nguồn rõ ràng', 'Audience cụ thể', 'Ranh giới nhìn thấy được'],
    benefits: [
      'Người không viết code thấy được vì sao kiến thức mới quan trọng trước khi nó ảnh hưởng câu trả lời.',
      'Packet review giữ nguồn gốc và receipt ở cùng một chỗ.',
      'Công việc sau đó bắt đầu với ít giả định ẩn hơn và bước tiếp theo rõ hơn.',
    ],
  },
};

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

function slugId(title: string): string {
  return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'intake';
}

export default function KnowledgeIntakePage() {
  const { language } = useLanguage();
  const copy = COPY[language === 'vi' ? 'vi' : 'en'];

  const [sourceTitle, setSourceTitle] = useState('');
  const [sourcePath, setSourcePath] = useState('');
  const [audience, setAudience] = useState('');
  const [note, setNote] = useState('');
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [collectionId, setCollectionId] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const canSubmit = sourceTitle.trim().length > 0 && note.trim().length > 0;

  const preview = useMemo(() => {
    if (!sourceTitle.trim() && !sourcePath.trim() && !audience.trim() && !note.trim()) return '';
    return [
      `# ${sourceTitle.trim() || copy.source}`,
      '',
      `Source: ${sourcePath.trim() || '-'}`,
      `Audience: ${audience.trim() || '-'}`,
      '',
      '## What changed',
      note.trim() || '-',
      '',
      '## Claim Boundary',
      copy.boundary,
    ].join('\n');
  }, [audience, copy.boundary, copy.source, note, sourcePath, sourceTitle]);

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;
    setSubmitState('submitting');
    setErrorMessage('');

    const id = slugId(sourceTitle.trim());
    try {
      const response = await fetch('/api/admin/knowledge/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          name: sourceTitle.trim(),
          description: [
            `Source: ${sourcePath.trim() || '-'}`,
            `Audience: ${audience.trim() || '-'}`,
            note.trim(),
          ].join('\n'),
        }),
      });

      const payload = await response.json() as { success: boolean; collectionId?: string; error?: string };

      if (!response.ok || !payload.success) {
        throw new Error(payload.error ?? `HTTP ${response.status}`);
      }

      setCollectionId(payload.collectionId ?? id);
      setSubmitState('success');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Unknown error');
      setSubmitState('error');
    }
  }, [audience, canSubmit, note, sourcePath, sourceTitle]);

  const handleReset = useCallback(() => {
    setSourceTitle('');
    setSourcePath('');
    setAudience('');
    setNote('');
    setCollectionId('');
    setErrorMessage('');
    setSubmitState('idle');
  }, []);

  if (submitState === 'success') {
    return (
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 text-gray-900 dark:text-gray-100">
        <header className="border-b border-gray-200 pb-5 dark:border-white/[0.08]">
          <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
            <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
            {copy.label}
          </div>
          <h1 className="text-3xl font-bold tracking-normal text-gray-950 dark:text-white">{copy.successTitle}</h1>
        </header>
        <div data-testid="intake-success" className="rounded-lg border border-emerald-200 bg-emerald-50 p-6 dark:border-emerald-900/60 dark:bg-emerald-950/30">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-300" aria-hidden="true" />
            <div className="space-y-2">
              <p className="font-semibold text-emerald-800 dark:text-emerald-100">{copy.successBody}</p>
              <p className="text-sm text-emerald-700 dark:text-emerald-200">
                {copy.collectionId}: <span className="font-mono font-semibold" data-testid="collection-id">{collectionId}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <p className="text-sm font-semibold text-gray-950 dark:text-white">{copy.exportPrompt}</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/artifacts"
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700"
            >
              {copy.goToExport}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              {copy.reset}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 text-gray-900 dark:text-gray-100">
      <header className="border-b border-gray-200 pb-5 dark:border-white/[0.08]">
        <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-300">
          <BookOpenCheck className="h-4 w-4" aria-hidden="true" />
          {copy.label}
        </div>
        <h1 className="text-3xl font-bold tracking-normal text-gray-950 dark:text-white">{copy.title}</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">{copy.intro}</p>
      </header>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <div className="grid gap-4">
            <label className="text-sm font-semibold">
              {copy.source}
              <input
                data-testid="source-title-input"
                value={sourceTitle}
                onChange={event => setSourceTitle(event.target.value)}
                placeholder={copy.sourcePlaceholder}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
              />
            </label>
            <label className="text-sm font-semibold">
              {copy.path}
              <input
                value={sourcePath}
                onChange={event => setSourcePath(event.target.value)}
                placeholder={copy.pathPlaceholder}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
              />
            </label>
            <label className="text-sm font-semibold">
              {copy.audience}
              <input
                value={audience}
                onChange={event => setAudience(event.target.value)}
                placeholder={copy.audiencePlaceholder}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950"
              />
            </label>
            <label className="text-sm font-semibold">
              {copy.note}
              <textarea
                data-testid="note-input"
                value={note}
                onChange={event => setNote(event.target.value)}
                placeholder={copy.notePlaceholder}
                rows={7}
                className="mt-1 w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 dark:border-gray-700 dark:bg-gray-950"
              />
            </label>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              data-testid="submit-button"
              onClick={() => void handleSubmit()}
              disabled={!canSubmit || submitState === 'submitting'}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitState === 'submitting' && <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />}
              {submitState === 'submitting' ? copy.submitting : copy.submit}
            </button>
            {submitState === 'error' && (
              <div
                data-testid="intake-error"
                className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200"
              >
                <TriangleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span className="font-semibold">{copy.errorTitle}:</span>
                <span>{errorMessage}</span>
              </div>
            )}
          </div>
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">
            {copy.boundary}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
          <h2 className="text-lg font-semibold text-gray-950 dark:text-white">{copy.packet}</h2>
          {preview ? (
            <pre className="mt-4 max-h-[420px] overflow-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-5 dark:border-gray-800 dark:bg-gray-950">{preview}</pre>
          ) : (
            <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">{copy.empty}</p>
          )}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <InfoList title={copy.stepsTitle} items={copy.steps} />
        <InfoList title={copy.benefitsTitle} items={copy.benefits} />
      </section>
    </div>
  );
}

function InfoList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
      <h2 className="text-lg font-semibold text-gray-950 dark:text-white">{title}</h2>
      <div className="mt-4 space-y-3">
        {items.map(item => (
          <div key={item} className="flex gap-3 text-sm leading-6 text-gray-600 dark:text-gray-300">
            <CircleCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
