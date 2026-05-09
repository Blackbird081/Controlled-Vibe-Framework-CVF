'use client';

import { useMemo, useState, useTransition } from 'react';

import { applyDLPPatterns, getPresetDLPPatterns } from '@/lib/dlp-filter-core';
import type { DLPPatternRecord } from '@/lib/policy-events';
import { useLanguage } from '@/lib/i18n';

function createPatternId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `dlp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function AdminDLPControls({ initialPatterns }: { initialPatterns: DLPPatternRecord[] }) {
  const { language } = useLanguage();
  const vi = language === 'vi';
  const presetPatterns = useMemo(() => getPresetDLPPatterns(), []);
  const [patterns, setPatterns] = useState<DLPPatternRecord[]>(initialPatterns);
  const [label, setLabel] = useState('');
  const [regex, setRegex] = useState('');
  const [enabled, setEnabled] = useState(true);
  const [previewInput, setPreviewInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const preview = useMemo(
    () => applyDLPPatterns(previewInput, patterns),
    [previewInput, patterns],
  );

  const addPattern = () => {
    const nextLabel = label.trim();
    const nextRegex = regex.trim();

    if (!nextLabel || !nextRegex) {
      setError(vi ? 'Bạn cần nhập tên nhãn và biểu thức regex.' : 'Label and regex are required.');
      return;
    }

    try {
      new RegExp(nextRegex, 'u');
    } catch {
      setError(vi ? 'Regex chưa hợp lệ. Hãy sửa trước khi thêm.' : 'Regex is invalid. Please fix it before adding.');
      return;
    }

    setPatterns(current => [
      ...current,
      {
        id: createPatternId(),
        label: nextLabel,
        regex: nextRegex,
        enabled,
      },
    ]);
    setLabel('');
    setRegex('');
    setEnabled(true);
    setError(null);
    setSuccess(null);
  };

  const savePolicy = () => {
    startTransition(async () => {
      setError(null);
      setSuccess(null);

      try {
        const response = await fetch('/api/admin/dlp/policy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ patterns }),
        });
        const payload = await response.json();

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || (vi ? 'Không thể lưu chính sách bảo vệ dữ liệu.' : 'Failed to save DLP policy.'));
        }

        setPatterns(payload.data.patterns ?? patterns);
        setSuccess(vi ? 'Đã lưu chính sách bảo vệ dữ liệu.' : 'DLP policy saved.');
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : (vi ? 'Không thể lưu chính sách bảo vệ dữ liệu.' : 'Failed to save DLP policy.'));
      }
    });
  };

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="text-sm text-gray-500">{vi ? 'Mẫu có sẵn' : 'Built-in presets'}</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {vi ? 'Luật bảo vệ dữ liệu luôn bật' : 'Always-on DLP patterns'}
            </h3>
          </div>
          <div className="text-sm text-gray-500">{vi ? 'Chỉ xem • không thể tắt' : 'Read-only • cannot be disabled'}</div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {presetPatterns.map(pattern => (
            <div key={pattern.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="font-medium text-gray-900 dark:text-white">{pattern.label}</div>
              <div className="mt-2 break-all text-xs text-gray-500">{pattern.regex}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div>
          <div className="text-sm text-gray-500">{vi ? 'Luật tùy chỉnh' : 'Custom rules'}</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {vi ? 'Thêm quy tắc kiểm tra riêng' : 'Add custom regex patterns'}
          </h3>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_2fr_auto]">
          <input
            value={label}
            onChange={event => setLabel(event.target.value)}
            placeholder={vi ? 'Tên nhãn' : 'Label'}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <input
            value={regex}
            onChange={event => setRegex(event.target.value)}
            placeholder={vi ? 'Biểu thức regex' : 'Regex pattern'}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <label className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
            <input
              type="checkbox"
              checked={enabled}
              onChange={event => setEnabled(event.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            {vi ? 'Bật' : 'Enabled'}
          </label>
        </div>

        <div className="mt-3 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={addPattern}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            {vi ? 'Thêm quy tắc' : 'Add pattern'}
          </button>
          <button
            type="button"
            onClick={savePolicy}
            disabled={isPending}
            className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
          >
            {isPending ? (vi ? 'Đang lưu...' : 'Saving...') : (vi ? 'Lưu chính sách bảo vệ' : 'Save DLP policy')}
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {patterns.length === 0 && (
            <div className="rounded-xl border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500 dark:border-gray-700">
              {vi ? 'Chưa có quy tắc tùy chỉnh nào.' : 'No custom patterns yet.'}
            </div>
          )}
          {patterns.map(pattern => (
            <div key={pattern.id} className="rounded-xl border border-gray-200 px-4 py-3 dark:border-gray-700">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{pattern.label}</div>
                  <div className="mt-1 break-all text-xs text-gray-500">{pattern.regex}</div>
                </div>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <input
                      type="checkbox"
                      checked={pattern.enabled}
                      onChange={event => {
                        const nextEnabled = event.target.checked;
                        setPatterns(current => current.map(candidate => (
                          candidate.id === pattern.id
                            ? { ...candidate, enabled: nextEnabled }
                            : candidate
                        )));
                      }}
                      className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    {vi ? 'Bật' : 'Enabled'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setPatterns(current => current.filter(candidate => candidate.id !== pattern.id))}
                    className="text-sm font-medium text-rose-600 transition hover:text-rose-700"
                  >
                    {vi ? 'Xóa' : 'Remove'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {(error || success) && (
          <div className="mt-4 space-y-3">
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200">
                {error}
              </div>
            )}
            {success && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200">
                {success}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <div>
          <div className="text-sm text-gray-500">{vi ? 'Xem trước' : 'Preview'}</div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {vi ? 'Xem trước nội dung sau khi che dữ liệu' : 'Client-side masking preview'}
          </h3>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <textarea
            value={previewInput}
            onChange={event => setPreviewInput(event.target.value)}
            placeholder={vi ? 'Dán nội dung có dữ liệu nhạy cảm để xem hệ thống che như thế nào...' : 'Paste text containing sensitive values to preview masking...'}
            className="min-h-56 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
          <div className="min-h-56 rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 dark:border-gray-700 dark:bg-gray-800 dark:text-white">
            <pre className="whitespace-pre-wrap break-words font-sans">{preview.redacted || (vi ? 'Kết quả sau khi che dữ liệu sẽ xuất hiện ở đây.' : 'Masked output appears here.')}</pre>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-600 dark:border-gray-700 dark:text-gray-300">
          {vi ? 'Kết quả phát hiện:' : 'Matches detected:'} {preview.matches.length === 0
            ? (vi ? 'Không có' : 'None')
            : preview.matches.map(match => `${match.label} ×${match.matchCount}`).join(', ')}
        </div>
      </section>
    </div>
  );
}
