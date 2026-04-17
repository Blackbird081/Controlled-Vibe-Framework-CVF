import { NextRequest, NextResponse } from 'next/server';

import { exportAuditEventsToCsv, readAuditEvents } from '@/lib/control-plane-events';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { canAccessAdmin } from '@/lib/enterprise-access';

export async function GET(request: NextRequest) {
  const session = await verifySessionCookie(request);
  if (!session || !canAccessAdmin(session.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
