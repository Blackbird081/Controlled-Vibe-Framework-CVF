import { NextRequest, NextResponse } from 'next/server';

import { requireAdminApiSession } from '@/lib/admin-session';
import { exportAuditEventsToCsv, readAuditEvents } from '@/lib/control-plane-events';

export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession(request, '/api/admin/audit-feed');
  if (session instanceof NextResponse) {
    return session;
  }

  const format = request.nextUrl.searchParams.get('format');
  if (format === 'csv') {
    const csv = await exportAuditEventsToCsv();
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename="cvf-audit-log.csv"',
      },
    });
  }

  const events = await readAuditEvents();
  return NextResponse.json({ success: true, data: events });
}
