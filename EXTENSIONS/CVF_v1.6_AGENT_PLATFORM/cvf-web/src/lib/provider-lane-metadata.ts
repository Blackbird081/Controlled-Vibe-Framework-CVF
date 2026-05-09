import type { LaneStatus } from './provider-lane-status';

export interface LaneEvidence {
  status: LaneStatus;
  label: string;
  passWindow: string;
  note: string;
}

/** Static lane evidence — updated by evaluate_cvf_provider_lane_certification.py */
export const PROVIDER_LANE_EVIDENCE: Partial<Record<string, LaneEvidence>> = {
  alibaba: {
    status: 'CERTIFIED',
    label: 'Certified',
    passWindow: '3/3 PASS',
    note: 'Certified by repeated CVF canary',
  },
  deepseek: {
    status: 'CERTIFIED',
    label: 'Certified',
    passWindow: '3/3 PASS',
    note: 'Certified by repeated CVF canary',
  },
  openai: {
    status: 'CERTIFIED',
    label: 'Certified',
    passWindow: '3/3 PASS',
    note: 'Certified by repeated CVF canary on gpt-4o-mini',
  },
};

export const LANE_BADGE_STYLE: Record<LaneStatus, { text: string; bg: string }> = {
  CERTIFIED: {
    text: 'text-green-700 dark:text-green-400',
    bg: 'bg-green-100 dark:bg-green-900/30',
  },
  CANARY_PASS: {
    text: 'text-amber-700 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
  },
  EXPERIMENTAL: {
    text: 'text-gray-600 dark:text-gray-400',
    bg: 'bg-gray-100 dark:bg-gray-700',
  },
  UNCONFIGURED: {
    text: 'text-gray-500 dark:text-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-800',
  },
  LIVE: {
    text: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
  },
  BLOCKED: {
    text: 'text-red-600 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/30',
  },
  DEGRADED: {
    text: 'text-orange-600 dark:text-orange-400',
    bg: 'bg-orange-100 dark:bg-orange-900/30',
  },
};
