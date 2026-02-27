export type TelemetryEvent =
  | "screen_view"
  | "game_switch"
  | "answer_correct"
  | "answer_wrong"
  | "round_start"
  | "round_timeout"
  | "hint_shown"
  | "celebration_burst"
  | "age_profile_change"
  | "audio_update"
  | "tts_update"
  | "tts_speak"
  | "language_switch"
  | "parent_unlock"
  | "parent_pin_update"
  | "onboarding_complete"
  | "parent_mode_update"
  | "restart_run";

interface TelemetryPayload {
  [key: string]: string | number | boolean | null;
}

export async function trackEvent(event: TelemetryEvent, payload: TelemetryPayload = {}): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    await fetch("/api/telemetry", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        event,
        payload,
        timestamp: Date.now(),
      }),
      keepalive: true,
    });
  } catch {
    // Avoid impacting gameplay when telemetry endpoint is unavailable.
  }
}
