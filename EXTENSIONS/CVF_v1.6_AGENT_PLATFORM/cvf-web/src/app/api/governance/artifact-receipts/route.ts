import type { NextRequest } from 'next/server';
import { createBoundReceiptHandlers } from '@/lib/server/bound-receipt-api';

// Dedicated bound-receipt endpoint. No activation context is supplied here: the deployed route denies every request, and no environment value,
// header or body field can create one. Offline tests build their own handlers with an injected fixture context. POST is the only method.
const handlers = createBoundReceiptHandlers({ context: null });

export async function POST(request: NextRequest): Promise<Response> {
  return handlers.POST(request);
}
