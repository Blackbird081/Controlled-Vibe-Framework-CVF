// components/governance/GovernanceProfileSelector.tsx

"use client";

import { useState } from "react";
import { StrategyProfileName } from "@/lib/strategy/governanceStrategy.types";

interface Props {
  selected?: StrategyProfileName;
  onChange: (profile: StrategyProfileName) => void;
  disabled?: boolean;
}

const profileDescriptions: Record<StrategyProfileName, string> = {
  conservative:
    "Ưu tiên an toàn. Hệ thống sẽ can thiệp sớm và yêu cầu xác nhận khi có rủi ro.",
  balanced:
    "Cân bằng giữa tự động và kiểm soát. Chỉ can thiệp khi rủi ro cao.",
  exploratory:
    "Ưu tiên tự động hóa. Chỉ dừng khi rủi ro nghiêm trọng.",
};

export default function GovernanceProfileSelector({
  selected,
  onChange,
  disabled,
}: Props) {
  const [internal, setInternal] = useState<StrategyProfileName>("balanced");
  const active = selected ?? internal;

  const handleSelect = (profile: StrategyProfileName) => {
    if (disabled) return;
    setInternal(profile);
    onChange(profile);
  };

  return (
    <div className={`border rounded-xl p-4 space-y-4 bg-white shadow-sm ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <h2 className="text-lg font-semibold">Governance Profile</h2>

      {(["conservative", "balanced", "exploratory"] as StrategyProfileName[]).map(
        (profile) => (
          <div
            key={profile}
            onClick={() => handleSelect(profile)}
            className={`cursor-pointer border rounded-lg p-3 transition ${active === profile
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:bg-gray-50"
              }`}
          >
            <div className="font-medium capitalize">{profile}</div>
            <div className="text-sm text-gray-600">
              {profileDescriptions[profile]}
            </div>
          </div>
        )
      )}
    </div>
  );
}