"use client";

import { GovernanceEvent } from "@/lib/sessionManager";
import GovernanceEventItem from "./GovernanceEventItem";

interface Props {
  events: GovernanceEvent[];
}

export default function GovernanceTimeline({ events }: Props) {
  if (!events || events.length === 0) {
    return (
      <div className="p-4 border border-dashed border-gray-300 rounded-lg text-gray-500 text-sm">
        No governance events recorded yet.
      </div>
    );
  }

  const sortedEvents = [...events].reverse();

  return (
    <div className="space-y-0">
      {sortedEvents.map((event) => (
        <GovernanceEventItem key={event.id} event={event} />
      ))}
    </div>
  );
}