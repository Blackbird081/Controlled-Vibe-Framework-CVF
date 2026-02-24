/**
 * rollback.snapshot.ts
 *
 * Responsible for:
 * - Creating execution snapshots
 * - Storing metadata for recovery
 *
 * Does NOT:
 * - Perform automatic rollback
 * - Modify files
 * - Decide execution outcome
 */

import { prisma } from "@/lib/db";

export interface SnapshotCreateInput {
  executionId: string;
  projectId?: string;
  userId: string;
  filesChanged: string[];
  commitHash?: string;
  metadata?: Record<string, any>;
}

export interface SnapshotRecord {
  id: string;
  executionId: string;
  createdAt: Date;
}

/**
 * Create rollback snapshot record
 */
export async function createRollbackSnapshot(
  input: SnapshotCreateInput
): Promise<SnapshotRecord> {
  const snapshot = await prisma.rollbackSnapshot.create({
    data: {
      executionId: input.executionId,
      projectId: input.projectId,
      userId: input.userId,
      filesChanged: JSON.stringify(input.filesChanged),
      commitHash: input.commitHash || null,
      metadata: input.metadata
        ? JSON.stringify(input.metadata)
        : null,
    },
  });

  return {
    id: snapshot.id,
    executionId: snapshot.executionId,
    createdAt: snapshot.createdAt,
  };
}