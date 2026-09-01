import type { Difficulty } from "../worker/types";

export const DIFFICULTY_FACTOR: Record<Difficulty, number> = {
  beginner: 1,
  intermediate: 1.5,
  advanced: 2,
};

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function speedFactor(cpm: number): number {
  return clamp(cpm / 150, 0.5, 1.5);
}

export function accuracyFactor(accuracy: number): number {
  const ratio = clamp(accuracy, 0, 1);
  if (ratio <= 0.8) {
    return 0.8;
  }
  if (ratio <= 0.9) {
    return 0.8 + ((ratio - 0.8) / 0.1) * 0.2;
  }
  return 1 + ((ratio - 0.9) / 0.1) * 0.2;
}

export function computeCpm(correctKeys: number, durationMs: number): number {
  if (durationMs <= 0) {
    return 0;
  }
  return (correctKeys * 60_000) / durationMs;
}

export function computeAccuracy(correctKeys: number, totalKeys: number): number {
  if (totalKeys <= 0) {
    return 1;
  }
  return correctKeys / totalKeys;
}

export function computeSalary(input: {
  replyChars: number;
  difficulty: Difficulty;
  cpm: number;
  accuracy: number;
}): number {
  const base = input.replyChars * 100;
  return Math.round(
    base *
      DIFFICULTY_FACTOR[input.difficulty] *
      speedFactor(input.cpm) *
      accuracyFactor(input.accuracy),
  );
}
