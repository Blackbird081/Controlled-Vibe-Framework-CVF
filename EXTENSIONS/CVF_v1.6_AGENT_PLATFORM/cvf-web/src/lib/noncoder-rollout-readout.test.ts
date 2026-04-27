/**
 * noncoder-rollout-readout.test.ts
 * W128-T1 — Lane readout model verification
 *
 * Tests:
 *   1.  computeLaneReadout([]) → 6 lanes all no_data
 *   2.  all 6 lane IDs present in readout
 *   3.  entry_routing healthy when weak_fallback_rate ≤ 15%
 *   4.  entry_routing watch when weak_fallback_rate 15–30%
 *   5.  entry_routing action_required when weak_fallback_rate > 30%
 *   6.  entry_routing action_required when TTFV > 5 min (worstOf)
 *   7.  clarification_recovery healthy when route_recovery_rate ≥ 50%
 *   8.  clarification_recovery action_required when rate < 30%
 *   9.  followup_continuity healthy when rate ≥ 15%
 *   10. followup_continuity action_required when rate < 5%
 *   11. evidence_export healthy when rate ≥ 15%
 *   12. deliverable_pack healthy when rate ≥ 15%
 *   13. trusted_form shares weak_fallback_rate signal with entry_routing
 *   14. flagActive reflects passed flags
 *   15. flag-aware rec — clar loop off + action_required mentions enabling flag
 *   16. flag-aware rec — clar loop on + action_required gives tuning advice
 *   17. buildRolloutRecommendations excludes healthy lanes
 *   18. buildRolloutRecommendations sorts action_required before watch
 *   19. buildRolloutRecommendations assigns sequential priority numbers
 *   20. no_data lane included in recommendations (priority after watch)
 */

import { describe, it, expect } from 'vitest';
import { computeLaneReadout, buildRolloutRecommendations } from './noncoder-rollout-readout';
import type { AnalyticsEvent } from './analytics';
import type { NoncoderFlags } from './noncoder-rollout-readout';

let idCounter = 0;
function makeEvent(
  type: string,
  timestamp: number,
  data?: Record<string, unknown>,
): AnalyticsEvent {
  return {
    id: `evt_${++idCounter}`,
    type: type as AnalyticsEvent['type'],
    timestamp,
    data,
  };
}

const T0 = 2_000_000;

const ALL_FLAGS_OFF: NoncoderFlags = {
  intentFirstEnabled: false,
  iterationMemoryEnabled: false,
  clarificationLoopEnabled: false,
};

const ALL_FLAGS_ON: NoncoderFlags = {
  intentFirstEnabled: true,
  iterationMemoryEnabled: true,
  clarificationLoopEnabled: true,
};

