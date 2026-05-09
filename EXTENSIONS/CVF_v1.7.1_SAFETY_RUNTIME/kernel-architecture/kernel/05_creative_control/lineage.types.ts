export interface LineageNode {
  id: string
  type: "input" | "process" | "output"
  domain: string
  parentIds: string[]
  timestamp: number
}
