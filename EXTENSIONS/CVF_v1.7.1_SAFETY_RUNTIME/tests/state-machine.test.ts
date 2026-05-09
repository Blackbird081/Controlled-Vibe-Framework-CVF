import { describe, it, expect } from "vitest"
import { nextState, type ApprovalState } from "../policy/approval.state-machine"

describe("nextState", () => {
  it("should transition proposed → validated (ignoring decision)", () => {
    expect(nextState("proposed", "approved")).toBe("validated")
    expect(nextState("proposed", "rejected")).toBe("validated")
    expect(nextState("proposed", "pending")).toBe("validated")
  })

  it("should transition validated → approved when decision is approved", () => {
    expect(nextState("validated", "approved")).toBe("approved")
  })

  it("should transition validated → rejected when decision is rejected", () => {
    expect(nextState("validated", "rejected")).toBe("rejected")
  })

  it("should transition validated → pending when decision is pending", () => {
    expect(nextState("validated", "pending")).toBe("pending")
  })

  it("should transition approved → executed (ignoring decision)", () => {
    expect(nextState("approved", "approved")).toBe("executed")
    expect(nextState("approved", "rejected")).toBe("executed")
  })

  it("should not transition from terminal states", () => {
    const terminalStates: ApprovalState[] = ["rejected", "executed", "pending"]
    for (const state of terminalStates) {
      expect(nextState(state, "approved")).toBe(state)
    }
  })

  it("should handle full lifecycle: proposed → validated → approved → executed", () => {
    let state: ApprovalState = "proposed"
    state = nextState(state, "pending") // → validated
    expect(state).toBe("validated")
    state = nextState(state, "approved") // → approved
    expect(state).toBe("approved")
    state = nextState(state, "approved") // → executed
    expect(state).toBe("executed")
  })

  it("should handle rejection lifecycle: proposed → validated → rejected", () => {
    let state: ApprovalState = "proposed"
    state = nextState(state, "pending") // → validated
    expect(state).toBe("validated")
    state = nextState(state, "rejected") // → rejected
    expect(state).toBe("rejected")
  })
})
