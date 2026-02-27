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
  generateMemoryRound,
  getColorHint,
  getMathHint,
  getMemoryHint,
  LEVELS,
  LevelKey,
  MINI_GAMES,
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
import { useGameStore } from "@/lib/store/game-store";
import { trackEvent } from "@/lib/telemetry";
import styles from "./page.module.css";

type FeedbackTone = "success" | "error" | "info";
type AgeGroupKey = "age_5_6" | "age_7_8" | "age_9_10";

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
      return getMathHint(mathQuestion);
    }
    if (activeGame === "memory") {
      return getMemoryHint(memoryRound.answer);
    }
    return getColorHint(colorRound.answerColorName);
  }, [activeGame, colorRound.answerColorName, mathQuestion, memoryRound.answer]);

  const gameTitle = useMemo(() => {
    const found = MINI_GAMES.find((item) => item.key === activeGame);
    return found?.title ?? "Mini Game";
  }, [activeGame]);
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
  const ageProfile = AGE_PROFILES[ageGroup];
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
      return `Cau hoi toan: ${mathQuestion.left} ${mathQuestion.operator === "+" ? "cong" : "tru"} ${mathQuestion.right} bang bao nhieu?`;
    }
    if (activeGame === "memory") {
      if (memoryRevealLeft > 0) {
        return `Hay nho chuoi ky hieu trong ${memoryRevealLeft} giay.`;
      }
      return "Chuoi da an. Ky hieu nao xuat hien nhieu nhat?";
    }
    return `Phan xa mau. Tu hien thi la ${colorRound.word}. Hay chon mau cua chu dang hien thi.`;
  }, [activeGame, colorRound.word, mathQuestion.left, mathQuestion.operator, mathQuestion.right, memoryRevealLeft]);
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
      utterance.lang = "vi-VN";
      utterance.rate = ageGroup === "age_5_6" ? 0.88 : 0.96;
      utterance.pitch = 1.03;
      utterance.volume = Math.max(0, Math.min(1, soundVolume / 100));
      speech.speak(utterance);
      void trackEvent("tts_speak", { source, game: activeGame, ageGroup });
    },
    [activeGame, ageGroup, currentSpeechText, soundMuted, soundVolume, ttsEnabled, ttsSupported],
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
    if (typeof window === "undefined") return;
    setTtsSupported("speechSynthesis" in window);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const rawAgeGroup = window.localStorage.getItem(AGE_PROFILE_STORAGE_KEY);
    if (rawAgeGroup && rawAgeGroup in AGE_PROFILES) {
      setAgeGroup(rawAgeGroup as AgeGroupKey);
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
      text: `Da doi profile ${AGE_PROFILES[ageGroup].label}. Do kho duoc can chinh lai.`,
    });
    void trackEvent("age_profile_change", {
      ageGroup,
      game: activeGame,
      level: level.key,
    });
  }, [activeGame, activeRoundConfig, ageGroup, beginRound, hydrated, level.key]);

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
          ? "Het gio roi. Lam tiep cau moi nhe!"
          : "Chua dung. Binh tinh va thu lai!";
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
      beginRound(activeGame, activeRoundConfig, reason === "round_timeout" ? "timeout" : "answer_wrong");
    },
    [activeGame, activeRoundConfig, beginRound, getHintForCurrentGame, level.key, updateProgress, wrongStreak],
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
        text: `Chinh xac! +${points} diem. Combo x${nextCombo}.`,
      });
      void trackEvent("answer_correct", { level: level.key, game: activeGame, points });
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
          text: "Da reset run moi (shortcut R).",
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
  }, [activeGame, activeRoundConfig, beginRound, currentChoices, handleAnswer, resetRun]);

  if (!hydrated) {
    return (
      <main id="cvf-game-root" className={styles.page} data-game="math">
        <div className={styles.frame}>
          <section className={styles.heroCard}>Dang tai du lieu game...</section>
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
            <div className={styles.memoryCover}>Chuoi da an. Ky hieu nao xuat hien nhieu nhat?</div>
          )}
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
        <p className={styles.hint}>Chon MAU cua chu, khong phai noi dung cua chu.</p>
        <p className={styles.colorWord} style={{ color: colorRound.wordColorHex }}>
          {colorRound.word}
        </p>
        <div className={styles.answers}>
          {colorRound.choices.map((choice) => (
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
  };

  return (
    <main id="cvf-game-root" className={styles.page} data-game={activeGame}>
      {showOnboarding ? (
        <div className={styles.onboardingBackdrop} role="dialog" aria-modal="true">
          <section className={styles.onboardingCard}>
            <h2>Chao mung den CVF Mini Detective Academy</h2>
            <ul className={styles.onboardingList}>
              <li>Chon 1 trong 3 mini game o hang tab phia tren.</li>
              <li>Nhan phim 1-4 de chon dap an nhanh, nhan R de choi lai run.</li>
              <li>Parent Mode cho phep gioi han thoi gian choi moi ngay.</li>
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
                Bat dau choi
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
              Nhiem vu hom nay: giai ma mini game, giu combo that dai va tro thanh sieu tham tu cua hoc vien.
            </p>
            <div className={styles.heroMeta}>
              <span className={styles.chip}>Dang choi: {gameTitle}</span>
              <span className={styles.chip}>Profile: {ageProfile.label}</span>
              <span className={styles.chip}>Combo = Diem thuong</span>
            </div>
            <div className={styles.heroControlGrid}>
              <section className={styles.heroControlCard}>
                <p className={styles.controlTitle}>Do tuoi</p>
                <div className={styles.segmentedRow}>
                  {(Object.keys(AGE_PROFILES) as AgeGroupKey[]).map((key) => (
                    <button
                      key={key}
                      type="button"
                      className={`${styles.segmentedButton} ${ageGroup === key ? styles.segmentedButtonActive : ""}`}
                      onClick={() => setAgeGroup(key)}
                    >
                      {AGE_PROFILES[key].label}
                    </button>
                  ))}
                </div>
              </section>
              <section className={styles.heroControlCard}>
                <p className={styles.controlTitle}>Am thanh</p>
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
                    {soundMuted ? "Bat am thanh" : "Tat am thanh"}
                  </button>
                  <label className={styles.audioLabel} htmlFor="sound-volume">
                    Volume {soundVolume}%
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
                  <span>Hieu ung click/hover</span>
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
                  <span>Doc cau hoi (TTS)</span>
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
                  <span>Tu dong doc cau moi</span>
                </label>
                {!ttsSupported ? <p className={styles.telemetryNote}>Trinh duyet nay khong ho tro TTS.</p> : null}
              </section>
            </div>
            <p className={styles.telemetryNote}>Telemetry chi ghi event an danh, khong thu thap thong tin ca nhan cua tre.</p>
            <div className={styles.heroActions}>
              <button
                type="button"
                className={styles.primaryCta}
                onClick={() => {
                  document.getElementById("mission-zone")?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                Vao tran ngay
              </button>
              <button type="button" className={styles.secondaryCta} onClick={() => setShowOnboarding(true)}>
                Xem huong dan nhanh
              </button>
            </div>
          </article>
          <div className={styles.playgroundWrap}>
            <PhaserPlayground className={styles.playground} />
            <span className={styles.playgroundLabel}>Phaser playground live</span>
          </div>
        </section>

        <MiniGameTabs
          activeKey={activeGame}
          onSelect={(nextGame) => {
            const nextRound = getRoundConfig(nextGame, level.key, ageGroup);
            setActiveGame(nextGame);
            setWrongStreak(0);
            beginRound(nextGame, nextRound, "switch_game");
            setFeedback({
              tone: "info",
              text: `${MINI_GAMES.find((item) => item.key === nextGame)?.title ?? "Mini game"} san sang!`,
            });
            void trackEvent("game_switch", { game: nextGame, level: level.key });
          }}
        />

        <LevelSelector
          selected={levelKey}
          onSelect={(nextLevelKey) => {
            const nextRound = getRoundConfig(activeGame, nextLevelKey, ageGroup);
            setLevelKey(nextLevelKey);
            const nextLevel = LEVELS[nextLevelKey];
            setWrongStreak(0);
            beginRound(activeGame, nextRound, "switch_level", nextLevelKey);
            setFeedback({
              tone: "info",
              text: `${nextLevel.label} da kich hoat cho ${gameTitle}.`,
            });
          }}
        />

        <GameHud
          score={progress.score}
          combo={progress.combo}
          highScore={progress.highScores[level.key]}
          streak={progress.streak}
          timeLeft={timeLeft}
        />

        <section className={styles.questStrip} aria-label="Nhiem vu hom nay">
          <article className={styles.questCard}>
            <p className={styles.questTitle}>Nhiem vu 1: Choi deu tay</p>
            <p className={styles.questHint}>Hoan thanh 12 vong trong ngay.</p>
            <div className={styles.questTrack} role="presentation" aria-hidden>
              <span className={styles.questFill} style={{ width: `${questProgress.roundsProgress}%` }} />
            </div>
            <p className={styles.questValue}>{progress.dailyStats.rounds}/12</p>
          </article>
          <article className={styles.questCard}>
            <p className={styles.questTitle}>Nhiem vu 2: Chinh xac</p>
            <p className={styles.questHint}>Dat do chinh xac {"\u003E="} 70%.</p>
            <div className={styles.questTrack} role="presentation" aria-hidden>
              <span className={styles.questFill} style={{ width: `${questProgress.accuracyProgress}%` }} />
            </div>
            <p className={styles.questValue}>{questProgress.todayAccuracy}%</p>
          </article>
          <article className={styles.questCard}>
            <p className={styles.questTitle}>Nhiem vu 3: Da nang</p>
            <p className={styles.questHint}>Moi mini game choi it nhat 1 lan.</p>
            <div className={styles.questMiniGrid}>
              <span className={`${styles.questMiniPill} ${questProgress.mathProgress > 0 ? styles.questMiniDone : ""}`}>Toan</span>
              <span className={`${styles.questMiniPill} ${questProgress.memoryProgress > 0 ? styles.questMiniDone : ""}`}>Nho</span>
              <span className={`${styles.questMiniPill} ${questProgress.colorProgress > 0 ? styles.questMiniDone : ""}`}>Mau</span>
            </div>
            <p className={styles.questValue}>{questProgress.balanceDone ? "Hoan thanh" : "Dang mo"}</p>
          </article>
        </section>

        <section
          id="mission-zone"
          className={`${styles.questionCard} ${timeLeft <= 6 ? styles.questionCardDanger : ""}`}
        >
          {showCelebration ? (
            <div className={styles.confettiLayer} aria-hidden>
              <span className={styles.confettiMessage}>Tuyet voi!</span>
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
                  ? `Nho ky chuoi trong ${memoryRevealLeft}s truoc khi bi an.`
                  : "Dung lien tiep de tang combo va mo khoa huy hieu."}
              </p>
            </div>
            <div className={styles.questionHeaderRight}>
              <button
                type="button"
                className={styles.ttsButton}
                disabled={!ttsEnabled || soundMuted || !ttsSupported}
                onClick={() => speakCurrentPrompt("manual")}
              >
                Doc cau hoi
              </button>
              {!playable ? <p className={styles.blocked}>Da het gio choi hom nay.</p> : null}
            </div>
          </header>
          <div className={styles.timerCluster}>
            <p className={styles.timerLabel}>Round timer: {timeLeft}s</p>
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
                text: "Da reset run moi. Co gang pha ky luc nao!",
              });
              void trackEvent("restart_run", { level: level.key, game: activeGame });
            }}
          >
            Choi lai tu dau
          </button>
        </section>

        <section className={styles.metaRow}>
          <BadgeShelf badges={progress.badges} />
          <ParentModePanel
            settings={progress.parentMode}
            remainingMinutes={remainingMinutes}
            report={parentReport}
            locked={parentLocked}
            parentMessage={parentMessage}
            onUnlock={(pin) => {
              if (verifyParentPin(progress, pin)) {
                setParentUnlocked(true);
                setParentMessage("Da mo khoa khu vuc phu huynh.");
                void trackEvent("parent_unlock", { success: true });
              } else {
                setParentMessage("PIN khong dung. Vui long thu lai.");
                void trackEvent("parent_unlock", { success: false });
              }
            }}
            onSetPin={(pin) => {
              const normalized = pin.trim();
              const isValid = /^[0-9]{4,6}$/.test(normalized);
              if (!isValid) {
                setParentMessage("PIN can 4-6 chu so.");
                return;
              }
              setParentPin(normalized);
              setParentUnlocked(false);
              setParentMessage("Da luu PIN va khoa lai khu vuc phu huynh.");
              void trackEvent("parent_pin_update", { length: normalized.length });
            }}
            onLock={() => {
              setParentUnlocked(false);
              setParentMessage("Da khoa khu vuc phu huynh.");
            }}
            onResetAll={() => {
              resetAllProgress();
              setParentUnlocked(false);
              setParentMessage("Da reset toan bo du lieu choi.");
              setWrongStreak(0);
              beginRound(activeGame, activeRoundConfig, "reset_all");
            }}
            onToggle={(enabled) => {
              if (parentLocked) {
                setParentMessage("Can mo khoa Parent Mode truoc khi thay doi.");
                return;
              }
              setParentMode(enabled, progress.parentMode.dailyLimitMinutes);
              void trackEvent("parent_mode_update", { enabled });
              setParentMessage("Da cap nhat Parent Mode.");
            }}
            onLimitChange={(minutes) => {
              if (parentLocked) {
                setParentMessage("Can mo khoa Parent Mode truoc khi thay doi.");
                return;
              }
              updateProgress((previous) => updateParentMode(previous, { dailyLimitMinutes: minutes }));
              void trackEvent("parent_mode_update", { limit: minutes });
              setParentMessage(`Da cap nhat gioi han: ${minutes} phut/ngay.`);
            }}
          />
        </section>
      </div>
    </main>
  );
}
