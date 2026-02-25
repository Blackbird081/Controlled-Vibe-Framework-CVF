export interface LineageNode {
  id: string
  parentIds: string[]
  domain: string
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