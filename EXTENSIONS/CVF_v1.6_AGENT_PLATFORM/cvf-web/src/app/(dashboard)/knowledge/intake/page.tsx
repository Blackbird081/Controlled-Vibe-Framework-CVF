'use client';

import { useMemo, useState } from 'react';
import { BookOpenCheck, CircleCheck, FileText, ShieldCheck } from 'lucide-react';

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
    stepsTitle: 'What new knowledge should become',
    benefitsTitle: 'What the user gets',
    exportTitle: 'Ready for Artifact Export',
    exportBody: 'After review, send this source text to Artifact Export so the source, receipt, and claim boundary stay together.',
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
    stepsTitle: 'Kiến thức mới nên trở thành gì',
    benefitsTitle: 'Người dùng nhận được gì',
    exportTitle: 'Sẵn sàng cho Artifact Export',
    exportBody: 'Sau khi review, đưa nội dung này sang Artifact Export để nguồn, receipt và ranh giới claim đi cùng nhau.',
    boundary: 'Trang này chỉ chuẩn bị ghi chú intake. Nó không tự chứng minh hành vi governance live.',
    steps: ['Nguồn rõ ràng', 'Audience cụ thể', 'Ranh giới nhìn thấy được'],
    benefits: [
      'Người không viết code thấy được vì sao kiến thức mới quan trọng trước khi nó ảnh hưởng câu trả lời.',
      'Packet review giữ nguồn gốc và receipt ở cùng một chỗ.',
      'Công việc sau đó bắt đầu với ít giả định ẩn hơn và bước tiếp theo rõ hơn.',
    ],
  },
};

export default function KnowledgeIntakePage() {
  const { language } = useLanguage();
  const copy = COPY[language === 'vi' ? 'vi' : 'en'];
  const [sourceTitle, setSourceTitle] = useState('');
  const [sourcePath, setSourcePath] = useState('');
  const [audience, setAudience] = useState('');
  const [note, setNote] = useState('');

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
              <input value={sourceTitle} onChange={event => setSourceTitle(event.target.value)} placeholder={copy.sourcePlaceholder} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950" />
            </label>
            <label className="text-sm font-semibold">
              {copy.path}
              <input value={sourcePath} onChange={event => setSourcePath(event.target.value)} placeholder={copy.pathPlaceholder} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950" />
            </label>
            <label className="text-sm font-semibold">
              {copy.audience}
              <input value={audience} onChange={event => setAudience(event.target.value)} placeholder={copy.audiencePlaceholder} className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950" />
            </label>
            <label className="text-sm font-semibold">
              {copy.note}
              <textarea value={note} onChange={event => setNote(event.target.value)} placeholder={copy.notePlaceholder} rows={7} className="mt-1 w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 dark:border-gray-700 dark:bg-gray-950" />
            </label>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-indigo-500" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-950 dark:text-white">{copy.packet}</h2>
            </div>
            {preview ? (
              <pre className="mt-4 max-h-[360px] overflow-auto whitespace-pre-wrap rounded-lg border border-gray-200 bg-gray-50 p-4 text-xs leading-5 dark:border-gray-800 dark:bg-gray-950">{preview}</pre>
            ) : (
              <p className="mt-4 text-sm leading-6 text-gray-600 dark:text-gray-300">{copy.empty}</p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-indigo-500" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-gray-950 dark:text-white">{copy.exportTitle}</h2>
            </div>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{copy.exportBody}</p>
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-100">{copy.boundary}</div>
          </div>
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
