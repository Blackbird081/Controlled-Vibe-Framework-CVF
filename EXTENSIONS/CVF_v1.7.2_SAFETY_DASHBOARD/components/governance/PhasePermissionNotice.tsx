// components/governance/PhasePermissionNotice.tsx

"use client";

import { Phase } from "@/lib/sessionManager";

interface Props {
  phase: Phase;
}

const phaseMessages: Record<string, {
  title: string;
  description: string;
  color: string;
  border: string;
}> = {
  discovery: {
    title: "AI đang phân tích",
    description:
      "Trong giai đoạn này, AI chỉ thu thập và phân tích thông tin. Không có hành động nào được thực thi.",
    color: "text-blue-700",
    border: "border-blue-300 bg-blue-50",
  },
  planning: {
    title: "AI đang đề xuất kế hoạch",
    description:
      "AI có thể tạo kế hoạch và đề xuất phương án, nhưng chưa thực hiện hành động.",
    color: "text-indigo-700",
    border: "border-indigo-300 bg-indigo-50",
  },
  execution: {
    title: "AI có thể thực thi",
    description:
      "AI được phép thực hiện hành động theo mức tự động hóa hiện tại.",
    color: "text-green-700",
    border: "border-green-300 bg-green-50",
  },
  verification: {
    title: "AI đang chờ xác minh",
    description:
      "Hệ thống đang kiểm tra kết quả. Có thể yêu cầu bạn xác nhận trước khi tiếp tục.",
    color: "text-purple-700",
    border: "border-purple-300 bg-purple-50",
  },
};

export default function PhasePermissionNotice({ phase }: Props) {
  const config = phaseMessages[phase];

  return (
    <div
      className={`border rounded-xl p-4 shadow-sm space-y-2 ${config.border}`}
    >
      <div className={`font-semibold ${config.color}`}>
        {config.title}
      </div>

      <div className="text-sm text-gray-700">
        {config.description}
      </div>
    </div>
  );
}