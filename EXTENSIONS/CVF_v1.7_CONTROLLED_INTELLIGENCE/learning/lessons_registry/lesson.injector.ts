import { getActiveLessons } from "./lesson.store"

export function injectLessonsIntoContext(
  baseContext: string
): string {

  const lessons = getActiveLessons()

  const lessonText = lessons
    .map(l => [
      `Lesson [${l.version}] (${l.severity?.toUpperCase() ?? "?"}) — ${l.category}:`,
      `  Description: ${l.description}`,
      l.rootCause ? `  Root Cause: ${l.rootCause}` : null,
      l.preventionRule ? `  Prevention: ${l.preventionRule}` : null,
    ].filter(Boolean).join("\n"))
    .join("\n\n")

  return `${baseContext}\n\n--- ACTIVE LESSONS ---\n${lessonText}`
}