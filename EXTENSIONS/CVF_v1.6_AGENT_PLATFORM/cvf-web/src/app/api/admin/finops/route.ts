import { NextRequest, NextResponse } from 'next/server';

import { requireAdminApiSession } from '@/lib/admin-session';
import { getFinOpsSummary } from '@/lib/control-plane-events';

export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession(request, '/api/admin/finops');
  if (session instanceof NextResponse) {
    return session;
  }

  const summary = await getFinOpsSummary();
  return NextResponse.json({ success: true, data: summary });
}
