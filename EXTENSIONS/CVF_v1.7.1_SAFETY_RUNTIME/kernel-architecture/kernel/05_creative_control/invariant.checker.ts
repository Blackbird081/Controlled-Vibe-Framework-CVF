import { LineageStore } from "./lineage.store"

export class InvariantChecker {
  constructor(private store: LineageStore) {}

  validateNoCrossDomainReuse() {
    const nodes = this.store.getAll()

    nodes.forEach((node) => {
      node.parentIds.forEach((parentId) => {
        const parent = nodes.find((n) => n.id === parentId)
        if (parent && parent.domain !== node.domain) {
          throw new Error(
            `Cross-domain reuse detected: ${parent.domain} -> ${node.domain}`
          )
        }
      })
    })
  }
}
