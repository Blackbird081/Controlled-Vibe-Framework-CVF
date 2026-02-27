"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PhaserPlayground } from "@/components/game/PhaserPlayground";
import { BadgeShelf } from "@/components/ui-shell/BadgeShelf";
import { GameHud } from "@/components/ui-shell/GameHud";
import { LevelSelector } from "@/components/ui-shell/LevelSelector";
import { MiniGameTabs } from "@/components/ui-shell/MiniGameTabs";
import { ParentModePanel } from "@/components/ui-shell/ParentModePanel";
import {
  calculateEarnedScore,
  generateColorRound,
  generateMathQuestion,
  getColorEnglishName,
  generateMemoryRound,
  getColorHint,
  getMathHint,
  getMemoryHint,
  LEVELS,
  LevelKey,
  MiniGameKey,
} from "@/lib/game-core";
import {
  getAudioPreferences,
  playCelebrationTone,
  playErrorTone,
  playSuccessTone,
  playUiClickTone,
  playUiHoverTone,
  setAudioPreferences,
} from "@/lib/game-core/sfx";
import {
  addPlayTime,
  applyCorrectAnswer,
  applyWrongAnswer,
  canPlay,
  getRemainingPlayMs,
  grantComboBadge,
  recordRoundResult,
  touchSession,
  updateParentMode,
  verifyParentPin,
} from "@/lib/progress-service";
import {
  AcademyZoneState,
  advanceAcademyProgress,
  getDefaultAcademyProgress,
  getRoundsUntilBoss,
  loadAcademyProgress,
  saveAcademyProgress,
} from "@/lib/progression-service";
import { useGameStore } from "@/lib/store/game-store";
import { trackEvent } from "@/lib/telemetry";
import styles from "./page.module.css";

type FeedbackTone = "success" | "error" | "info";
type AgeGroupKey = "age_5_6" | "age_7_8" | "age_9_10";
type UiLanguage = "vi" | "en";

interface AgeProfileConfig {
  key: AgeGroupKey;
  label: string;
  maxMathLimit: number;
  roundBonusSeconds: number;
  memoryRevealBonusSeconds: number;
}

const AGE_PROFILES: Record<AgeGroupKey, AgeProfileConfig> = {
  age_5_6: {
    key: "age_5_6",
    label: "5-6 tuoi",
    maxMathLimit: 20,
    roundBonusSeconds: 8,
    memoryRevealBonusSeconds: 2,
  },
  age_7_8: {
    key: "age_7_8",
    label: "7-8 tuoi",
    maxMathLimit: 50,
    roundBonusSeconds: 3,
    memoryRevealBonusSeconds: 1,
  },
  age_9_10: {
    key: "age_9_10",
    label: "9-10 tuoi",
    maxMathLimit: 100,
    roundBonusSeconds: 0,
    memoryRevealBonusSeconds: 0,
  },
};

const AGE_PROFILE_STORAGE_KEY = "cvf-mini-age-group-v1";
const AUDIO_PREF_STORAGE_KEY = "cvf-mini-audio-pref-v1";
const LANGUAGE_STORAGE_KEY = "cvf-mini-language-v1";

const AGE_PROFILE_LABELS: Record<UiLanguage, Record<AgeGroupKey, string>> = {
  vi: {
    age_5_6: "5-6 tuoi",
    age_7_8: "7-8 tuoi",
    age_9_10: "9-10 tuoi",
  },
  en: {
    age_5_6: "5-6 years",
    age_7_8: "7-8 years",
    age_9_10: "9-10 years",
  },
};

const MINI_GAME_LABELS: Record<UiLanguage, Record<MiniGameKey, { title: string; description: string }>> = {
  vi: {
    math: {
      title: "Toan Nhanh",
      description: "Tinh nhanh, chon dap an dung.",
    },
    memory: {
      title: "Nho Hinh",
      description: "Nho chuoi ky hieu roi chon ky hieu xuat hien nhieu nhat.",
    },
    color: {
      title: "Phan Xa Mau",
      description: "Bo qua noi dung chu, chon mau chu dang hien thi.",
    },
  },
  en: {
    math: {
      title: "Math Sprint",
      description: "Solve quickly and pick the correct answer.",
    },
    memory: {
      title: "Memory Spark",
      description: "Memorize symbols and pick the one that appears most.",
    },
    color: {
      title: "Color Reflex",
      description: "Ignore word meaning, pick the displayed text color.",
    },
  },
};

const LEVEL_LABELS: Record<UiLanguage, Record<LevelKey, { label: string; subtitle: string }>> = {
  vi: {
    rookie: { label: "Cua 1: Tap su", subtitle: "So nho den 20" },
    talent: { label: "Cua 2: Tai nang", subtitle: "So vua den 50" },
    master: { label: "Cua 3: Sieu tham tu", subtitle: "So lon den 100" },
  },
  en: {
    rookie: { label: "Gate 1: Rookie", subtitle: "Numbers up to 20" },
    talent: { label: "Gate 2: Talent", subtitle: "Numbers up to 50" },
    master: { label: "Gate 3: Super Detective", subtitle: "Numbers up to 100" },
  },
};

function pickLanguageText(language: UiLanguage, vi: string, en: string): string {
  return language === "vi" ? vi : en;
}

function feedbackClass(tone: FeedbackTone): string {
  if (tone === "success") return styles.feedbackSuccess;
  if (tone === "error") return styles.feedbackError;
  return styles.feedbackInfo;
}

