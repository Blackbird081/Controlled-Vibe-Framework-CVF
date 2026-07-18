export function cloneContext(context) {
    return {
        sourceEnvelopes: context.sourceEnvelopes.map((item) => structuredClone(item)),
        rawRecords: context.rawRecords.map((item) => structuredClone(item)),
        normalizedRecords: context.normalizedRecords.map((item) => structuredClone(item)),
        duplicateGroups: context.duplicateGroups.map((item) => structuredClone(item)),
        conflictSets: context.conflictSets.map((item) => structuredClone(item)),
        qualityFindings: context.qualityFindings.map((item) => structuredClone(item)),
        integrityResults: context.integrityResults.map((item) => structuredClone(item)),
        schemaValid: context.schemaValid,
        lineage: context.lineage.map((item) => structuredClone(item)),
        declaredScope: structuredClone(context.declaredScope),
        declaredOwner: context.declaredOwner,
        ruleManifest: structuredClone(context.ruleManifest),
    };
}
