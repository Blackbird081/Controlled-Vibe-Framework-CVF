import { describe, it, expect } from "vitest"
import { DomainGuard } from "../kernel/01_domain_lock/domain_guard"

describe("DomainGuard", () => {
  it("blocks missing domain declaration", () => {
    const guard = new DomainGuard()
    expect(() => guard.enforce({ type: "question" })).toThrow(
      "Missing domain declaration"
    )
  })

  it("blocks unknown domain", () => {
    const guard = new DomainGuard()
    expect(() => guard.enforce({ domain: "unknown", type: "question" })).toThrow(
      "Unknown domain"
    )
  })

  it("allows valid informational question input", () => {
    const guard = new DomainGuard()
    expect(() =>
      guard.enforce({ domain: "informational", type: "question" })
    ).not.toThrow()
  })

  it("blocks unsupported input type for declared domain", () => {
    const guard = new DomainGuard()
    expect(() => guard.enforce({ domain: "informational", type: "instruction" })).toThrow(
      "Input type 'instruction' not allowed"
    )
  })
})
