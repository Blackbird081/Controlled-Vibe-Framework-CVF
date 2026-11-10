import { describe, expect, it } from "vitest";
import { QuotaLedger } from "../src/quota-ledger";

describe("QuotaLedger", () => {
  it("allows usage when no limit is configured", () => {
    const ledger = new QuotaLedger(() => new Date("2026-05-16T00:00:00Z"));

    expect(
      ledger.canUse({ providerId: "dashscope", modelId: "qwen-flash", estimatedTokens: 100 }),
    ).toMatchObject({ allowed: true, reason: "no_limit_configured" });
  });

  it("tracks requests, estimated tokens, and actual tokens separately", () => {
    const ledger = new QuotaLedger(() => new Date("2026-05-16T00:00:00Z"));
    ledger.setLimit("dashscope", "qwen-flash", {
      requestsPerDay: 2,
      estimatedTokensPerDay: 200,
      actualTokensPerDay: 150,
    });

    ledger.recordUse({ providerId: "dashscope", modelId: "qwen-flash", estimatedTokens: 80, actualTokens: 70 });

    expect(
      ledger.canUse({ providerId: "dashscope", modelId: "qwen-flash", estimatedTokens: 90, actualTokens: 80 }),
    ).toMatchObject({ allowed: true, reason: "within_quota" });
    expect(
      ledger.canUse({ providerId: "dashscope", modelId: "qwen-flash", estimatedTokens: 130 }),
    ).toMatchObject({ allowed: false, reason: "estimated_tokens_per_day_exceeded" });
    expect(
      ledger.canUse({ providerId: "dashscope", modelId: "qwen-flash", actualTokens: 90 }),
    ).toMatchObject({ allowed: false, reason: "actual_tokens_per_day_exceeded" });
  });
});


import { reserveActionQuota, transitionActionQuota, validateActionQuota } from '../src/quota-ledger';
describe('opted-in action money snapshots',()=>{
  const reserve=()=>reserveActionQuota({scopeId:'scope',reservationId:'run',currency:'USD',totalMicrounits:30,stageAllocations:{wide:10,narrow:20}});
  it('reserves once, settles each distinct stage key idempotently and leaves prior immutable',()=>{
    const initial=reserve();const started=transitionActionQuota(initial,'wide','start');
    const settled=transitionActionQuota(started,'wide','settle',7);
    expect(transitionActionQuota(settled,'wide','settle',7)).toEqual(settled);
    expect(()=>transitionActionQuota(settled,'wide','settle',8)).toThrow('ACTION_SETTLEMENT_CONFLICT');
    expect(initial.stages.wide.state).toBe('RESERVED');
    expect(transitionActionQuota(settled,'narrow','release').stages.narrow.cost).toBe(0);
  });
  it('retains nonzero unknown spend, forbids replay and possible-spend refunds',()=>{
    const unknown=transitionActionQuota(transitionActionQuota(reserve(),'wide','start'),'wide','unknown');
    expect(unknown.stages.wide).toEqual({allocation:10,state:'UNKNOWN',cost:null});
    expect(()=>transitionActionQuota(unknown,'wide','release')).toThrow('ACTION_POSSIBLE_SPEND');
    expect(()=>transitionActionQuota(unknown,'wide','start')).toThrow('ACTION_STAGE_REPLAY');
    expect(transitionActionQuota(unknown,'wide','settle',5).stages.wide.cost).toBe(5);
  });
  it('requires explicit valid currency/safe integer money and stage capacity',()=>{
    expect(()=>reserveActionQuota({scopeId:'s',reservationId:'r',currency:'USD',totalMicrounits:0,stageAllocations:{wide:0}})).toThrow();
    expect(()=>validateActionQuota({...reserve(),totalMicrounits:29})).toThrow();
    expect(()=>transitionActionQuota(transitionActionQuota(reserve(),'wide','start'),'wide','settle',11)).toThrow();
    expect(()=>transitionActionQuota(reserve(),'third','start')).toThrow();
  });
});
