import { NextResponse } from 'next/server';

import { verifySessionCookie } from '@/lib/middleware-auth';
import { getToolInventory } from '@/lib/tool-registry-catalog';

export async function GET() {
  const session = await verifySessionCookie();
  if (!session) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const inventory = await getToolInventory();
  return NextResponse.json({
    success: true,
    data: {
      role: session.role,
      inventory: inventory.map(tool => ({
        id: tool.id,
        allowedRoles: tool.allowedRoles,
        policySource: tool.policySource,
        policyUpdatedAt: tool.policyUpdatedAt,
      })),
    },
  });
}
