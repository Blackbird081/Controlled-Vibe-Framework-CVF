'use client';

import { ArrowRight, FileCheck2, ShieldCheck, Sparkles } from 'lucide-react';

import ArtifactExportPanel, { type ArtifactExportRequest } from '@/components/ArtifactExportPanel';
import { useLanguage } from '@/lib/i18n';

const COPY = {
  en: {
    label: 'Review Packet Export',
    title: 'Turn approved work into an HTML review packet',
    intro: 'This page is for people who need a clean, reviewable version of AI-assisted work. It keeps the source, receipt, review status, and boundary visible so the next reviewer does not have to guess what happened.',
    boundary: 'HTML review packet only. PDF, image export, and final proof are handled separately.',
    newKnowledgeTitle: 'What new knowledge should become',
    newKnowledgeBody: 'When CVF absorbs useful knowledge, the web experience should turn it into clearer choices, review packets, receipts, and handoff notes. The user benefit is better review and safer reuse, not more hidden complexity.',
    flow: ['Source', 'Review', 'Handoff'],
    cards: [
      ['Bring knowledge into the review', 'Approved source text can become a clean review page without changing the meaning of the original material.'],
      ['Keep the receipt visible', 'The output keeps the receipt and review boundary close to the work, so a reviewer can see what is safe to rely on.'],
      ['Hand off with less guessing', 'The HTML packet is meant for review, sharing, and handoff. It does not replace human judgment or final proof.'],
    ],
  },
  vi: {
    label: 'Xuất gói rà soát',
    title: 'Biến phần đã duyệt thành gói HTML để rà soát',
    intro: 'Trang này dành cho người cần một bản dễ đọc của công việc có AI hỗ trợ. Nguồn, receipt, trạng thái rà soát và ranh giới được giữ rõ để người xem tiếp theo không phải đoán.',
    boundary: 'Chỉ là gói HTML để rà soát. PDF, xuất ảnh và bằng chứng cuối cùng được xử lý riêng.',
    newKnowledgeTitle: 'Kiến thức mới nên trở thành gì',
    newKnowledgeBody: 'Khi CVF hấp thu kiến thức hữu ích, trải nghiệm web nên biến nó thành lựa chọn rõ hơn, gói rà soát, receipt và ghi chú bàn giao. Lợi ích là rà soát tốt hơn và tái sử dụng an toàn hơn, không phải thêm độ phức tạp ẩn.',
    flow: ['Nguồn', 'Rà soát', 'Bàn giao'],
    cards: [
      ['Đưa kiến thức vào rà soát', 'Nội dung nguồn đã duyệt có thể trở thành trang rà soát sạch mà không đổi ý nghĩa gốc.'],
      ['Giữ receipt dễ thấy', 'Kết quả giữ receipt và ranh giới gần với nội dung để người dùng biết phần nào có thể tin cậy.'],
      ['Bàn giao ít phỏng đoán hơn', 'Bản HTML dùng để rà soát, chia sẻ và bàn giao. Nó không thay thế phán đoán của người xem hoặc bằng chứng cuối cùng.'],
    ],
  },
};

const starterRequest: ArtifactExportRequest = {
  title: 'Customer Onboarding Review Packet',
  sourcePath: 'workspace/reviews/customer-onboarding.md',
  sourceContent: [
    '# Customer Onboarding Review Packet',
    '',
    'Record type: Complete review record',
    '',
    'Review status: Ready for review',
    '',
    '## Summary',
    '',
    'This packet captures the current onboarding plan, the checks already made, and the open decisions that still need a human review.',
    '',
    '## Review Boundary',
    '',
    'This is an HTML review packet. It helps review and handoff. It is not final proof by itself.',
  ].join('\n'),
  memoryClass: 'FULL_RECORD',
  status: 'Ready for review',
  claimBoundary: 'HTML review packet only. It helps review and handoff, but it is not final proof by itself.',
  receiptAnchor: 'receipt-customer-onboarding-demo',
};

const cardIcons = [Sparkles, ShieldCheck, FileCheck2];

export default function ArtifactsPage() {
  const { language } = useLanguage();
  const copy = COPY[language === 'vi' ? 'vi' : 'en'];

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <header className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <div className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-indigo-600 dark:text-indigo-300">
              <FileCheck2 className="h-4 w-4" aria-hidden="true" />
              {copy.label}
            </div>
            <h1 className="text-2xl font-bold text-gray-950 dark:text-white">{copy.title}</h1>
            <p className="mt-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{copy.intro}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">{copy.boundary}</div>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3" aria-label="Artifact export value">
        {copy.cards.map(([title, body], index) => {
          const Icon = cardIcons[index];
          return (
            <article key={title} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
              <div className="mb-4 inline-flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40 dark:text-indigo-300">
                <Icon className="h-4 w-4" aria-hidden="true" />
              </div>
              <h2 className="text-sm font-semibold text-gray-950 dark:text-white">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-gray-600 dark:text-gray-300">{body}</p>
            </article>
          );
        })}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-sm font-semibold text-gray-950 dark:text-white">{copy.newKnowledgeTitle}</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-300">{copy.newKnowledgeBody}</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 dark:border-gray-800 dark:text-gray-300">
            {copy.flow.map((item, index) => (
              <span key={item} className="inline-flex items-center gap-2">
                {index > 0 && <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <ArtifactExportPanel initialRequest={starterRequest} />
    </div>
  );
}
