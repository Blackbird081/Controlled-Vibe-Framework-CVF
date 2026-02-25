import { describe, it, expect, beforeEach } from "vitest"
import { RateLimiter } from "../security/rate-limiter"

describe("RateLimiter", () => {
    let limiter: RateLimiter

    beforeEach(() => {
        limiter = new RateLimiter({
            windowMs: 1000,
            maxRequests: 3,
            blockDurationMs: 2000,
        })
    })

    it("should allow requests under the limit", () => {
        const result = limiter.check("user1")
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(2)
    })

    it("should track remaining requests", () => {
        limiter.check("user1")
        limiter.check("user1")
        const result = limiter.check("user1")
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(0)
    })

    it("should block after exceeding limit", () => {
        limiter.check("user1")
        limiter.check("user1")
        limiter.check("user1")
        const result = limiter.check("user1")
        expect(result.allowed).toBe(false)
        expect(result.retryAfterMs).toBeDefined()
    })

    it("should track different keys independently", () => {
        limiter.check("user1")
        limiter.check("user1")
        limiter.check("user1")
        limiter.check("user1") // blocked

        const result = limiter.check("user2")
        expect(result.allowed).toBe(true)
    })

    it("should reset a specific key", () => {
        limiter.check("user1")
        limiter.check("user1")
        limiter.check("user1")
        limiter.check("user1") // blocked

        limiter.reset("user1")
        const result = limiter.check("user1")
        expect(result.allowed).toBe(true)
    })
})
