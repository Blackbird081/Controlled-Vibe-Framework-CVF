/**
 * API Routes for Session Management
 * ===================================
 * GET /api/sessions?userId=xxx — list sessions
 * POST /api/sessions — create new session
 * GET /api/sessions/[id] — load session
 * PUT /api/sessions/[id] — add message
 *
 * Sprint 7 — Task 7.2 (API layer)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createSession, listSessions, saveSession } from '@/lib/session-store';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || 'default';
    const sessions = await listSessions(userId);
    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to list sessions' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const session = createSession(
      body.userId || 'default',
      body.title || 'New Chat',
      body.metadata,
    );
    await saveSession(session);
    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to create session' },
      { status: 500 },
    );
  }
}
