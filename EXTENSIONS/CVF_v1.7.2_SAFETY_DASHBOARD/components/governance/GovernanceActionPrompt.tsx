// components/governance/GovernanceActionPrompt.tsx

"use client";

interface Props {
  escalated: boolean;
  requireHuman: boolean;
  hardStop: boolean;
}

export default function GovernanceActionPrompt({
  escalated,
  requireHuman,
  hardStop,
}: Props) {
  if (hardStop) {
    return (
      <div className="border rounded-xl p-4 bg-red-50 border-red-300 shadow-sm space-y-2">
        <div className="font-semibold text-red-700">
          AI đã tạm dừng
        </div>
        <div className="text-sm text-red-600">
          Hệ thống phát hiện rủi ro nghiêm trọng. 
          Bạn cần xem xét và xác nhận trước khi tiếp tục.
        </div>
      </div>
    );
  }

  if (requireHuman) {
    return (
      <div className="border rounded-xl p-4 bg-orange-50 border-orange-300 shadow-sm space-y-2">
        <div className="font-semibold text-orange-700">
          Yêu cầu xác nhận
        </div>
        <div className="text-sm text-orange-600">
          AI đề xuất một hành động có rủi ro. 
          Vui lòng xác nhận trước khi hệ thống tiếp tục.
        </div>
      </div>
    );
  }

  if (escalated) {
    return (
      <div className="border rounded-xl p-4 bg-yellow-50 border-yellow-300 shadow-sm space-y-2">
        <div className="font-semibold text-yellow-700">
          Mức kiểm soát đã tăng
        </div>
        <div className="text-sm text-yellow-600">
          Hệ thống đã tăng cường giám sát do phát hiện rủi ro.
        </div>
      </div>
    );
  }

  return null;
}