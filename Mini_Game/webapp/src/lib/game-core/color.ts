import { ColorRound } from "@/lib/game-core/types";

interface ColorEntry {
  name: string;
  hex: string;
}

const COLORS: ColorEntry[] = [
  { name: "Xanh Duong", hex: "#1fb6ff" },
  { name: "Vang", hex: "#ffb703" },
  { name: "Do", hex: "#ff4d4f" },
  { name: "Xanh La", hex: "#52c41a" },
  { name: "Cam", hex: "#ff8c42" },
  { name: "Hong", hex: "#ff66a3" },
];

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function generateColorRound(): ColorRound {
  const entries = shuffle(COLORS);
  const answerColor = entries[0];
  const wordEntry = entries[1];
  const allowMatch = Math.random() < 0.2;

  const word = allowMatch ? answerColor.name : wordEntry.name;
  const choices = shuffle(entries.slice(0, 4).map((item) => item.name));
  if (!choices.includes(answerColor.name)) {
    choices[0] = answerColor.name;
  }

  return {
    word,
    wordColorHex: answerColor.hex,
    answerColorName: answerColor.name,
    choices: shuffle(choices),
  };
}

export function getColorHint(answerColorName: string): string {
  return `Goi y: Tap trung vao MAU CHU, dap an la ${answerColorName}.`;
}

export function getColorHexByName(colorName: string): string {
  const found = COLORS.find((item) => item.name === colorName);
  return found?.hex ?? "#1fb6ff";
}
