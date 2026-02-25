
export interface AISettings {
  provider: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AuditEntry {
  timestamp: number;
  model?: string;
  totalTokens?: number;
}