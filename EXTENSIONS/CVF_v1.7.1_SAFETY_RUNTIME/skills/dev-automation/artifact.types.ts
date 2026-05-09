export type ArtifactType = "CODE" | "INFRA" | "CONFIG" | "POLICY"

export interface FileChange {
  filePath: string
  content: string
  diffSize: number
  isNewFile: boolean
  isDeleted: boolean
  touchesDependencyFile: boolean
  touchesMigrationFile: boolean
  touchesPolicyFile: boolean
  touchesCoreFile: boolean
}

export interface GenerationMetrics {
  tokensUsed: number
  generationTimeMs: number
  modelUsed: string
  filesGenerated: number
}

export interface DevArtifact {
  proposalId: string
  artifactType: ArtifactType
  createdBy: string // userId or system
  createdAt: number // epoch timestamp
  checksum: string
  fileChanges: FileChange[]
  metrics: GenerationMetrics
}

export interface DevAutomationContext {
  userId: string
  organizationId: string
  requestId: string
}

export interface DevAutomationInput {
  context: DevAutomationContext
  instruction: string
  artifactType: ArtifactType
}

export interface DevAutomationOutput {
  artifact: DevArtifact
}
