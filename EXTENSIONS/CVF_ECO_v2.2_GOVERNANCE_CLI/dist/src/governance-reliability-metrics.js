"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.receiptIntegrityRate = receiptIntegrityRate;
exports.policyDecisionRate = policyDecisionRate;
exports.stepTraceCompletionRate = stepTraceCompletionRate;
exports.auditEventCaptureRate = auditEventCaptureRate;
exports.taskCompletionRate = taskCompletionRate;
exports.retryRecoveryRate = retryRecoveryRate;
exports.retryCount = retryCount;
exports.policyViolationRate = policyViolationRate;
exports.crossSessionContinuityRate = crossSessionContinuityRate;
exports.deterministicConsistencyRate = deterministicConsistencyRate;
exports.humanCorrectionRate = humanCorrectionRate;
exports.humanCorrectionCount = humanCorrectionCount;
exports.longHorizonStabilityRate = longHorizonStabilityRate;
exports.rollbackSuccessRate = rollbackSuccessRate;
exports.computeGovernanceReliabilityReport = computeGovernanceReliabilityReport;
exports.parseAuditJsonl = parseAuditJsonl;
function receiptIntegrityRate(events) {
    return ratio(events.filter((event) => Boolean(nonEmptyString(event.receiptId)) && event.decision === "captured").length, events.length);
}
function policyDecisionRate(events) {
    return ratio(events.filter((event) => {
        const status = nonEmptyString(event.enforcement?.status);
        return Boolean(status) && status !== "error";
    }).length, events.length);
}
function stepTraceCompletionRate(events) {
    return ratio(events.filter((event) => Array.isArray(event.stepTraceIds) && event.stepTraceIds.length > 0).length, events.length);
}
function auditEventCaptureRate(events) {
    const executionRequests = new Set(events
        .filter((event) => event.eventType === "execution_requested" || event.type === "execution_requested")
        .map(executionKey)
        .filter(Boolean));
    const executionsWithAuditEvents = new Set(events.map(executionKey).filter(Boolean));
    const total = executionRequests.size || executionsWithAuditEvents.size;
    return ratio(executionsWithAuditEvents.size, total);
}
function taskCompletionRate(events) {
    return ratio(events.filter((event) => event.decision === "allow").length, events.length);
}
function retryRecoveryRate(events) {
    const withStatus = events.filter((event) => Boolean(nonEmptyString(event.enforcement?.status)));
    const recovered = withStatus.filter((event) => {
        const status = nonEmptyString(event.enforcement?.status);
        return status === "retry" || status === "recovered";
    });
    return ratio(recovered.length, withStatus.length);
}
function retryCount(events) {
    return events.filter((event) => {
        const status = nonEmptyString(event.enforcement?.status);
        const kind = eventKind(event);
        return status === "retry" || status === "recovered" || kind === "retry" || kind === "retry_recovered";
    }).length;
}
function policyViolationRate(events) {
    return ratio(events.filter((event) => {
        const status = nonEmptyString(event.enforcement?.status);
        return status === "deny" || status === "blocked";
    }).length, events.length);
}
function crossSessionContinuityRate(events) {
    const runGroups = new Map();
    events.forEach((event) => {
        const key = nonEmptyString(event.runId);
        if (key)
            runGroups.set(key, (runGroups.get(key) ?? 0) + 1);
    });
    return ratio([...runGroups.values()].filter((count) => count > 1).length, runGroups.size);
}
function deterministicConsistencyRate(events) {
    const executionGroups = new Map();
    events.forEach((event) => {
        const key = nonEmptyString(event.executionId);
        if (key)
            executionGroups.set(key, (executionGroups.get(key) ?? 0) + 1);
    });
    return ratio([...executionGroups.values()].filter((count) => count === 1).length, executionGroups.size);
}
function humanCorrectionRate(events) {
    const executions = distinctExecutions(events);
    const correctedExecutions = new Set(events
        .filter((event) => eventKind(event) === "operator_correction")
        .map(executionKey)
        .filter(Boolean));
    return ratio(correctedExecutions.size, executions.size);
}
function humanCorrectionCount(events) {
    return events.filter((event) => eventKind(event) === "operator_correction").length;
}
function longHorizonStabilityRate(events, windowDays) {
    const groups = groupByExecution(events);
    if (groups.size === 0) {
        return { rate: 1, count: 0, total: 0 };
    }
    let stable = 0;
    groups.forEach((group) => {
        const times = group
            .map(eventTime)
            .filter((value) => typeof value === "number" && Number.isFinite(value))
            .sort((a, b) => a - b);
        const withinWindow = times.length < 2 || ((times[times.length - 1] - times[0]) / 86_400_000) <= windowDays;
        const hasViolation = group.some((event) => {
            const kind = eventKind(event);
            return kind === "policy_violation" || (kind === "rollback" && event.success === false);
        });
        if (withinWindow && !hasViolation) {
            stable += 1;
        }
    });
    return ratio(stable, groups.size);
}
function rollbackSuccessRate(events) {
    const rollbackEvents = events.filter((event) => eventKind(event) === "rollback");
    if (rollbackEvents.length === 0) {
        return { rate: null, count: 0, total: 0 };
    }
    return ratio(rollbackEvents.filter((event) => event.success === true).length, rollbackEvents.length);
}
function computeGovernanceReliabilityReport(events) {
    return {
        receiptIntegrityRate: receiptIntegrityRate(events),
        policyDecisionRate: policyDecisionRate(events),
        stepTraceCompletionRate: stepTraceCompletionRate(events),
        auditEventCaptureRate: auditEventCaptureRate(events),
        taskCompletionRate: taskCompletionRate(events),
        retryRecoveryRate: retryRecoveryRate(events),
        policyViolationRate: policyViolationRate(events),
        crossSessionContinuityRate: crossSessionContinuityRate(events),
        deterministicConsistencyRate: deterministicConsistencyRate(events),
        humanCorrectionRate: humanCorrectionRate(events),
        longHorizonStabilityRate: longHorizonStabilityRate(events, 30),
        rollbackSuccessRate: rollbackSuccessRate(events),
    };
}
function parseAuditJsonl(content) {
    return content
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => JSON.parse(line));
}
function ratio(count, total) {
    return {
        rate: total === 0 ? 0 : count / total,
        count,
        total,
    };
}
function executionKey(event) {
    return nonEmptyString(event.executionId) ?? nonEmptyString(event.runId) ?? "";
}
function distinctExecutions(events) {
    return new Set(events.map(executionKey).filter(Boolean));
}
function groupByExecution(events) {
    const groups = new Map();
    events.forEach((event) => {
        const key = executionKey(event);
        if (!key)
            return;
        groups.set(key, [...(groups.get(key) ?? []), event]);
    });
    return groups;
}
function eventKind(event) {
    return nonEmptyString(event.eventType) ?? nonEmptyString(event.type) ?? "";
}
function eventTime(event) {
    const raw = nonEmptyString(event.correctedAt) ??
        nonEmptyString(event.rolledBackAt) ??
        nonEmptyString(event.timestamp) ??
        nonEmptyString(event.at) ??
        nonEmptyString(event.createdAt);
    if (!raw)
        return undefined;
    const parsed = Date.parse(raw);
    return Number.isFinite(parsed) ? parsed : undefined;
}
function nonEmptyString(value) {
    return typeof value === "string" && value.trim() ? value.trim() : undefined;
}
