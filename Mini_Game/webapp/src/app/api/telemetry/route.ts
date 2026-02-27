import { NextResponse } from "next/server";

const ALLOWED_EVENTS = new Set([
  "screen_view",
  "game_switch",
  "round_start",
  "answer_correct",
  "answer_wrong",
  "round_timeout",
  "hint_shown",
  "celebration_burst",
  "age_profile_change",
  "audio_update",
  "tts_update",
  "tts_speak",
  "parent_unlock",
  "parent_pin_update",
  "onboarding_complete",
  "parent_mode_update",
  "restart_run",
]);

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      event?: string;
      payload?: Record<string, unknown>;
      timestamp?: number;
    };

    if (!body.event || !ALLOWED_EVENTS.has(body.event)) {
      return NextResponse.json(
        {
          ok: false,
          message: "invalid_event",
        },
        { status: 400 },
      );
    }

    return NextResponse.json({
      ok: true,
      receivedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: "bad_request",
      },
      { status: 400 },
    );
  }
}