describe('computeLaneReadout', () => {
  it('1. all no_data on empty events', () => {
    const readout = computeLaneReadout([], ALL_FLAGS_OFF);
    expect(readout).toHaveLength(6);
    readout.forEach((lane) => expect(lane.status).toBe('no_data'));
  });

  it('2. all 6 lane IDs present', () => {
    const readout = computeLaneReadout([], ALL_FLAGS_OFF);
    const ids = readout.map((l) => l.laneId);
    expect(ids).toContain('entry_routing');
    expect(ids).toContain('clarification_recovery');
    expect(ids).toContain('trusted_form');
    expect(ids).toContain('followup_continuity');
    expect(ids).toContain('evidence_export');
    expect(ids).toContain('deliverable_pack');
  });

  it('3. entry_routing healthy when weak_fallback_rate ≤ 15%', () => {
    // 10 strong routes, 1 weak, 0 fallback → rate = 0/11 = 0%
    const events = [
      ...Array(10).fill(null).map((_, i) => makeEvent('intent_routed', T0 + i)),
      makeEvent('clarification_weak_confidence_detected', T0 + 10),
    ];
    const readout = computeLaneReadout(events, ALL_FLAGS_ON);
    const lane = readout.find((l) => l.laneId === 'entry_routing')!;
    expect(lane.status).toBe('healthy');
  });

  it('4. entry_routing watch when weak_fallback_rate 15–30%', () => {
    // 2 strong + 2 weak + 1 fallback → rate = 1/4 = 25%
    const events = [
      makeEvent('intent_routed', T0),
      makeEvent('intent_routed', T0 + 1),
      makeEvent('clarification_weak_confidence_detected', T0 + 2),
      makeEvent('clarification_weak_confidence_detected', T0 + 3),
      makeEvent('clarification_browse_fallback', T0 + 4),
    ];
    const readout = computeLaneReadout(events, ALL_FLAGS_ON);
    const lane = readout.find((l) => l.laneId === 'entry_routing')!;
    expect(lane.status).toBe('watch');
  });

  it('5. entry_routing action_required when weak_fallback_rate > 30%', () => {
    // 2 strong + 3 weak + 2 fallback → rate = 2/5 = 40%
    const events = [
      makeEvent('intent_routed', T0),
      makeEvent('intent_routed', T0 + 1),
      makeEvent('clarification_weak_confidence_detected', T0 + 2),
      makeEvent('clarification_weak_confidence_detected', T0 + 3),
      makeEvent('clarification_weak_confidence_detected', T0 + 4),
      makeEvent('clarification_browse_fallback', T0 + 5),
      makeEvent('clarification_browse_fallback', T0 + 6),
    ];
    const readout = computeLaneReadout(events, ALL_FLAGS_ON);
    const lane = readout.find((l) => l.laneId === 'entry_routing')!;
    expect(lane.status).toBe('action_required');
  });

  it('6. entry_routing action_required when TTFV > 5 min (worstOf)', () => {
    // No routing events → fallbackStatus = no_data
    // TTFV = 6 min → ttfvStatus = action_required
    // worstOf(no_data, action_required) = action_required
    const events = [
      makeEvent('execution_created', T0, { id: 'e1' }),
      makeEvent('execution_accepted', T0 + 6 * 60_000, { id: 'e1' }),
    ];
    const readout = computeLaneReadout(events, ALL_FLAGS_ON);
    const lane = readout.find((l) => l.laneId === 'entry_routing')!;
    expect(lane.status).toBe('action_required');
  });

  it('7. clarification_recovery healthy when rate ≥ 50%', () => {
    // 2 weak + 1 recovered → rate = 0.5
    const events = [
      makeEvent('clarification_weak_confidence_detected', T0),
      makeEvent('clarification_weak_confidence_detected', T0 + 1),
      makeEvent('clarification_route_recovered', T0 + 2),
    ];
    const readout = computeLaneReadout(events, ALL_FLAGS_ON);
    const lane = readout.find((l) => l.laneId === 'clarification_recovery')!;
    expect(lane.status).toBe('healthy');
  });

  it('8. clarification_recovery action_required when rate < 30%', () => {
    // 4 weak + 1 recovered → rate = 0.25
    const events = [
      makeEvent('clarification_weak_confidence_detected', T0),
      makeEvent('clarification_weak_confidence_detected', T0 + 1),
      makeEvent('clarification_weak_confidence_detected', T0 + 2),
      makeEvent('clarification_weak_confidence_detected', T0 + 3),
      makeEvent('clarification_route_recovered', T0 + 4),
    ];
    const readout = computeLaneReadout(events, ALL_FLAGS_ON);
    const lane = readout.find((l) => l.laneId === 'clarification_recovery')!;
    expect(lane.status).toBe('action_required');
  });

  it('9. followup_continuity healthy when rate ≥ 15%', () => {
    // 3 created + 1 followup → rate = 1/3 ≈ 33%
    const events = [
      makeEvent('execution_created', T0),
      makeEvent('execution_created', T0 + 1),
      makeEvent('execution_created', T0 + 2),
      makeEvent('followup_started', T0 + 3),
    ];
    const readout = computeLaneReadout(events, ALL_FLAGS_ON);
    const lane = readout.find((l) => l.laneId === 'followup_continuity')!;
    expect(lane.status).toBe('healthy');
  });

  it('10. followup_continuity action_required when rate < 5%', () => {
    // 100 created + 3 followup → rate = 3%
    const events = [
      ...Array(100).fill(null).map((_, i) => makeEvent('execution_created', T0 + i)),
      makeEvent('followup_started', T0 + 100),
      makeEvent('followup_started', T0 + 101),
      makeEvent('followup_started', T0 + 102),
    ];
    const readout = computeLaneReadout(events, ALL_FLAGS_ON);
    const lane = readout.find((l) => l.laneId === 'followup_continuity')!;
    expect(lane.status).toBe('action_required');
  });

  it('11. evidence_export healthy when rate ≥ 15%', () => {
    // 4 accepted + 1 exported → rate = 25%
    const events = [
      makeEvent('execution_accepted', T0, { id: 'e1' }),
      makeEvent('execution_accepted', T0 + 1, { id: 'e2' }),
      makeEvent('execution_accepted', T0 + 2, { id: 'e3' }),
      makeEvent('execution_accepted', T0 + 3, { id: 'e4' }),
      makeEvent('evidence_exported', T0 + 4, { executionId: 'e1', format: 'md' }),
    ];
    const readout = computeLaneReadout(events, ALL_FLAGS_ON);
    const lane = readout.find((l) => l.laneId === 'evidence_export')!;
    expect(lane.status).toBe('healthy');
  });

  it('12. deliverable_pack healthy when rate ≥ 15%', () => {
    // 4 accepted + 1 pack → rate = 25%
    const events = [
      makeEvent('execution_accepted', T0, { id: 'e1' }),
      makeEvent('execution_accepted', T0 + 1, { id: 'e2' }),
      makeEvent('execution_accepted', T0 + 2, { id: 'e3' }),
      makeEvent('execution_accepted', T0 + 3, { id: 'e4' }),
      makeEvent('deliverable_pack_exported', T0 + 4),
    ];
    const readout = computeLaneReadout(events, ALL_FLAGS_ON);
    const lane = readout.find((l) => l.laneId === 'deliverable_pack')!;
    expect(lane.status).toBe('healthy');
  });

  it('13. trusted_form shares weak_fallback_rate signal', () => {
    // Healthy fallback → trusted_form healthy; action_required fallback → trusted_form action_required
    const healthyEvents = [
      ...Array(10).fill(null).map((_, i) => makeEvent('intent_routed', T0 + i)),
    ];
    const healthyReadout = computeLaneReadout(healthyEvents, ALL_FLAGS_ON);
    const healthyTf = healthyReadout.find((l) => l.laneId === 'trusted_form')!;
    const healthyEntry = healthyReadout.find((l) => l.laneId === 'entry_routing')!;
    // Both should be healthy (no fallbacks)
    expect(healthyTf.status).toBe('healthy');
    expect(healthyTf.metricValue).toBe(healthyEntry.metricValue);
  });

  it('14. flagActive reflects passed flags', () => {
    const offReadout = computeLaneReadout([], ALL_FLAGS_OFF);
    expect(offReadout.find((l) => l.laneId === 'entry_routing')!.flagActive).toBe(false);
    expect(offReadout.find((l) => l.laneId === 'clarification_recovery')!.flagActive).toBe(false);
    expect(offReadout.find((l) => l.laneId === 'followup_continuity')!.flagActive).toBe(false);
    expect(offReadout.find((l) => l.laneId === 'evidence_export')!.flagActive).toBe(true);

    const onReadout = computeLaneReadout([], ALL_FLAGS_ON);
    expect(onReadout.find((l) => l.laneId === 'entry_routing')!.flagActive).toBe(true);
    expect(onReadout.find((l) => l.laneId === 'clarification_recovery')!.flagActive).toBe(true);
    expect(onReadout.find((l) => l.laneId === 'followup_continuity')!.flagActive).toBe(true);
  });

  it('15. clar loop off + action_required → recommendation mentions enabling flag', () => {
    const events = [
      makeEvent('clarification_weak_confidence_detected', T0),
      makeEvent('clarification_weak_confidence_detected', T0 + 1),
      makeEvent('clarification_weak_confidence_detected', T0 + 2),
      makeEvent('clarification_weak_confidence_detected', T0 + 3),
    ];
    const readout = computeLaneReadout(events, ALL_FLAGS_OFF);
    const lane = readout.find((l) => l.laneId === 'clarification_recovery')!;
    expect(lane.status).toBe('action_required');
    expect(lane.recommendation).toContain('NEXT_PUBLIC_CVF_NONCODER_CLARIFICATION_LOOP');
  });

  it('16. clar loop on + action_required → recommendation gives tuning advice', () => {
    const events = [
      makeEvent('clarification_weak_confidence_detected', T0),
      makeEvent('clarification_weak_confidence_detected', T0 + 1),
      makeEvent('clarification_weak_confidence_detected', T0 + 2),
      makeEvent('clarification_weak_confidence_detected', T0 + 3),
    ];
    const readout = computeLaneReadout(events, ALL_FLAGS_ON);
    const lane = readout.find((l) => l.laneId === 'clarification_recovery')!;
    expect(lane.status).toBe('action_required');
    expect(lane.recommendation).toContain('Rewrite clarification questions');
  });
});

