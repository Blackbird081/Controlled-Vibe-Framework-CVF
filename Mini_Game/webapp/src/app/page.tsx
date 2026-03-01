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
  getCompareHint,
  getColorEnglishName,
  getColorHint,
  getColorMarker,
  getLogicHint,
  getMathHint,
  getMemoryHint,
  getVocabHint,
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
  getBossRoundNumber,
  getDefaultAcademyProgress,
  getRoundsUntilBoss,
  isBossRound,
  loadAcademyProgress,
  saveAcademyProgress,
} from "@/lib/progression-service";
import {
  ContentAdaptiveTuning,
  ContentBankState,
  getDefaultContentBankState,
  getAgeGameCopy,
  getNextCompareRound,
  getNextColorRound,
  getNextLogicRound,
  getNextMathRound,
  getNextMemoryRound,
  getNextVocabRound,
  getWeeklyThemeLabel,
  loadContentBankState,
  saveContentBankState,
} from "@/lib/content-bank";
import {
  appendAdaptiveOutcome,
  getAdaptiveGameTuning,
  getDefaultAdaptiveEngineState,
  loadAdaptiveEngineState,
  saveAdaptiveEngineState,
} from "@/lib/adaptive-engine";
import {
  getDefaultLearningPathState,
  getLearningSuggestion,
  LearningPathState,
  loadLearningPathState,
  saveLearningPathState,
  updateLearningPathState,
} from "@/lib/learning-path-service";
import {
  buildWeeklyReport,
  getDefaultReportHistoryState,
  getYesterdayEntry,
  loadReportHistoryState,
  saveReportHistoryState,
  syncTodayMetrics,
} from "@/lib/report-service";
import {
  RewardState,
  equipAvatar,
  equipPet,
  equipTool,
  getDefaultRewardState,
  getSelfChallengeStatus,
  getUnlockedAvatars,
  getUnlockedPets,
  getUnlockedTools,
  loadRewardState,
  markSelfChallengeWin,
  openDailyChest,
  saveRewardState,
  syncStickersFromBadges,
} from "@/lib/rewards-service";
import { useGameStore } from "@/lib/store/game-store";
import { trackEvent } from "@/lib/telemetry";
import { ExperimentAssignment, getOrCreateExperimentAssignment } from "@/lib/experiment-service";
import styles from "./page.module.css";

