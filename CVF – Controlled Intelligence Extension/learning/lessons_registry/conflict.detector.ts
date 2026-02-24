import { Lesson } from "./lesson.schema"

export function detectConflict(
  newLesson: Lesson,
  existingLessons: Lesson[]
): string[] {

  const conflicts: string[] = []

  existingLessons.forEach(l => {
    if (
      l.category === newLesson.category &&
      l.description === newLesson.description &&
      l.version !== newLesson.version
    ) {
      conflicts.push(
        `Conflict with lesson ${l.id} version ${l.version}`
      )
    }
  })

  return conflicts
}