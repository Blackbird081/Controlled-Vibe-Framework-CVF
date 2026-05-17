import { describe, it, expect } from "vitest";
import * as CVFCore from "../index.js";

describe('Barrel index.ts exports', () => {
    it('should export AI Commit primitives', () => {
        expect(CVFCore.parseCommit).toBeDefined();
        expect(CVFCore.validateCommit).toBeDefined();
    });

    it('should export Artifact Staging primitives', () => {
        expect(CVFCore.ArtifactStagingArea).toBeDefined();
        // Since enum is exported, we can check types loosely, but let's check classes/functions
    });

    it('should export Artifact Ledger primitives', () => {
        expect(CVFCore.ArtifactLedger).toBeDefined();
    });

    it('should export Process Model primitives', () => {
        expect(CVFCore.ProcessModel).toBeDefined();
    });

    it('should export Skill Lifecycle primitives', () => {
        expect(CVFCore.SkillRegistry).toBeDefined();
    });
});
