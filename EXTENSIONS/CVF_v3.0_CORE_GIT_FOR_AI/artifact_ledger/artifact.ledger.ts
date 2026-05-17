/**
 * Artifact Ledger (CVF v3.0 — Layer 0)
 *
 * Append-only ledger of ACCEPTED artifacts — equivalent to Git's object store.
 * Once an artifact is committed to the ledger, it is immutable.
 *
 * Mapping to Git:
 *   Git object store (blob) → ArtifactLedger
 *   git log --all           → getLedgerHistory()
 *   git show <hash>         → getByHash()
 *
 * Design (De_xuat_08 — Artifact Ledger):
 *   - ACCEPTED artifacts from ArtifactStagingArea are committed here.
 *   - Each entry is content-addressed by contentHash.
 *   - Full lineage: every version of an artifact is tracked.
 *   - Tamper-evident: ledger entries cannot be modified after writing.
 */

import { StagedArtifact } from "../artifact_staging/artifact.staging.js";

export interface LedgerEntry {
    /** Stable artifact identity (from staging) */
    artifact_id: string;
    /** Artifact type */
    type: string;
    /** Path at time of commit */
    path: string;
    /** SHA-256 of content — content address */
    contentHash: string;
    /** The AICommit that included this artifact */
    commit_id: string;
    /** Sequential version number for this artifact_id (1, 2, 3, ...) */
    version: number;
    /** ISO 8601 timestamp of ledger write */
    committed_at: string;
    /** Previous version's contentHash — enables diff and rollback */
    previous_hash: string | null;
}

// ─── ArtifactLedger ───────────────────────────────────────────────────────────

export class ArtifactLedger {
    /** Append-only log — never delete, never modify */
    private entries: LedgerEntry[] = [];

    /** Content-address index: contentHash → entry */
    private byHash = new Map<string, LedgerEntry>();

    /** Artifact history: artifact_id → versions (sorted by version) */
    private byArtifactId = new Map<string, LedgerEntry[]>();

    /**
     * commit()
     *
     * Writes an ACCEPTED artifact from the staging area into the ledger.
     * Throws if the artifact is not in ACCEPTED status.
     * Throws if artifact with same contentHash already exists (idempotent guard).
     */
    public commit(artifact: StagedArtifact, commit_id: string): LedgerEntry {
        if (artifact.status !== "ACCEPTED") {
            throw new Error(
                `ArtifactLedger: only ACCEPTED artifacts can be committed — "${artifact.artifact_id}" is ${artifact.status}`
            );
        }

        // Idempotency: same content → same ledger entry (no duplicate)
        if (this.byHash.has(artifact.contentHash)) {
            const existing = this.byHash.get(artifact.contentHash)!;
            return existing;
        }

        const history = this.byArtifactId.get(artifact.artifact_id) ?? [];
        const previousEntry = history.length > 0 ? history[history.length - 1] : null;
        const version = history.length + 1;

        const entry: LedgerEntry = {
            artifact_id: artifact.artifact_id,
            type: artifact.type,
            path: artifact.path,
            contentHash: artifact.contentHash,
            commit_id,
            version,
            committed_at: new Date().toISOString(),
            previous_hash: previousEntry ? previousEntry.contentHash : null,
        };

        // Append-only writes
        this.entries.push(entry);
        this.byHash.set(entry.contentHash, entry);

        if (!this.byArtifactId.has(artifact.artifact_id)) {
            this.byArtifactId.set(artifact.artifact_id, []);
        }
        this.byArtifactId.get(artifact.artifact_id)!.push(entry);

        return entry;
    }

    /**
     * getByHash()
     * Content-addressed lookup — like Git's `git cat-file blob <hash>`.
     */
    public getByHash(contentHash: string): LedgerEntry | undefined {
        return this.byHash.get(contentHash);
    }

    /**
     * getLatest()
     * Returns the most recent ledger entry for an artifact_id.
     */
    public getLatest(artifact_id: string): LedgerEntry | undefined {
        const history = this.byArtifactId.get(artifact_id) ?? [];
        return history.length > 0 ? history[history.length - 1] : undefined;
    }

    /**
     * getHistory()
     * Returns all versions of an artifact in chronological order.
     * Like `git log -- <path>`.
     */
    public getHistory(artifact_id: string): LedgerEntry[] {
        return this.byArtifactId.get(artifact_id) ?? [];
    }

    /**
     * getLedgerHistory()
     * Returns the full append-only log — all ledger entries.
     * Like `git log --all --full-history`.
     */
    public getLedgerHistory(): LedgerEntry[] {
        return [...this.entries];
    }

    /**
     * getByCommit()
     * Returns all artifacts committed in a specific AICommit.
     */
    public getByCommit(commit_id: string): LedgerEntry[] {
        return this.entries.filter((e) => e.commit_id === commit_id);
    }

    /**
     * size()
     * Total number of ledger entries.
     */
    public size(): number {
        return this.entries.length;
    }
}
