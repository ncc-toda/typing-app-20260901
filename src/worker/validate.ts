import { DIFFICULTIES, type Difficulty, type PlayResultInput } from "./types";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_STATS = 256;
const MAX_KEY_LEN = 8;

export type ValidationError = { status: 400; message: string };

export function parseAnonymousId(value: string | undefined): string | ValidationError {
  if (typeof value !== "string" || !UUID_RE.test(value)) {
    return { status: 400, message: "anonymousId は UUID である必要があります" };
  }
  return value;
}

export function parseDifficulty(value: string | undefined): Difficulty | ValidationError {
  if (!value || !DIFFICULTIES.includes(value as Difficulty)) {
    return {
      status: 400,
      message: "difficulty は beginner / intermediate / advanced のいずれかです",
    };
  }
  return value as Difficulty;
}

function isNonNegativeInt(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isKeyToken(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_KEY_LEN;
}

export function parsePlayResult(body: unknown): PlayResultInput | ValidationError {
  if (body === null || typeof body !== "object") {
    return { status: 400, message: "JSON オブジェクトが必要です" };
  }

  const input = body as Record<string, unknown>;
  const difficulty = parseDifficulty(
    typeof input.difficulty === "string" ? input.difficulty : undefined,
  );
  if (typeof difficulty !== "string") {
    return difficulty;
  }

  const anonymousId = parseAnonymousId(
    typeof input.anonymousId === "string" ? input.anonymousId : undefined,
  );
  if (typeof anonymousId !== "string") {
    return anonymousId;
  }
  if (!isNonNegativeInt(input.salary)) {
    return { status: 400, message: "salary は 0 以上の整数です" };
  }
  if (!isFiniteNumber(input.cpm) || input.cpm < 0) {
    return { status: 400, message: "cpm は 0 以上の数値です" };
  }
  if (!isFiniteNumber(input.accuracy) || input.accuracy < 0 || input.accuracy > 1) {
    return { status: 400, message: "accuracy は 0 以上 1 以下です" };
  }
  if (!isNonNegativeInt(input.missCount)) {
    return { status: 400, message: "missCount は 0 以上の整数です" };
  }
  if (!isNonNegativeInt(input.maxCombo)) {
    return { status: 400, message: "maxCombo は 0 以上の整数です" };
  }
  if (!isNonNegativeInt(input.repliesCompleted)) {
    return { status: 400, message: "repliesCompleted は 0 以上の整数です" };
  }
  if (!isNonNegativeInt(input.durationMs)) {
    return { status: 400, message: "durationMs は 0 以上の整数です" };
  }

  const keyStats = parseKeyStats(input.keyStats);
  if ("status" in keyStats) {
    return keyStats;
  }
  const transitionStats = parseTransitionStats(input.transitionStats);
  if ("status" in transitionStats) {
    return transitionStats;
  }

  return {
    anonymousId,
    difficulty,
    salary: input.salary,
    cpm: input.cpm,
    accuracy: input.accuracy,
    missCount: input.missCount,
    maxCombo: input.maxCombo,
    repliesCompleted: input.repliesCompleted,
    durationMs: input.durationMs,
    keyStats,
    transitionStats,
  };
}

function parseKeyStats(value: unknown): PlayResultInput["keyStats"] | ValidationError {
  if (!Array.isArray(value) || value.length > MAX_STATS) {
    return { status: 400, message: "keyStats は 256 件以下の配列です" };
  }
  const stats: PlayResultInput["keyStats"] = [];
  for (const item of value) {
    if (item === null || typeof item !== "object") {
      return { status: 400, message: "keyStats の要素が不正です" };
    }
    const row = item as Record<string, unknown>;
    if (
      !isKeyToken(row.key) ||
      !isNonNegativeInt(row.hitCount) ||
      !isNonNegativeInt(row.missCount)
    ) {
      return { status: 400, message: "keyStats の key / hitCount / missCount が不正です" };
    }
    stats.push({ key: row.key, hitCount: row.hitCount, missCount: row.missCount });
  }
  return stats;
}

function parseTransitionStats(
  value: unknown,
): PlayResultInput["transitionStats"] | ValidationError {
  if (!Array.isArray(value) || value.length > MAX_STATS) {
    return { status: 400, message: "transitionStats は 256 件以下の配列です" };
  }
  const stats: PlayResultInput["transitionStats"] = [];
  for (const item of value) {
    if (item === null || typeof item !== "object") {
      return { status: 400, message: "transitionStats の要素が不正です" };
    }
    const row = item as Record<string, unknown>;
    if (
      !isKeyToken(row.fromKey) ||
      !isKeyToken(row.toKey) ||
      !isNonNegativeInt(row.hitCount) ||
      !isNonNegativeInt(row.missCount)
    ) {
      return { status: 400, message: "transitionStats の fromKey / toKey / 回数が不正です" };
    }
    stats.push({
      fromKey: row.fromKey,
      toKey: row.toKey,
      hitCount: row.hitCount,
      missCount: row.missCount,
    });
  }
  return stats;
}

export function isValidationError(value: unknown): value is ValidationError {
  return (
    typeof value === "object" &&
    value !== null &&
    "status" in value &&
    (value as ValidationError).status === 400
  );
}
