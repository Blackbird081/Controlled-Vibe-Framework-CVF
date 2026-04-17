import Link from 'next/link';

import { readAuditEvents } from '@/lib/control-plane-events';
import { requireAdminSession } from '@/lib/admin-session';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function asSingle(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function AdminAuditLogPage(props: { searchParams: SearchParams }) {
  await requireAdminSession('/admin/audit-log');
  const searchParams = await props.searchParams;
  const actorFilter = asSingle(searchParams.actor)?.trim().toLowerCase() ?? '';
  const outcomeFilter = asSingle(searchParams.outcome)?.trim().toLowerCase() ?? '';
  const riskFilter = asSingle(searchParams.riskLevel)?.trim().toLowerCase() ?? '';

  const auditEvents = await readAuditEvents();
  const filteredEvents = auditEvents.filter(event => {
    if (actorFilter && !`${event.actorId} ${event.actorRole}`.toLowerCase().includes(actorFilter)) return false;
    if (outcomeFilter && event.outcome.toLowerCase() !== outcomeFilter) return false;
    if (riskFilter && (event.riskLevel ?? '').toLowerCase() !== riskFilter) return false;
    return true;
  }).reverse();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="text-sm text-gray-500 dark:text-gray-400">Phase B • Read-only</div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mt-1">Audit Log Viewer</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Silent admin denials, execute telemetry, and control-plane evidence emitted during this tranche.
          </p>
        </div>
        <Link
          href="/api/admin/audit-feed?format=csv"
          className="inline-flex items-center justify-center rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          Export CSV
        </Link>
      </div>

      <form className="grid gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:grid-cols-4 dark:border-gray-700 dark:bg-gray-900">
        <input
          name="actor"
          defaultValue={actorFilter}
          placeholder="Actor or role"
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <input
          name="outcome"
          defaultValue={outcomeFilter}
          placeholder="Outcome"
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <input
          name="riskLevel"
          defaultValue={riskFilter}
          placeholder="Risk level"
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 outline-none focus:border-emerald-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
        />
        <button
          type="submit"
          className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-700"
        >
          Apply Filters
        </button>
      </form>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-900">
        <table className="w-full border-collapse text-left">
          <thead className="bg-gray-50 text-sm text-gray-600 dark:bg-gray-800 dark:text-gray-300">
            <tr>
              <th className="px-5 py-4">Timestamp</th>
              <th className="px-5 py-4">Event</th>
              <th className="px-5 py-4">Actor</th>
              <th className="px-5 py-4">Target</th>
              <th className="px-5 py-4">Outcome</th>
              <th className="px-5 py-4">Risk / Phase</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {filteredEvents.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-sm text-gray-500">
                  No audit events recorded yet.
                </td>
              </tr>
            )}
            {filteredEvents.map(event => (
              <tr key={event.id} className="align-top">
                <td className="px-5 py-4 text-sm text-gray-500">{new Date(event.timestamp).toLocaleString()}</td>
                <td className="px-5 py-4">
                  <div className="font-medium text-gray-900 dark:text-white">{event.eventType}</div>
                  <div className="mt-1 text-sm text-gray-500">{event.action}</div>
                </td>
                <td className="px-5 py-4">
                  <div className="font-medium text-gray-900 dark:text-white">{event.actorId}</div>
                  <div className="mt-1 text-sm text-gray-500">{event.actorRole}</div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-700 dark:text-gray-300">{event.targetResource}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-200">
                    {event.outcome}
                  </span>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                  <div>{event.riskLevel || '-'}</div>
                  <div className="mt-1">{event.phase || '-'}</div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
