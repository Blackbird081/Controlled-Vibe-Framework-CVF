import { LineageNode } from "./lineage.types"

export class LineageStore {
  private nodes: LineageNode[] = []

  add(node: LineageNode) {
    this.nodes.push(node)
  }

  getAll(): LineageNode[] {
    return this.nodes
  }
}