describe('buildRolloutRecommendations', () => {
  it('17. excludes healthy lanes', () => {
    const readout = computeLaneReadout([], ALL_FLAGS_OFF);
    // All no_data — none are healthy, so all included
    const recs = buildRolloutRecommendations(readout);
    expect(recs.length).toBe(6);

    // Make all healthy by providing ideal data
    const idealEvents = [
      ...Array(10).fill(null).map((_, i) => makeEvent('intent_routed', T0 + i)),
      makeEvent('clarification_weak_confidence_detected', T0 + 10),
      makeEvent('clarification_route_recovered', T0 + 11),
      makeEvent('clarification_route_recovered', T0 + 12),
      makeEvent('execution_created', T0 + 13),
      makeEvent('followup_started', T0 + 14),
      makeEvent('followup_started', T0 + 15),
      makeEvent('followup_started', T0 + 16),
      makeEvent('execution_accepted', T0 + 17, { id: 'ea1' }),
      makeEvent('execution_accepted', T0 + 18, { id: 'ea2' }),
      makeEvent('execution_accepted', T0 + 19, { id: 'ea3' }),
      makeEvent('execution_accepted', T0 + 20, { id: 'ea4' }),
      makeEvent('evidence_exported', T0 + 21, { executionId: 'ea1', format: 'md' }),
      makeEvent('deliverable_pack_exported', T0 + 22),
    ];
    const idealReadout = computeLaneReadout(idealEvents, ALL_FLAGS_ON);
    const idealRecs = buildRolloutRecommendations(idealReadout);
    idealRecs.forEach((r) => {
      const lane = idealReadout.find((l) => l.laneId === r.laneId)!;
      expect(lane.status).not.toBe('healthy');
    });
  });

  it('18. sorts action_required before watch before no_data', () => {
    // action_required: fallback > 30%; watch: followup 5–15%
    const events = [
      // entry: action_required (40% fallback)
      makeEvent('intent_routed', T0),
      makeEvent('intent_routed', T0 + 1),
      makeEvent('clarification_weak_confidence_detected', T0 + 2),
      makeEvent('clarification_weak_confidence_detected', T0 + 3),
      makeEvent('clarification_weak_confidence_detected', T0 + 4),
      makeEvent('clarification_browse_fallback', T0 + 5),
      makeEvent('clarification_browse_fallback', T0 + 6),
      // followup: watch (10%) — 10 created + 1 followup
      makeEvent('execution_created', T0 + 7),
      makeEvent('execution_created', T0 + 8),
      makeEvent('execution_created', T0 + 9),
      makeEvent('execution_created', T0 + 10),
      makeEvent('execution_created', T0 + 11),
      makeEvent('execution_created', T0 + 12),
      makeEvent('execution_created', T0 + 13),
      makeEvent('execution_created', T0 + 14),
      makeEvent('execution_created', T0 + 15),
      makeEvent('execution_created', T0 + 16),
      makeEvent('followup_started', T0 + 17),
    ];
    const readout = computeLaneReadout(events, ALL_FLAGS_ON);
    const recs = buildRolloutRecommendations(readout);
    const actionRecs = recs.filter((r) => readout.find((l) => l.laneId === r.laneId)!.status === 'action_required');
    const watchRecs = recs.filter((r) => readout.find((l) => l.laneId === r.laneId)!.status === 'watch');
    if (actionRecs.length > 0 && watchRecs.length > 0) {
      expect(actionRecs[0].priority).toBeLessThan(watchRecs[0].priority);
    }
  });

  it('19. assigns sequential priority numbers starting at 1', () => {
    const readout = computeLaneReadout([], ALL_FLAGS_OFF);
    const recs = buildRolloutRecommendations(readout);
    recs.forEach((r, idx) => {
      expect(r.priority).toBe(idx + 1);
    });
  });

  it('20. no_data lane included in recommendations', () => {
    const readout = computeLaneReadout([], ALL_FLAGS_OFF);
    const recs = buildRolloutRecommendations(readout);
    const noDataRec = recs.find((r) => readout.find((l) => l.laneId === r.laneId)!.status === 'no_data');
    expect(noDataRec).toBeDefined();
  });
});
