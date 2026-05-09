'use client';

import React, { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useLanguage } from '@/lib/i18n';

type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired';

interface ApprovalRequestRecord {
  id: string;
  templateId: string;
  templateName: string;
  intent: string;
  toolId?: string;
  toolPayload?: Record<string, unknown>;
  riskLevel?: string;
  phase?: string;
  reason: string;
  expiresAt: string;
  status: ApprovalStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewComment?: string;
}

const T = {
  title: { vi: 'Hộp thư phê duyệt', en: 'Approval Inbox' },
  subtitle: { vi: 'Xem xét và xử lý các yêu cầu guard leo thang từ thành viên nhóm.', en: 'Review and manage ESCALATED guard requests from team members.' },
  breadcrumbHome: { vi: 'Trang chủ', en: 'Home' },
  breadcrumbApprovals: { vi: 'Phê duyệt', en: 'Approvals' },
  toolId: { vi: 'Mã công cụ', en: 'Tool ID' },
  riskLevel: { vi: 'Mức rủi ro', en: 'Risk Level' },
  phase: { vi: 'Pha', en: 'Phase' },
  status: { vi: 'Trạng thái', en: 'Status' },
  all: { vi: 'Tất cả', en: 'All' },
  clearFilters: { vi: 'Xóa bộ lọc', en: 'Clear filters' },
  loading: { vi: 'Đang tải…', en: 'Loading…' },
  actionRequired: { vi: 'Cần xử lý', en: 'Action Required' },
  noPending: { vi: 'Không có yêu cầu chờ duyệt. Đã xử lý hết!', en: 'No pending approvals. All caught up!' },
  history: { vi: 'Lịch sử quyết định', en: 'Decision History' },
  colRequest: { vi: 'Yêu cầu', en: 'Request' },
  colRiskPhase: { vi: 'Rủi ro / Pha', en: 'Risk / Phase' },
  colDecision: { vi: 'Quyết định', en: 'Decision' },
  colNote: { vi: 'Ghi chú', en: 'Reviewer Note' },
  approve: { vi: 'Phê duyệt', en: 'Approve' },
  reject: { vi: 'Từ chối', en: 'Reject' },
  commentPlaceholder: { vi: 'Nhận xét (tùy chọn)…', en: 'Review comment (optional)…' },
  submitted: { vi: 'Gửi lúc', en: 'Submitted' },
  expired: { vi: 'Đã hết hạn', en: 'Expired' },
  remaining: { vi: 'còn lại', en: 'remaining' },
  toolPayload: { vi: 'Dữ liệu công cụ', en: 'Tool payload' },
  pending: { vi: 'pending', en: 'pending' },
};

function t(key: keyof typeof T, lang: string) {
  return T[key][lang === 'vi' ? 'vi' : 'en'];
}

interface ApprovalInboxContentProps {
  homePath?: string;
}

