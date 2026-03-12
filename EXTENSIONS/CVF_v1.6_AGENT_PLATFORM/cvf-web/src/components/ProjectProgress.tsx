'use client';

/**
 * Project Progress Component
 * ============================
 * Visual dashboard showing "where is the project now" in the CVF pipeline.
 * Shows current phase, guard decisions history, and timeline.
 *
 * Sprint 7 — Task 7.3
 */

import React from 'react';

interface GuardEvent {
  timestamp: string;
  action: string;
  decision: 'ALLOW' | 'BLOCK' | 'ESCALATE';
  phase: string;
  duration?: number;
}

interface ProjectProgressProps {
  currentPhase: string;
  completedPhases: string[];
  guardEvents: GuardEvent[];
  totalActions: number;
  blockedActions: number;
  language?: 'vi' | 'en';
}

const PHASES = [
  { id: 'DISCOVERY', icon: '🔍', labelVi: 'Khám phá', labelEn: 'Discovery' },
  { id: 'DESIGN', icon: '📐', labelVi: 'Thiết kế', labelEn: 'Design' },
  { id: 'BUILD', icon: '🔨', labelVi: 'Xây dựng', labelEn: 'Build' },
  { id: 'REVIEW', icon: '✅', labelVi: 'Kiểm tra', labelEn: 'Review' },
];

export default function ProjectProgress({
  currentPhase,
  completedPhases,
  guardEvents,
  totalActions,
  blockedActions,
  language = 'vi',
}: ProjectProgressProps) {
  const l = language === 'vi' ? {
    title: '📊 Tiến độ dự án',
    phase: 'Giai đoạn hiện tại',
    timeline: 'Lịch sử Guard',
    stats: 'Thống kê',
    total: 'Tổng hành động',
    allowed: 'Cho phép',
    blocked: 'Bị chặn',
    escalated: 'Cần duyệt',
    noEvents: 'Chưa có hành động nào.',
  } : {
    title: '📊 Project Progress',
    phase: 'Current Phase',
    timeline: 'Guard History',
    stats: 'Statistics',
    total: 'Total Actions',
    allowed: 'Allowed',
    blocked: 'Blocked',
    escalated: 'Escalated',
    noEvents: 'No actions yet.',
  };

  const allowedCount = guardEvents.filter(e => e.decision === 'ALLOW').length;
  const escalatedCount = guardEvents.filter(e => e.decision === 'ESCALATE').length;

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-bold">{l.title}</h3>

      {/* Phase Progress Bar */}
      <div>
        <div className="text-sm text-gray-500 mb-2">{l.phase}</div>
        <div className="flex items-center gap-1">
          {PHASES.map((phase, i) => {
            const isCompleted = completedPhases.includes(phase.id);
            const isCurrent = phase.id === currentPhase;
            return (
              <React.Fragment key={phase.id}>
                <div className={`flex-1 rounded-lg p-3 text-center transition-all ${
                  isCurrent ? 'bg-blue-500 text-white ring-2 ring-blue-300 scale-105' :
                  isCompleted ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                  'bg-gray-100 dark:bg-gray-800 text-gray-400'
                }`}>
                  <div className="text-lg">{phase.icon}</div>
                  <div className="text-xs font-medium mt-1">
                    {language === 'vi' ? phase.labelVi : phase.labelEn}
                  </div>
                  {isCompleted && <div className="text-xs">✓</div>}
                </div>
                {i < PHASES.length - 1 && (
                  <div className={`w-6 h-0.5 ${isCompleted ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold">{totalActions}</div>
          <div className="text-xs text-gray-500">{l.total}</div>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{allowedCount}</div>
          <div className="text-xs text-green-600">{l.allowed}</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{blockedActions}</div>
          <div className="text-xs text-red-600">{l.blocked}</div>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-amber-600">{escalatedCount}</div>
          <div className="text-xs text-amber-600">{l.escalated}</div>
        </div>
      </div>

      {/* Guard Event Timeline */}
      <div>
        <div className="text-sm text-gray-500 mb-2">{l.timeline}</div>
        {guardEvents.length === 0 ? (
          <div className="text-sm text-gray-400 text-center py-4">{l.noEvents}</div>
        ) : (
          <div className="space-y-1 max-h-60 overflow-y-auto">
            {guardEvents.slice(-10).reverse().map((event, i) => (
              <div key={i} className="flex items-center gap-2 text-xs p-2 bg-gray-50 dark:bg-gray-800 rounded">
                <span className={`w-2 h-2 rounded-full ${
                  event.decision === 'ALLOW' ? 'bg-green-500' :
                  event.decision === 'BLOCK' ? 'bg-red-500' : 'bg-amber-500'
                }`} />
                <span className="flex-1 truncate">{event.action}</span>
                <span className={`font-medium ${
                  event.decision === 'ALLOW' ? 'text-green-600' :
                  event.decision === 'BLOCK' ? 'text-red-600' : 'text-amber-600'
                }`}>{event.decision}</span>
                <span className="text-gray-400">{new Date(event.timestamp).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
