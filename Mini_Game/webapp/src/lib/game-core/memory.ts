import { MemoryRound } from "@/lib/game-core/types";

type UiLanguage = "vi" | "en";

const SYMBOL_POOL = ["🚀", "🛰️", "🌟", "🪐", "🔭", "🧪", "🧠", "⚡", "🛸", "📡"];

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function pickDistinctSymbols(count: number): string[] {
  return shuffle(SYMBOL_POOL).slice(0, count);
}

export function generateMemoryRound(limit: number): MemoryRound {
  const complexity = limit <= 20 ? 5 : limit <= 50 ? 6 : 7;
  const revealSeconds = limit <= 20 ? 4 : limit <= 50 ? 3 : 2;

  const options = pickDistinctSymbols(4);
  const answer = options[randomInt(0, options.length - 1)];

  const answerCount = randomInt(2, Math.max(3, Math.floor(complexity / 2) + 1));
  const sequence: string[] = Array(answerCount).fill(answer);

  while (sequence.length < complexity) {
    const distractor = options[randomInt(0, options.length - 1)];
    if (distractor !== answer) {
      sequence.push(distractor);
    }
  }

  return {
    sequence: shuffle(sequence),
    choices: shuffle(options),
    answer,
    revealSeconds,
  };
}

export function getMemoryHint(answer: string, language: UiLanguage = "vi"): string {
  if (language === "en") {
    return `Hint: the correct symbol is ${answer}.`;
  }
  return `Goi y: Ky hieu dung la ${answer}.`;
}