function ApprovalInboxContent({ homePath = '/home' }: ApprovalInboxContentProps) {
  const searchParams = useSearchParams();
  const { language } = useLanguage();
  const [requests, setRequests] = useState<ApprovalRequestRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(Date.now());
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [acting, setActing] = useState<Record<string, boolean>>({});

  const [filterToolId, setFilterToolId] = useState(searchParams.get('toolId') ?? '');
  const [filterRisk, setFilterRisk] = useState(searchParams.get('riskLevel') ?? '');
  const [filterPhase, setFilterPhase] = useState(searchParams.get('phase') ?? '');
  const [filterStatus, setFilterStatus] = useState(searchParams.get('status') ?? '');

  const loadRequests = useCallback(async () => {
    try {
      const res = await fetch('/api/approvals');
      const data = await res.json() as { success: boolean; data: ApprovalRequestRecord[] };
      if (data.success) setRequests(data.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadRequests(); }, [loadRequests]);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleAction = async (id: string, action: 'approved' | 'rejected') => {
    setActing(a => ({ ...a, [id]: true }));
    try {
      const res = await fetch(`/api/approvals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reviewComment: reasons[id] ?? '' }),
      });
      if (res.ok) {
        await loadRequests();
        setReasons(r => { const next = { ...r }; delete next[id]; return next; });
      }
    } finally {
      setActing(a => { const next = { ...a }; delete next[id]; return next; });
    }
  };

  const filtered = requests.filter(r => {
    if (filterToolId && r.toolId !== filterToolId) return false;
    if (filterRisk && r.riskLevel !== filterRisk) return false;
    if (filterPhase && r.phase !== filterPhase) return false;
    if (filterStatus && r.status !== filterStatus) return false;
    return true;
  });

  const pending = filtered.filter(r => r.status === 'pending');
  const history = filtered.filter(r => r.status !== 'pending');
  const allToolIds = [...new Set(requests.map(r => r.toolId).filter(Boolean) as string[])];
  const allPhases = [...new Set(requests.map(r => r.phase).filter(Boolean) as string[])];
  const hasFilter = filterToolId || filterRisk || filterPhase || filterStatus;

  return (
    <div className="px-4 py-6 sm:px-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
          <Link href={homePath} className="hover:text-indigo-500">{t('breadcrumbHome', language)}</Link>
          <span>/</span>
          <span className="text-gray-900 dark:text-gray-100 font-medium">{t('breadcrumbApprovals', language)}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          📥 {t('title', language)}
          {pending.length > 0 && (
            <span className="px-3 py-1 text-sm font-semibold bg-red-100 text-red-700 rounded-full">{pending.length}</span>
          )}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">{t('subtitle', language)}</p>
      </div>

      <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 flex flex-wrap gap-3 items-end">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{t('toolId', language)}</label>
          <select title={t('toolId', language)} value={filterToolId} onChange={e => setFilterToolId(e.target.value)} className="text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
            <option value="">{t('all', language)}</option>
            {allToolIds.map(id => <option key={id} value={id}>{id}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{t('riskLevel', language)}</label>
          <select title={t('riskLevel', language)} value={filterRisk} onChange={e => setFilterRisk(e.target.value)} className="text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
            <option value="">{t('all', language)}</option>
            {['R1', 'R2', 'R3'].map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{t('phase', language)}</label>
          <select title={t('phase', language)} value={filterPhase} onChange={e => setFilterPhase(e.target.value)} className="text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
            <option value="">{t('all', language)}</option>
            {allPhases.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-gray-500">{t('status', language)}</label>
          <select title={t('status', language)} value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200">
            <option value="">{t('all', language)}</option>
            {(['pending', 'approved', 'rejected', 'expired'] as ApprovalStatus[]).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        {hasFilter && (
          <button onClick={() => { setFilterToolId(''); setFilterRisk(''); setFilterPhase(''); setFilterStatus(''); }} className="text-sm text-indigo-600 hover:underline">
            {t('clearFilters', language)}
          </button>
        )}
      </div>

      {loading && <div className="text-gray-500 py-8 text-center">{t('loading', language)}</div>}

      {!loading && (
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('actionRequired', language)}</h2>
          {pending.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center border border-dashed border-gray-200 dark:border-gray-700">
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-gray-500 font-medium">{t('noPending', language)}</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {pending.map(req => {
                const diff = new Date(req.expiresAt).getTime() - now;
                const h = Math.floor(diff / 3600000);
                const m = Math.floor((diff % 3600000) / 60000);
                const countdown = diff <= 0 ? t('expired', language) : h > 0 ? `${h}h ${m}m ${t('remaining', language)}` : `${m}m ${t('remaining', language)}`;
                return (
                  <div key={req.id} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-l-4 border-l-amber-500 border-y-gray-200 border-r-gray-200 dark:border-y-gray-700 dark:border-r-gray-700">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          {req.riskLevel && <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded">{req.riskLevel}</span>}
                          {req.phase && <span className="px-2 py-0.5 bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300 text-xs font-bold rounded">{req.phase}</span>}
                          {req.toolId && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-mono rounded">{req.toolId}</span>}
                          <span className={`text-xs ${diff < 3600000 ? 'text-red-500 font-semibold' : 'text-gray-400'}`}>⏱ {countdown}</span>
                        </div>
                        <p className="font-medium text-gray-900 dark:text-white mb-1">{req.templateName}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">&quot;{req.reason}&quot;</p>
                        {req.toolPayload && (
                          <details className="mb-3">
                            <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700 select-none">▸ {t('toolPayload', language)}</summary>
                            <pre className="mt-2 p-3 text-xs bg-gray-50 dark:bg-gray-900 rounded text-gray-700 dark:text-gray-300 overflow-x-auto">
                              {JSON.stringify(req.toolPayload, null, 2)}
                            </pre>
                          </details>
                        )}
                        <textarea
                          value={reasons[req.id] ?? ''}
                          onChange={e => setReasons(r => ({ ...r, [req.id]: e.target.value }))}
                          placeholder={t('commentPlaceholder', language)}
                          rows={2}
                          className="w-full text-sm border border-gray-200 dark:border-gray-600 rounded p-2 dark:bg-gray-700 dark:text-gray-200 resize-none"
                        />
                        <div className="text-xs text-gray-400 mt-1">{t('submitted', language)} {new Date(req.submittedAt).toLocaleString()}</div>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <button onClick={() => void handleAction(req.id, 'approved')} disabled={acting[req.id]}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg font-medium transition-colors text-sm">
                          {t('approve', language)}
                        </button>
                        <button onClick={() => void handleAction(req.id, 'rejected')} disabled={acting[req.id]}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-800 dark:text-gray-200 rounded-lg font-medium transition-colors text-sm">
                          {t('reject', language)}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {!loading && history.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('history', language)}</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="py-3 px-6 font-semibold text-gray-600 dark:text-gray-400">{t('colRequest', language)}</th>
                  <th className="py-3 px-6 font-semibold text-gray-600 dark:text-gray-400">{t('colRiskPhase', language)}</th>
                  <th className="py-3 px-6 font-semibold text-gray-600 dark:text-gray-400">{t('colDecision', language)}</th>
                  <th className="py-3 px-6 font-semibold text-gray-600 dark:text-gray-400">{t('colNote', language)}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {history.map(req => (
                  <tr key={req.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                    <td className="py-4 px-6">
                      <div className="font-medium text-gray-900 dark:text-white truncate max-w-xs">{req.templateName}</div>
                      <div className="text-xs text-gray-500 mt-1">{new Date(req.submittedAt).toLocaleDateString()}</div>
                    </td>
                    <td className="py-4 px-6 text-xs text-gray-500">{req.riskLevel ?? '—'} / {req.phase ?? '—'}</td>
                    <td className="py-4 px-6">
                      <span className={`px-2 py-1 text-xs font-bold rounded ${
                        req.status === 'approved' ? 'bg-emerald-100 text-emerald-700' :
                        req.status === 'expired' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' :
                        'bg-red-100 text-red-700'
                      }`}>{req.status.toUpperCase()}</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-gray-700 dark:text-gray-300 truncate max-w-xs">{req.reviewComment ?? '-'}</div>
                      <div className="text-xs text-gray-500 mt-1">{req.reviewedBy}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

interface ApprovalInboxProps {
  homePath?: string;
}

export function ApprovalInbox({ homePath }: ApprovalInboxProps) {
  return (
    <Suspense fallback={<div className="px-4 py-6 sm:px-6" />}>
      <ApprovalInboxContent homePath={homePath} />
    </Suspense>
  );
}
