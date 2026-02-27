"use client"

import { useState } from "react"
import { Proposal } from "../types/proposal.types"
import { createProposal, executeProposal } from "../services/proposal.service"

export function useProposal() {
  const [proposal, setProposal] = useState<Proposal | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit(instruction: string) {
    setLoading(true)
    const result = await createProposal(instruction)
    setProposal(result)
    setLoading(false)
  }

  async function execute() {
    if (!proposal) return
    setLoading(true)
    await executeProposal(proposal.id)
    setProposal({
      ...proposal,
      status: "EXECUTED",
    })
    setLoading(false)
  }

  return {
    proposal,
    loading,
    submit,
    execute,
  }
}
