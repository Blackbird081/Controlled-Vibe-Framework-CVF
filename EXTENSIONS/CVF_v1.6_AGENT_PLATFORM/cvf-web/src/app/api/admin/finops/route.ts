import { NextResponse } from 'next/server';

import { getFinOpsSummary } from '@/lib/control-plane-events';
import { verifySessionCookie } from '@/lib/middleware-auth';
import { canAccessAdmin } from '@/lib/enterprise-access';

export async function GET() {
  const session = await verifySessionCookie();
  if (!session || !canAccessAdmin(session.role)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const summary = await getFinOpsSummary();
  return NextResponse.json({ success: true, data: summary });
}
