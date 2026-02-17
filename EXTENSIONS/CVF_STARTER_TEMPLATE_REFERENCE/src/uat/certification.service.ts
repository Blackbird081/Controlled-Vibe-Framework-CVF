// src/uat/certification.service.ts

export interface CertificationReport {
  version: string;
  timestamp: string;
  scenariosPassed: number;
  scenariosFailed: number;
}

export class CertificationService {
  generate(results: any[], version: string): CertificationReport {
    const passed = results.filter(r => r.status === "PASSED").length;
    const failed = results.filter(r => r.status === "FAILED").length;

    return {
      version,
      timestamp: new Date().toISOString(),
      scenariosPassed: passed,
      scenariosFailed: failed
    };
  }
}
