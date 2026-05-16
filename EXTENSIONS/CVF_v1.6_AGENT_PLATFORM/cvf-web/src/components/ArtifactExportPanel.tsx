'use client';

import { useCallback, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  CheckCircle2,
  Clipboard,
  Download,
  FileCode2,
  Loader2,
  Printer,
  ShieldCheck,
  TriangleAlert,
} from 'lucide-react';

import { useLanguage } from '@/lib/i18n';

export type ArtifactMemoryClass = 'POINTER_RECORD' | 'FULL_RECORD';

export interface ArtifactExportRequest {
  title: string;
  sourcePath: string;
  sourceContent: string;
  memoryClass: ArtifactMemoryClass;
  status: string;
  claimBoundary: string;
  receiptAnchor: string;
}

export interface ArtifactVerificationItem {
  label: string;
  passed: boolean;
  detail?: string;
}

export interface ArtifactExportResult {
  html: string;
  filename: string;
  receiptAnchor: string;
  verification: ArtifactVerificationItem[];
  generatedAt: string;
}

interface ArtifactExportApiResponse {
  success: boolean;
  data?: ArtifactExportResult;
  error?: string;
}

interface ArtifactExportPanelProps {
  initialRequest?: Partial<ArtifactExportRequest>;
  initialResult?: ArtifactExportResult | null;
  exportEndpoint?: string;
  onGenerated?: (result: ArtifactExportResult) => void;
}

const DEFAULT_REQUEST: ArtifactExportRequest = {
  title: 'CVF HTML Review Packet',
  sourcePath: 'docs/reviews/example.md',
  sourceContent: [
    '# Review Packet',
    '',
    'Record type: Complete review record',
    '',
    'Review status: Draft',
    '',
    '## Review Boundary',
    '',
    'This packet helps review and handoff. It is not final proof by itself.',
  ].join('\n'),
  memoryClass: 'FULL_RECORD',
  status: 'DRAFT',
  claimBoundary: 'HTML review packet only. Not final proof by itself.',
  receiptAnchor: 'receipt-local-preview',
};

const LABELS = {
  en: {
    title: 'Review Packet Export',
    subtitle: 'Build a self-contained HTML review packet with a visible receipt reference.',
    boundary: 'HTML only. PDF, PNG, PPTX, and final proof are handled separately.',
    sourceTitle: 'Review Source',
    outputTitle: 'HTML Review Packet',
    verificationTitle: 'Readiness Checks',
    titleLabel: 'Title',
    pathLabel: 'Source reference',
    memoryLabel: 'Record type',
    statusLabel: 'Review status',
    receiptLabel: 'Receipt reference',
    boundaryLabel: 'Review boundary',
    contentLabel: 'Source notes',
    generate: 'Build HTML',
    generating: 'Generating',
    copy: 'Copy HTML',
    copied: 'Copied',
    download: 'Download HTML',
    print: 'Print preview',
    noOutput: 'Build an HTML review packet to preview it here.',
    noChecks: 'Readiness checks will appear after the packet is built.',
    failed: 'Export failed',
    sourceHint: 'Paste approved source text. The packet should make review easier without changing the meaning.',
    previewTitle: 'Preview',
    fullRecord: 'Complete record',
    pointerRecord: 'Reference record',
  },
  vi: {
    title: 'Xuất gói rà soát',
    subtitle: 'Tạo gói HTML tự chứa, có receipt rõ ràng để người xem biết nguồn và ranh giới.',
    boundary: 'Chỉ HTML. PDF, PNG, PPTX và bằng chứng cuối cùng được xử lý riêng.',
    sourceTitle: 'Nguồn rà soát',
    outputTitle: 'Gói HTML',
    verificationTitle: 'Kiểm tra sẵn sàng',
    titleLabel: 'Tiêu đề',
    pathLabel: 'Nguồn tham chiếu',
    memoryLabel: 'Loại bản ghi',
    statusLabel: 'Trạng thái rà soát',
    receiptLabel: 'Mã receipt',
    boundaryLabel: 'Ranh giới rà soát',
    contentLabel: 'Ghi chú nguồn',
    generate: 'Tạo HTML',
    generating: 'Đang tạo',
    copy: 'Sao chép HTML',
    copied: 'Đã sao chép',
    download: 'Tải HTML',
    print: 'Xem bản in',
    noOutput: 'Tạo gói HTML để xem trước tại đây.',
    noChecks: 'Các kiểm tra sẵn sàng sẽ hiện sau khi tạo.',
    failed: 'Xuất thất bại',
    sourceHint: 'Dán nội dung đã được duyệt. Gói này giúp review dễ hơn mà không đổi ý nghĩa.',
    previewTitle: 'Xem trước',
    fullRecord: 'Bản đầy đủ',
    pointerRecord: 'Bản tham chiếu',
  },
};

