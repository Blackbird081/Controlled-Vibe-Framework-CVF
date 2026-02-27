import { describe, expect, it } from "vitest";
import {
  advanceAcademyProgress,
  getDefaultAcademyProgress,
  getRoundsUntilBoss,
} from "@/lib/progression-service/academy";

describe("academy progression service", () => {
  it("starts with first zone and first node unlocked", () => {
    const state = getDefaultAcademyProgress();
    expect(state.activeZoneIndex).toBe(0);
    expect(state.activeNodeIndex).toBe(0);
    expect(state.zones[0].unlocked).toBe(true);
    expect(state.zones[0].nodes[0].unlocked).toBe(true);
    expect(state.zones[1].unlocked).toBe(false);
  });

  it("completes node after enough correct answers", () => {
    const initial = getDefaultAcademyProgress();
    const first = advanceAcademyProgress(initial, true);
    const second = advanceAcademyProgress(first.next, true);

    expect(second.next.zones[0].nodes[0].completed).toBe(true);
    expect(second.next.activeNodeIndex).toBe(1);
    expect(second.telemetry.some((event) => event.event === "node_complete")).toBe(true);
  });

  it("unlocks and enters next zone after finishing all nodes in current zone", () => {
    let state = getDefaultAcademyProgress();
    // Zone 1 needs 2 + 2 + 3 correct to finish all nodes.
    for (let i = 0; i < 6; i += 1) {
      state = advanceAcademyProgress(state, true).next;
    }
    const transition = advanceAcademyProgress(state, true);

    expect(transition.next.activeZoneIndex).toBe(1);
    expect(transition.next.zones[1].unlocked).toBe(true);
    expect(transition.telemetry.some((event) => event.event === "zone_unlock")).toBe(true);
    expect(transition.telemetry.some((event) => event.event === "zone_enter")).toBe(true);
  });

  it("counts rounds until boss every 5 rounds", () => {
    const state = getDefaultAcademyProgress();
    expect(getRoundsUntilBoss(state)).toBe(5);
    const progressed = {
      ...state,
      totalRounds: 3,
    };
    expect(getRoundsUntilBoss(progressed)).toBe(2);
  });
});
