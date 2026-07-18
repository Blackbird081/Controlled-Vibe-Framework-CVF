import type { Clock, IdFactory } from "../deps.js";
import type { SourceEnvelope, SourceScope } from "../types/source-envelope.js";
import type { RuleManifestRef, RefineryPacket } from "../types/refinery-packet.js";
import type { RefineryStage } from "./stage.js";
/**
 * The complete required stage chain. Callers cannot obtain
 * READY_FOR_KERNEL by omitting stages: RefineryEngine.run always executes
 * exactly this ordered chain and ignores any caller-supplied stage list.
 * There is deliberately no public API to substitute or skip a stage.
 */
export declare const REQUIRED_STAGE_CHAIN: readonly RefineryStage[];
export interface RefineryRunInput {
    sourceEnvelopes: SourceEnvelope[];
    rawRecords: Array<Record<string, unknown>>;
    ruleManifest: RuleManifestRef;
    declaredScope?: SourceScope;
    declaredOwner?: string;
}
export interface RefineryRunResult {
    packet: RefineryPacket;
    completedStages: string[];
}
export declare class RefineryEngine {
    private readonly clock;
    private readonly ids;
    constructor(clock: Clock, ids: IdFactory);
    run(input: RefineryRunInput): RefineryRunResult;
}
