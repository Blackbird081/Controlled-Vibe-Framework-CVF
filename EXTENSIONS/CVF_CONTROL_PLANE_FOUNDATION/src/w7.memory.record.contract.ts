import { computeDeterministicHash } from "../../CVF_v1.9_DETERMINISTIC_REPRODUCIBILITY/core/deterministic.hash";
import type { W7PalaceVocabulary } from "./w7.normalized.asset.candidate.contract";

// --- Types ---

/**
 * W73-T1 — W7MemoryRecordContract (Lifecycle Step 6 — Memory Palace Placement)
 * Places a governed asset into the memory palace hierarchy.
 * Authorization: CVF_GC018_W73_T1_W7_MEMORY_RECORD_CONTRACT_AUTHORIZATION_2026-04-14.md
 */
export interface W7MemoryRecord {
  stage: "w7_memory_record";
  memoryRecordId: string;   // time-variant: hash(memoryRecordHash + recordedAt)
  memoryRecordHash: string; // content-bound: hash(sourceRef + candidateId + name + domain + content + palace)
  recordedAt: string;
  sourceRef: string;
  candidateId: string;
  name: string;
  domain: string;
  content: string;
  // palace vocabulary (all optional)
  wing?: string;
  hall?: string;
  room?: string;
  drawer?: string;
  closet_summary?: string;
  tunnel_links?: string[];
  contradiction_flag?: boolean;
}

export interface W7MemoryRecordRequest {
  sourceRef: string;
  candidateId: string;
  name: string;
  domain: string;
  content: string;
  palaceVocabulary?: W7PalaceVocabulary;
}

export interface W7MemoryRecordContractDependencies {
  now?: () => string;
}

// --- Contract ---

export class W7MemoryRecordContract {
  private readonly now: () => string;

  constructor(dependencies: W7MemoryRecordContractDependencies = {}) {
    this.now = dependencies.now ?? (() => new Date().toISOString());
  }

  record(request: W7MemoryRecordRequest): W7MemoryRecord {
    const recordedAt = this.now();
    const pv = request.palaceVocabulary ?? {};
    const tunnelSig = (pv.tunnel_links ?? []).join(",");

    const memoryRecordHash = computeDeterministicHash(
      "w73-t1-memory-record",
      `${request.sourceRef}:${request.candidateId}`,
      `name:${request.name}`,
      `domain:${request.domain}`,
      `content:${request.content}`,
      `wing:${pv.wing ?? ""}`,
      `hall:${pv.hall ?? ""}`,
      `room:${pv.room ?? ""}`,
      `drawer:${pv.drawer ?? ""}`,
      `closet_summary:${pv.closet_summary ?? ""}`,
      `tunnel_links:[${tunnelSig}]`,
      `contradiction_flag:${pv.contradiction_flag ?? ""}`,
    );

    const memoryRecordId = computeDeterministicHash(
      "w73-t1-memory-record-id",
      memoryRecordHash,
      recordedAt,
    );

    const result: W7MemoryRecord = {
      stage: "w7_memory_record",
      memoryRecordId,
      memoryRecordHash,
      recordedAt,
      sourceRef: request.sourceRef,
      candidateId: request.candidateId,
      name: request.name,
      domain: request.domain,
      content: request.content,
    };

    if (pv.wing !== undefined) result.wing = pv.wing;
    if (pv.hall !== undefined) result.hall = pv.hall;
    if (pv.room !== undefined) result.room = pv.room;
    if (pv.drawer !== undefined) result.drawer = pv.drawer;
    if (pv.closet_summary !== undefined) result.closet_summary = pv.closet_summary;
    if (pv.tunnel_links !== undefined) result.tunnel_links = pv.tunnel_links;
    if (pv.contradiction_flag !== undefined) result.contradiction_flag = pv.contradiction_flag;

    return result;
  }
}

export function createW7MemoryRecordContract(
  dependencies?: W7MemoryRecordContractDependencies,
): W7MemoryRecordContract {
  return new W7MemoryRecordContract(dependencies);
}
