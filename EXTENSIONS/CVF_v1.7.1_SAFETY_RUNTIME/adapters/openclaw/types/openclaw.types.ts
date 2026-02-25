export interface OpenClawMessage {
  userId: string
  message: string
  metadata?: Record<string, any>
}