export interface LineageNode {
  id: string
  parentIds: string[]
  domain: string
  requestId: string
  policyVersion: string
  decisionCode: string
  traceHash: string
  timestamp: number
}

export class LineageTracker {
  private nodes: LineageNode[] = []

  record(node: LineageNode) {
    this.nodes.push(node)
  }

  getAll() {
    return this.nodes
  }
}
