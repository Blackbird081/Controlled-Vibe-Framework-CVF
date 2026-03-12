/**
 * API Route for Individual Session Operations
 * =============================================
 * GET /api/sessions/[id] — load session
 * PUT /api/sessions/[id] — add message to session
 * DELETE /api/sessions/[id] — delete session
 *
 * Sprint 7 — Task 7.2 (API layer)
 */

import { NextRequest, NextResponse } from 'next/server';
import { loadSession, addMessage, deleteSession } from '@/lib/session-store';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await loadSession(id);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to load session' },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await request.json();
    if (!body.content || !body.role) {
      return NextResponse.json({ success: false, error: 'Missing content or role' }, { status: 400 });
    }

    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      role: body.role as 'user' | 'assistant' | 'system',
      content: body.content,
      timestamp: new Date().toISOString(),
      provider: body.provider,
      model: body.model,
    };

    const { id } = await params;
    const session = await addMessage(id, message);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: session });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to add message' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteSession(id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Failed to delete session' },
      { status: 500 },
    );
  }
}
