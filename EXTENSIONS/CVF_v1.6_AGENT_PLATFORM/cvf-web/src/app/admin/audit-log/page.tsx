import { AdminAuditLogBody } from '@/components/admin/AdminAuditLogBody';
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
    <AdminAuditLogBody
      filteredEvents={filteredEvents}
      actorFilter={actorFilter}
      outcomeFilter={outcomeFilter}
      riskFilter={riskFilter}
    />
  );
}
