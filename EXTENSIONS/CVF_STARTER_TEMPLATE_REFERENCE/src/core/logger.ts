// @reference-only — This module is not wired into the main execution pipeline.
// src/core/logger.ts

export type LogLevel = "INFO" | "WARN" | "ERROR";

export interface SimpleLogPayload {
  executionId?: string;
  message: string;
  metadata?: Record<string, unknown>;
}

export class Logger {
  static log(level: LogLevel, payload: SimpleLogPayload) {
    const logEntry = {
      level,
      timestamp: new Date().toISOString(),
      executionId: payload.executionId || null,
      message: payload.message,
      metadata: payload.metadata || {},
    };

    console.log(JSON.stringify(logEntry));
  }

  static info(payload: SimpleLogPayload) {
    this.log("INFO", payload);
  }

  static warn(payload: SimpleLogPayload) {
    this.log("WARN", payload);
  }

  static error(payload: SimpleLogPayload) {
    this.log("ERROR", payload);
  }
}
