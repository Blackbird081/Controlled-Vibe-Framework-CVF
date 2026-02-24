"use client";

interface Props {
  provider: string;
  onChange: (provider: string) => void;
}

export default function ProviderSelector({
  provider,
  onChange,
}: Props) {
  return (
    <div>
      <label>Provider: </label>
      <select
        value={provider}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="DIRECT_LLM">Direct LLM</option>
        <option value="OPENCLAW">OpenClaw</option>
        <option value="LOCAL">Local</option>
      </select>
    </div>
  );
}