"use client";

import { useEffect, useState } from "react";
import { AuditEntry } from "../types/ai.types";
import { getAudit } from "../services/audit.service";

export function useAudit() {
  const [entries, setEntries] =
    useState<AuditEntry[]>([]);

  useEffect(() => {
    getAudit().then(setEntries);
  }, []);

  return entries;
}