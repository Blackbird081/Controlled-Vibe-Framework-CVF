// components/governance/AutonomyStatusBadge.tsx

"use client";

interface Props {
  autonomy: number;
}

export default function AutonomyStatusBadge({ autonomy }: Props) {
  let label = "Controlled";
  let color = "bg-blue-500";
  let description =
    "AI đang hoạt động dưới kiểm soát chặt.";

  if (autonomy >= 70) {
    label = "Autonomous";
    color = "bg-green-500";
    description =
      "AI đang hoạt động với mức tự động hóa cao.";
  } else if (autonomy >= 40) {
    label = "Semi-Autonomous";
    color = "bg-indigo-500";
    description =
      "AI đang tự động ở mức trung bình, vẫn có kiểm soát.";
  }

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
      <h2 className="font-semibold">Autonomy Mode</h2>

      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full ${color}`} />
        <div className="font-medium">{label}</div>
      </div>

      <div className="text-sm text-gray-600">
        {description}
      </div>

      <div className="text-xs text-gray-400">
        Current autonomy score: {autonomy}
      </div>
    </div>
  );
}