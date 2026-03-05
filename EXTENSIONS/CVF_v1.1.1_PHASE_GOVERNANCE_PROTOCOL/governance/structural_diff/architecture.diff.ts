export interface ArchitectureSnapshot {
  nodes: Set<string>
  edges: Map<string, Set<string>>
}

export interface ArchitectureDiff {
  missingNodes: string[]
  extraNodes: string[]
  missingEdges: string[]
  extraEdges: string[]
}

export function diffArchitecture(
  expected: ArchitectureSnapshot,
  actual: ArchitectureSnapshot
): ArchitectureDiff {

  const missingNodes: string[] = []
  const extraNodes: string[] = []
  const missingEdges: string[] = []
  const extraEdges: string[] = []

  for (const n of expected.nodes) {
    if (!actual.nodes.has(n)) missingNodes.push(n)
  }

  for (const n of actual.nodes) {
    if (!expected.nodes.has(n)) extraNodes.push(n)
  }

  for (const [from, targets] of expected.edges) {

    const actualTargets = actual.edges.get(from) || new Set()

    for (const to of targets) {

      if (!actualTargets.has(to)) {
        missingEdges.push(`${from}->${to}`)
      }

    }

  }

  for (const [from, targets] of actual.edges) {

    const expectedTargets = expected.edges.get(from) || new Set()

    for (const to of targets) {

      if (!expectedTargets.has(to)) {
        extraEdges.push(`${from}->${to}`)
      }

    }

  }

  return {
    missingNodes,
    extraNodes,
    missingEdges,
    extraEdges
  }

}