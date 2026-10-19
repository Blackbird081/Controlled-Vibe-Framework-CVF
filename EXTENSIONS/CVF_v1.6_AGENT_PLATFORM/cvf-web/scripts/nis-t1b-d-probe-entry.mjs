/** Bundle entry for the NIS-T1B-D transaction probe. Re-exports the production store, actor, acceptance and
 * security modules unchanged; only the session verifier is replaced (see nis-t1b-d-probe-session-stub.mjs).
 */
import { commitIntentSpecAcceptanceCandidate, prepareIntentSpecAcceptance } from '../src/lib/intent-spec-acceptance';
import { resolveIntentSpecActor } from '../src/lib/intent-spec-actor';
import { createSpecConfirmationCandidate } from '../src/lib/intent-spec-confirmation';
import { acknowledgeIntentSpecReview, createIntentSpecReview, updateReviewDecision } from '../src/lib/intent-spec-review';

export { FileIntentSpecAcceptanceStore } from '../src/lib/intent-spec-file-store';
export { commitIntentSpecAcceptanceCandidate };
export { hardenPrivate, isPrivateSecurity, measureSecurity, windowsPrivateSecurity } from '../src/lib/intent-spec-private-profile';
export { applyAdversary, assertFixture, makePrivateRoot, removeFixture } from '../src/lib/intent-spec-security-fixture';

/** Resolves an actor through the production owner using the synthetic session in NIS_PROBE_SESSION. */
export async function syntheticActor(userId) {
    process.env.NIS_PROBE_SESSION = JSON.stringify({ userId, user: userId, role: 'developer', orgId: 'org_probe', teamId: 'team_probe' });
    return resolveIntentSpecActor(new Request('http://localhost/nis-t1b-d-probe'));
}

export async function prepareSyntheticCandidate(actor, label) {
    let review = createIntentSpecReview({ coreFeatures: label }, 'Synthetic probe packet');
    for (const decision of review.decisions) review = updateReviewDecision(review, decision.id, { answer: `Decision ${decision.id}` });
    const portable = await createSpecConfirmationCandidate(acknowledgeIntentSpecReview(review), 'en', 'Probe reviewer');
    return prepareIntentSpecAcceptance(actor, new TextEncoder().encode(portable.fileContent), portable.fileSha256);
}
