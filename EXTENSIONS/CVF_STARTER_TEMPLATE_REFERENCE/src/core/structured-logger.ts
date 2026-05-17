// src/core/structured-logger.ts

export interface LogPayload {
  level: "INFO" | "WARN" | "ERROR";
  message: string;
  contextId?: string;
  projectId?: string;
  metadata?: Record<string, unknown>;
}

export class StructuredLogger {
  log(payload: LogPayload) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      ...payload
    };

    console.log(JSON.stringify(logEntry));
  }
}
