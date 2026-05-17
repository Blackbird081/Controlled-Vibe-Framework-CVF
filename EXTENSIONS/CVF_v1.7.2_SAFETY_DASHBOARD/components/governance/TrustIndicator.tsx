// components/governance/TrustIndicator.tsx

"use client";

import { RLevel } from "@/lib/strategy/governanceStrategy.types";

interface Props {
  rLevel: RLevel;
  warning: boolean;
  critical: boolean;
}

export default function TrustIndicator({
  rLevel,
  warning,
  critical,
}: Props) {
  let label = "Safe";
  let color = "bg-green-500";
  let description =
    "AI đang hoạt động trong vùng an toàn.";

  if (critical) {
    label = "Critical";
    color = "bg-red-500";
    description =
      "Rủi ro nghiêm trọng. Hệ thống đang siết chặt kiểm soát.";
  } else if (warning) {
    label = "High Risk";
    color = "bg-orange-500";
    description =
      "Phát hiện rủi ro. Hệ thống đang theo dõi chặt.";
  } else if (rLevel === "R3" || rLevel === "R2") {
    label = "Monitor";
    color = "bg-yellow-400";
    description =
      "Rủi ro hiện tại ở mức cần theo dõi.";
  } else if (rLevel === "R1") {
    label = "Monitor";
    color = "bg-yellow-400";
    description =
      "Có dấu hiệu rủi ro nhẹ. Nên quan sát.";
  }

  return (
    <div className="border rounded-xl p-4 bg-white shadow-sm space-y-3">
      <h2 className="font-semibold">Trust Status</h2>

      <div className="flex items-center gap-3">
        <div className={`w-4 h-4 rounded-full ${color}`} />
        <div className="font-medium">{label}</div>
      </div>

      <div className="text-sm text-gray-600">
        {description}
      </div>
    </div>
  );
}