export interface BoundaryState {
  domain: string
  contractValid: boolean
  refusalTriggered: boolean
  timestamp: number
}

export class BoundarySnapshot {

  private states: BoundaryState[] = []

  capture(state: BoundaryState) {
    this.states.push(state)
  }

  getAll() {
    return this.states
  }
}