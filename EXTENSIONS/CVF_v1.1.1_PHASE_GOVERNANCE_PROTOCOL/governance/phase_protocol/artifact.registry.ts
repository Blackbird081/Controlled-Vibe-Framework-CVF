/**
 * Artifact Registry
 *
 * Tracks artifacts generated during a development phase.
 * Ensures required artifacts are registered before phase gate.
 */

export interface ArtifactRecord {
  type: string;
  path: string;
  timestamp: number;
}

export class ArtifactRegistry {
  private componentName: string;
  private artifacts: ArtifactRecord[];

  constructor(componentName: string) {
    this.componentName = componentName;
    this.artifacts = [];
  }

  public registerArtifact(type: string, path: string): void {
    const record: ArtifactRecord = {
      type,
      path,
      timestamp: Date.now(),
    };

    this.artifacts.push(record);
  }

  public getArtifacts(): ArtifactRecord[] {
    return this.artifacts;
  }

  public findArtifact(type: string): ArtifactRecord | undefined {
    return this.artifacts.find((a) => a.type === type);
  }

  public hasArtifact(type: string): boolean {
    return this.artifacts.some((a) => a.type === type);
  }

  public clear(): void {
    this.artifacts = [];
  }
}