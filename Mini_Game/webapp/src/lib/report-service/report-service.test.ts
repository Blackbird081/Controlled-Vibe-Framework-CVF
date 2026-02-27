import { describe, expect, it } from "vitest";
import { buildWeeklyReport, getDefaultReportHistoryState, getYesterdayEntry, syncTodayMetrics } from "@/lib/report-service";

describe("report service", () => {
  it("syncs per-day metrics without duplicating unchanged payload", () => {
    const initial = getDefaultReportHistoryState();
    const day1 = syncTodayMetrics(initial, {
      date: "2026-02-26",
      rounds: 8,
      correct: 6,
      wrong: 2,
      usedMs: 600000,
      byGame: {
        math: { rounds: 3, correct: 2, wrong: 1 },
        memory: { rounds: 3, correct: 3, wrong: 0 },
        color: { rounds: 2, correct: 1, wrong: 1 },
        logic: { rounds: 0, correct: 0, wrong: 0 },
      },
    });
    const same = syncTodayMetrics(day1, {
      date: "2026-02-26",
      rounds: 8,
      correct: 6,
      wrong: 2,
      usedMs: 600000,
      byGame: {
        math: { rounds: 3, correct: 2, wrong: 1 },
        memory: { rounds: 3, correct: 3, wrong: 0 },
        color: { rounds: 2, correct: 1, wrong: 1 },
        logic: { rounds: 0, correct: 0, wrong: 0 },
      },
    });

    expect(day1.entries).toHaveLength(1);
    expect(same).toBe(day1);
  });

  it("builds weekly report trend and weak game", () => {
    let state = getDefaultReportHistoryState();
    state = syncTodayMetrics(state, {
      date: "2026-02-24",
      rounds: 6,
      correct: 3,
      wrong: 3,
      usedMs: 450000,
      byGame: {
        math: { rounds: 2, correct: 1, wrong: 1 },
        memory: { rounds: 2, correct: 1, wrong: 1 },
        color: { rounds: 2, correct: 1, wrong: 1 },
        logic: { rounds: 0, correct: 0, wrong: 0 },
      },
    });
    state = syncTodayMetrics(state, {
      date: "2026-02-25",
      rounds: 8,
      correct: 6,
      wrong: 2,
      usedMs: 520000,
      byGame: {
        math: { rounds: 3, correct: 2, wrong: 1 },
        memory: { rounds: 3, correct: 3, wrong: 0 },
        color: { rounds: 2, correct: 1, wrong: 1 },
        logic: { rounds: 0, correct: 0, wrong: 0 },
      },
    });
    state = syncTodayMetrics(state, {
      date: "2026-02-26",
      rounds: 9,
      correct: 8,
      wrong: 1,
      usedMs: 570000,
      byGame: {
        math: { rounds: 3, correct: 3, wrong: 0 },
        memory: { rounds: 3, correct: 3, wrong: 0 },
        color: { rounds: 3, correct: 2, wrong: 1 },
        logic: { rounds: 0, correct: 0, wrong: 0 },
      },
    });

    const weekly = buildWeeklyReport(state);
    const yesterday = getYesterdayEntry(state, "2026-02-26");

    expect(weekly.totalRounds).toBe(23);
    expect(weekly.averageAccuracy).toBeGreaterThan(70);
    expect(weekly.trend).toBe("up");
    expect(weekly.weakGame).toBe("color");
    expect(yesterday?.date).toBe("2026-02-25");
  });
});
