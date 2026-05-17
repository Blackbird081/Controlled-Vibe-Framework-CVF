// components/governance/PhaseIndicator.tsx

"use client";

import { Phase } from "@/lib/sessionManager";

interface Props {
  phase: Phase;
}

const phases = [
  "discovery",
  "planning",
  "execution",
  "verification",
] as const;

const phaseLabels: Record<string, string> = {
  discovery: "Discovery",
  planning: "Planning",
  execution: "Execution",
  verification: "Verification",
};

export default function PhaseIndicator({ phase }: Props) {
  const currentIndex = phases.indexOf(phase);

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm space-y-4">
      <h2 className="font-semibold">Workflow Phase</h2>

      <div className="flex items-center justify-between">
        {phases.map((p, index) => {
          const isActive = index === currentIndex;
          const isCompleted = index < currentIndex;

          return (
            <div
              key={p}
              className="flex flex-col items-center flex-1"
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${isActive
                    ? "bg-blue-600 text-white"
                    : isCompleted
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-600"
                  }`}
              >
                {index + 1}
              </div>

              <div className="text-xs mt-1 text-center">
                {phaseLabels[p]}
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-sm text-gray-600">
        Current phase:{" "}
        <span className="font-medium">
          {phaseLabels[phase]}
        </span>
      </div>
    </div>
  );
}