export default function Home() {
  const {
    hydrated,
    levelKey,
    progress,
    hydrate,
    setLevelKey,
    updateProgress,
    resetRun,
    setParentMode,
    setParentPin,
    resetAllProgress,
  } = useGameStore();
  const level = LEVELS[levelKey];

  const [activeGame, setActiveGame] = useState<MiniGameKey>("math");
  const [mathQuestion, setMathQuestion] = useState(() => generateMathQuestion(level.limit));
  const [memoryRound, setMemoryRound] = useState(() => generateMemoryRound(level.limit));
  const [colorRound, setColorRound] = useState(() => generateColorRound());
  const [memoryRevealLeft, setMemoryRevealLeft] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(level.roundSeconds);
  const [ageGroup, setAgeGroup] = useState<AgeGroupKey>("age_7_8");
  const [language, setLanguage] = useState<UiLanguage>("vi");
  const [soundMuted, setSoundMuted] = useState(false);
  const [soundVolume, setSoundVolume] = useState(75);
  const [uiSfxEnabled, setUiSfxEnabled] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [autoReadEnabled, setAutoReadEnabled] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationSeed, setCelebrationSeed] = useState(0);
  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [parentMessage, setParentMessage] = useState<string | null>(null);
  const [academyProgress, setAcademyProgress] = useState(() => getDefaultAcademyProgress());
  const [feedback, setFeedback] = useState<{ tone: FeedbackTone; text: string }>({
    tone: "info",
    text: "Chon mini game va bat dau hanh trinh hoc ma choi!",
  });
  const previousAgeGroupRef = useRef<AgeGroupKey | null>(null);
  const spokenRoundRef = useRef<string | null>(null);

  const startRound = useCallback((game: MiniGameKey, limit: number, roundSeconds: number, memoryRevealBonus = 0) => {
    if (game === "math") {
      setMathQuestion(generateMathQuestion(limit));
      setMemoryRevealLeft(0);
    } else if (game === "memory") {
      const nextMemory = generateMemoryRound(limit);
      setMemoryRound(nextMemory);
      setMemoryRevealLeft(nextMemory.revealSeconds + memoryRevealBonus);
    } else {
      setColorRound(generateColorRound());
      setMemoryRevealLeft(0);
    }
    setTimeLeft(roundSeconds);
  }, []);

  const getHintForCurrentGame = useCallback((): string => {
    if (activeGame === "math") {
      return getMathHint(mathQuestion, language);
    }
    if (activeGame === "memory") {
      return getMemoryHint(memoryRound.answer, language);
    }
    return getColorHint(colorRound.answerColorName, language);
  }, [activeGame, colorRound.answerColorName, language, mathQuestion, memoryRound.answer]);

  const miniGameLabels = useMemo(() => MINI_GAME_LABELS[language], [language]);
  const levelLabels = useMemo(() => LEVEL_LABELS[language], [language]);
  const gameTitle = useMemo(
    () => miniGameLabels[activeGame]?.title ?? pickLanguageText(language, "Mini Game", "Mini Game"),
    [activeGame, language, miniGameLabels],
  );
  const getRoundConfig = useCallback(
    (game: MiniGameKey, targetLevelKey: LevelKey = level.key, targetAgeGroup: AgeGroupKey = ageGroup) => {
      const targetLevel = LEVELS[targetLevelKey];
      const profile = AGE_PROFILES[targetAgeGroup];
      return {
        limit: game === "math" ? Math.min(targetLevel.limit, profile.maxMathLimit) : targetLevel.limit,
        roundSeconds: Math.max(12, targetLevel.roundSeconds + profile.roundBonusSeconds),
        memoryRevealBonusSeconds: profile.memoryRevealBonusSeconds,
      };
    },
    [ageGroup, level.key],
  );
  const activeRoundConfig = useMemo(
    () => getRoundConfig(activeGame, level.key, ageGroup),
    [activeGame, ageGroup, getRoundConfig, level.key],
  );
  const ageProfileLabel = AGE_PROFILE_LABELS[language][ageGroup];
  const timeRatio = Math.max(0, Math.min(1, timeLeft / activeRoundConfig.roundSeconds));
  const currentRoundKey = useMemo(() => {
    if (activeGame === "math") {
      return `math:${mathQuestion.left}:${mathQuestion.operator}:${mathQuestion.right}:${mathQuestion.answer}`;
    }
    if (activeGame === "memory") {
      return `memory:${memoryRound.sequence.join("")}:${memoryRound.answer}`;
    }
    return `color:${colorRound.word}:${colorRound.wordColorHex}:${colorRound.answerColorName}`;
  }, [activeGame, colorRound.answerColorName, colorRound.word, colorRound.wordColorHex, mathQuestion, memoryRound.answer, memoryRound.sequence]);
  const currentSpeechText = useMemo(() => {
    if (activeGame === "math") {
      return language === "vi"
        ? `Cau hoi toan: ${mathQuestion.left} ${mathQuestion.operator === "+" ? "cong" : "tru"} ${mathQuestion.right} bang bao nhieu?`
        : `Math question: what is ${mathQuestion.left} ${mathQuestion.operator === "+" ? "plus" : "minus"} ${mathQuestion.right}?`;
    }
    if (activeGame === "memory") {
      if (memoryRevealLeft > 0) {
        return language === "vi"
          ? `Hay nho chuoi ky hieu trong ${memoryRevealLeft} giay.`
          : `Remember the symbol sequence in ${memoryRevealLeft} seconds.`;
      }
      return pickLanguageText(language, "Chuoi da an. Ky hieu nao xuat hien nhieu nhat?", "Sequence hidden. Which symbol appeared the most?");
    }
    return language === "vi"
      ? `Phan xa mau. Tu hien thi la ${colorRound.word}. Hay chon mau cua chu dang hien thi.`
      : `Color reflex. The shown word is ${getColorEnglishName(colorRound.word)}. Pick the color of the text.`;
  }, [activeGame, colorRound.word, language, mathQuestion.left, mathQuestion.operator, mathQuestion.right, memoryRevealLeft]);
  const englishLearningLine = useMemo(() => {
    if (activeGame === "math") {
      return `English: What is ${mathQuestion.left} ${mathQuestion.operator === "+" ? "plus" : "minus"} ${mathQuestion.right}?`;
    }
    if (activeGame === "memory") {
      return memoryRevealLeft > 0
        ? "English: Remember the symbols."
        : "English: Which symbol appears the most?";
    }
    return "English: Choose the COLOR of the word.";
  }, [activeGame, mathQuestion.left, mathQuestion.operator, mathQuestion.right, memoryRevealLeft]);
  const getColorChoiceDisplay = useCallback(
    (choice: string) =>
      language === "vi" ? `${choice} / ${getColorEnglishName(choice)}` : `${getColorEnglishName(choice)} / ${choice}`,
    [language],
  );
  const triggerCelebration = useCallback(() => {
    setCelebrationSeed((value) => value + 1);
    setShowCelebration(true);
    playCelebrationTone();
  }, []);
  const beginRound = useCallback(
    (
      game: MiniGameKey,
      config: { limit: number; roundSeconds: number; memoryRevealBonusSeconds: number },
      source: "answer_correct" | "answer_wrong" | "timeout" | "restart" | "switch_game" | "switch_level" | "age_profile" | "reset_all",
      telemetryLevel: LevelKey = level.key,
    ) => {
      startRound(game, config.limit, config.roundSeconds, config.memoryRevealBonusSeconds);
      void trackEvent("round_start", {
        game,
        level: telemetryLevel,
        source,
        ageGroup,
        roundSeconds: config.roundSeconds,
      });
    },
    [ageGroup, level.key, startRound],
  );
  const speakCurrentPrompt = useCallback(
    (source: "manual" | "auto") => {
      if (!ttsEnabled || soundMuted) return;
      if (typeof window === "undefined" || !ttsSupported) return;

      const speech = window.speechSynthesis;
      speech.cancel();
      const utterance = new SpeechSynthesisUtterance(currentSpeechText);
      utterance.lang = language === "vi" ? "vi-VN" : "en-US";
      utterance.rate = ageGroup === "age_5_6" ? 0.88 : 0.96;
      utterance.pitch = 1.03;
      utterance.volume = Math.max(0, Math.min(1, soundVolume / 100));
      speech.speak(utterance);
      void trackEvent("tts_speak", { source, game: activeGame, ageGroup, language });
    },
    [activeGame, ageGroup, currentSpeechText, language, soundMuted, soundVolume, ttsEnabled, ttsSupported],
  );

  useEffect(() => {
    hydrate();
    void trackEvent("screen_view", { page: "home" });
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    const timer = window.setTimeout(() => {
      const onboardingDone = window.localStorage.getItem("cvf-mini-onboarding-done");
      setShowOnboarding(onboardingDone !== "1");
    }, 0);
    return () => window.clearTimeout(timer);
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    setAcademyProgress(loadAcademyProgress());
  }, [hydrated]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setTtsSupported("speechSynthesis" in window);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const rawAgeGroup = window.localStorage.getItem(AGE_PROFILE_STORAGE_KEY);
    if (rawAgeGroup && rawAgeGroup in AGE_PROFILES) {
      setAgeGroup(rawAgeGroup as AgeGroupKey);
    }
    const rawLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (rawLanguage === "vi" || rawLanguage === "en") {
      setLanguage(rawLanguage);
    }

    const rawAudioPref = window.localStorage.getItem(AUDIO_PREF_STORAGE_KEY);
    if (rawAudioPref) {
      try {
        const parsed = JSON.parse(rawAudioPref) as {
          muted?: boolean;
          volume?: number;
          uiEnabled?: boolean;
          ttsEnabled?: boolean;
          autoReadEnabled?: boolean;
        };
        if (typeof parsed.muted === "boolean") {
          setSoundMuted(parsed.muted);
        }
        if (typeof parsed.volume === "number" && Number.isFinite(parsed.volume)) {
          setSoundVolume(Math.max(0, Math.min(100, Math.round(parsed.volume * 100))));
        }
        if (typeof parsed.uiEnabled === "boolean") {
          setUiSfxEnabled(parsed.uiEnabled);
        }
        if (typeof parsed.ttsEnabled === "boolean") {
          setTtsEnabled(parsed.ttsEnabled);
        }
        if (typeof parsed.autoReadEnabled === "boolean") {
          setAutoReadEnabled(parsed.autoReadEnabled);
        }
      } catch {
        // Ignore malformed preference payload.
      }
    } else {
      const defaults = getAudioPreferences();
      setSoundMuted(defaults.muted);
      setSoundVolume(Math.round(defaults.volume * 100));
      setUiSfxEnabled(defaults.uiEnabled);
      setTtsEnabled(true);
      setAutoReadEnabled(true);
    }
  }, [hydrated]);

  useEffect(() => {
    const normalizedVolume = Math.max(0, Math.min(1, soundVolume / 100));
    setAudioPreferences({
      muted: soundMuted,
      volume: normalizedVolume,
      uiEnabled: uiSfxEnabled,
    });
    if (!hydrated) return;
    window.localStorage.setItem(
      AUDIO_PREF_STORAGE_KEY,
      JSON.stringify({
        muted: soundMuted,
        volume: normalizedVolume,
        uiEnabled: uiSfxEnabled,
        ttsEnabled,
        autoReadEnabled,
      }),
    );
  }, [autoReadEnabled, hydrated, soundMuted, soundVolume, ttsEnabled, uiSfxEnabled]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(AGE_PROFILE_STORAGE_KEY, ageGroup);
  }, [ageGroup, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [hydrated, language]);

  useEffect(() => {
    if (!hydrated) return;
    if (previousAgeGroupRef.current === null) {
      previousAgeGroupRef.current = ageGroup;
      return;
    }
    if (previousAgeGroupRef.current === ageGroup) return;
    previousAgeGroupRef.current = ageGroup;

    beginRound(activeGame, activeRoundConfig, "age_profile");
    setWrongStreak(0);
    setFeedback({
      tone: "info",
      text: pickLanguageText(
        language,
        `Da doi profile ${AGE_PROFILE_LABELS.vi[ageGroup]}. Do kho duoc can chinh lai.`,
        `Profile switched to ${AGE_PROFILE_LABELS.en[ageGroup]}. Difficulty was re-balanced.`,
      ),
    });
    void trackEvent("age_profile_change", {
      ageGroup,
      game: activeGame,
      level: level.key,
    });
  }, [activeGame, activeRoundConfig, ageGroup, beginRound, hydrated, language, level.key]);

  useEffect(() => {
    if (!hydrated || !autoReadEnabled) return;
    if (spokenRoundRef.current === currentRoundKey) return;
    spokenRoundRef.current = currentRoundKey;
    const timer = window.setTimeout(() => {
      speakCurrentPrompt("auto");
    }, 180);
    return () => window.clearTimeout(timer);
  }, [autoReadEnabled, currentRoundKey, hydrated, speakCurrentPrompt]);

  useEffect(() => {
    if (typeof window === "undefined" || !ttsSupported) return;
    if (soundMuted || !ttsEnabled) {
      window.speechSynthesis.cancel();
    }
  }, [soundMuted, ttsEnabled, ttsSupported]);

  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  useEffect(() => {
    if (!showCelebration) return;
    const timer = window.setTimeout(() => {
      setShowCelebration(false);
    }, 920);
    return () => window.clearTimeout(timer);
  }, [celebrationSeed, showCelebration]);

  useEffect(() => {
    if (!hydrated) return;
    const root = document.getElementById("cvf-game-root");
    if (!root) return;
    let hoverCooldownUntil = 0;

    const onMouseOver = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button || !root.contains(button)) return;

      const related = event.relatedTarget as Node | null;
      if (related && button.contains(related)) return;

      const now = window.performance.now();
      if (now < hoverCooldownUntil) return;
      hoverCooldownUntil = now + 70;
      playUiHoverTone();
    };

    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest("button");
      if (!button || !root.contains(button)) return;
      playUiClickTone();
    };

    root.addEventListener("mouseover", onMouseOver);
    root.addEventListener("click", onClick);
    return () => {
      root.removeEventListener("mouseover", onMouseOver);
      root.removeEventListener("click", onClick);
    };
  }, [hydrated]);

  const remainingPlayMs = useMemo(() => getRemainingPlayMs(progress), [progress]);
  const remainingMinutes = Number.isFinite(remainingPlayMs) ? Math.ceil(remainingPlayMs / (60 * 1000)) : null;
  const playable = hydrated && canPlay(progress);
  const parentLocked = Boolean(progress.parentMode.pinCode) && !parentUnlocked;
  const answerLocked = !playable || (activeGame === "memory" && memoryRevealLeft > 0);
  const currentChoices = useMemo<(string | number)[]>(() => {
    if (activeGame === "math") return mathQuestion.choices;
    if (activeGame === "memory") return memoryRound.choices;
    return colorRound.choices;
  }, [activeGame, colorRound.choices, mathQuestion.choices, memoryRound.choices]);

  const parentReport = useMemo(() => {
    const rounds = progress.dailyStats.rounds;
    const accuracy = rounds > 0 ? Math.round((progress.dailyStats.correct / rounds) * 100) : 0;
    return {
      rounds,
      correct: progress.dailyStats.correct,
      wrong: progress.dailyStats.wrong,
      accuracy,
    };
  }, [progress.dailyStats]);
  const questProgress = useMemo(() => {
    const dailyRoundsTarget = 12;
    const mathRoundsTarget = 4;
    const memoryRoundsTarget = 4;
    const colorRoundsTarget = 4;
    const roundsProgress = Math.min(100, Math.round((progress.dailyStats.rounds / dailyRoundsTarget) * 100));
    const mathProgress = Math.min(100, Math.round((progress.dailyStats.byGame.math.rounds / mathRoundsTarget) * 100));
    const memoryProgress = Math.min(100, Math.round((progress.dailyStats.byGame.memory.rounds / memoryRoundsTarget) * 100));
    const colorProgress = Math.min(100, Math.round((progress.dailyStats.byGame.color.rounds / colorRoundsTarget) * 100));
    const todayAccuracy = progress.dailyStats.rounds > 0 ? Math.round((progress.dailyStats.correct / progress.dailyStats.rounds) * 100) : 0;
    const accuracyTarget = 70;
    const accuracyProgress = Math.min(100, Math.round((todayAccuracy / accuracyTarget) * 100));

    return {
      roundsProgress,
      mathProgress,
      memoryProgress,
      colorProgress,
      accuracyProgress,
      todayAccuracy,
      roundsDone: progress.dailyStats.rounds >= dailyRoundsTarget,
      accuracyDone: todayAccuracy >= accuracyTarget && progress.dailyStats.rounds >= 6,
      balanceDone:
        progress.dailyStats.byGame.math.rounds > 0 &&
        progress.dailyStats.byGame.memory.rounds > 0 &&
        progress.dailyStats.byGame.color.rounds > 0,
    };
  }, [progress.dailyStats]);
  const comboStatus = useMemo(() => {
    const comboModulo = progress.combo % 3;
    const progressToBadge = comboModulo === 0 && progress.combo > 0 ? 100 : Math.round((comboModulo / 3) * 100);
    const remainingForBadge = comboModulo === 0 ? 3 : 3 - comboModulo;
    const streakProgress = Math.min(100, Math.round((progress.streak / 7) * 100));
    return {
      progressToBadge,
      remainingForBadge,
      streakProgress,
    };
  }, [progress.combo, progress.streak]);
  const coachTip = useMemo(() => {
    if (!playable) {
      return pickLanguageText(
        language,
        "Hom nay da het quota choi. Nghia 1 chut roi quay lai vao ngay mai nhe.",
        "Today's play quota is over. Take a short break and come back tomorrow.",
      );
    }
    if (feedback.tone === "success") {
      return pickLanguageText(language, "Nhip rat tot. Giu combo de mo khoa them huy hieu!", "Great rhythm. Keep your combo to unlock more badges!");
    }
    if (feedback.tone === "error" && wrongStreak >= 2) {
      if (activeGame === "math") {
        return pickLanguageText(
          language,
          "Thu tach phep tinh thanh so nho de tim dap an nhanh hon.",
          "Try splitting the operation into smaller numbers for faster solving.",
        );
      }
      if (activeGame === "memory") {
        return pickLanguageText(
          language,
          "Nhin cum 2 ky hieu 1 lan de nho de hon.",
          "Look at symbols in pairs. It is easier to remember.",
        );
      }
      return pickLanguageText(language, "Tap trung vao MAU chu, dung doc noi dung cua chu.", "Focus on the COLOR of the text, not the word meaning.");
    }
    if (timeLeft <= 6) {
      return pickLanguageText(language, "Sap het gio. Chon dap an nhanh va chinh xac!", "Time is almost over. Pick quickly and stay accurate!");
    }
    return pickLanguageText(language, "Nhan phim 1-4 de tra loi sieu nhanh, phim R de choi lai run.", "Use keys 1-4 to answer fast, and R to restart the run.");
  }, [activeGame, feedback.tone, language, playable, timeLeft, wrongStreak]);
  const roundsUntilBoss = useMemo(() => getRoundsUntilBoss(academyProgress), [academyProgress]);
  const activeZone = academyProgress.zones[academyProgress.activeZoneIndex];
  const activeNode = activeZone.nodes[academyProgress.activeNodeIndex];
  const getZoneTitle = useCallback(
    (zone: AcademyZoneState) => (language === "vi" ? zone.titleVi : zone.titleEn),
    [language],
  );
  const applyAcademyRoundResult = useCallback((isCorrect: boolean) => {
    setAcademyProgress((previous) => {
      const { next, telemetry } = advanceAcademyProgress(previous, isCorrect);
      saveAcademyProgress(next);
      telemetry.forEach((entry) => {
        void trackEvent(entry.event, entry.payload);
      });
      return next;
    });
  }, []);

  const handleWrong = useCallback(
    (reason: "answer_wrong" | "round_timeout") => {
      const nextWrongStreak = wrongStreak + 1;
      const shouldShowHint = nextWrongStreak >= 2;

      updateProgress((previous) => {
        const touched = touchSession(previous);
        const afterWrong = applyWrongAnswer(touched);
        return recordRoundResult(afterWrong, activeGame, false);
      });
      playErrorTone();
      setWrongStreak(nextWrongStreak);

      let text =
        reason === "round_timeout"
          ? pickLanguageText(language, "Het gio roi. Lam tiep cau moi nhe!", "Time is up. Keep going with the next round!")
          : pickLanguageText(language, "Chua dung. Binh tinh va thu lai!", "Not correct yet. Stay calm and try again!");
      if (shouldShowHint) {
        text = `${text} ${getHintForCurrentGame()}`;
        void trackEvent("hint_shown", { game: activeGame, reason });
      }

      setFeedback({
        tone: "error",
        text,
      });
      if (reason === "round_timeout") {
        void trackEvent("round_timeout", { level: level.key, game: activeGame });
      } else {
        void trackEvent("answer_wrong", { level: level.key, game: activeGame });
      }
      applyAcademyRoundResult(false);
      beginRound(activeGame, activeRoundConfig, reason === "round_timeout" ? "timeout" : "answer_wrong");
    },
    [activeGame, activeRoundConfig, applyAcademyRoundResult, beginRound, getHintForCurrentGame, language, level.key, updateProgress, wrongStreak],
  );

  const handleAnswer = useCallback(
    (choice: string | number) => {
      if (answerLocked) {
        return;
      }

      const isCorrect =
        activeGame === "math"
          ? choice === mathQuestion.answer
          : activeGame === "memory"
            ? choice === memoryRound.answer
            : choice === colorRound.answerColorName;

      if (!isCorrect) {
        handleWrong("answer_wrong");
        return;
      }

      const nextCombo = progress.combo + 1;
      const points = calculateEarnedScore(nextCombo, level.baseScore);
      const isComboMilestone = nextCombo > 0 && nextCombo % 3 === 0;
      const isNewHighScore = progress.score + points > progress.highScores[level.key];
      updateProgress((previous) => {
        const touched = touchSession(previous);
        const withPoints = applyCorrectAnswer(touched, level.key, points);
        const withStats = recordRoundResult(withPoints, activeGame, true);
        if (withStats.combo > 0 && withStats.combo % 3 === 0) {
          return grantComboBadge(withStats);
        }
        return withStats;
      });

      setWrongStreak(0);
      playSuccessTone();
      if (isComboMilestone || isNewHighScore) {
        triggerCelebration();
        void trackEvent("celebration_burst", {
          level: level.key,
          game: activeGame,
          comboMilestone: isComboMilestone,
          highScore: isNewHighScore,
        });
      }
      setFeedback({
        tone: "success",
        text:
          language === "vi"
            ? `Chinh xac! +${points} diem. Combo x${nextCombo}.`
            : `Correct! +${points} points. Combo x${nextCombo}.`,
      });
      void trackEvent("answer_correct", { level: level.key, game: activeGame, points });
      applyAcademyRoundResult(true);
      beginRound(activeGame, activeRoundConfig, "answer_correct");
    },
    [
      activeGame,
      activeRoundConfig,
      answerLocked,
      colorRound.answerColorName,
      handleWrong,
      level.baseScore,
      level.key,
      mathQuestion.answer,
      memoryRound.answer,
      language,
      applyAcademyRoundResult,
      progress.combo,
      progress.highScores,
      progress.score,
      beginRound,
      triggerCelebration,
      updateProgress,
    ],
  );

  useEffect(() => {
    if (!playable) return;
    if (timeLeft <= 0) return;

    const timer = window.setTimeout(() => {
      if (timeLeft === 1) {
        setTimeLeft(0);
        handleWrong("round_timeout");
        return;
      }
      setTimeLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [handleWrong, playable, timeLeft]);

  useEffect(() => {
    if (!playable) return;
    if (activeGame !== "memory") return;
    if (memoryRevealLeft <= 0) return;

    const revealTimer = window.setTimeout(() => {
      setMemoryRevealLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearTimeout(revealTimer);
  }, [activeGame, memoryRevealLeft, playable]);

  useEffect(() => {
    if (!playable) return;
    const usageTicker = window.setInterval(() => {
      updateProgress((previous) => addPlayTime(previous, 1000));
    }, 1000);
    return () => window.clearInterval(usageTicker);
  }, [playable, updateProgress]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (tag === "input" || tag === "textarea") {
        return;
      }

      if (event.key === "r" || event.key === "R") {
        event.preventDefault();
        resetRun();
        setWrongStreak(0);
        beginRound(activeGame, activeRoundConfig, "restart");
        setFeedback({
          tone: "info",
          text: pickLanguageText(language, "Da reset run moi (shortcut R).", "Run restarted (shortcut R)."),
        });
        return;
      }

      const idx = Number(event.key) - 1;
      if (idx >= 0 && idx < 4 && currentChoices[idx] !== undefined) {
        event.preventDefault();
        handleAnswer(currentChoices[idx]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeGame, activeRoundConfig, beginRound, currentChoices, handleAnswer, language, resetRun]);

  if (!hydrated) {
    return (
      <main id="cvf-game-root" className={styles.page} data-game="math" data-age={ageGroup}>
        <div className={styles.frame}>
          <section className={styles.heroCard}>{pickLanguageText(language, "Dang tai du lieu game...", "Loading game data...")}</section>
        </div>
      </main>
    );
  }

  const renderMainQuestion = () => {
    if (activeGame === "math") {
      return (
        <>
          <p className={styles.questionValue}>
            {mathQuestion.left} {mathQuestion.operator} {mathQuestion.right} = ?
          </p>
          <p className={styles.questionGloss}>{englishLearningLine}</p>
          <div className={styles.answers}>
            {mathQuestion.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                className={styles.answerButton}
                onClick={() => handleAnswer(choice)}
                disabled={answerLocked}
              >
                {choice}
              </button>
            ))}
          </div>
        </>
      );
    }

    if (activeGame === "memory") {
      return (
        <>
          {memoryRevealLeft > 0 ? (
            <div className={styles.memorySequence}>{memoryRound.sequence.join(" ")}</div>
          ) : (
            <div className={styles.memoryCover}>
              {pickLanguageText(language, "Chuoi da an. Ky hieu nao xuat hien nhieu nhat?", "Sequence hidden. Which symbol appears the most?")}
            </div>
          )}
          <p className={styles.questionGloss}>{englishLearningLine}</p>
          <div className={styles.answers}>
            {memoryRound.choices.map((choice) => (
              <button
                key={choice}
                type="button"
                className={styles.answerButton}
                onClick={() => handleAnswer(choice)}
                disabled={answerLocked}
              >
                {choice}
              </button>
            ))}
          </div>
        </>
      );
    }

    return (
      <>
        <p className={styles.hint}>
          {pickLanguageText(language, "Chon MAU cua chu, khong phai noi dung cua chu.", "Pick the COLOR of the text, not the word meaning.")}
        </p>
        <p className={styles.colorWord} style={{ color: colorRound.wordColorHex }}>
          {language === "vi" ? colorRound.word : getColorEnglishName(colorRound.word)}
        </p>
        <p className={styles.questionGloss}>{englishLearningLine}</p>
        <div className={styles.answers}>
          {colorRound.choices.map((choice) => (
            <button
              key={choice}
              type="button"
              className={styles.answerButton}
              onClick={() => handleAnswer(choice)}
              disabled={answerLocked}
            >
              {getColorChoiceDisplay(choice)}
            </button>
          ))}
        </div>
      </>
    );
  };

  return (
    <main id="cvf-game-root" className={styles.page} data-game={activeGame} data-age={ageGroup}>
      {showOnboarding ? (
        <div className={styles.onboardingBackdrop} role="dialog" aria-modal="true">
          <section className={styles.onboardingCard}>
            <h2>{pickLanguageText(language, "Chao mung den CVF Mini Detective Academy", "Welcome to CVF Mini Detective Academy")}</h2>
            <ul className={styles.onboardingList}>
              <li>{pickLanguageText(language, "Chon 1 trong 3 mini game o hang tab phia tren.", "Choose 1 of 3 mini games on the top tab row.")}</li>
              <li>{pickLanguageText(language, "Nhan phim 1-4 de chon dap an nhanh, nhan R de choi lai run.", "Press keys 1-4 to answer quickly, and press R to restart the run.")}</li>
              <li>{pickLanguageText(language, "Parent Mode cho phep gioi han thoi gian choi moi ngay.", "Parent Mode can limit total daily play time.")}</li>
            </ul>
            <div className={styles.onboardingActions}>
              <button
                type="button"
                className={styles.onboardingButton}
                onClick={() => {
                  window.localStorage.setItem("cvf-mini-onboarding-done", "1");
                  setShowOnboarding(false);
                  void trackEvent("onboarding_complete", { source: "first_launch" });
                }}
              >
                {pickLanguageText(language, "Bat dau choi", "Start Playing")}
              </button>
            </div>
          </section>
        </div>
      ) : null}

      <div className={styles.frame}>
        <section className={styles.hero}>
          <article className={styles.heroCard}>
            <h1>CVF Mini Detective Academy</h1>
            <p>
              {pickLanguageText(
                language,
                "Nhiem vu hom nay: giai ma mini game, giu combo that dai va tro thanh sieu tham tu cua hoc vien.",
                "Today's mission: solve mini games, keep long combos, and become the academy's super detective.",
              )}
            </p>
            <div className={styles.heroMeta}>
              <span className={styles.chip}>{pickLanguageText(language, "Dang choi", "Now playing")}: {gameTitle}</span>
              <span className={styles.chip}>{pickLanguageText(language, "Profile", "Profile")}: {ageProfileLabel}</span>
              <span className={styles.chip}>{pickLanguageText(language, "Ngon ngu", "Language")}: {language.toUpperCase()}</span>
              <span className={styles.chip}>{pickLanguageText(language, "Combo = Diem thuong", "Combo = Bonus points")}</span>
            </div>
            <div className={styles.heroControlGrid}>
              <section className={styles.heroControlCard}>
                <p className={styles.controlTitle}>{pickLanguageText(language, "Do tuoi", "Age group")}</p>
                <div className={styles.segmentedRow}>
                  {(Object.keys(AGE_PROFILES) as AgeGroupKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`${styles.segmentedButton} ${ageGroup === key ? styles.segmentedButtonActive : ""}`}
                      onClick={() => setAgeGroup(key)}
                    >
                      {AGE_PROFILE_LABELS[language][key]}
                    </button>
                  ))}
                </div>
                <p className={styles.controlTitle}>{pickLanguageText(language, "Ngon ngu", "Language")}</p>
                <div className={styles.segmentedRow}>
                  {(["vi", "en"] as UiLanguage[]).map((langKey) => (
                    <button
                      key={langKey}
                      type="button"
                      className={`${styles.segmentedButton} ${language === langKey ? styles.segmentedButtonActive : ""}`}
                      onClick={() => {
                        setLanguage(langKey);
                        void trackEvent("language_switch", { language: langKey });
                      }}
                    >
                      {langKey === "vi" ? "Tieng Viet" : "English"}
                    </button>
                  ))}
                </div>
              </section>
              <section className={styles.heroControlCard}>
                <p className={styles.controlTitle}>{pickLanguageText(language, "Am thanh", "Audio")}</p>
                <div className={styles.audioRow}>
                  <button
                    type="button"
                    className={styles.soundToggle}
                    onClick={() => {
                      const nextMuted = !soundMuted;
                      setSoundMuted(nextMuted);
                      void trackEvent("audio_update", { muted: nextMuted, uiEnabled: uiSfxEnabled });
                    }}
                  >
                    {soundMuted
                      ? pickLanguageText(language, "Bat am thanh", "Unmute")
                      : pickLanguageText(language, "Tat am thanh", "Mute")}
                  </button>
                  <label className={styles.audioLabel} htmlFor="sound-volume">
                    {pickLanguageText(language, "Am luong", "Volume")} {soundVolume}%
                  </label>
                </div>
                <input
                  id="sound-volume"
                  className={styles.volumeSlider}
                  type="range"
                  min={0}
                  max={100}
                  step={5}
                  value={soundVolume}
                  onChange={(event) => {
                    const nextVolume = Number(event.target.value);
                    setSoundVolume(nextVolume);
                    void trackEvent("audio_update", { muted: soundMuted, volume: nextVolume / 100, uiEnabled: uiSfxEnabled });
                  }}
                />
                <label className={styles.uiSfxToggle}>
                  <input
                    type="checkbox"
                    checked={uiSfxEnabled}
                    onChange={(event) => {
                      const nextUiEnabled = event.target.checked;
                      setUiSfxEnabled(nextUiEnabled);
                      void trackEvent("audio_update", { muted: soundMuted, volume: soundVolume / 100, uiEnabled: nextUiEnabled });
                    }}
                  />
                  <span>{pickLanguageText(language, "Hieu ung click/hover", "Click/hover effects")}</span>
                </label>
                <label className={styles.uiSfxToggle}>
                  <input
                    type="checkbox"
                    checked={ttsEnabled}
                    disabled={!ttsSupported}
                    onChange={(event) => {
                      const nextTtsEnabled = event.target.checked;
                      setTtsEnabled(nextTtsEnabled);
                      if (!nextTtsEnabled && typeof window !== "undefined" && "speechSynthesis" in window) {
                        window.speechSynthesis.cancel();
                      }
                      void trackEvent("tts_update", {
                        enabled: nextTtsEnabled,
                        autoReadEnabled,
                      });
                    }}
                  />
                  <span>{pickLanguageText(language, "Doc cau hoi (TTS)", "Read question (TTS)")}</span>
                </label>
                <label className={styles.uiSfxToggle}>
                  <input
                    type="checkbox"
                    checked={autoReadEnabled}
                    disabled={!ttsEnabled || !ttsSupported}
                    onChange={(event) => {
                      const nextAutoRead = event.target.checked;
                      setAutoReadEnabled(nextAutoRead);
                      void trackEvent("tts_update", {
                        enabled: ttsEnabled,
                        autoReadEnabled: nextAutoRead,
                      });
                    }}
                  />
                  <span>{pickLanguageText(language, "Tu dong doc cau moi", "Auto read new question")}</span>
                </label>
                {!ttsSupported ? (
                  <p className={styles.telemetryNote}>
                    {pickLanguageText(language, "Trinh duyet nay khong ho tro TTS.", "This browser does not support TTS.")}
                  </p>
                ) : null}
              </section>
            </div>
            <p className={styles.telemetryNote}>
              {pickLanguageText(
                language,
                "Telemetry chi ghi event an danh, khong thu thap thong tin ca nhan cua tre.",
                "Telemetry only records anonymous events. No child personal data is collected.",
              )}
            </p>
            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.primaryCta}
                onClick={() => {
                  document.getElementById("mission-zone")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {pickLanguageText(language, "Vao tran ngay", "Play Now")}
              </button>
              <button type="button" className={styles.secondaryCta} onClick={() => setShowOnboarding(true)}>
                {pickLanguageText(language, "Xem huong dan nhanh", "Quick Guide")}
              </button>
            </div>
          </article>
          <div className={styles.playgroundWrap}>
            <PhaserPlayground className={styles.playground} />
            <span className={styles.playgroundLabel}>{pickLanguageText(language, "Phaser playground live", "Phaser playground live")}</span>
          </div>
        </section>

        <section className={styles.mapStrip} aria-label={pickLanguageText(language, "Ban do hoc vien", "Academy map")}>
          <header className={styles.mapHeader}>
            <h2>{pickLanguageText(language, "Ban do Hoc Vien", "Academy Map")}</h2>
            <p>
              {pickLanguageText(
                language,
                `Dang o ${getZoneTitle(activeZone)} - ${language === "vi" ? activeNode.labelVi : activeNode.labelEn} (${activeNode.correctCount}/${activeNode.requiredCorrect})`,
                `Current zone ${getZoneTitle(activeZone)} - ${language === "vi" ? activeNode.labelVi : activeNode.labelEn} (${activeNode.correctCount}/${activeNode.requiredCorrect})`,
              )}
            </p>
          </header>
          <div className={styles.mapGrid}>
            {academyProgress.zones.map((zone, zoneIdx) => {
              const completedNodes = zone.nodes.filter((node) => node.completed).length;
              const progressPercent = Math.round((completedNodes / zone.nodes.length) * 100);
              const isActiveZone = zoneIdx === academyProgress.activeZoneIndex;
              return (
                <article
                  key={zone.key}
                  className={`${styles.mapZoneCard} ${zone.unlocked ? "" : styles.mapZoneLocked} ${isActiveZone ? styles.mapZoneActive : ""}`}
                >
                  <p className={styles.mapZoneTitle}>{getZoneTitle(zone)}</p>
                  <p className={styles.mapZoneHint}>
                    {zone.unlocked
                      ? pickLanguageText(language, `${completedNodes}/${zone.nodes.length} node hoan thanh`, `${completedNodes}/${zone.nodes.length} nodes completed`)
                      : pickLanguageText(language, "Khoa", "Locked")}
                  </p>
                  <div className={styles.mapTrack} role="presentation" aria-hidden>
                    <span className={styles.mapFill} style={{ width: `${progressPercent}%` }} />
                  </div>
                </article>
              );
            })}
          </div>
          <p className={styles.mapBossHint}>
            {roundsUntilBoss === 5
              ? pickLanguageText(language, "Boss round da san sang khi dat moc 5 vong.", "Boss round will trigger at the 5-round milestone.")
              : pickLanguageText(language, `Con ${roundsUntilBoss} vong nua den boss round.`, `${roundsUntilBoss} rounds until boss round.`)}
          </p>
        </section>

        <MiniGameTabs
          activeKey={activeGame}
          labels={miniGameLabels}
          onSelect={(nextGame) => {
            const nextRound = getRoundConfig(nextGame, level.key, ageGroup);
            setActiveGame(nextGame);
            setWrongStreak(0);
            beginRound(nextGame, nextRound, "switch_game");
            setFeedback({
              tone: "info",
              text:
                language === "vi"
                  ? `${miniGameLabels[nextGame].title} san sang!`
                  : `${miniGameLabels[nextGame].title} is ready!`,
            });
            void trackEvent("game_switch", { game: nextGame, level: level.key });
          }}
        />

        <LevelSelector
          selected={levelKey}
          labels={levelLabels}
          onSelect={(nextLevelKey) => {
            const nextRound = getRoundConfig(activeGame, nextLevelKey, ageGroup);
            setLevelKey(nextLevelKey);
            setWrongStreak(0);
            beginRound(activeGame, nextRound, "switch_level", nextLevelKey);
            setFeedback({
              tone: "info",
              text:
                language === "vi"
                  ? `${levelLabels[nextLevelKey].label} da kich hoat cho ${gameTitle}.`
                  : `${levelLabels[nextLevelKey].label} is now active for ${gameTitle}.`,
            });
          }}
        />

        <GameHud
          score={progress.score}
          combo={progress.combo}
          highScore={progress.highScores[level.key]}
          streak={progress.streak}
          timeLeft={timeLeft}
          language={language}
        />

        <section className={styles.questStrip} aria-label={pickLanguageText(language, "Nhiem vu hom nay", "Today missions")}>
          <article className={styles.questCard}>
            <p className={styles.questTitle}>{pickLanguageText(language, "Nhiem vu 1: Choi deu tay", "Mission 1: Keep Playing")}</p>
            <p className={styles.questHint}>{pickLanguageText(language, "Hoan thanh 12 vong trong ngay.", "Finish 12 rounds today.")}</p>
            <div className={styles.questTrack} role="presentation" aria-hidden>
              <span className={styles.questFill} style={{ width: `${questProgress.roundsProgress}%` }} />
            </div>
            <p className={styles.questValue}>{progress.dailyStats.rounds}/12</p>
          </article>
          <article className={styles.questCard}>
            <p className={styles.questTitle}>{pickLanguageText(language, "Nhiem vu 2: Chinh xac", "Mission 2: Accuracy")}</p>
            <p className={styles.questHint}>{pickLanguageText(language, "Dat do chinh xac >= 70%.", "Reach accuracy >= 70%.")}</p>
            <div className={styles.questTrack} role="presentation" aria-hidden>
              <span className={styles.questFill} style={{ width: `${questProgress.accuracyProgress}%` }} />
            </div>
            <p className={styles.questValue}>{questProgress.todayAccuracy}%</p>
          </article>
          <article className={styles.questCard}>
            <p className={styles.questTitle}>{pickLanguageText(language, "Nhiem vu 3: Da nang", "Mission 3: Variety")}</p>
            <p className={styles.questHint}>{pickLanguageText(language, "Moi mini game choi it nhat 1 lan.", "Play each mini game at least once.")}</p>
            <div className={styles.questMiniGrid}>
              <span className={`${styles.questMiniPill} ${questProgress.mathProgress > 0 ? styles.questMiniDone : ""}`}>
                {pickLanguageText(language, "Toan", "Math")}
              </span>
              <span className={`${styles.questMiniPill} ${questProgress.memoryProgress > 0 ? styles.questMiniDone : ""}`}>
                {pickLanguageText(language, "Nho", "Memory")}
              </span>
              <span className={`${styles.questMiniPill} ${questProgress.colorProgress > 0 ? styles.questMiniDone : ""}`}>
                {pickLanguageText(language, "Mau", "Color")}
              </span>
            </div>
            <p className={styles.questValue}>{questProgress.balanceDone ? pickLanguageText(language, "Hoan thanh", "Done") : pickLanguageText(language, "Dang mo", "In progress")}</p>
          </article>
        </section>

        <section className={styles.arcadeStrip} aria-label={pickLanguageText(language, "Bang trang thai tran dau", "Match status board")}>
          <article className={styles.arcadeCard}>
            <p className={styles.arcadeTitle}>Combo Reactor</p>
            <p className={styles.arcadeHint}>
              {pickLanguageText(
                language,
                `Con ${comboStatus.remainingForBadge} cau dung nua de no huy hieu.`,
                `${comboStatus.remainingForBadge} more correct answers to ignite a badge.`,
              )}
            </p>
            <div className={styles.arcadeTrack} role="presentation" aria-hidden>
              <span className={styles.arcadeFill} style={{ width: `${comboStatus.progressToBadge}%` }} />
            </div>
            <p className={styles.arcadeValue}>x{progress.combo}</p>
          </article>
          <article className={styles.arcadeCard}>
            <p className={styles.arcadeTitle}>{pickLanguageText(language, "Nang luong vong", "Round Energy")}</p>
            <p className={styles.arcadeHint}>
              {pickLanguageText(
                language,
                `Giu nhip trong ${activeRoundConfig.roundSeconds}s de dat diem cao.`,
                `Keep your rhythm in ${activeRoundConfig.roundSeconds}s to maximize points.`,
              )}
            </p>
            <div className={styles.arcadeTrack} role="presentation" aria-hidden>
              <span className={styles.arcadeFillWarm} style={{ width: `${Math.round(timeRatio * 100)}%` }} />
            </div>
            <p className={styles.arcadeValue}>{Math.round(timeRatio * 100)}%</p>
          </article>
          <article className={styles.arcadeCard}>
            <p className={styles.arcadeTitle}>Coach Bot</p>
            <p className={styles.arcadeHint}>{coachTip}</p>
            <div className={styles.arcadeTrack} role="presentation" aria-hidden>
              <span className={styles.arcadeFillCool} style={{ width: `${comboStatus.streakProgress}%` }} />
            </div>
            <p className={styles.arcadeValue}>
              {pickLanguageText(language, "Streak", "Streak")} {progress.streak}/7
            </p>
          </article>
        </section>

        <section
          id="mission-zone"
          className={`${styles.questionCard} ${timeLeft <= 6 ? styles.questionCardDanger : ""} ${
            feedback.tone === "success" ? styles.questionCardBoost : ""
          }`}
        >
          {showCelebration ? (
            <div className={styles.confettiLayer} aria-hidden>
              <span className={styles.confettiMessage}>{pickLanguageText(language, "Tuyet voi!", "Awesome!")}</span>
              {Array.from({ length: 14 }, (_, idx) => (
                <span key={`${celebrationSeed}-${idx}`} className={styles.confettiPiece} />
              ))}
            </div>
          ) : null}
          <header className={styles.questionHeader}>
            <div>
              <h2>{gameTitle}</h2>
              <p className={styles.hint}>
                {activeGame === "memory" && memoryRevealLeft > 0
                  ? pickLanguageText(
                      language,
                      `Nho ky chuoi trong ${memoryRevealLeft}s truoc khi bi an.`,
                      `Memorize the sequence in ${memoryRevealLeft}s before it hides.`,
                    )
                  : pickLanguageText(language, "Dung lien tiep de tang combo va mo khoa huy hieu.", "Keep answering correctly to build combo and unlock badges.")}
              </p>
            </div>
            <div className={styles.questionHeaderRight}>
              <button
                type="button"
                className={styles.ttsButton}
                disabled={!ttsEnabled || soundMuted || !ttsSupported}
                onClick={() => speakCurrentPrompt("manual")}
              >
                {pickLanguageText(language, "Doc cau hoi", "Read question")}
              </button>
              {!playable ? <p className={styles.blocked}>{pickLanguageText(language, "Da het gio choi hom nay.", "Today's play time is over.")}</p> : null}
            </div>
          </header>
          <div className={styles.timerCluster}>
            <p className={styles.timerLabel}>{pickLanguageText(language, "Dong ho vong", "Round timer")}: {timeLeft}s</p>
            <div className={styles.timerTrack} role="presentation" aria-hidden>
              <span className={styles.timerFill} style={{ width: `${Math.round(timeRatio * 100)}%` }} />
            </div>
          </div>

          {renderMainQuestion()}

          <p className={`${styles.feedback} ${feedbackClass(feedback.tone)}`} aria-live="polite">
            {feedback.text}
          </p>

          <button
            type="button"
            className={styles.restartButton}
            onClick={() => {
              resetRun();
              setWrongStreak(0);
              beginRound(activeGame, activeRoundConfig, "restart");
              setFeedback({
                tone: "info",
                text: pickLanguageText(language, "Da reset run moi. Co gang pha ky luc nao!", "Run restarted. Let's break your high score!"),
              });
              void trackEvent("restart_run", { level: level.key, game: activeGame });
            }}
          >
            {pickLanguageText(language, "Choi lai tu dau", "Restart Run")}
          </button>
        </section>

        <section className={styles.metaRow}>
          <BadgeShelf badges={progress.badges} language={language} />
          <ParentModePanel
            settings={progress.parentMode}
            remainingMinutes={remainingMinutes}
            report={parentReport}
            language={language}
            locked={parentLocked}
            parentMessage={parentMessage}
            onUnlock={(pin) => {
              if (verifyParentPin(progress, pin)) {
                setParentUnlocked(true);
                setParentMessage(pickLanguageText(language, "Da mo khoa khu vuc phu huynh.", "Parent area unlocked."));
                void trackEvent("parent_unlock", { success: true });
              } else {
                setParentMessage(pickLanguageText(language, "PIN khong dung. Vui long thu lai.", "Incorrect PIN. Please try again."));
                void trackEvent("parent_unlock", { success: false });
              }
            }}
            onSetPin={(pin) => {
              const normalized = pin.trim();
              const isValid = /^[0-9]{4,6}$/.test(normalized);
              if (!isValid) {
                setParentMessage(pickLanguageText(language, "PIN can 4-6 chu so.", "PIN must have 4-6 digits."));
                return;
              }
              setParentPin(normalized);
              setParentUnlocked(false);
              setParentMessage(pickLanguageText(language, "Da luu PIN va khoa lai khu vuc phu huynh.", "PIN saved and parent area locked again."));
              void trackEvent("parent_pin_update", { length: normalized.length });
            }}
            onLock={() => {
              setParentUnlocked(false);
              setParentMessage(pickLanguageText(language, "Da khoa khu vuc phu huynh.", "Parent area locked."));
            }}
            onResetAll={() => {
              resetAllProgress();
              const freshAcademy = getDefaultAcademyProgress();
              setAcademyProgress(freshAcademy);
              saveAcademyProgress(freshAcademy);
              setParentUnlocked(false);
              setParentMessage(pickLanguageText(language, "Da reset toan bo du lieu choi.", "All game data has been reset."));
              setWrongStreak(0);
              beginRound(activeGame, activeRoundConfig, "reset_all");
            }}
            onToggle={(enabled) => {
              if (parentLocked) {
                setParentMessage(pickLanguageText(language, "Can mo khoa Parent Mode truoc khi thay doi.", "Please unlock Parent Mode before changing settings."));
                return;
              }
              setParentMode(enabled, progress.parentMode.dailyLimitMinutes);
              void trackEvent("parent_mode_update", { enabled });
              setParentMessage(pickLanguageText(language, "Da cap nhat Parent Mode.", "Parent Mode updated."));
            }}
            onLimitChange={(minutes) => {
              if (parentLocked) {
                setParentMessage(pickLanguageText(language, "Can mo khoa Parent Mode truoc khi thay doi.", "Please unlock Parent Mode before changing settings."));
                return;
              }
              updateProgress((previous) => updateParentMode(previous, { dailyLimitMinutes: minutes }));
              void trackEvent("parent_mode_update", { limit: minutes });
              setParentMessage(
                pickLanguageText(
                  language,
                  `Da cap nhat gioi han: ${minutes} phut/ngay.`,
                  `Daily limit updated: ${minutes} min/day.`,
                ),
              );
            }}
          />
        </section>
      </div>
    </main>
  );
}
