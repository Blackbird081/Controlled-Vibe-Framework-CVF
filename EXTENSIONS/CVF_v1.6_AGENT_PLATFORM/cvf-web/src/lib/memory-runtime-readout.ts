import {
  runMemoryRuntimeWorkflowChain,
  type MemoryRuntimeWorkflowInput,
  type MemoryRuntimeWorkflowResult,
  type MemoryRetrievalPolicyOptions,
  type MemoryRetrievalCandidate,
} from 'cvf-learning-plane-foundation/memory-runtime';

export type MemoryRuntimeProjection = MemoryRuntimeWorkflowResult & {
  retrievalResult?: Omit<MemoryRuntimeWorkflowResult['retrievalResult'], 'selected'> & {
    selected: Array<Omit<MemoryRetrievalCandidate, 'content'>>;
  };
};

function sanitizeCandidates(
  candidates: readonly MemoryRetrievalCandidate[] | undefined,
): Array<Omit<MemoryRetrievalCandidate, 'content'>> {
  if (!candidates) return [];
  return candidates.map(({ content, ...rest }) => {
    void content;
    return { ...rest };
  });
}

function sanitizeRetrievalResult(
  result: MemoryRuntimeWorkflowResult['retrievalResult'],
): MemoryRuntimeProjection['retrievalResult'] {
  if (!result) return undefined;
  return {
    ...result,
    selected: sanitizeCandidates(result.selected),
  };
}

function sanitizeWorkflowResult(
  result: MemoryRuntimeWorkflowResult,
): MemoryRuntimeProjection {
  return {
    ...result,
    retrievalResult: sanitizeRetrievalResult(result.retrievalResult),
    rawMemoryReleased: false,
    canReinject: false,
    contextBlock: result.contextBlock
      ? {
          ...result.contextBlock,
          rawMemoryReleased: false,
          evidence: {
            ...result.contextBlock.evidence,
            rawMemoryReleased: false,
            canReinject: false,
          },
        }
      : undefined,
  };
}

export function buildMemoryRuntimeReadout(
  input: MemoryRuntimeWorkflowInput,
  options?: MemoryRetrievalPolicyOptions,
): MemoryRuntimeProjection {
  const workflowResult = runMemoryRuntimeWorkflowChain(input, options ?? {});
  return sanitizeWorkflowResult(workflowResult);
}
