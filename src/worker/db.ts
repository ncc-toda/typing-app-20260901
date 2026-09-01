import type { Difficulty, PlayResultInput, Problem } from "./types";

export type ProblemRow = {
  id: number;
  difficulty: Difficulty;
  opponent_name: string;
  opponent_message: string;
  reply_text: string;
  sort_order: number;
};

export type PlayHistoryRow = {
  id: number;
  difficulty: Difficulty;
  salary: number;
  cpm: number;
  accuracy: number;
  miss_count: number;
  max_combo: number;
  replies_completed: number;
  duration_ms: number;
  created_at: string;
};

export type AggregatedKeyRow = {
  key: string;
  hit_count: number;
  miss_count: number;
};

export type AggregatedTransitionRow = {
  from_key: string;
  to_key: string;
  hit_count: number;
  miss_count: number;
};

export function problemFromRow(row: ProblemRow): Problem {
  return {
    id: row.id,
    difficulty: row.difficulty,
    opponentName: row.opponent_name,
    opponentMessage: row.opponent_message,
    replyText: row.reply_text,
    sortOrder: row.sort_order,
  };
}

export async function listProblems(db: D1Database, difficulty: Difficulty): Promise<Problem[]> {
  const result = await db
    .prepare(
      `SELECT id, difficulty, opponent_name, opponent_message, reply_text, sort_order
			 FROM problems
			 WHERE difficulty = ?
			 ORDER BY sort_order ASC`,
    )
    .bind(difficulty)
    .all<ProblemRow>();
  return (result.results ?? []).map(problemFromRow);
}

export async function insertPlayResult(db: D1Database, input: PlayResultInput): Promise<number> {
  const inserted = await db
    .prepare(
      `INSERT INTO play_results (
				anonymous_id, difficulty, salary, cpm, accuracy, miss_count, max_combo,
				replies_completed, duration_ms
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      input.anonymousId,
      input.difficulty,
      input.salary,
      input.cpm,
      input.accuracy,
      input.missCount,
      input.maxCombo,
      input.repliesCompleted,
      input.durationMs,
    )
    .run();

  const playResultId = Number(inserted.meta.last_row_id);
  const statements: D1PreparedStatement[] = [];

  for (const stat of input.keyStats) {
    statements.push(
      db
        .prepare(
          `INSERT INTO play_key_stats (play_result_id, key, hit_count, miss_count)
					 VALUES (?, ?, ?, ?)`,
        )
        .bind(playResultId, stat.key, stat.hitCount, stat.missCount),
    );
  }
  for (const stat of input.transitionStats) {
    statements.push(
      db
        .prepare(
          `INSERT INTO play_transition_stats (play_result_id, from_key, to_key, hit_count, miss_count)
					 VALUES (?, ?, ?, ?, ?)`,
        )
        .bind(playResultId, stat.fromKey, stat.toKey, stat.hitCount, stat.missCount),
    );
  }

  if (statements.length > 0) {
    await db.batch(statements);
  }

  return playResultId;
}

export async function listPlayHistory(
  db: D1Database,
  anonymousId: string,
): Promise<PlayHistoryRow[]> {
  const result = await db
    .prepare(
      `SELECT id, difficulty, salary, cpm, accuracy, miss_count, max_combo,
			        replies_completed, duration_ms, created_at
			 FROM play_results
			 WHERE anonymous_id = ?
			 ORDER BY created_at DESC, id DESC`,
    )
    .bind(anonymousId)
    .all<PlayHistoryRow>();
  return result.results ?? [];
}

export async function listAggregatedKeys(
  db: D1Database,
  anonymousId: string,
): Promise<AggregatedKeyRow[]> {
  const result = await db
    .prepare(
      `SELECT k.key AS key, SUM(k.hit_count) AS hit_count, SUM(k.miss_count) AS miss_count
			 FROM play_key_stats k
			 INNER JOIN play_results r ON r.id = k.play_result_id
			 WHERE r.anonymous_id = ?
			 GROUP BY k.key
			 ORDER BY CASE WHEN SUM(k.hit_count) + SUM(k.miss_count) = 0 THEN 0
			               ELSE CAST(SUM(k.miss_count) AS REAL) / (SUM(k.hit_count) + SUM(k.miss_count))
			          END DESC,
			          SUM(k.miss_count) DESC
			 LIMIT 5`,
    )
    .bind(anonymousId)
    .all<AggregatedKeyRow>();
  return result.results ?? [];
}

export async function listAggregatedTransitions(
  db: D1Database,
  anonymousId: string,
): Promise<AggregatedTransitionRow[]> {
  const result = await db
    .prepare(
      `SELECT t.from_key AS from_key, t.to_key AS to_key,
			        SUM(t.hit_count) AS hit_count, SUM(t.miss_count) AS miss_count
			 FROM play_transition_stats t
			 INNER JOIN play_results r ON r.id = t.play_result_id
			 WHERE r.anonymous_id = ?
			 GROUP BY t.from_key, t.to_key
			 ORDER BY CASE WHEN SUM(t.hit_count) + SUM(t.miss_count) = 0 THEN 0
			               ELSE CAST(SUM(t.miss_count) AS REAL) / (SUM(t.hit_count) + SUM(t.miss_count))
			          END DESC,
			          SUM(t.miss_count) DESC
			 LIMIT 5`,
    )
    .bind(anonymousId)
    .all<AggregatedTransitionRow>();
  return result.results ?? [];
}
