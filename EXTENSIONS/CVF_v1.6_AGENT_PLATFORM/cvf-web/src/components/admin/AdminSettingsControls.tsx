'use client';

import { useState, useTransition } from 'react';
import { useLanguage } from '@/lib/i18n';

import type { SIEMEventFilter } from '@/lib/policy-events';

type SIEMConfigView = {
  webhookUrl: string;
  signingSecret: string;
  enabled: boolean;
  eventTypes: SIEMEventFilter;
};

const EVENT_TYPE_LABELS: Record<SIEMEventFilter, { en: string; vi: string }> = {
  audit: { en: 'Audit only', vi: 'Chỉ kiểm toán' },
  cost:  { en: 'Cost only',  vi: 'Chỉ chi phí' },
  all:   { en: 'All events', vi: 'Tất cả sự kiện' },
};
const EVENT_TYPE_VALUES: SIEMEventFilter[] = ['audit', 'cost', 'all'];

export function AdminSettingsControls({ initialConfig }: { initialConfig: SIEMConfigView }) {
  const { language } = useLanguage();
  const vi = language === 'vi';
  const [config, setConfig] = useState(initialConfig);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const saveConfig = () => {
    startTransition(async () => {
      setError(null);
      setSuccess(null);

      try {
        const response = await fetch('/api/admin/siem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });
        const payload = await response.json();

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.error || 'Failed to save SIEM configuration.');
        }

        setConfig({
          webhookUrl: payload.data.webhookUrl,
          signingSecret: payload.data.signingSecret,
          enabled: payload.data.enabled,
          eventTypes: payload.data.eventTypes,
        });
        setSuccess(vi ? 'Đã lưu cấu hình SIEM.' : 'SIEM configuration saved.');
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : (vi ? 'Không thể lưu cấu hình SIEM.' : 'Failed to save SIEM configuration.'));
      }
    });
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900">
      <div>
        <div className="text-sm text-gray-500">{vi ? 'Kết nối SIEM' : 'SIEM integration'}</div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{vi ? 'Gửi sự kiện ra ngoài' : 'Outbound event forwarding'}</h3>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {vi
            ? 'Gửi nhật ký quản trị và chi phí đến Splunk HEC hoặc endpoint tương thích Elastic, kèm chữ ký HMAC để xác thực.'
            : 'Forward admin and cost events to Splunk HEC or Elastic-compatible endpoints with HMAC signing.'}
        </p>
      </div>

      <div className="mt-4 grid gap-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-200">Webhook URL</span>
          <input
            value={config.webhookUrl}
            onChange={event => setConfig(current => ({ ...current, webhookUrl: event.target.value }))}
            placeholder="https://siem.example.com/ingest"
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-200">{vi ? 'Khóa bí mật ký' : 'Signing secret'}</span>
          <input
            value={config.signingSecret}
            onChange={event => setConfig(current => ({ ...current, signingSecret: event.target.value }))}
            placeholder={vi ? 'Khóa HMAC dùng chung' : 'Shared HMAC secret'}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-200">{vi ? 'Bộ lọc sự kiện' : 'Event filter'}</span>
          <select
            value={config.eventTypes}
            onChange={event => setConfig(current => ({ ...current, eventTypes: event.target.value as SIEMEventFilter }))}
            className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            {EVENT_TYPE_VALUES.map(val => (
              <option key={val} value={val}>{vi ? EVENT_TYPE_LABELS[val].vi : EVENT_TYPE_LABELS[val].en}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm dark:border-gray-700">
          <input
            type="checkbox"
            checked={config.enabled}
            onChange={event => setConfig(current => ({ ...current, enabled: event.target.checked }))}
            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
          />
          {vi ? 'Bật chuyển tiếp SIEM' : 'Enable SIEM forwarding'}
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={saveConfig}
          disabled={isPending}
          className="rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {isPending ? (vi ? 'Đang lưu...' : 'Saving...') : (vi ? 'Lưu cấu hình SIEM' : 'Save SIEM settings')}
        </button>
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
  );
}
