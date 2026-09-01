import type { Difficulty, Problem } from "../worker/types";

export async function fetchProblems(difficulty: Difficulty): Promise<Problem[]> {
  const response = await fetch(`/api/problems?difficulty=${difficulty}`);
  if (!response.ok) {
    throw new Error("問題を取得できませんでした");
  }
  const body = (await response.json()) as { problems: Problem[] };
  return body.problems;
}

export async function saveResult(payload: unknown): Promise<void> {
  const response = await fetch("/api/results", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    throw new Error("結果を保存できませんでした");
  }
}

export type StatsResponse = {
  history: Array<{
    id: number;
    difficulty: Difficulty;
    salary: number;
    cpm: number;
    accuracy: number;
    missCount: number;
    maxCombo: number;
    repliesCompleted: number;
    durationMs: number;
    createdAt: string;
  }>;
  worstKeys: Array<{ key: string; hitCount: number; missCount: number }>;
  worstTransitions: Array<{
    fromKey: string;
    toKey: string;
    hitCount: number;
    missCount: number;
  }>;
};

export async function fetchStats(anonymousId: string): Promise<StatsResponse> {
  const response = await fetch(`/api/stats?anonymousId=${anonymousId}`);
  if (!response.ok) {
    throw new Error("統計を取得できませんでした");
  }
  return (await response.json()) as StatsResponse;
}