type FeedbackTone = "success" | "error" | "info";
type AgeGroupKey = "age_5_6" | "age_7_8" | "age_9_10";
type UiLanguage = "vi" | "en";
type DashboardView = "play" | "progress" | "parent" | "settings";

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
    logic: {
      title: "Logic Chuoi",
      description: "Tim quy luat day so va chon so tiep theo.",
    },
    compare: {
      title: "So Sanh So",
      description: "So sanh 2 so va chon so lon hon.",
    },
    vocab: {
      title: "Tu Vung Song Ngu",
      description: "Noi cap tu Viet-Anh dung nghia.",
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
    logic: {
      title: "Logic Sequence",
      description: "Find number pattern rules and pick the next value.",
    },
    compare: {
      title: "Number Compare",
      description: "Compare two numbers and choose the larger one.",
    },
    vocab: {
      title: "Bilingual Vocab",
      description: "Match Vietnamese and English word pairs.",
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

const LEVEL_ORDER: LevelKey[] = ["rookie", "talent", "master"];
const DAILY_ROUNDS_TARGET = 18;

function getUnlockedLevelByAcademyProgress(activeZoneIndex: number): LevelKey {
  if (activeZoneIndex >= 2) return "master";
  if (activeZoneIndex >= 1) return "talent";
  return "rookie";
}

function isLevelUnlocked(level: LevelKey, highest: LevelKey): boolean {
  return LEVEL_ORDER.indexOf(level) <= LEVEL_ORDER.indexOf(highest);
}

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
  const [contentBankState, setContentBankState] = useState<ContentBankState>(() => getDefaultContentBankState());
  const [mathQuestion, setMathQuestion] = useState(() => getNextMathRound(level.limit, getDefaultContentBankState()).round);
  const [memoryRound, setMemoryRound] = useState(() => getNextMemoryRound(level.limit, getDefaultContentBankState()).round);
  const [colorRound, setColorRound] = useState(() => getNextColorRound(getDefaultContentBankState()).round);
  const [logicRound, setLogicRound] = useState(() => getNextLogicRound(level.limit, getDefaultContentBankState()).round);
  const [compareRound, setCompareRound] = useState(() => getNextCompareRound(level.limit, getDefaultContentBankState()).round);
  const [vocabRound, setVocabRound] = useState(() => getNextVocabRound(getDefaultContentBankState()).round);
  const [memoryRevealLeft, setMemoryRevealLeft] = useState(0);
  const [wrongStreak, setWrongStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(level.roundSeconds);
  const [roundDurationSeconds, setRoundDurationSeconds] = useState(level.roundSeconds);
  const [ageGroup, setAgeGroup] = useState<AgeGroupKey>("age_7_8");
  const [language, setLanguage] = useState<UiLanguage>("vi");
  const [activeView, setActiveView] = useState<DashboardView>("play");
  const [isMobileLayout, setIsMobileLayout] = useState(false);
  const [soundMuted, setSoundMuted] = useState(false);
  const [soundVolume, setSoundVolume] = useState(75);
  const [uiSfxEnabled, setUiSfxEnabled] = useState(true);
  const [ttsSupported, setTtsSupported] = useState(true);
  const [ttsEnabled, setTtsEnabled] = useState(true);
  const [autoReadEnabled, setAutoReadEnabled] = useState(true);
  const [colorAssistEnabled, setColorAssistEnabled] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [celebrationSeed, setCelebrationSeed] = useState(0);
  const [experimentAssignment, setExperimentAssignment] = useState<ExperimentAssignment>({
    layoutVariant: "compact",
    rewardPromptVariant: "standard",
  });
  const [parentUnlocked, setParentUnlocked] = useState(false);
  const [parentMessage, setParentMessage] = useState<string | null>(null);
  const [academyProgress, setAcademyProgress] = useState(() => getDefaultAcademyProgress());
  const [rewardState, setRewardState] = useState<RewardState>(() => getDefaultRewardState());
  const [reportHistory, setReportHistory] = useState(() => getDefaultReportHistoryState());
  const [adaptiveState, setAdaptiveState] = useState(() => getDefaultAdaptiveEngineState());
  const [learningPathState, setLearningPathState] = useState<LearningPathState>(() => getDefaultLearningPathState());
  const [feedback, setFeedback] = useState<{ tone: FeedbackTone; text: string }>({
    tone: "info",
    text: "Chon mini game va bat dau hanh trinh hoc ma choi!",
  });
  const previousAgeGroupRef = useRef<AgeGroupKey | null>(null);
  const previousViewRef = useRef<DashboardView | null>(null);
  const spokenRoundRef = useRef<string | null>(null);
  const selfChallengeCelebratedRef = useRef<string | null>(null);
  const sessionStartedAtRef = useRef<number | null>(null);
  const retentionPingSentRef = useRef(false);
  const settingsPanelRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia("(max-width: 740px)");
    const handleChange = (event: MediaQueryListEvent) => {
      setIsMobileLayout(event.matches);
    };

    setIsMobileLayout(mediaQuery.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  useEffect(() => {
    if (!isMobileLayout || activeView !== "settings") return;
    const frameId = window.requestAnimationFrame(() => {
      settingsPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    return () => window.cancelAnimationFrame(frameId);
  }, [activeView, isMobileLayout]);

  const startRound = useCallback((
    game: MiniGameKey,
    limit: number,
    roundSeconds: number,
    memoryRevealBonus = 0,
    targetAgeGroup: AgeGroupKey = ageGroup,
    adaptiveTuning: ContentAdaptiveTuning = {},
  ) => {
    setContentBankState((previous) => {
      if (game === "math") {
        const nextRound = getNextMathRound(limit, previous, targetAgeGroup, adaptiveTuning);
        setMathQuestion(nextRound.round);
        setMemoryRevealLeft(0);
        saveContentBankState(nextRound.nextState);
        return nextRound.nextState;
      }
      if (game === "memory") {
        const nextRound = getNextMemoryRound(limit, previous, targetAgeGroup, adaptiveTuning);
        setMemoryRound(nextRound.round);
        setMemoryRevealLeft(nextRound.round.revealSeconds + memoryRevealBonus);
        saveContentBankState(nextRound.nextState);
        return nextRound.nextState;
      }
      if (game === "logic") {
        const nextRound = getNextLogicRound(limit, previous, targetAgeGroup, adaptiveTuning);
        setLogicRound(nextRound.round);
        setMemoryRevealLeft(0);
        saveContentBankState(nextRound.nextState);
        return nextRound.nextState;
      }
      if (game === "compare") {
        const nextRound = getNextCompareRound(limit, previous, targetAgeGroup, adaptiveTuning);
        setCompareRound(nextRound.round);
        setMemoryRevealLeft(0);
        saveContentBankState(nextRound.nextState);
        return nextRound.nextState;
      }
      if (game === "vocab") {
        const nextRound = getNextVocabRound(previous, targetAgeGroup);
        setVocabRound(nextRound.round);
        setMemoryRevealLeft(0);
        saveContentBankState(nextRound.nextState);
        return nextRound.nextState;
      }
      const nextRound = getNextColorRound(previous, targetAgeGroup, adaptiveTuning);
      setColorRound(nextRound.round);
      setMemoryRevealLeft(0);
      saveContentBankState(nextRound.nextState);
      return nextRound.nextState;
    });
    setRoundDurationSeconds(roundSeconds);
    setTimeLeft(roundSeconds);
  }, [ageGroup]);

  const getHintForCurrentGame = useCallback((): string => {
    if (activeGame === "math") {
      return getMathHint(mathQuestion, language);
    }
    if (activeGame === "memory") {
      return getMemoryHint(memoryRound.answer, language);
    }
    if (activeGame === "logic") {
      return getLogicHint(logicRound, language);
    }
    if (activeGame === "compare") {
      return getCompareHint(compareRound, language);
    }
    if (activeGame === "vocab") {
      return getVocabHint(vocabRound, language);
    }
    return getColorHint(colorRound.answerColorName, language);
  }, [activeGame, colorRound.answerColorName, compareRound, language, logicRound, mathQuestion, memoryRound.answer, vocabRound]);

  const miniGameLabels = useMemo(() => {
    const base = MINI_GAME_LABELS[language];
    return {
      math: {
        title: base.math.title,
        description: getAgeGameCopy(ageGroup, "math", language).description,
      },
      memory: {
        title: base.memory.title,
        description: getAgeGameCopy(ageGroup, "memory", language).description,
      },
      color: {
        title: base.color.title,
        description: getAgeGameCopy(ageGroup, "color", language).description,
      },
      logic: {
        title: base.logic.title,
        description: getAgeGameCopy(ageGroup, "logic", language).description,
      },
      compare: {
        title: base.compare.title,
        description: getAgeGameCopy(ageGroup, "compare", language).description,
      },
      vocab: {
        title: base.vocab.title,
        description: getAgeGameCopy(ageGroup, "vocab", language).description,
      },
    };
  }, [ageGroup, language]);
  const levelLabels = useMemo(() => LEVEL_LABELS[language], [language]);
  const dashboardViewLabels = useMemo(
    () => ({
      play: pickLanguageText(language, "Tro choi", "Play"),
      progress: pickLanguageText(language, "Tien trinh", "Progress"),
      parent: pickLanguageText(language, "Phu huynh", "Parent"),
      settings: pickLanguageText(language, "Cai dat", "Settings"),
    }),
    [language],
  );
  const gameTitle = useMemo(
    () => miniGameLabels[activeGame]?.title ?? pickLanguageText(language, "Mini Game", "Mini Game"),
    [activeGame, language, miniGameLabels],
  );
  const activeAdaptiveTuning = useMemo(
    () => getAdaptiveGameTuning(adaptiveState, activeGame),
    [activeGame, adaptiveState],
  );
  const learningSuggestion = useMemo(
    () => getLearningSuggestion(learningPathState, activeGame),
    [activeGame, learningPathState],
  );
  const adaptiveBandLabel = useMemo(() => {
    if (activeAdaptiveTuning.band === "assist") {
      return pickLanguageText(language, "Adaptive: ho tro", "Adaptive: assist");
    }
    if (activeAdaptiveTuning.band === "challenge") {
      return pickLanguageText(language, "Adaptive: thu thach", "Adaptive: challenge");
    }
    return pickLanguageText(language, "Adaptive: can bang", "Adaptive: steady");
  }, [activeAdaptiveTuning.band, language]);
  const recommendedGameTitle = useMemo(
    () => miniGameLabels[learningSuggestion.recommendedGame]?.title ?? learningSuggestion.recommendedGame,
    [learningSuggestion.recommendedGame, miniGameLabels],
  );
  const activeAgeGameCopy = useMemo(
    () => getAgeGameCopy(ageGroup, activeGame, language),
    [activeGame, ageGroup, language],
  );
  const getRoundConfig = useCallback(
    (game: MiniGameKey, targetLevelKey: LevelKey = level.key, targetAgeGroup: AgeGroupKey = ageGroup) => {
      const targetLevel = LEVELS[targetLevelKey];
      const profile = AGE_PROFILES[targetAgeGroup];
      return {
        limit: game === "math" || game === "logic" || game === "compare"
          ? Math.min(targetLevel.limit, profile.maxMathLimit)
          : targetLevel.limit,
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
  const timeRatio = Math.max(0, Math.min(1, timeLeft / Math.max(1, roundDurationSeconds)));
  const getBossMetaByTotalRounds = useCallback((totalRounds: number) => {
    const probe = {
      ...academyProgress,
      totalRounds,
    };
    return {
      isBossRound: isBossRound(probe),
      bossRoundNumber: getBossRoundNumber(probe),
    };
  }, [academyProgress]);
  const currentBossRoundMeta = useMemo(
    () => getBossMetaByTotalRounds(academyProgress.totalRounds),
    [academyProgress.totalRounds, getBossMetaByTotalRounds],
  );
  const weeklyThemeLabel = useMemo(
    () => getWeeklyThemeLabel(contentBankState.theme, language),
    [contentBankState.theme, language],
  );
  const getRuntimeRoundConfig = useCallback(
    (
      config: { limit: number; roundSeconds: number; memoryRevealBonusSeconds: number },
      totalRounds: number,
    ) => {
      const bossMeta = getBossMetaByTotalRounds(totalRounds);
      if (!bossMeta.isBossRound) {
        return {
          ...config,
          scoreMultiplier: 1,
          bossRound: false,
          bossRoundNumber: bossMeta.bossRoundNumber,
        };
      }
      const bossRoundSeconds = Math.max(10, config.roundSeconds - (ageGroup === "age_5_6" ? 4 : 6));
      const bossMemoryBonus = Math.max(0, config.memoryRevealBonusSeconds - 1);
      return {
        ...config,
        roundSeconds: bossRoundSeconds,
        memoryRevealBonusSeconds: bossMemoryBonus,
        scoreMultiplier: 2,
        bossRound: true,
        bossRoundNumber: bossMeta.bossRoundNumber,
      };
    },
    [ageGroup, getBossMetaByTotalRounds],
  );
  const currentRoundKey = useMemo(() => {
    if (activeGame === "math") {
      return `math:${mathQuestion.left}:${mathQuestion.operator}:${mathQuestion.right}:${mathQuestion.answer}`;
    }
    if (activeGame === "memory") {
      return `memory:${memoryRound.sequence.join("")}:${memoryRound.answer}`;
    }
    if (activeGame === "logic") {
      return `logic:${logicRound.sequence.join("-")}:${logicRound.answer}`;
    }
    if (activeGame === "compare") {
      return `compare:${compareRound.left}:${compareRound.right}:${compareRound.answer}`;
    }
    if (activeGame === "vocab") {
      return `vocab:${vocabRound.direction}:${vocabRound.prompt}:${vocabRound.answer}`;
    }
    return `color:${colorRound.word}:${colorRound.wordColorHex}:${colorRound.answerColorName}`;
  }, [
    activeGame,
    colorRound.answerColorName,
    colorRound.word,
    colorRound.wordColorHex,
    compareRound.answer,
    compareRound.left,
    compareRound.right,
    logicRound.answer,
    logicRound.sequence,
    mathQuestion,
    memoryRound.answer,
    memoryRound.sequence,
    vocabRound.answer,
    vocabRound.direction,
    vocabRound.prompt,
  ]);
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
    if (activeGame === "logic") {
      const seq = logicRound.sequence.join(", ");
      return language === "vi"
        ? `Logic chuoi: ${seq}. So tiep theo la so nao?`
        : `Logic sequence: ${seq}. Which number comes next?`;
    }
    if (activeGame === "compare") {
      return language === "vi"
        ? `So sanh nhanh: ${compareRound.left} va ${compareRound.right}. Hay chon so lon hon.`
        : `Quick compare: ${compareRound.left} and ${compareRound.right}. Choose the larger number.`;
    }
    if (activeGame === "vocab") {
      return vocabRound.direction === "vi_to_en"
        ? pickLanguageText(
            language,
            `Tu tieng Anh cua "${vocabRound.prompt}" la gi?`,
            `What is the English word for "${vocabRound.prompt}"?`,
          )
        : pickLanguageText(
            language,
            `Tu tieng Viet cua "${vocabRound.prompt}" la gi?`,
            `What is the Vietnamese word for "${vocabRound.prompt}"?`,
          );
    }
    return language === "vi"
      ? `Phan xa mau. Tu hien thi la ${colorRound.word}. Hay chon mau cua chu dang hien thi.`
      : `Color reflex. The shown word is ${getColorEnglishName(colorRound.word)}. Pick the color of the text.`;
  }, [
    activeGame,
    colorRound.word,
    compareRound.left,
    compareRound.right,
    language,
    logicRound.sequence,
    mathQuestion.left,
    mathQuestion.operator,
    mathQuestion.right,
    memoryRevealLeft,
    vocabRound.direction,
    vocabRound.prompt,
  ]);
  const englishLearningLine = useMemo(() => {
    if (activeGame === "math") {
      return `English: What is ${mathQuestion.left} ${mathQuestion.operator === "+" ? "plus" : "minus"} ${mathQuestion.right}?`;
    }
    if (activeGame === "memory") {
      return memoryRevealLeft > 0
        ? "English: Remember the symbols."
        : "English: Which symbol appears the most?";
    }
    if (activeGame === "logic") {
      return "English: Find the sequence rule and choose the next number.";
    }
    if (activeGame === "compare") {
      return "English: Compare two numbers and pick the larger one.";
    }
    if (activeGame === "vocab") {
      return vocabRound.direction === "vi_to_en"
        ? `English: "${vocabRound.prompt}" means "${vocabRound.answer}".`
        : `English: "${vocabRound.answer}" means "${vocabRound.prompt}".`;
    }
    return "English: Choose the COLOR of the word.";
  }, [activeGame, mathQuestion.left, mathQuestion.operator, mathQuestion.right, memoryRevealLeft, vocabRound.answer, vocabRound.direction, vocabRound.prompt]);
  const getColorChoiceDisplay = useCallback(
    (choice: string) => {
      const marker = colorAssistEnabled ? ` ${getColorMarker(choice)}` : "";
      return language === "vi"
        ? `${choice} / ${getColorEnglishName(choice)}${marker}`
        : `${getColorEnglishName(choice)} / ${choice}${marker}`;
    },
    [colorAssistEnabled, language],
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
      totalRoundsForRound: number = academyProgress.totalRounds,
    ) => {
      const runtime = getRuntimeRoundConfig(config, totalRoundsForRound);
      const adaptive = getAdaptiveGameTuning(adaptiveState, game);
      const tunedLimit = game === "math" || game === "logic" || game === "compare"
        ? Math.max(10, runtime.limit + adaptive.mathLimitDelta)
        : runtime.limit;
      const tunedRoundSeconds = Math.max(10, runtime.roundSeconds + adaptive.roundSecondsDelta);
      const tunedMemoryBonus = Math.max(0, runtime.memoryRevealBonusSeconds + adaptive.memoryRevealDelta);
      const contentAdaptive: ContentAdaptiveTuning = {
        mathLimitDelta: adaptive.mathLimitDelta,
        mathDeltaMode: adaptive.mathDeltaMode,
        memoryComplexityDelta: adaptive.memoryComplexityDelta,
        colorMatchDelta: adaptive.colorMatchDelta,
      };
      const suggestion = getLearningSuggestion(learningPathState, game);
      startRound(game, tunedLimit, tunedRoundSeconds, tunedMemoryBonus, ageGroup, contentAdaptive);
      void trackEvent("round_start", {
        game,
        level: telemetryLevel,
        source,
        ageGroup,
        roundSeconds: tunedRoundSeconds,
        bossRound: runtime.bossRound,
        bossRoundNumber: runtime.bossRoundNumber,
        weeklyTheme: contentBankState.theme,
        adaptiveBand: adaptive.band,
        recommendedGame: suggestion.recommendedGame,
      });
      if (runtime.bossRound) {
        void trackEvent("boss_round_start", {
          game,
          level: telemetryLevel,
          bossRoundNumber: runtime.bossRoundNumber,
        });
      }
    },
    [
      academyProgress.totalRounds,
      adaptiveState,
      ageGroup,
      contentBankState.theme,
      getRuntimeRoundConfig,
      learningPathState,
      level.key,
      startRound,
    ],
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
    if (sessionStartedAtRef.current === null) {
      sessionStartedAtRef.current = Date.now();
    }
  }, [hydrated]);

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
    if (!hydrated) return;
    setContentBankState(loadContentBankState());
    setRewardState(loadRewardState());
    setReportHistory(loadReportHistoryState());
    setAdaptiveState(loadAdaptiveEngineState());
    setLearningPathState(loadLearningPathState());
    const assignment = getOrCreateExperimentAssignment();
    setExperimentAssignment(assignment);
    void trackEvent("experiment_exposure", {
      layoutVariant: assignment.layoutVariant,
      rewardPromptVariant: assignment.rewardPromptVariant,
    });
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
          colorAssistEnabled?: boolean;
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
        if (typeof parsed.colorAssistEnabled === "boolean") {
          setColorAssistEnabled(parsed.colorAssistEnabled);
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
      setColorAssistEnabled(false);
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
        colorAssistEnabled,
      }),
    );
  }, [autoReadEnabled, colorAssistEnabled, hydrated, soundMuted, soundVolume, ttsEnabled, uiSfxEnabled]);

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
    if (activeView !== "play") return;
    if (!hydrated || !autoReadEnabled) return;
    if (spokenRoundRef.current === currentRoundKey) return;
    spokenRoundRef.current = currentRoundKey;
    const timer = window.setTimeout(() => {
      speakCurrentPrompt("auto");
    }, 180);
    return () => window.clearTimeout(timer);
  }, [activeView, autoReadEnabled, currentRoundKey, hydrated, speakCurrentPrompt]);

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
  const sessionRemainingMs = useMemo(() => {
    if (!progress.parentMode.enabled) return Number.POSITIVE_INFINITY;
    const sessionLimitMs = Math.max(5, progress.parentMode.sessionLimitMinutes) * 60 * 1000;
    if (sessionStartedAtRef.current === null) return sessionLimitMs;
    const elapsedWallMs = Date.now() - sessionStartedAtRef.current;
    const elapsedMs = Math.max(elapsedWallMs, progress.usage.usedMs);
    return Math.max(0, sessionLimitMs - elapsedMs);
  }, [progress.parentMode.enabled, progress.parentMode.sessionLimitMinutes, progress.usage.usedMs]);
  const remainingMinutes = Number.isFinite(remainingPlayMs) ? Math.ceil(remainingPlayMs / (60 * 1000)) : null;
  const remainingSessionMinutes = Number.isFinite(sessionRemainingMs) ? Math.ceil(sessionRemainingMs / (60 * 1000)) : null;
  const playable = hydrated && canPlay(progress) && sessionRemainingMs > 0;
  const parentLocked = Boolean(progress.parentMode.pinCode) && !parentUnlocked;
  const answerLocked = activeView !== "play" || !playable || (activeGame === "memory" && memoryRevealLeft > 0);
  const currentChoices = useMemo<(string | number)[]>(() => {
    if (activeGame === "math") return mathQuestion.choices;
    if (activeGame === "memory") return memoryRound.choices;
    if (activeGame === "logic") return logicRound.choices;
    if (activeGame === "compare") return compareRound.choices;
    if (activeGame === "vocab") return vocabRound.choices;
    return colorRound.choices;
  }, [activeGame, colorRound.choices, compareRound.choices, logicRound.choices, mathQuestion.choices, memoryRound.choices, vocabRound.choices]);
  const todayMetrics = useMemo(
    () => ({
      date: progress.dailyStats.date,
      rounds: progress.dailyStats.rounds,
      correct: progress.dailyStats.correct,
      wrong: progress.dailyStats.wrong,
      accuracy: progress.dailyStats.rounds > 0 ? Math.round((progress.dailyStats.correct / progress.dailyStats.rounds) * 100) : 0,
      usedMs: progress.usage.usedMs,
      byGame: progress.dailyStats.byGame,
    }),
    [progress.dailyStats, progress.usage.usedMs],
  );
  const weeklyReport = useMemo(() => buildWeeklyReport(reportHistory), [reportHistory]);
  const yesterdayMetrics = useMemo(() => getYesterdayEntry(reportHistory, todayMetrics.date), [reportHistory, todayMetrics.date]);
  const selfChallengeStatus = useMemo(
    () => getSelfChallengeStatus(rewardState, todayMetrics, yesterdayMetrics),
    [rewardState, todayMetrics, yesterdayMetrics],
  );
  const unlockedAvatars = useMemo(() => getUnlockedAvatars(rewardState), [rewardState]);
  const unlockedPets = useMemo(() => getUnlockedPets(rewardState), [rewardState]);
  const unlockedTools = useMemo(() => getUnlockedTools(rewardState), [rewardState]);

  const parentReport = useMemo(() => {
    const rounds = progress.dailyStats.rounds;
    const accuracy = rounds > 0 ? Math.round((progress.dailyStats.correct / rounds) * 100) : 0;
    const weakSpotMap: Record<MiniGameKey, string> = {
      math: pickLanguageText(language, "Toan", "Math"),
      memory: pickLanguageText(language, "Nho", "Memory"),
      color: pickLanguageText(language, "Mau", "Color"),
      logic: pickLanguageText(language, "Logic", "Logic"),
      compare: pickLanguageText(language, "So sanh", "Compare"),
      vocab: pickLanguageText(language, "Tu vung", "Vocab"),
    };
    const skillScores = {
      [pickLanguageText(language, "Toan", "Math")]: learningPathState.skills.math.score,
      [pickLanguageText(language, "Nho", "Memory")]: learningPathState.skills.memory.score,
      [pickLanguageText(language, "Mau", "Color")]: learningPathState.skills.color.score,
      [pickLanguageText(language, "Logic", "Logic")]: learningPathState.skills.logic.score,
      [pickLanguageText(language, "So sanh", "Compare")]: learningPathState.skills.compare.score,
      [pickLanguageText(language, "Tu vung", "Vocab")]: learningPathState.skills.vocab.score,
    };
    const offlineActivity = weeklyReport.weakGame === "math"
      ? pickLanguageText(language, "Choi dominos/phep tinh do vat 5-10 phut.", "Try domino or object-counting math for 5-10 minutes.")
      : weeklyReport.weakGame === "memory"
        ? pickLanguageText(language, "Tro nho hinh voi 6-8 the bai giay.", "Use 6-8 paper cards for memory matching.")
        : weeklyReport.weakGame === "logic"
          ? pickLanguageText(language, "Sap xep day so bang que tinh theo quy luat.", "Build number patterns using sticks or blocks.")
          : weeklyReport.weakGame === "compare"
            ? pickLanguageText(language, "So sanh so tren flashcard, bat dau tu cap so gan nhau.", "Compare number flashcards, starting with close values.")
            : weeklyReport.weakGame === "vocab"
              ? pickLanguageText(language, "On tu vung Viet-Anh 5 phut bang flashcard.", "Review Vietnamese-English words for 5 minutes using flashcards.")
          : pickLanguageText(language, "Tro choi nhan mau do vat trong nha.", "Play household color spotting challenges.");
    const teacherSummary = pickLanguageText(
      language,
      `Tap trung uu tien ${recommendedGameTitle} trong 2-3 ngay toi.`,
      `Prioritize ${recommendedGameTitle} for the next 2-3 days.`,
    );
    return {
      rounds,
      correct: progress.dailyStats.correct,
      wrong: progress.dailyStats.wrong,
      accuracy,
      weeklyRounds: weeklyReport.totalRounds,
      weeklyAccuracy: weeklyReport.averageAccuracy,
      weeklyTrend: weeklyReport.trend,
      weakSpot: weeklyReport.weakGame ? weakSpotMap[weeklyReport.weakGame] : pickLanguageText(language, "Can bang", "Balanced"),
      suggestion: language === "vi" ? weeklyReport.suggestionVi : weeklyReport.suggestionEn,
      skillScores,
      offlineActivity,
      teacherSummary,
    };
  }, [language, learningPathState.skills, progress.dailyStats, recommendedGameTitle, weeklyReport]);
  useEffect(() => {
    if (!hydrated) return;
    setReportHistory((previous) => {
      const next = syncTodayMetrics(previous, todayMetrics);
      if (next !== previous) {
        saveReportHistoryState(next);
      }
      return next;
    });
  }, [hydrated, todayMetrics]);

  useEffect(() => {
    if (!hydrated) return;
    setRewardState((previous) => {
      const synced = syncStickersFromBadges(previous, progress.badges);
      if (synced.unlocked.length > 0) {
        synced.unlocked.forEach((sticker) => {
          void trackEvent("sticker_unlock", {
            source: "combo_badge",
            sticker,
            total: synced.nextState.stickers.length,
          });
        });
      }
      if (synced.nextState !== previous) {
        saveRewardState(synced.nextState);
      }
      return synced.nextState;
    });
  }, [hydrated, progress.badges]);

  useEffect(() => {
    if (!hydrated) return;
    if (!selfChallengeStatus.achieved || selfChallengeStatus.wonToday) return;
    if (selfChallengeCelebratedRef.current === todayMetrics.date) return;
    selfChallengeCelebratedRef.current = todayMetrics.date;
    setRewardState((previous) => {
      const next = markSelfChallengeWin(previous, todayMetrics.date);
      saveRewardState(next);
      return next;
    });
    triggerCelebration();
    void trackEvent("self_challenge_win", {
      date: todayMetrics.date,
      rounds: selfChallengeStatus.progress.rounds,
      accuracy: selfChallengeStatus.progress.accuracy,
    });
    setFeedback({
      tone: "success",
      text: pickLanguageText(
        language,
        "Da vuot moc Beat Your Yesterday! Tiep tuc giu phong do.",
        "Beat Your Yesterday completed! Keep the momentum going.",
      ),
    });
  }, [hydrated, language, selfChallengeStatus, todayMetrics.date, triggerCelebration]);

  useEffect(() => {
    if (!hydrated) return;
    if (!parentUnlocked) return;
    if (weeklyReport.days.length === 0) return;
    void trackEvent("weekly_report_view", {
      days: weeklyReport.days.length,
      averageAccuracy: weeklyReport.averageAccuracy,
      weakGame: weeklyReport.weakGame ?? "none",
    });
  }, [hydrated, parentUnlocked, weeklyReport.averageAccuracy, weeklyReport.days.length, weeklyReport.weakGame]);
  useEffect(() => {
    if (!hydrated) return;
    if (retentionPingSentRef.current) return;
    retentionPingSentRef.current = true;

    const today = new Date();
    const last = progress.lastPlayedDate ? new Date(`${progress.lastPlayedDate}T00:00:00`) : null;
    const diffDays = last ? Math.max(0, Math.round((today.getTime() - last.getTime()) / 86400000)) : null;
    const bucket =
      diffDays === 1
        ? "D1"
        : diffDays === 7
          ? "D7"
          : diffDays === null
            ? "first_seen"
            : "other";
    void trackEvent("retention_ping", {
      bucket,
      diffDays: diffDays ?? -1,
      streak: progress.streak,
    });
  }, [hydrated, progress.lastPlayedDate, progress.streak]);

  useEffect(() => {
    if (!hydrated) return;
    if (previousViewRef.current === null) {
      previousViewRef.current = activeView;
      return;
    }
    if (previousViewRef.current === activeView) return;
    void trackEvent("drop_off_marker", {
      fromView: previousViewRef.current,
      toView: activeView,
      score: progress.score,
      combo: progress.combo,
      remainingSeconds: timeLeft,
      activeGame,
    });
    previousViewRef.current = activeView;
  }, [activeGame, activeView, hydrated, progress.combo, progress.score, timeLeft]);
  const questProgress = useMemo(() => {
    const mathRoundsTarget = 3;
    const memoryRoundsTarget = 3;
    const colorRoundsTarget = 3;
    const logicRoundsTarget = 3;
    const compareRoundsTarget = 3;
    const vocabRoundsTarget = 3;
    const roundsProgress = Math.min(100, Math.round((progress.dailyStats.rounds / DAILY_ROUNDS_TARGET) * 100));
    const mathProgress = Math.min(100, Math.round((progress.dailyStats.byGame.math.rounds / mathRoundsTarget) * 100));
    const memoryProgress = Math.min(100, Math.round((progress.dailyStats.byGame.memory.rounds / memoryRoundsTarget) * 100));
    const colorProgress = Math.min(100, Math.round((progress.dailyStats.byGame.color.rounds / colorRoundsTarget) * 100));
    const logicProgress = Math.min(100, Math.round((progress.dailyStats.byGame.logic.rounds / logicRoundsTarget) * 100));
    const compareProgress = Math.min(100, Math.round((progress.dailyStats.byGame.compare.rounds / compareRoundsTarget) * 100));
    const vocabProgress = Math.min(100, Math.round((progress.dailyStats.byGame.vocab.rounds / vocabRoundsTarget) * 100));
    const todayAccuracy = progress.dailyStats.rounds > 0 ? Math.round((progress.dailyStats.correct / progress.dailyStats.rounds) * 100) : 0;
    const accuracyTarget = 70;
    const accuracyProgress = Math.min(100, Math.round((todayAccuracy / accuracyTarget) * 100));

    return {
      roundsProgress,
      mathProgress,
      memoryProgress,
      colorProgress,
      logicProgress,
      compareProgress,
      vocabProgress,
      accuracyProgress,
      todayAccuracy,
      roundsDone: progress.dailyStats.rounds >= DAILY_ROUNDS_TARGET,
      accuracyDone: todayAccuracy >= accuracyTarget && progress.dailyStats.rounds >= 6,
      balanceDone:
        progress.dailyStats.byGame.math.rounds > 0 &&
        progress.dailyStats.byGame.memory.rounds > 0 &&
        progress.dailyStats.byGame.color.rounds > 0 &&
        progress.dailyStats.byGame.logic.rounds > 0 &&
        progress.dailyStats.byGame.compare.rounds > 0 &&
        progress.dailyStats.byGame.vocab.rounds > 0,
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
      if (sessionRemainingMs <= 0) {
        return pickLanguageText(
          language,
          "Da het gioi han cho phien hien tai. Nghia 5-10 phut roi quay lai nhe.",
          "This session limit is reached. Take a 5-10 minute break and come back.",
        );
      }
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
      if (activeGame === "logic") {
        return pickLanguageText(
          language,
          "So sanh khoang cach giua cac so de nhin ra quy luat.",
          "Compare the gaps between numbers to spot the pattern.",
        );
      }
      if (activeGame === "compare") {
        return pickLanguageText(
          language,
          "Dat mat vao so hang chuc truoc, roi moi den so hang don vi.",
          "Compare tens first, then ones for faster decisions.",
        );
      }
      if (activeGame === "vocab") {
        return pickLanguageText(
          language,
          "Doc tu trong dau 1 lan va lien tuong theo cap nghia.",
          "Say the prompt once in your head and map it to its meaning pair.",
        );
      }
      return pickLanguageText(language, "Tap trung vao MAU chu, dung doc noi dung cua chu.", "Focus on the COLOR of the text, not the word meaning.");
    }
    if (timeLeft <= 6) {
      return pickLanguageText(language, "Sap het gio. Chon dap an nhanh va chinh xac!", "Time is almost over. Pick quickly and stay accurate!");
    }
    return pickLanguageText(language, "Nhan phim 1-4 de tra loi sieu nhanh, phim R de choi lai run.", "Use keys 1-4 to answer fast, and R to restart the run.");
  }, [activeGame, feedback.tone, language, playable, sessionRemainingMs, timeLeft, wrongStreak]);
  const roundsUntilBoss = useMemo(() => getRoundsUntilBoss(academyProgress), [academyProgress]);
  const activeZone = academyProgress.zones[academyProgress.activeZoneIndex];
  const activeNode = activeZone.nodes[academyProgress.activeNodeIndex];
  const highestUnlockedLevel = useMemo(
    () => getUnlockedLevelByAcademyProgress(academyProgress.activeZoneIndex),
    [academyProgress.activeZoneIndex],
  );
  const getZoneTitle = useCallback(
    (zone: AcademyZoneState) => (language === "vi" ? zone.titleVi : zone.titleEn),
    [language],
  );
  useEffect(() => {
    if (!hydrated) return;
    if (isLevelUnlocked(levelKey, highestUnlockedLevel)) return;
    setLevelKey(highestUnlockedLevel);
    setFeedback({
      tone: "info",
      text: pickLanguageText(
        language,
        `Ban da mo khoa ${levelLabels[highestUnlockedLevel].label}. Level duoc nang tu dong.`,
        `${levelLabels[highestUnlockedLevel].label} is now unlocked. Level upgraded automatically.`,
      ),
    });
  }, [highestUnlockedLevel, hydrated, language, levelKey, levelLabels, setLevelKey]);
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
  const captureRoundOutcome = useCallback(
    (payload: { game: MiniGameKey; isCorrect: boolean; timedOut: boolean; responseMs: number; roundMs: number }) => {
      setAdaptiveState((previous) => {
        const next = appendAdaptiveOutcome(previous, payload);
        saveAdaptiveEngineState(next);
        return next;
      });
      setLearningPathState((previous) => {
        const next = updateLearningPathState(previous, payload);
        saveLearningPathState(next);
        return next;
      });
    },
    [],
  );

  const handleWrong = useCallback(
    (reason: "answer_wrong" | "round_timeout") => {
      const nextWrongStreak = wrongStreak + 1;
      const shouldShowHint = nextWrongStreak >= 2;
      const activeBossMeta = getBossMetaByTotalRounds(academyProgress.totalRounds);
      const nextRoundTotalRounds = academyProgress.totalRounds + 1;
      const roundMs = roundDurationSeconds * 1000;
      const responseMs =
        reason === "round_timeout"
          ? roundMs
          : Math.max(250, (roundDurationSeconds - timeLeft) * 1000);

      updateProgress((previous) => {
        const touched = touchSession(previous);
        const afterWrong = applyWrongAnswer(touched);
        return recordRoundResult(afterWrong, activeGame, false);
      });
      captureRoundOutcome({
        game: activeGame,
        isCorrect: false,
        timedOut: reason === "round_timeout",
        responseMs,
        roundMs,
      });
      playErrorTone();
      setWrongStreak(nextWrongStreak);

      let text =
        reason === "round_timeout"
          ? pickLanguageText(language, "Het gio roi. Lam tiep cau moi nhe!", "Time is up. Keep going with the next round!")
          : pickLanguageText(language, "Chua dung. Binh tinh va thu lai!", "Not correct yet. Stay calm and try again!");
      if (activeBossMeta.isBossRound) {
        text = pickLanguageText(
          language,
          `Boss round ${activeBossMeta.bossRoundNumber} chua qua. Thu lai va tang toc nhe!`,
          `Boss round ${activeBossMeta.bossRoundNumber} missed. Try again with faster focus!`,
        );
      }
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
      if (activeBossMeta.isBossRound) {
        void trackEvent("boss_round_fail", {
          game: activeGame,
          level: level.key,
          bossRoundNumber: activeBossMeta.bossRoundNumber,
          reason,
        });
      }
      applyAcademyRoundResult(false);
      beginRound(activeGame, activeRoundConfig, reason === "round_timeout" ? "timeout" : "answer_wrong", level.key, nextRoundTotalRounds);
    },
    [
      academyProgress.totalRounds,
      activeGame,
      activeRoundConfig,
      applyAcademyRoundResult,
      beginRound,
      captureRoundOutcome,
      getBossMetaByTotalRounds,
      getHintForCurrentGame,
      language,
      level.key,
      roundDurationSeconds,
      timeLeft,
      updateProgress,
      wrongStreak,
    ],
  );

  const handleAnswer = useCallback(
    (choice: string | number) => {
      if (answerLocked) {
        return;
      }
      const roundMs = roundDurationSeconds * 1000;
      const responseMs = Math.max(250, (roundDurationSeconds - timeLeft) * 1000);

      const isCorrect =
        activeGame === "math"
          ? choice === mathQuestion.answer
          : activeGame === "memory"
            ? choice === memoryRound.answer
            : activeGame === "logic"
              ? choice === logicRound.answer
              : activeGame === "compare"
                ? choice === compareRound.answer
                : activeGame === "vocab"
                  ? choice === vocabRound.answer
                  : choice === colorRound.answerColorName;

      if (!isCorrect) {
        handleWrong("answer_wrong");
        return;
      }

      const activeBossMeta = getBossMetaByTotalRounds(academyProgress.totalRounds);
      const runtimeRound = getRuntimeRoundConfig(activeRoundConfig, academyProgress.totalRounds);
      const nextRoundTotalRounds = academyProgress.totalRounds + 1;
      const nextCombo = progress.combo + 1;
      const points = calculateEarnedScore(nextCombo, level.baseScore) * runtimeRound.scoreMultiplier;
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
      captureRoundOutcome({
        game: activeGame,
        isCorrect: true,
        timedOut: false,
        responseMs,
        roundMs,
      });

      setWrongStreak(0);
      playSuccessTone();
      if (isComboMilestone || isNewHighScore || activeBossMeta.isBossRound) {
        triggerCelebration();
        void trackEvent("celebration_burst", {
          level: level.key,
          game: activeGame,
          comboMilestone: isComboMilestone,
          highScore: isNewHighScore,
          bossRound: activeBossMeta.isBossRound,
        });
      }
      setFeedback({
        tone: "success",
        text: activeBossMeta.isBossRound
          ? pickLanguageText(
              language,
              `Boss round ${activeBossMeta.bossRoundNumber} da vuot qua! +${points} diem thuong.`,
              `Boss round ${activeBossMeta.bossRoundNumber} cleared! +${points} bonus points.`,
            )
          : language === "vi"
            ? `Chinh xac! +${points} diem. Combo x${nextCombo}.`
            : `Correct! +${points} points. Combo x${nextCombo}.`,
      });
      void trackEvent("answer_correct", { level: level.key, game: activeGame, points, bossRound: activeBossMeta.isBossRound });
      if (activeBossMeta.isBossRound) {
        void trackEvent("boss_round_win", {
          level: level.key,
          game: activeGame,
          bossRoundNumber: activeBossMeta.bossRoundNumber,
          points,
        });
      }
      applyAcademyRoundResult(true);
      beginRound(activeGame, activeRoundConfig, "answer_correct", level.key, nextRoundTotalRounds);
    },
    [
      academyProgress.totalRounds,
      activeGame,
      activeRoundConfig,
      answerLocked,
      captureRoundOutcome,
      colorRound.answerColorName,
      handleWrong,
      getBossMetaByTotalRounds,
      getRuntimeRoundConfig,
      level.baseScore,
      level.key,
      mathQuestion.answer,
      memoryRound.answer,
      language,
      logicRound.answer,
      compareRound.answer,
      vocabRound.answer,
      applyAcademyRoundResult,
      progress.combo,
      progress.highScores,
      progress.score,
      roundDurationSeconds,
      beginRound,
      timeLeft,
      triggerCelebration,
      updateProgress,
    ],
  );

  useEffect(() => {
    if (activeView !== "play") return;
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
  }, [activeView, handleWrong, playable, timeLeft]);

  useEffect(() => {
    if (activeView !== "play") return;
    if (!playable) return;
    if (activeGame !== "memory") return;
    if (memoryRevealLeft <= 0) return;

    const revealTimer = window.setTimeout(() => {
      setMemoryRevealLeft((value) => Math.max(0, value - 1));
    }, 1000);

    return () => window.clearTimeout(revealTimer);
  }, [activeGame, activeView, memoryRevealLeft, playable]);

  useEffect(() => {
    if (activeView !== "play") return;
    if (!playable) return;
    const usageTicker = window.setInterval(() => {
      updateProgress((previous) => addPlayTime(previous, 1000));
    }, 1000);
    return () => window.clearInterval(usageTicker);
  }, [activeView, playable, updateProgress]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (activeView !== "play") return;
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
  }, [activeGame, activeRoundConfig, activeView, beginRound, currentChoices, handleAnswer, language, resetRun]);

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

    if (activeGame === "logic") {
      return (
        <>
          <p className={styles.hint}>
            {pickLanguageText(language, "Tim quy luat day so va chon so tiep theo.", "Find the sequence rule and choose the next number.")}
          </p>
          <p className={styles.questionValue}>{logicRound.sequence.join(" , ")} , ?</p>
          <p className={styles.questionGloss}>{englishLearningLine}</p>
          <div className={styles.answers}>
            {logicRound.choices.map((choice) => (
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

    if (activeGame === "compare") {
      return (
        <>
          <p className={styles.hint}>
            {pickLanguageText(language, "So nao lon hon? Chon dap an nhanh.", "Which number is larger? Choose quickly.")}
          </p>
          <p className={styles.questionValue}>
            {compareRound.left} ? {compareRound.right}
          </p>
          <p className={styles.questionGloss}>{englishLearningLine}</p>
          <div className={styles.answers}>
            {compareRound.choices.map((choice) => (
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

    if (activeGame === "vocab") {
      return (
        <>
          <p className={styles.hint}>
            {vocabRound.direction === "vi_to_en"
              ? pickLanguageText(language, `Tu tieng Anh cua "${vocabRound.prompt}" la gi?`, `What is the English word for "${vocabRound.prompt}"?`)
              : pickLanguageText(language, `Tu tieng Viet cua "${vocabRound.prompt}" la gi?`, `What is the Vietnamese word for "${vocabRound.prompt}"?`)}
          </p>
          <p className={styles.questionGloss}>{englishLearningLine}</p>
          <div className={styles.answers}>
            {vocabRound.choices.map((choice) => (
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
          {colorAssistEnabled
            ? pickLanguageText(
                language,
                "Chon MAU cua chu (co marker hinh dang), khong phai noi dung cua chu.",
                "Pick the COLOR of the text (with shape marker), not the word meaning.",
              )
            : pickLanguageText(language, "Chon MAU cua chu, khong phai noi dung cua chu.", "Pick the COLOR of the text, not the word meaning.")}
        </p>
        <p className={styles.colorWord} style={{ color: colorRound.wordColorHex }}>
          {language === "vi" ? colorRound.word : getColorEnglishName(colorRound.word)}{colorAssistEnabled ? ` ${getColorMarker(colorRound.answerColorName)}` : ""}
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

  const playgroundPreviewCard =
    activeView === "play" ? null : (
      <div className={styles.playgroundWrap}>
        <PhaserPlayground className={styles.playground} />
        <span className={styles.playgroundLabel}>{pickLanguageText(language, "Phaser playground live", "Phaser playground live")}</span>
      </div>
    );

  return (
    <main id="cvf-game-root" className={styles.page} data-game={activeGame} data-age={ageGroup}>
      {showOnboarding ? (
        <div className={styles.onboardingBackdrop} role="dialog" aria-modal="true">
          <section className={styles.onboardingCard}>
            <h2>{pickLanguageText(language, "Chao mung den CVF Mini Detective Academy", "Welcome to CVF Mini Detective Academy")}</h2>
            <ul className={styles.onboardingList}>
              <li>{pickLanguageText(language, "Chon 1 trong 6 mini game o hang tab phia tren.", "Choose 1 of 6 mini games on the top tab row.")}</li>
              <li>{pickLanguageText(language, "Nhan phim 1-4 de chon dap an nhanh, nhan R de choi lai run.", "Press keys 1-4 to answer quickly, and press R to restart the run.")}</li>
              <li>{pickLanguageText(language, "Thu game Tu Vung Song Ngu de luyen Viet-Anh theo dang ghep cap.", "Try Bilingual Vocab to practice Vietnamese-English matching.")}</li>
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
        <section className={`${styles.hero} ${activeView === "play" ? styles.heroSingle : ""}`}>
          <article className={styles.heroCard}>
            <h1>CVF Mini Detective Academy</h1>
            {activeView === "play" ? (
              <>
                <p className={styles.focusLine}>
                  {pickLanguageText(
                    language,
                    experimentAssignment.layoutVariant === "guide_first"
                      ? "Huong dan nhanh: nhan phim 1-4 de tra loi, R de choi lai run."
                      : "Che do choi nhanh: nhan phim 1-4 de tra loi, R de choi lai.",
                    experimentAssignment.layoutVariant === "guide_first"
                      ? "Quick guide: press keys 1-4 to answer and R to restart the run."
                      : "Quick play mode: press keys 1-4 to answer and R to restart.",
                  )}
                </p>
                <p className={styles.profileFocusLine}>
                  {pickLanguageText(language, "Nhiem vu theo tuoi:", "Age mission:")} {activeAgeGameCopy.focus}
                </p>
              </>
            ) : (
              <p>
                {pickLanguageText(
                  language,
                  "Nhiem vu hom nay: giai ma mini game, giu combo that dai va tro thanh sieu tham tu cua hoc vien.",
                  "Today's mission: solve mini games, keep long combos, and become the academy's super detective.",
                )}
              </p>
            )}
            <div className={styles.heroMeta}>
              <span className={styles.chip}>{pickLanguageText(language, "Dang choi", "Now playing")}: {gameTitle}</span>
              <span className={styles.chip}>{pickLanguageText(language, "Profile", "Profile")}: {ageProfileLabel}</span>
              <span className={styles.chip}>{adaptiveBandLabel}</span>
              <span className={styles.chip}>
                {pickLanguageText(language, "Goi y luyen", "Practice next")}: {recommendedGameTitle}
              </span>
              <span className={styles.chip}>
                {pickLanguageText(language, "Tien do man", "Stage progress")}: {language === "vi" ? activeNode.labelVi : activeNode.labelEn} ({activeNode.correctCount}/{activeNode.requiredCorrect})
              </span>
              <span className={styles.chip}>
                {pickLanguageText(language, "Level mo khoa", "Unlocked level")}: {levelLabels[highestUnlockedLevel].label}
              </span>
              {remainingSessionMinutes !== null ? (
                <span className={styles.chip}>
                  {pickLanguageText(language, "Con lai phien", "Session left")}: {remainingSessionMinutes}m
                </span>
              ) : null}
              {activeView === "play" ? null : (
                <>
                  <span className={styles.chip}>{pickLanguageText(language, "Ngon ngu", "Language")}: {language.toUpperCase()}</span>
                  <span className={styles.chip}>{pickLanguageText(language, "Combo = Diem thuong", "Combo = Bonus points")}</span>
                </>
              )}
            </div>
            <div className={styles.viewTabs} role="tablist" aria-label={pickLanguageText(language, "Dieu huong man hinh", "Screen navigation")}>
              {(Object.keys(dashboardViewLabels) as DashboardView[]).map((viewKey) => (
                <button
                  key={viewKey}
                  type="button"
                  role="tab"
                  aria-selected={activeView === viewKey}
                  className={`${styles.viewTabButton} ${activeView === viewKey ? styles.viewTabButtonActive : ""}`}
                  onClick={() => setActiveView(viewKey)}
                >
                  {dashboardViewLabels[viewKey]}
                </button>
              ))}
            </div>
            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.primaryCta}
                onClick={() => {
                  setActiveView("play");
                  window.setTimeout(() => {
                    document.getElementById("mission-zone")?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }, 0);
                }}
              >
                {pickLanguageText(language, "Vao tran ngay", "Play Now")}
              </button>
              <button type="button" className={styles.secondaryCta} onClick={() => setActiveView("settings")}>
                {pickLanguageText(language, "Mo cai dat", "Open Settings")}
              </button>
              <button type="button" className={styles.secondaryCta} onClick={() => setShowOnboarding(true)}>
                {pickLanguageText(language, "Xem huong dan nhanh", "Quick Guide")}
              </button>
            </div>
          </article>
          {isMobileLayout ? null : playgroundPreviewCard}
        </section>

        {activeView === "progress" ? (
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
            {currentBossRoundMeta.isBossRound
              ? pickLanguageText(
                  language,
                  `Boss round ${currentBossRoundMeta.bossRoundNumber} dang kich hoat! Theme tuan nay: ${weeklyThemeLabel}.`,
                  `Boss round ${currentBossRoundMeta.bossRoundNumber} is live! Weekly theme: ${weeklyThemeLabel}.`,
                )
              : roundsUntilBoss === 5
                ? pickLanguageText(
                    language,
                    `Boss round se bat dau o moc 5 vong. Theme tuan nay: ${weeklyThemeLabel}.`,
                    `Boss round starts at the 5-round milestone. Weekly theme: ${weeklyThemeLabel}.`,
                  )
                : pickLanguageText(language, `Con ${roundsUntilBoss} vong nua den boss round.`, `${roundsUntilBoss} rounds until boss round.`)}
          </p>
          </section>
        ) : null}

        {activeView === "play" ? (
          <>
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
          highestUnlocked={highestUnlockedLevel}
          onSelect={(nextLevelKey) => {
            if (!isLevelUnlocked(nextLevelKey, highestUnlockedLevel)) {
              setFeedback({
                tone: "info",
                text: pickLanguageText(
                  language,
                  `Can hoan thanh them nhiem vu de mo ${levelLabels[nextLevelKey].label}.`,
                  `Complete more missions to unlock ${levelLabels[nextLevelKey].label}.`,
                ),
              });
              return;
            }
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
          </>
        ) : null}

        {activeView === "progress" ? (
          <>
            <section className={styles.questStrip} aria-label={pickLanguageText(language, "Nhiem vu hom nay", "Today missions")}>
          <article className={styles.questCard}>
            <p className={styles.questTitle}>{pickLanguageText(language, "Nhiem vu 1: Choi deu tay", "Mission 1: Keep Playing")}</p>
            <p className={styles.questHint}>{pickLanguageText(language, `Hoan thanh ${DAILY_ROUNDS_TARGET} vong trong ngay.`, `Finish ${DAILY_ROUNDS_TARGET} rounds today.`)}</p>
            <div className={styles.questTrack} role="presentation" aria-hidden>
              <span className={styles.questFill} style={{ width: `${questProgress.roundsProgress}%` }} />
            </div>
            <p className={styles.questValue}>{progress.dailyStats.rounds}/{DAILY_ROUNDS_TARGET}</p>
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
              <span className={`${styles.questMiniPill} ${questProgress.logicProgress > 0 ? styles.questMiniDone : ""}`}>
                {pickLanguageText(language, "Logic", "Logic")}
              </span>
              <span className={`${styles.questMiniPill} ${questProgress.compareProgress > 0 ? styles.questMiniDone : ""}`}>
                {pickLanguageText(language, "So sanh", "Compare")}
              </span>
              <span className={`${styles.questMiniPill} ${questProgress.vocabProgress > 0 ? styles.questMiniDone : ""}`}>
                {pickLanguageText(language, "Tu vung", "Vocab")}
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
                `Giu nhip trong ${roundDurationSeconds}s de dat diem cao.`,
                `Keep your rhythm in ${roundDurationSeconds}s to maximize points.`,
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

            <section className={styles.rewardStrip} aria-label={pickLanguageText(language, "Reward va challenge", "Rewards and challenge")}>
          <article className={styles.rewardCard}>
            <p className={styles.rewardTitle}>{pickLanguageText(language, "Daily chest", "Daily chest")}</p>
            <p className={styles.rewardHint}>
              {rewardState.chestLastOpenedDate === todayMetrics.date
                ? pickLanguageText(language, "Hom nay da mo chest. Quay lai vao ngay mai nhe.", "Today's chest is opened. Come back tomorrow.")
                : pickLanguageText(
                    language,
                    experimentAssignment.rewardPromptVariant === "coach"
                      ? "Coach tip: mo chest sau moi cum 3 combo de tang tien do bo suu tap."
                      : "Mo chest de nhan sticker va mo khoa avatar/pet/tool.",
                    experimentAssignment.rewardPromptVariant === "coach"
                      ? "Coach tip: open the chest after each 3-combo streak to speed up collection progress."
                      : "Open the chest to earn stickers and unlock avatar/pet/tool.",
                  )}
            </p>
            <button
              type="button"
              className={styles.rewardAction}
              disabled={rewardState.chestLastOpenedDate === todayMetrics.date}
              onClick={() => {
                setRewardState((previous) => {
                  const chest = openDailyChest(previous);
                  if (chest.opened) {
                    saveRewardState(chest.nextState);
                    void trackEvent("daily_chest_open", {
                      date: todayMetrics.date,
                      totalOpened: chest.nextState.chestOpenCount,
                    });
                    if (chest.unlockedSticker) {
                      void trackEvent("sticker_unlock", {
                        source: "daily_chest",
                        sticker: chest.unlockedSticker,
                        total: chest.nextState.stickers.length,
                      });
                    }
                    setFeedback({
                      tone: "success",
                      text: chest.unlockedSticker
                        ? pickLanguageText(
                            language,
                            `Chest mo thanh cong! Sticker moi: ${chest.unlockedSticker}.`,
                            `Chest opened! New sticker: ${chest.unlockedSticker}.`,
                          )
                        : pickLanguageText(language, "Chest mo thanh cong. Bo suu tap da day.", "Chest opened. Sticker album is complete."),
                    });
                  }
                  return chest.nextState;
                });
              }}
            >
              {pickLanguageText(language, "Mo chest", "Open chest")}
            </button>
            <p className={styles.rewardValue}>{pickLanguageText(language, "Sticker", "Stickers")}: {rewardState.stickers.length}</p>
          </article>

          <article className={styles.rewardCard}>
            <p className={styles.rewardTitle}>{pickLanguageText(language, "Avatar + pet + tool", "Avatar + pet + tool")}</p>
            <p className={styles.rewardHint}>
              {pickLanguageText(
                language,
                "Reward loop sau: mo khoa avatar, pet va cong cu tham tu an toan cho tre.",
                "Deeper reward loop: unlock child-safe avatar, pet, and detective tool.",
              )}
            </p>
            <label className={styles.rewardSelectLabel}>
              {pickLanguageText(language, "Avatar", "Avatar")}
              <select
                className={styles.rewardSelect}
                value={rewardState.equippedAvatar ?? ""}
                onChange={(event) => {
                  setRewardState((previous) => {
                    const next = equipAvatar(previous, event.target.value);
                    saveRewardState(next);
                    return next;
                  });
                }}
              >
                {unlockedAvatars.map((avatar) => (
                  <option key={avatar} value={avatar}>
                    {avatar}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.rewardSelectLabel}>
              {pickLanguageText(language, "Pet", "Pet")}
              <select
                className={styles.rewardSelect}
                value={rewardState.equippedPet ?? ""}
                onChange={(event) => {
                  setRewardState((previous) => {
                    const next = equipPet(previous, event.target.value);
                    saveRewardState(next);
                    return next;
                  });
                }}
              >
                {unlockedPets.map((pet) => (
                  <option key={pet} value={pet}>
                    {pet}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.rewardSelectLabel}>
              {pickLanguageText(language, "Cong cu", "Tool")}
              <select
                className={styles.rewardSelect}
                value={rewardState.equippedTool ?? ""}
                onChange={(event) => {
                  setRewardState((previous) => {
                    const next = equipTool(previous, event.target.value);
                    saveRewardState(next);
                    return next;
                  });
                }}
              >
                {unlockedTools.map((tool) => (
                  <option key={tool} value={tool}>
                    {tool}
                  </option>
                ))}
              </select>
            </label>
          </article>

          <article className={styles.rewardCard}>
            <p className={styles.rewardTitle}>{pickLanguageText(language, "Beat your yesterday", "Beat your yesterday")}</p>
            <p className={styles.rewardHint}>
              {pickLanguageText(
                language,
                `Muc tieu: ${selfChallengeStatus.target.rounds} vong, ${selfChallengeStatus.target.correct} cau dung, do chinh xac ${selfChallengeStatus.target.accuracy}%`,
                `Target: ${selfChallengeStatus.target.rounds} rounds, ${selfChallengeStatus.target.correct} correct, ${selfChallengeStatus.target.accuracy}% accuracy`,
              )}
            </p>
            <div className={styles.rewardTrack} role="presentation" aria-hidden>
              <span
                className={styles.rewardFill}
                style={{
                  width: `${Math.min(
                    100,
                    Math.round(
                      (
                        selfChallengeStatus.progress.rounds / Math.max(1, selfChallengeStatus.target.rounds) +
                        selfChallengeStatus.progress.correct / Math.max(1, selfChallengeStatus.target.correct) +
                        selfChallengeStatus.progress.accuracy / Math.max(1, selfChallengeStatus.target.accuracy)
                      ) * (100 / 3),
                    ),
                  )}%`,
                }}
              />
            </div>
            <p className={styles.rewardValue}>
              {selfChallengeStatus.wonToday
                ? pickLanguageText(language, "Da hoan thanh challenge hom nay!", "Challenge completed for today!")
                : `${selfChallengeStatus.progress.rounds}/${selfChallengeStatus.target.rounds} | ${selfChallengeStatus.progress.correct}/${selfChallengeStatus.target.correct} | ${selfChallengeStatus.progress.accuracy}%`}
            </p>
          </article>
            </section>
          </>
        ) : null}

        {activeView === "play" ? (
          <section
          id="mission-zone"
          className={`${styles.questionCard} ${timeLeft <= 6 ? styles.questionCardDanger : ""} ${
            feedback.tone === "success" ? styles.questionCardBoost : ""
          } ${currentBossRoundMeta.isBossRound ? styles.questionCardBoss : ""} ${
            progress.combo >= 5 ? styles.questionCardCombo : ""
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
                {currentBossRoundMeta.isBossRound
                  ? pickLanguageText(
                      language,
                      `Boss round ${currentBossRoundMeta.bossRoundNumber}: thoi gian ngan hon, diem x2.`,
                      `Boss round ${currentBossRoundMeta.bossRoundNumber}: shorter timer, 2x score.`,
                    )
                  : activeGame === "memory" && memoryRevealLeft > 0
                  ? pickLanguageText(
                      language,
                      `Nho ky chuoi trong ${memoryRevealLeft}s truoc khi bi an.`,
                      `Memorize the sequence in ${memoryRevealLeft}s before it hides.`,
                    )
                  : pickLanguageText(language, "Dung lien tiep de tang combo va mo khoa huy hieu.", "Keep answering correctly to build combo and unlock badges.")}
              </p>
              {currentBossRoundMeta.isBossRound ? null : (
                <p className={styles.profileFocusLine}>{activeAgeGameCopy.focus}</p>
              )}
              <p className={styles.profileFocusLine}>
                {language === "vi" ? learningSuggestion.reasonVi : learningSuggestion.reasonEn}
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
              {learningSuggestion.recommendedGame !== activeGame ? (
                <button
                  type="button"
                  className={styles.quickSwitchButton}
                  onClick={() => {
                    const nextGame = learningSuggestion.recommendedGame;
                    setActiveGame(nextGame);
                    const nextRound = getRoundConfig(nextGame, level.key, ageGroup);
                    beginRound(nextGame, nextRound, "switch_game");
                  }}
                >
                  {pickLanguageText(language, "Luyen diem yeu", "Train weak skill")}
                </button>
              ) : null}
              {!playable ? (
                <p className={styles.blocked}>
                  {sessionRemainingMs <= 0
                    ? pickLanguageText(language, "Phien choi da het gio. Hay nghi nhe.", "Session limit reached. Time for a short break.")
                    : pickLanguageText(language, "Da het gio choi hom nay.", "Today's play time is over.")}
                </p>
              ) : null}
            </div>
          </header>
          <div className={styles.timerCluster}>
            <p className={styles.timerLabel}>
              {pickLanguageText(language, "Dong ho vong", "Round timer")}: {timeLeft}s / {roundDurationSeconds}s
            </p>
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
        ) : null}

        {activeView === "progress" ? (
          <section className={styles.singlePanel}>
            <BadgeShelf badges={progress.badges} language={language} />
          </section>
        ) : null}

        {activeView === "parent" ? (
          <section className={styles.parentTabWrap}>
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
              const freshContentBank = getDefaultContentBankState();
              const freshReward = getDefaultRewardState();
              const freshReport = getDefaultReportHistoryState();
              setAcademyProgress(freshAcademy);
              setContentBankState(freshContentBank);
              setRewardState(freshReward);
              setReportHistory(freshReport);
              saveAcademyProgress(freshAcademy);
              saveContentBankState(freshContentBank);
              saveRewardState(freshReward);
              saveReportHistoryState(freshReport);
              sessionStartedAtRef.current = Date.now();
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
              if (enabled) {
                sessionStartedAtRef.current = Date.now();
              }
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
            onSessionLimitChange={(minutes) => {
              if (parentLocked) {
                setParentMessage(pickLanguageText(language, "Can mo khoa Parent Mode truoc khi thay doi.", "Please unlock Parent Mode before changing settings."));
                return;
              }
              updateProgress((previous) => updateParentMode(previous, { sessionLimitMinutes: minutes }));
              void trackEvent("parent_mode_update", { sessionLimit: minutes });
              setParentMessage(
                pickLanguageText(
                  language,
                  `Da cap nhat gioi han moi phien: ${minutes} phut.`,
                  `Session limit updated: ${minutes} min.`,
                ),
              );
            }}
            />
          </section>
        ) : null}

        {activeView === "settings" ? (
          <section ref={settingsPanelRef} className={styles.settingsPanel}>
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
                <label className={styles.uiSfxToggle}>
                  <input
                    type="checkbox"
                    checked={colorAssistEnabled}
                    onChange={(event) => {
                      const nextValue = event.target.checked;
                      setColorAssistEnabled(nextValue);
                      void trackEvent("audio_update", { colorAssistEnabled: nextValue });
                    }}
                  />
                  <span>{pickLanguageText(language, "Ho tro mui mau (marker hinh dang)", "Color-blind assist (shape markers)")}</span>
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
          </section>
        ) : null}
        {isMobileLayout ? playgroundPreviewCard : null}
      </div>
    </main>
  );
}
