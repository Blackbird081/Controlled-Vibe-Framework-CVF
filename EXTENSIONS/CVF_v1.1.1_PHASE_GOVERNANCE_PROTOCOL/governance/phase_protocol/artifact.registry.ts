/**
 * Artifact Registry — v1.1.2 Hardening
 *
 * Tracks artifacts generated during a development phase.
 * Ensures required artifacts are registered before phase gate.
 *
 * v1.1.2 changes (De_xuat_06 — Trust Boundary + Hash Ledger):
 *   - ArtifactRecord now stores contentHash (SHA-256 hex string).
 *   - registerArtifact() accepts optional hash parameter.
 *   - verifyAllHashes(): returns false if any artifact has no hash (Trust Boundary).
 *   - Hash Ledger: getHashLedger() returns a stable snapshot for audit.
 *   - detectTampering(): compares current hash vs registered hash.
 */

import * as crypto from "crypto";

export interface ArtifactRecord {
  type: string;
  path: string;
  timestamp: number;
  /** SHA-256 hex digest of artifact content at registration time. */
  contentHash?: string;
}

export interface ArtifactHashEntry {
  type: string;
  path: string;
  contentHash: string;
  timestamp: number;
}

export class ArtifactRegistry {
  private componentName: string;
  private artifacts: ArtifactRecord[];

  constructor(componentName: string) {
    this.componentName = componentName;
    this.artifacts = [];
  }

  /**
   * Register an artifact.
   * @param type    Artifact type (e.g. "feature.spec")
   * @param path    Filesystem path of the artifact
   * @param content Optional raw content string — used to compute SHA-256 hash.
   *                If omitted, artifact is registered WITHOUT a hash (unverified).
   */
  public registerArtifact(type: string, path: string, content?: string): void {
    const contentHash = content
      ? crypto.createHash("sha256").update(content, "utf8").digest("hex")
      : undefined;

    const record: ArtifactRecord = {
      type,
      path,
      timestamp: Date.now(),
      contentHash,
    };

    this.artifacts.push(record);
  }

  public getArtifacts(): ArtifactRecord[] {
    return this.artifacts;
  }

  public findArtifact(type: string): ArtifactRecord | undefined {
    return this.artifacts.find((a) => a.type === type);
  }

  public hasArtifact(type: string): boolean {
    return this.artifacts.some((a) => a.type === type);
  }

  public clear(): void {
    this.artifacts = [];
  }

  // ─── Trust Boundary (De_xuat_06) ────────────────────────────────────────

  /**
   * verifyAllHashes()
   *
   * Returns true only if EVERY registered artifact has a contentHash.
   * An artifact without a hash is considered unverified — Trust Boundary rejects it.
   * Called by GateRules.validateArtifacts() as "artifact_hashes_verified".
   */
  public verifyAllHashes(): boolean {
    if (this.artifacts.length === 0) return false;
    return this.artifacts.every((a) => typeof a.contentHash === "string" && a.contentHash.length > 0);
  }

  // ─── Hash Ledger (De_xuat_06) ────────────────────────────────────────────

  /**
   * getHashLedger()
   *
   * Returns the stable hash ledger snapshot — all artifacts that have a hash.
   * Used by GovernanceAuditLog to persist a tamper-evident record.
   */
  public getHashLedger(): ArtifactHashEntry[] {
    return this.artifacts
      .filter((a): a is ArtifactRecord & { contentHash: string } =>
        typeof a.contentHash === "string" && a.contentHash.length > 0
      )
      .map((a) => ({
        type: a.type,
        path: a.path,
        contentHash: a.contentHash,
        timestamp: a.timestamp,
      }));
  }

  /**
   * detectTampering()
   *
   * Re-hashes the given content and compares against the registered hash.
   * Returns true if content matches the registered hash (no tampering).
   * Returns false (tampered) if hashes differ or artifact not found.
   */
  public detectTampering(type: string, currentContent: string): boolean {
    const record = this.findArtifact(type);
    if (!record || !record.contentHash) return false;

    const currentHash = crypto
      .createHash("sha256")
      .update(currentContent, "utf8")
      .digest("hex");

    return record.contentHash === currentHash;
  }
}