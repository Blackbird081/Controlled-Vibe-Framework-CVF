// @reference-only — This module is not wired into the main execution pipeline.
// src/config/app.config.ts

export interface AppConfig {
  port: number;
  environment: "development" | "production" | "test";
  projectName: string;
}

export const appConfig: AppConfig = {
  port: Number(process.env.PORT) || 3000,
  environment:
    (process.env.NODE_ENV as "development" | "production" | "test") ||
    "development",
  projectName: process.env.PROJECT_NAME || "cvf-starter-template",
};
