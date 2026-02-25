export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ArtifactChangeMeta {
  filePath: string;
  diffSize: number; // lines changed
  isNewFile: boolean;
  isDeleted: boolean;
  touchesDependencyFile: boolean;
  touchesMigrationFile: boolean;
  touchesPolicyFile: boolean;
  touchesCoreFile: boolean;
}

export interface RiskAssessmentInput {
  artifactType: "CODE" | "INFRA" | "CONFIG" | "POLICY";
  changes: ArtifactChangeMeta[];
}

export interface RiskAssessmentResult {
  level: RiskLevel;
  score: number;
  reasons: string[];
}

export class RiskEngine {
  static assess(input: RiskAssessmentInput): RiskAssessmentResult {
    let score = 0;
    const reasons: string[] = [];

    const totalFiles = input.changes.length;
    const totalDiff = input.changes.reduce(
      (sum, c) => sum + c.diffSize,
      0
    );

    // Base scoring by artifact type
    switch (input.artifactType) {
      case "CODE":
        score += 10;
        break;
      case "INFRA":
        score += 20;
        reasons.push("Infrastructure change detected");
        break;
      case "CONFIG":
        score += 15;
        break;
      case "POLICY":
        score += 50;
        reasons.push("Policy modification attempt");
        break;
    }

    // File count impact
    if (totalFiles > 20) {
      score += 25;
      reasons.push("Large file count change");
    } else if (totalFiles > 10) {
      score += 15;
    } else if (totalFiles > 5) {
      score += 10;
    }

    // Diff size impact
    if (totalDiff > 2000) {
      score += 30;
      reasons.push("Very large diff size");
    } else if (totalDiff > 1000) {
      score += 20;
    } else if (totalDiff > 500) {
      score += 10;
    }

    // Per file sensitivity
    for (const change of input.changes) {
      if (change.touchesDependencyFile) {
        score += 20;
        reasons.push(`Dependency file changed: ${change.filePath}`);
      }

      if (change.touchesMigrationFile) {
        score += 20;
        reasons.push(`Migration file changed: ${change.filePath}`);
      }

      if (change.touchesCoreFile) {
        score += 30;
        reasons.push(`Core file modified: ${change.filePath}`);
      }

      if (change.touchesPolicyFile) {
        score += 100;
        reasons.push(`Policy file modification: ${change.filePath}`);
      }
    }

    // Determine level
    let level: RiskLevel;

    if (score >= 120) {
      level = "CRITICAL";
    } else if (score >= 70) {
      level = "HIGH";
    } else if (score >= 35) {
      level = "MEDIUM";
    } else {
      level = "LOW";
    }

    return {
      level,
      score,
      reasons,
    };
  }
}