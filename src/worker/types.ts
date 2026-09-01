export const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

export type Difficulty = (typeof DIFFICULTIES)[number];

export type Problem = {
  id: number;
  difficulty: Difficulty;
  opponentName: string;
  opponentMessage: string;
  replyText: string;
  sortOrder: number;
};

export type KeyStatInput = {
  key: string;
  hitCount: number;
  missCount: number;
};

export type TransitionStatInput = {
  fromKey: string;
  toKey: string;
  hitCount: number;
  missCount: number;
};

export type PlayResultInput = {
  anonymousId: string;
  difficulty: Difficulty;
  salary: number;
  cpm: number;
  accuracy: number;
  missCount: number;
  maxCombo: number;
  repliesCompleted: number;
  durationMs: number;
  keyStats: KeyStatInput[];
  transitionStats: TransitionStatInput[];
};
