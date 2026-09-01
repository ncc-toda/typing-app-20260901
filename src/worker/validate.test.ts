import { expect, test } from "vite-plus/test";
import { parseAnonymousId, parseDifficulty, parsePlayResult } from "./validate";

const validResult = {
  anonymousId: "11111111-1111-4111-8111-111111111111",
  difficulty: "beginner",
  salary: 12000,
  cpm: 180,
  accuracy: 0.95,
  missCount: 2,
  maxCombo: 40,
  repliesCompleted: 3,
  durationMs: 120000,
  keyStats: [{ key: "a", hitCount: 10, missCount: 1 }],
  transitionStats: [{ fromKey: "s", toKey: "i", hitCount: 4, missCount: 0 }],
};

test("difficulty の許可値だけ通す", () => {
  expect(parseDifficulty("beginner")).toBe("beginner");
  expect(parseDifficulty("intermediate")).toBe("intermediate");
  expect(parseDifficulty("advanced")).toBe("advanced");
  expect(parseDifficulty("hard")).toMatchObject({ status: 400 });
  expect(parseDifficulty(undefined)).toMatchObject({ status: 400 });
});

test("anonymousId は UUID だけ通す", () => {
  expect(parseAnonymousId("11111111-1111-4111-8111-111111111111")).toBe(
    "11111111-1111-4111-8111-111111111111",
  );
  expect(parseAnonymousId("not-a-uuid")).toMatchObject({ status: 400 });
});

test("正常なプレイ結果を受理する", () => {
  expect(parsePlayResult(validResult)).toMatchObject(validResult);
});

test("範囲外の accuracy を拒否する", () => {
  expect(parsePlayResult({ ...validResult, accuracy: 1.2 })).toMatchObject({ status: 400 });
  expect(parsePlayResult({ ...validResult, accuracy: -0.1 })).toMatchObject({ status: 400 });
});

test("負の salary を拒否する", () => {
  expect(parsePlayResult({ ...validResult, salary: -1 })).toMatchObject({ status: 400 });
});

test("巨大な keyStats を拒否する", () => {
  const keyStats = Array.from({ length: 257 }, (_, i) => ({
    key: "a",
    hitCount: i,
    missCount: 0,
  }));
  expect(parsePlayResult({ ...validResult, keyStats })).toMatchObject({ status: 400 });
});
