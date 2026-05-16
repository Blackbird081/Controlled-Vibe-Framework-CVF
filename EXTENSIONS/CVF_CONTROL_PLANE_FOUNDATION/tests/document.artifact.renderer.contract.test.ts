import { describe, expect, it } from "vitest";
import {
  DocumentArtifactRendererContract,
  createDocumentArtifactRendererContract,
  type DocumentArtifactRenderRequest,
} from "../src/document.artifact.renderer.contract";

const FIXED_NOW = "2026-05-16T10:00:00.000Z";

function makeContract(): DocumentArtifactRendererContract {
  return new DocumentArtifactRendererContract({ now: () => FIXED_NOW });
}

function makeRequest(overrides: Partial<DocumentArtifactRenderRequest> = {}): DocumentArtifactRenderRequest {
  return {
    source: {
      sourcePath: "docs/reviews/CVF_SAMPLE_REVIEW.md",
      sourceName: "CVF_SAMPLE_REVIEW.md",
      markdown: "# Sample Review\n\n## Decision\n\nKeep failed checks visible.",
    },
    requestedComponents: ["evidence-receipt", "sandbox-preview-note"],
    adapterOrigin: "codex",
    previewMode: true,
    governance: {
      riskLevel: "high",
      approvalState: "rejected",
      evidenceState: "evidence-backed",
      failedChecks: ["validation failed"],
      claimsBoundary: {
        proven: ["Source markdown was rendered into a governed artifact."],
        notProven: ["Renderer did not create new evidence."],
        evidenceSource: "docs/reviews/CVF_SAMPLE_REVIEW.md",
        limitation: "Rendering is presentation only.",
      },
    },
    ...overrides,
  };
}

describe("DocumentArtifactRendererContract", () => {
  it("factory returns a contract instance", () => {
    expect(createDocumentArtifactRendererContract()).toBeInstanceOf(DocumentArtifactRendererContract);
  });

  it("renders a governed single-file HTML artifact with CVF metadata", () => {
    const artifact = makeContract().render(makeRequest());
    expect(artifact.metadata.rendererModule).toBe("CVF_DOCUMENT_ARTIFACT_RENDERER");
    expect(artifact.metadata.cvfRootAuthority).toBe("Controlled Vibe Framework");
    expect(artifact.html).toContain("<!doctype html>");
    expect(artifact.html).toContain("Metadata Panel");
    expect(artifact.outputFilename).toBe("governance-review-CVF_SAMPLE_REVIEW.html");
  });

  it("preserves approval state, risk level, evidence state, and failed checks", () => {
    const artifact = makeContract().render(makeRequest());
    expect(artifact.riskLevel).toBe("high");
    expect(artifact.approvalState).toBe("rejected");
    expect(artifact.evidenceState).toBe("evidence-backed");
    expect(artifact.html).toContain("validation failed");
  });

  it("keeps an explicit claims boundary and does not invent evidence", () => {
    const artifact = makeContract().render(makeRequest());
    expect(artifact.claimsBoundary.notProven).toContain("Renderer did not create new evidence.");
    expect(artifact.html).toContain("Renderer did not create new evidence.");
    expect(artifact.html).toContain("Rendering is presentation only.");
  });

  it("selects only approved requested components", () => {
    const artifact = makeContract().render(makeRequest({
      requestedComponents: ["evidence-receipt", "claim-upgrader", "metadata-panel"],
    }));
    expect(artifact.selectedComponents).toContain("evidence-receipt");
    expect(artifact.selectedComponents).not.toContain("claim-upgrader" as never);
    expect(artifact.metadata.verificationStatus).toBe("FAIL");
  });

  it("fails verification when forbidden components are requested", () => {
    const artifact = makeContract().render(makeRequest({ requestedComponents: ["policy-overrider"] }));
    expect(artifact.metadata.verificationStatus).toBe("FAIL");
    expect(artifact.verificationChecks.some((check) => check.checkId === "components.approved" && check.status === "fail")).toBe(true);
  });

  it("fails verification for remote script injection in source markdown", () => {
    const artifact = makeContract().render(makeRequest({
      source: {
        sourcePath: "docs/reviews/CVF_SAMPLE_REVIEW.md",
        sourceName: "CVF_SAMPLE_REVIEW.md",
        markdown: "# Sample\n<script src=\"https://example.test/x.js\"></script>",
      },
    }));
    expect(artifact.metadata.verificationStatus).toBe("FAIL");
    expect(artifact.verificationChecks.some((check) => check.checkId === "security.no-external-script" && check.status === "fail")).toBe(true);
  });

  it("escapes source markdown instead of executing embedded HTML", () => {
    const artifact = makeContract().render(makeRequest({
      source: {
        sourcePath: "docs/reviews/CVF_SAMPLE_REVIEW.md",
        sourceName: "CVF_SAMPLE_REVIEW.md",
        markdown: "# Sample\n<img src=x onerror=alert(1)>",
      },
    }));
    expect(artifact.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
    expect(artifact.html).not.toContain("<img src=x onerror=alert(1)>");
  });

  it("adds sandbox preview note when preview mode is requested", () => {
    const artifact = makeContract().render(makeRequest({ previewMode: true }));
    expect(artifact.html).toContain("Sandbox Preview Note");
    expect(artifact.verificationChecks.find((check) => check.checkId === "preview.sandbox")?.status).toBe("pass");
  });

  it("uses PASS_WITH_WARNINGS when preview mode is not requested but blocking checks pass", () => {
    const artifact = makeContract().render(makeRequest({ previewMode: false, requestedComponents: [] }));
    expect(artifact.metadata.verificationStatus).toBe("PASS_WITH_WARNINGS");
  });

  it("infers provider-proof artifact type from provider source name", () => {
    const artifact = makeContract().render(makeRequest({
      artifactType: undefined,
      source: {
        sourcePath: "docs/PROVIDERS.md",
        sourceName: "PROVIDERS.md",
        markdown: "# Providers\n\n## Proof\n\nAdapter-ready only.",
      },
    }));
    expect(artifact.metadata.artifactType).toBe("provider-proof");
    expect(artifact.outputFilename).toBe("provider-proof-PROVIDERS.html");
  });

  it("is deterministic for the same request and timestamp", () => {
    const first = makeContract().render(makeRequest());
    const second = makeContract().render(makeRequest());
    expect(first.metadata.artifactId).toBe(second.metadata.artifactId);
    expect(first.metadata.sourceHash).toBe(second.metadata.sourceHash);
  });

  it("changes artifact id when source content changes", () => {
    const first = makeContract().render(makeRequest());
    const second = makeContract().render(makeRequest({
      source: {
        sourcePath: "docs/reviews/CVF_SAMPLE_REVIEW.md",
        sourceName: "CVF_SAMPLE_REVIEW.md",
        markdown: "# Sample Review\n\nChanged content.",
      },
    }));
    expect(first.metadata.artifactId).not.toBe(second.metadata.artifactId);
  });

  it("throws when source fields are missing", () => {
    expect(() => makeContract().render(makeRequest({
      source: { sourcePath: "", sourceName: "x.md", markdown: "# X" },
    }))).toThrowError("sourcePath");
  });
});
