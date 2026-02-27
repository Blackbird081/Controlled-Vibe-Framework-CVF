export interface CVFProposal {
  action: string
  payload: Record<string, any>
  source: "openclaw"
  timestamp: number
}