function normalizeRequest(input?: Partial<ArtifactExportRequest>): ArtifactExportRequest {
  return { ...DEFAULT_REQUEST, ...input };
}

function downloadHtml(filename: string, html: string) {
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename.endsWith('.html') ? filename : `${filename}.html`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

async function writeText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Use the legacy clipboard path below.
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
}

function FieldLabel({ children }: { children: string }) {
  return (
    <label className="text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400">
      {children}
    </label>
  );
}

function StatusPill({ children, tone }: { children: ReactNode; tone: 'info' | 'success' | 'warning' }) {
  const className = tone === 'success'
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200'
    : tone === 'warning'
      ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200'
      : 'border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200';

  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

export function ArtifactExportPanel({
  initialRequest,
  initialResult = null,
  exportEndpoint = '/api/artifacts/export',
  onGenerated,
}: ArtifactExportPanelProps) {
  const { language } = useLanguage();
  const labels = LABELS[language === 'vi' ? 'vi' : 'en'];
  const [request, setRequest] = useState<ArtifactExportRequest>(() => normalizeRequest(initialRequest));
  const [result, setResult] = useState<ArtifactExportResult | null>(initialResult);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passedChecks = useMemo(
    () => result?.verification.filter(item => item.passed).length ?? 0,
    [result],
  );

  const updateRequest = useCallback(
    (field: keyof ArtifactExportRequest, value: string) => {
      setRequest(current => ({
        ...current,
        [field]: field === 'memoryClass' && value === 'POINTER_RECORD' ? 'POINTER_RECORD' : value,
      } as ArtifactExportRequest));
    },
    [],
  );

  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(exportEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      const payload = await response.json() as ArtifactExportApiResponse;
      if (!response.ok || !payload.success || !payload.data) {
        throw new Error(payload.error || `HTTP ${response.status}`);
      }
      setResult(payload.data);
      onGenerated?.(payload.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown export error');
    } finally {
      setLoading(false);
    }
  }, [exportEndpoint, onGenerated, request]);

  const handleCopy = useCallback(async () => {
    if (!result) return;
    const ok = await writeText(result.html);
    if (!ok) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  }, [result]);

  const handleDownload = useCallback(() => {
    if (!result) return;
    downloadHtml(result.filename, result.html);
  }, [result]);

  const handlePrint = useCallback(() => {
    if (!result) return;
    const printWindow = window.open('', '_blank', 'noopener,noreferrer');
    if (!printWindow) return;
    printWindow.document.write(result.html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  }, [result]);

  return (
    <section className="space-y-5 text-gray-900 dark:text-gray-100" data-testid="artifact-export-panel">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <StatusPill tone="info">HTML</StatusPill>
              <StatusPill tone="warning">Candidate</StatusPill>
            </div>
            <h2 className="text-2xl font-bold tracking-normal text-gray-950 dark:text-white">
              {labels.title}
            </h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-600 dark:text-gray-400">
              {labels.subtitle}
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/30 dark:text-amber-200">
            {labels.boundary}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="mb-4 flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-indigo-500" aria-hidden="true" />
            <h3 className="text-sm font-semibold text-gray-950 dark:text-white">{labels.sourceTitle}</h3>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <FieldLabel>{labels.titleLabel}</FieldLabel>
              <input
                aria-label={labels.titleLabel}
                value={request.title}
                onChange={event => updateRequest('title', event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>{labels.pathLabel}</FieldLabel>
              <input
                aria-label={labels.pathLabel}
                value={request.sourcePath}
                onChange={event => updateRequest('sourcePath', event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>
            <div>
              <FieldLabel>{labels.memoryLabel}</FieldLabel>
              <select
                aria-label={labels.memoryLabel}
                value={request.memoryClass}
                onChange={event => updateRequest('memoryClass', event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              >
                <option value="FULL_RECORD">{labels.fullRecord}</option>
                <option value="POINTER_RECORD">{labels.pointerRecord}</option>
              </select>
            </div>
            <div>
              <FieldLabel>{labels.statusLabel}</FieldLabel>
              <input
                aria-label={labels.statusLabel}
                value={request.status}
                onChange={event => updateRequest('status', event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>{labels.receiptLabel}</FieldLabel>
              <input
                aria-label={labels.receiptLabel}
                value={request.receiptAnchor}
                onChange={event => updateRequest('receiptAnchor', event.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <FieldLabel>{labels.boundaryLabel}</FieldLabel>
              <textarea
                aria-label={labels.boundaryLabel}
                value={request.claimBoundary}
                onChange={event => updateRequest('claimBoundary', event.target.value)}
                rows={3}
                className="mt-1 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm leading-6 outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>
            <div className="sm:col-span-2">
              <div className="flex items-end justify-between gap-3">
                <FieldLabel>{labels.contentLabel}</FieldLabel>
                <span className="text-[11px] text-gray-500 dark:text-gray-500">{labels.sourceHint}</span>
              </div>
              <textarea
                aria-label={labels.contentLabel}
                value={request.sourceContent}
                onChange={event => updateRequest('sourceContent', event.target.value)}
                rows={12}
                className="mt-1 w-full resize-y rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 font-mono text-xs leading-5 outline-none transition focus:border-indigo-500 dark:border-gray-700 dark:bg-gray-950 dark:text-white"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => void handleGenerate()}
              disabled={loading || !request.sourceContent.trim() || !request.receiptAnchor.trim()}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ShieldCheck className="h-4 w-4" aria-hidden="true" />}
              {loading ? labels.generating : labels.generate}
            </button>
            {error && (
              <div className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700 dark:border-red-900/70 dark:bg-red-950/30 dark:text-red-200">
                <TriangleAlert className="h-4 w-4" aria-hidden="true" />
                <span className="font-semibold">{labels.failed}:</span>
                <span>{error}</span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                  <h3 className="text-sm font-semibold text-gray-950 dark:text-white">{labels.outputTitle}</h3>
                </div>
                {result ? (
                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <p className="break-all font-mono">#{result.receiptAnchor}</p>
                    <p>{new Date(result.generatedAt).toLocaleString()}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{labels.noOutput}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void handleCopy()}
                  disabled={!result}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <Clipboard className="h-4 w-4" aria-hidden="true" />
                  {copied ? labels.copied : labels.copy}
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  disabled={!result}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <Download className="h-4 w-4" aria-hidden="true" />
                  {labels.download}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={!result}
                  className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-45 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                  <Printer className="h-4 w-4" aria-hidden="true" />
                  {labels.print}
                </button>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-950">
              <div className="border-b border-gray-200 px-4 py-2 text-xs font-semibold text-gray-500 dark:border-gray-800 dark:text-gray-400">
                {labels.previewTitle}
              </div>
              {result ? (
                <iframe
                  title={labels.previewTitle}
                  srcDoc={result.html}
                  sandbox=""
                  className="h-[430px] w-full bg-white"
                />
              ) : (
                <div className="flex h-[430px] items-center justify-center px-6 text-center text-sm text-gray-500 dark:text-gray-400">
                  {labels.noOutput}
                </div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-gray-950 dark:text-white">{labels.verificationTitle}</h3>
              {result && <StatusPill tone="success">{passedChecks}/{result.verification.length}</StatusPill>}
            </div>
            {!result && <p className="text-sm text-gray-500 dark:text-gray-400">{labels.noChecks}</p>}
            {result && (
              <div className="space-y-3">
                {result.verification.map(item => (
                  <div
                    key={item.label}
                    className="flex gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950"
                  >
                    {item.passed ? (
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                    ) : (
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" aria-hidden="true" />
                    )}
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{item.label}</div>
                      {item.detail && <div className="mt-1 text-xs leading-5 text-gray-500 dark:text-gray-400">{item.detail}</div>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ArtifactExportPanel;
