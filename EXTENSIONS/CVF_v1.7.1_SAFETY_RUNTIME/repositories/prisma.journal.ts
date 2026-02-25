/**
 * Prisma-based Execution Journal Repository
 */

import { PrismaClient } from "@prisma/client"
import type { IExecutionJournalRepository } from "./interfaces"
import type { ExecutionRecord } from "../types/index"

export class PrismaExecutionJournalRepository implements IExecutionJournalRepository {

    constructor(private prisma: PrismaClient) { }

    async record(entry: ExecutionRecord): Promise<void> {
        await this.prisma.executionJournal.create({
            data: {
                proposalId: entry.proposalId,
                policyVersion: entry.policyVersion,
                policyHash: entry.policyHash,
                decision: entry.decision,
                timestamp: new Date(entry.timestamp),
            },
        })
    }

    async getByProposalId(proposalId: string): Promise<ExecutionRecord[]> {
        const rows = await this.prisma.executionJournal.findMany({
            where: { proposalId },
            orderBy: { timestamp: "desc" },
        })

        return rows.map((row) => ({
            proposalId: row.proposalId,
            policyVersion: row.policyVersion,
            policyHash: row.policyHash,
            decision: row.decision as ExecutionRecord["decision"],
            timestamp: row.timestamp.getTime(),
        }))
    }

    async list(options?: {
        limit?: number
        offset?: number
    }): Promise<ExecutionRecord[]> {
        const rows = await this.prisma.executionJournal.findMany({
            take: options?.limit ?? 50,
            skip: options?.offset ?? 0,
            orderBy: { timestamp: "desc" },
        })

        return rows.map((row) => ({
            proposalId: row.proposalId,
            policyVersion: row.policyVersion,
            policyHash: row.policyHash,
            decision: row.decision as ExecutionRecord["decision"],
            timestamp: row.timestamp.getTime(),
        }))
    }
}
