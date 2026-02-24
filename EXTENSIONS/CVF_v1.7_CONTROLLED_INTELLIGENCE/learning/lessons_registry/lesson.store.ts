// lesson.store.ts
// Persisted lesson store — reads/writes to cvf_lessons.json.
// In-memory when fs unavailable.

// Node.js type declarations (no @types/node dependency needed)
declare const require: (module: string) => any
declare const process: { cwd: () => string; env: Record<string, string | undefined> }

let fs: any
let path: any
try {
  fs = require("fs")
  path = require("path")
} catch {
  fs = null
  path = null
}

import { Lesson } from "./lesson.schema"

function getStorePath(): string {
  if (!path) return ""
  return process.env.CVF_LESSONS_PATH
    ?? path.join(process.cwd(), "cvf_lessons.json")
}

function loadFromDisk(): Lesson[] {
  if (!fs) return []
  try {
    const storePath = getStorePath()
    if (fs.existsSync(storePath)) {
      const raw = fs.readFileSync(storePath, "utf-8")
      return JSON.parse(raw) as Lesson[]
    }
  } catch {
    // Fallback to empty store
  }
  return []
}

function saveToDisk(lessons: Lesson[]): void {
  if (!fs) return
  try {
    fs.writeFileSync(getStorePath(), JSON.stringify(lessons, null, 2), "utf-8")
  } catch {
    // Silently continue — in-memory still works
  }
}

// Initialize from disk
const lessons: Lesson[] = loadFromDisk()

export function registerLesson(lesson: Lesson): void {
  lessons.push(lesson)
  saveToDisk(lessons)
}

export function getActiveLessons(): Lesson[] {
  return lessons.filter(l => l.active)
}

export function deactivateLesson(id: string): void {
  const lesson = lessons.find(l => l.id === id)
  if (lesson) {
    lesson.active = false
    saveToDisk(lessons)
  }
}

export function getLessonStorePath(): string {
  return getStorePath()
}