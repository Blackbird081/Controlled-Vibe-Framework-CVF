import { DevArtifact } from "./artifact.types"

export interface PRCreationResult {
  prId: string
  prUrl: string
  branchName: string
}

export interface PRClient {
  createPullRequest(params: {
    branchName: string
    title: string
    description: string
    files: {
      filePath: string
      content: string
    }[]
  }): Promise<PRCreationResult>
}

let prClient: PRClient | null = null

export function registerPRClient(client: PRClient) {
  prClient = client
}

export async function createPRFromArtifact(
  artifact: DevArtifact
): Promise<PRCreationResult> {
  if (!prClient) {
    throw new Error("PR client not registered")
  }

  const branchName = buildBranchName(artifact)

  const result = await prClient.createPullRequest({
    branchName,
    title: buildPRTitle(artifact),
    description: buildPRDescription(artifact),
    files: artifact.fileChanges.map((f) => ({
      filePath: f.filePath,
      content: f.content,
    })),
  })

  return result
}

function buildBranchName(artifact: DevArtifact): string {
  return `cvf/${artifact.proposalId}`
}

function buildPRTitle(artifact: DevArtifact): string {
  return `CVF Proposal ${artifact.proposalId} - ${artifact.artifactType}`
}

function buildPRDescription(artifact: DevArtifact): string {
  return `
This PR was generated under CVF governance.

Proposal ID: ${artifact.proposalId}
Artifact Type: ${artifact.artifactType}
Created By: ${artifact.createdBy}
Created At: ${new Date(artifact.createdAt).toISOString()}
Checksum: ${artifact.checksum}

Total Files: ${artifact.fileChanges.length}
Tokens Used: ${artifact.metrics.tokensUsed}

This PR requires review and approval before merge.
`
}
