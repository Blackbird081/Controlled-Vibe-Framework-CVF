import { Lesson } from "./lesson.schema"

const lessons: Lesson[] = []

export function registerLesson(lesson: Lesson): void {
  lessons.push(lesson)
}

export function getActiveLessons(): Lesson[] {
  return lessons.filter(l => l.active)
}

export function deactivateLesson(id: string): void {
  const lesson = lessons.find(l => l.id === id)
  if (lesson) lesson.active = false
}