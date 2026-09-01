import { Hono } from "hono";
import {
  insertPlayResult,
  listAggregatedKeys,
  listAggregatedTransitions,
  listPlayHistory,
  listProblems,
} from "./db";
import { isValidationError, parseAnonymousId, parseDifficulty, parsePlayResult } from "./validate";

const app = new Hono<{ Bindings: Env }>();

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

app.get("/api/problems", async (c) => {
  const difficulty = parseDifficulty(c.req.query("difficulty"));
  if (isValidationError(difficulty)) {
    return c.json({ error: difficulty.message }, difficulty.status);
  }
  const problems = await listProblems(c.env.DB, difficulty);
  return c.json({ problems });
});

app.post("/api/results", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "JSON を解析できません" }, 400);
  }
  const parsed = parsePlayResult(body);
  if (isValidationError(parsed)) {
    return c.json({ error: parsed.message }, parsed.status);
  }
  const id = await insertPlayResult(c.env.DB, parsed);
  return c.json({ id }, 201);
});

app.get("/api/stats", async (c) => {
  const anonymousId = parseAnonymousId(c.req.query("anonymousId"));
  if (isValidationError(anonymousId)) {
    return c.json({ error: anonymousId.message }, anonymousId.status);
  }

  const [history, worstKeys, worstTransitions] = await Promise.all([
    listPlayHistory(c.env.DB, anonymousId),
    listAggregatedKeys(c.env.DB, anonymousId),
    listAggregatedTransitions(c.env.DB, anonymousId),
  ]);

  return c.json({
    history: history.map((row) => ({
      id: row.id,
      difficulty: row.difficulty,
      salary: row.salary,
      cpm: row.cpm,
      accuracy: row.accuracy,
      missCount: row.miss_count,
      maxCombo: row.max_combo,
      repliesCompleted: row.replies_completed,
      durationMs: row.duration_ms,
      createdAt: row.created_at,
    })),
    worstKeys: worstKeys.map((row) => ({
      key: row.key,
      hitCount: row.hit_count,
      missCount: row.miss_count,
    })),
    worstTransitions: worstTransitions.map((row) => ({
      fromKey: row.from_key,
      toKey: row.to_key,
      hitCount: row.hit_count,
      missCount: row.miss_count,
    })),
  });
});

export default app;
