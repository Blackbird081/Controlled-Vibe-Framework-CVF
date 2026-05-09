import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApiSession } from '@/lib/admin-session';
import { knowledgeStore } from '@/lib/knowledge-store';

export async function GET(request: NextRequest) {
  const session = await requireAdminApiSession(request, '/api/admin/knowledge/audit');
  if (session instanceof NextResponse) return session;

  return NextResponse.json({ entries: knowledgeStore.getAuditLog() }, { status: 200 });
}
