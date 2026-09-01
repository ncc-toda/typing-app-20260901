import { expect, test } from "vite-plus/test";
import { problemFromRow, type ProblemRow } from "./db";
import app from "./index";

const sampleProblem: ProblemRow = {
  id: 1,
  difficulty: "beginner",
  opponent_name: "田中",
  opponent_message: "レビューお願いします",
  reply_text: "確認します。",
  reply_kana: "かくにんします。",
  sort_order: 1,
};

function createMockDb() {
  const problems = [sampleProblem];
  const results: Array<Record<string, unknown>> = [];
  const keyStats: Array<Record<string, unknown>> = [];
  const transitionStats: Array<Record<string, unknown>> = [];
  let nextId = 1;

  const db = {
    prepare(sql: string) {
      let params: unknown[] = [];
      const statement = {
        bind(...values: unknown[]) {
          params = values;
          return statement;
        },
        async all() {
          if (sql.includes("FROM problems")) {
            const difficulty = params[0];
            return {
              results: problems.filter((row) => row.difficulty === difficulty),
            };
          }
          if (sql.includes("FROM play_results")) {
            const anonymousId = params[0];
            return {
              results: results.filter((row) => row.anonymous_id === anonymousId),
            };
          }
          if (sql.includes("FROM play_key_stats")) {
            return { results: keyStats };
          }
          if (sql.includes("FROM play_transition_stats")) {
            return { results: transitionStats };
          }
          return { results: [] };
        },
        async run() {
          if (sql.includes("INSERT INTO play_results")) {
            const id = nextId;
            nextId += 1;
            results.push({
              id,
              anonymous_id: params[0],
              difficulty: params[1],
              salary: params[2],
              cpm: params[3],
              accuracy: params[4],
              miss_count: params[5],
              max_combo: params[6],
              replies_completed: params[7],
              duration_ms: params[8],
              created_at: "2026-09-01T00:00:00",
            });
            return { meta: { last_row_id: id } };
          }
          if (sql.includes("INSERT INTO play_key_stats")) {
            keyStats.push({
              play_result_id: params[0],
              key: params[1],
              hit_count: params[2],
              miss_count: params[3],
            });
            return { meta: { last_row_id: keyStats.length } };
          }
          if (sql.includes("INSERT INTO play_transition_stats")) {
            transitionStats.push({
              play_result_id: params[0],
              from_key: params[1],
              to_key: params[2],
              hit_count: params[3],
              miss_count: params[4],
            });
            return { meta: { last_row_id: transitionStats.length } };
          }
          return { meta: { last_row_id: 0 } };
        },
      };
      return statement;
    },
    async batch(statements: Array<{ run: () => Promise<unknown> }>) {
      for (const statement of statements) {
        await statement.run();
      }
    },
  };

  return db as unknown as D1Database;
}

function env(): Env {
  return { DB: createMockDb() } as Env;
}

test("problemFromRow が API 用のキャメルケースに変換する", () => {
  expect(problemFromRow(sampleProblem)).toEqual({
    id: 1,
    difficulty: "beginner",
    opponentName: "田中",
    opponentMessage: "レビューお願いします",
    replyText: "確認します。",
    replyKana: "かくにんします。",
    sortOrder: 1,
  });
});

test("GET /api/problems は不正な難易度を 400 にする", async () => {
  const response = await app.request("/api/problems?difficulty=hard", {}, env());
  expect(response.status).toBe(400);
});

test("GET /api/problems は問題一覧を返す", async () => {
  const response = await app.request("/api/problems?difficulty=beginner", {}, env());
  expect(response.status).toBe(200);
  const body = (await response.json()) as { problems: unknown[] };
  expect(body.problems).toHaveLength(1);
});

test("POST /api/results は検証エラーを 400 にする", async () => {
  const response = await app.request(
    "/api/results",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ anonymousId: "bad" }),
    },
    env(),
  );
  expect(response.status).toBe(400);
});

test("POST /api/results のあと GET /api/stats で履歴が見える", async () => {
  const bindings = env();
  const anonymousId = "11111111-1111-4111-8111-111111111111";
  const created = await app.request(
    "/api/results",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        anonymousId,
        difficulty: "beginner",
        salary: 8000,
        cpm: 160,
        accuracy: 0.9,
        missCount: 1,
        maxCombo: 20,
        repliesCompleted: 2,
        durationMs: 120000,
        keyStats: [{ key: "a", hitCount: 8, missCount: 1 }],
        transitionStats: [{ fromKey: "s", toKey: "i", hitCount: 3, missCount: 0 }],
      }),
    },
    bindings,
  );
  expect(created.status).toBe(201);

  const stats = await app.request(`/api/stats?anonymousId=${anonymousId}`, {}, bindings);
  expect(stats.status).toBe(200);
  const body = (await stats.json()) as { history: Array<{ salary: number }> };
  expect(body.history[0]?.salary).toBe(8000);
});
