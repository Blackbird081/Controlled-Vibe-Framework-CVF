// lesson.signing.ts
// Lesson integrity — each lesson gets a deterministic signature hash.
// Signature = hash(id + version + category + description + rootCause + preventionRule)
// Detects tampering if signature doesn't match stored value.

import { Lesson } from "./lesson.schema"

/**
 * djb2 hash — same as reproducibility.snapshot.ts.
 * Deterministic, fast, no external deps.
 */
function hashString(input: string): string {
    let hash = 5381
    for (let i = 0; i < input.length; i++) {
        hash = ((hash << 5) + hash) ^ input.charCodeAt(i)
        hash = hash >>> 0
    }
    return hash.toString(16).padStart(8, "0")
}

/**
 * Generate a deterministic signature for a lesson.
 * Covers all content fields — changes to any field invalidate the signature.
 */
export function signLesson(lesson: Lesson): string {
    const payload = [
        lesson.id,
        lesson.version,
        lesson.category,
        lesson.description,
        lesson.rootCause ?? "",
        lesson.preventionRule ?? "",
        lesson.riskLevel?.toString() ?? "",
        lesson.severity ?? ""
    ].join("|")

    return hashString(payload)
}

/**
 * Verify a lesson's integrity against its stored signature.
 */
export function verifyLesson(lesson: Lesson, storedSignature: string): boolean {
    return signLesson(lesson) === storedSignature
}

/**
 * Sign a lesson and attach the signature as a property.
 * Returns a new object with `_signature` field.
 */
export function signAndAttach(lesson: Lesson): Lesson & { _signature: string } {
    return {
        ...lesson,
        _signature: signLesson(lesson)
    }
}

/**
 * Verify a signed lesson object.
 */
export function verifySignedLesson(lesson: Lesson & { _signature?: string }): {
    valid: boolean
    reason?: string
} {
    if (!lesson._signature) {
        return { valid: false, reason: "No signature found — unsigned lesson" }
    }
    const expected = signLesson(lesson)
    if (lesson._signature !== expected) {
        return { valid: false, reason: `Signature mismatch: expected ${expected}, got ${lesson._signature}` }
    }
    return { valid: true }
}
