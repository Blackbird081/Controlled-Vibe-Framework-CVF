/**
 * Prisma-based Snapshot Repository
 */

import { PrismaClient } from "@prisma/client"
import type { ISnapshotRepository } from "./interfaces"
import type { ProposalSnapshot } from "../types/index"

export class PrismaSnapshotRepository implements ISnapshotRepository {
  constructor(private prisma: PrismaClient) {}

  async save(snapshot: ProposalSnapshot): Promise<void> {
    await this.prisma.simulationSnapshot.create({
      data: {
        proposalId: snapshot.proposalId,
        proposal: JSON.stringify(snapshot.proposal),
        policyVersion: snapshot.policyVersion,
        decision: snapshot.decision,
        timestamp: new Date(snapshot.timestamp),
      },
    })
  }

  async getByProposalId(proposalId: string): Promise<ProposalSnapshot | null> {
    const row = await this.prisma.simulationSnapshot.findFirst({
      where: { proposalId },
      orderBy: { timestamp: "desc" },
    })

    if (!row) return null

    return {
      proposalId: row.proposalId,
      proposal: JSON.parse(row.proposal),
      policyVersion: row.policyVersion,
      decision: row.decision,
      timestamp: row.timestamp.getTime(),
    }
  }

  async list(): Promise<ProposalSnapshot[]> {
    const rows = await this.prisma.simulationSnapshot.findMany({
      orderBy: { timestamp: "desc" },
    })

    return rows.map((row) => ({
      proposalId: row.proposalId,
      proposal: JSON.parse(row.proposal),
      policyVersion: row.policyVersion,
      decision: row.decision,
      timestamp: row.timestamp.getTime(),
    }))
  }
}
