import { MathQuestion } from "@/lib/game-core/types";

type UiLanguage = "vi" | "en";

const DELTAS = [-12, -10, -6, -5, -3, -2, -1, 1, 2, 3, 5, 6, 10, 12];

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

function randomDelta(): number {
  return DELTAS[Math.floor(Math.random() * DELTAS.length)];
}

export function generateMathQuestion(limit: number): MathQuestion {
  const operator = Math.random() < 0.62 ? "+" : "-";
  let left = randomInt(1, limit);
  let right = randomInt(1, limit);

  if (operator === "-" && right > left) {
    [left, right] = [right, left];
  }

  const answer = operator === "+" ? left + right : left - right;
  const choices = new Set<number>([answer]);

  while (choices.size < 4) {
    const candidate = Math.max(0, answer + randomDelta());
    if (candidate !== answer) {
      choices.add(candidate);
    }
  }

  return {
    left,
    right,
    operator,
    answer,
    choices: shuffle(Array.from(choices)),
  };
}

export function calculateEarnedScore(nextCombo: number, baseScore: number): number {
  if (nextCombo >= 3) {
    return baseScore * 3;
  }
  return baseScore;
}

export function getDetectiveRank(score: number, language: UiLanguage = "vi"): string {
  if (language === "en") {
    if (score < 60) return "Junior Detective";
    if (score < 140) return "Bronze Detective";
    if (score < 260) return "Silver Detective";
    if (score < 420) return "Gold Detective";
    return "Super Detective";
  }
  if (score < 60) return "Tham tu Tre";
  if (score < 140) return "Tham tu Dong";
  if (score < 260) return "Tham tu Bac";
  if (score < 420) return "Tham tu Vang";
  return "Sieu Tham tu";
}

export function getMathHint(question: MathQuestion, language: UiLanguage = "vi"): string {
  if (language === "en") {
    if (question.operator === "+") {
      return `Hint: ${question.left} + ${question.right} is greater than ${Math.max(question.left, question.right)}.`;
    }
    return `Hint: ${question.left} - ${question.right} is not negative.`;
  }
  if (question.operator === "+") {
    return `Goi y: ${question.left} + ${question.right} lon hon ${Math.max(question.left, question.right)}.`;
  }
  return `Goi y: ${question.left} - ${question.right} la so khong am.`;
}
