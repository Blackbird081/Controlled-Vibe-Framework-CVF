/**
 * Prisma-based Proposal Repository — implements IProposalRepository
 */

import { PrismaClient } from "@prisma/client"
import type { IProposalRepository } from "./interfaces"
import type { StoredProposal, ApprovalState, PolicyDecision } from "../types/index"

export class PrismaProposalRepository implements IProposalRepository {
  constructor(private prisma: PrismaClient) {}

  async save(proposal: StoredProposal): Promise<void> {
    await this.prisma.proposal.create({
      data: {
        id: proposal.id,
        source: "api",
        action: "submit",
        payload: JSON.stringify(proposal.payload),
        policyVersion: proposal.policyVersion,
        policyHash: proposal.policyHash,
        createdAt: new Date(proposal.createdAt),
      },
    })
  }

  async getById(id: string): Promise<StoredProposal | null> {
    const row = await this.prisma.proposal.findUnique({ where: { id } })
    if (!row) return null

    return {
      id: row.id,
      payload: JSON.parse(row.payload),
      policyVersion: row.policyVersion,
      policyHash: row.policyHash,
      createdAt: row.createdAt.getTime(),
    }
  }

  async list(options?: {
    state?: ApprovalState
    limit?: number
    offset?: number
  }): Promise<StoredProposal[]> {
    const rows = await this.prisma.proposal.findMany({
      where: options?.state ? { state: options.state } : undefined,
      take: options?.limit ?? 50,
      skip: options?.offset ?? 0,
      orderBy: { createdAt: "desc" },
    })

    return rows.map((row) => ({
      id: row.id,
      payload: JSON.parse(row.payload),
      policyVersion: row.policyVersion,
      policyHash: row.policyHash,
      createdAt: row.createdAt.getTime(),
    }))
  }

  async updateState(id: string, state: ApprovalState): Promise<void> {
    await this.prisma.proposal.update({
      where: { id },
      data: { state },
    })
  }

  async updateDecision(id: string, decision: PolicyDecision): Promise<void> {
    await this.prisma.proposal.update({
      where: { id },
      data: { decision },
    })
  }
}
