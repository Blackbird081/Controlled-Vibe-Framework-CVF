export interface LineageGraphNode {
  id: string
  domain: string
  risk: string
  timestamp: number
}

export interface LineageGraphEdge {
  from: string
  to: string
}

export class LineageGraph {
  private nodes: LineageGraphNode[] = []
  private edges: LineageGraphEdge[] = []

  addNode(node: LineageGraphNode): void {
    this.nodes.push(node)
  }

  addEdge(from: string, to: string): void {
    this.edges.push({ from, to })
  }

  getSnapshot(): { nodes: LineageGraphNode[]; edges: LineageGraphEdge[] } {
    return {
      nodes: [...this.nodes],
      edges: [...this.edges]
    }
  }
}

