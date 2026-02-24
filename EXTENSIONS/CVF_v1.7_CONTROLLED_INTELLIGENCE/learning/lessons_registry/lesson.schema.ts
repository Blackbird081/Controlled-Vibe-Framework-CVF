// lesson.schema.ts
// Schema đầy đủ theo MODULE SPECIFICATIONS.md

export type LessonCategory = "REASONING" | "RISK" | "ROLE" | "POLICY"
export type LessonSeverity = "low" | "medium" | "high"

export interface Lesson {
  id: string
  version: string
  category: LessonCategory

  // Core fields (from original)
  description: string
  createdAt: number
  active: boolean

  // Added per MODULE SPECIFICATIONS — previously missing
  severity: LessonSeverity
  rootCause: string
  preventionRule: string
  riskLevel: string
}