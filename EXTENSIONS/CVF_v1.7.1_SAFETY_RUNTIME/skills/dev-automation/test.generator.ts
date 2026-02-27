import crypto from "crypto"
import { DevArtifact, FileChange } from "./artifact.types"

export interface TestAIClient {
  generateTests(prompt: string): Promise<{
    files: {
      filePath: string
      content: string
    }[]
    tokensUsed: number
    modelUsed: string
  }>
}

let testClient: TestAIClient | null = null

export function registerTestClient(client: TestAIClient) {
  testClient = client
}

export async function generateTestsForArtifact(
  artifact: DevArtifact
): Promise<DevArtifact> {
  if (!testClient) {
    throw new Error("Test AI client not registered")
  }

  const startTime = Date.now()

  const prompt = buildTestPrompt(artifact)

  const result = await testClient.generateTests(prompt)

  const endTime = Date.now()

  const testFileChanges: FileChange[] = result.files.map((file) => ({
    filePath: file.filePath,
    content: file.content,
    diffSize: estimateDiffSize(file.content),
    isNewFile: true,
    isDeleted: false,
    touchesDependencyFile: false,
    touchesMigrationFile: false,
    touchesPolicyFile: false,
    touchesCoreFile: false,
  }))

  const mergedFileChanges = [...artifact.fileChanges, ...testFileChanges]

  const updatedChecksum = computeChecksum(artifact.proposalId, mergedFileChanges)

  return {
    ...artifact,
    fileChanges: mergedFileChanges,
    checksum: updatedChecksum,
    metrics: {
      tokensUsed: artifact.metrics.tokensUsed + result.tokensUsed,
      generationTimeMs: artifact.metrics.generationTimeMs + (endTime - startTime),
      modelUsed: artifact.metrics.modelUsed + " + " + result.modelUsed,
      filesGenerated: mergedFileChanges.length,
    },
  }
}

function buildTestPrompt(artifact: DevArtifact): string {
  return `
Generate comprehensive unit tests for the following files.

Constraints:
- Do not modify production code
- Only create test files
- Enterprise-level coverage

Files:
${artifact.fileChanges.map((f) => f.filePath).join("\n")}
`
}

function computeChecksum(proposalId: string, files: FileChange[]): string {
  const hash = crypto.createHash("sha256")

  hash.update(proposalId)

  for (const file of files) {
    hash.update(file.filePath)
    hash.update(file.content)
  }

  return hash.digest("hex")
}

function estimateDiffSize(content: string): number {
  return content.split("\n").length
}
