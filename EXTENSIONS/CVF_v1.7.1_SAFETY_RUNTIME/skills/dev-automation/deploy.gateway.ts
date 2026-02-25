
import { DevArtifact } from "./artifact.types";

export type DeploymentEnvironment =
  | "DEV"
  | "STAGING"
  | "PRODUCTION";

export interface DeploymentResult {
  deploymentId: string;
  environment: DeploymentEnvironment;
  status: "SUCCESS" | "FAILED";
  timestamp: number;
}

export interface DeployClient {
  deploy(params: {
    environment: DeploymentEnvironment;
    artifact: DevArtifact;
  }): Promise<DeploymentResult>;
}

let deployClient: DeployClient | null = null;

export function registerDeployClient(client: DeployClient) {
  deployClient = client;
}

export async function deployArtifact(
  artifact: DevArtifact,
  environment: DeploymentEnvironment
): Promise<DeploymentResult> {
  if (!deployClient) {
    throw new Error("Deploy client not registered");
  }

  if (!environment) {
    throw new Error("Deployment environment required");
  }

  const result = await deployClient.deploy({
    environment,
    artifact,
  });

  return result;
}