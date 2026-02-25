"use client";

import { useEffect, useState } from "react";
import { AISettings } from "../types/ai.types";
import {
  getAISettings,
  updateAISettings,
} from "../services/ai.service";

export function useAISettings() {
  const [settings, setSettings] =
    useState<AISettings | null>(null);

  useEffect(() => {
    getAISettings().then(setSettings);
  }, []);

  async function save(newSettings: AISettings) {
    const updated = await updateAISettings(newSettings);
    setSettings(updated);
  }

  return {
    settings,
    save,
  };
}