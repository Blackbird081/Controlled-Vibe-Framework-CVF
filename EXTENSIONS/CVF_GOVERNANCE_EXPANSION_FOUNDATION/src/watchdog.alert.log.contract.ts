import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { WatchdogPulse, WatchdogStatus } from "./watchdog.pulse.contract";

// --- Types ---

export interface WatchdogAlertLog {
  logId: string;
  createdAt: string;
  totalPulses: number;
  criticalCount: number;
  warningCount: number;
  nominalCount: number;
  unknownCount: number;
  dominantStatus: WatchdogStatus;
  alertActive: boolean;
  summary: string;
  logHash: string;
}

export interface WatchdogAlertLogContractDependencies {
  now?: () => string;
}

// --- Dominant status logic ---
// CRITICAL > WARNING > UNKNOWN > NOMINAL

const STATUS_PRIORITY: WatchdogStatus[] = ["CRITICAL", "WARNING", "UNKNOWN", "NOMINAL"];

function computeDominantStatus(pulses: WatchdogPulse[]): WatchdogStatus {
  if (pulses.length === 0) return "UNKNOWN";

  const counts = new Map<WatchdogStatus, number>();
  for (const p of pulses) {
    counts.set(p.watchdogStatus, (counts.get(p.watchdogStatus) ?? 0) + 1);
  }

  let maxCount = 0;
  let dominant: WatchdogStatus = "UNKNOWN";

  for (const s of STATUS_PRIORITY) {
    const count = counts.get(s) ?? 0;
    if (count > maxCount) {
      maxCount = count;
      dominant = s;
    }
  }

  return dominant;
}

// --- Contract ---

export class WatchdogAlertLogContract {
  private readonly now: () => string;

  constructor(dependencies: WatchdogAlertLogContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  log(pulses: WatchdogPulse[]): WatchdogAlertLog {
    const createdAt = this.now();
    const totalPulses = pulses.length;

    let criticalCount = 0;
    let warningCount = 0;
    let nominalCount = 0;
    let unknownCount = 0;

    for (const p of pulses) {
      switch (p.watchdogStatus) {
        case "CRITICAL": criticalCount++; break;
        case "WARNING": warningCount++; break;
        case "NOMINAL": nominalCount++; break;
        case "UNKNOWN": unknownCount++; break;
      }
    }

    const dominantStatus = computeDominantStatus(pulses);
    const alertActive = dominantStatus === "CRITICAL" || dominantStatus === "WARNING";

    const summary =
      totalPulses === 0
        ? "No watchdog pulses in log."
        : `${totalPulses} pulse(s). Dominant status: ${dominantStatus}. Alert active: ${alertActive}.`;

    const logHash = computeDeterministicHash(
      "w3-t2-cp2-watchdog-log",
      `${createdAt}:total=${totalPulses}`,
      `critical=${criticalCount}:warning=${warningCount}:nominal=${nominalCount}:unknown=${unknownCount}`,
      `dominant:${dominantStatus}:alert:${alertActive}`,
    );

    const logId = computeDeterministicHash(
      "w3-t2-cp2-log-id",
      logHash,
      createdAt,
    );

    return {
      logId,
      createdAt,
      totalPulses,
      criticalCount,
      warningCount,
      nominalCount,
      unknownCount,
      dominantStatus,
      alertActive,
      summary,
      logHash,
    };
  }
}

export function createWatchdogAlertLogContract(
  dependencies?: WatchdogAlertLogContractDependencies,
): WatchdogAlertLogContract {
  return new WatchdogAlertLogContract(dependencies);
}
