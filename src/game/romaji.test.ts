import { expect, test } from "vite-plus/test";
import { applyKey, createRomajiSession, tokenizeRomaji, typeText } from "./romaji";

test("shi/si chi/ti tsu/tu fu/hu を許容する", () => {
  expect(typeText("し", "shi")).toBe(true);
  expect(typeText("し", "si")).toBe(true);
  expect(typeText("ち", "chi")).toBe(true);
  expect(typeText("ち", "ti")).toBe(true);
  expect(typeText("つ", "tsu")).toBe(true);
  expect(typeText("つ", "tu")).toBe(true);
  expect(typeText("ふ", "fu")).toBe(true);
  expect(typeText("ふ", "hu")).toBe(true);
});

test("拗音と促音を通す", () => {
  expect(typeText("しゃ", "sha")).toBe(true);
  expect(typeText("しゃ", "sya")).toBe(true);
  expect(typeText("っち", "tchi")).toBe(true);
  expect(typeText("っち", "tti")).toBe(true);
  expect(typeText("っち", "xtuchi")).toBe(true);
});

test("撥音は母音の前で n 単独にしない", () => {
  expect(typeText("んあ", "nna")).toBe(true);
  expect(typeText("んあ", "n'a")).toBe(true);
  expect(typeText("んあ", "na")).toBe(false);
});

test("英数字と業務記号をそのまま判定する", () => {
  expect(typeText("PR #123", "PR #123")).toBe(true);
  expect(typeText("@tanaka", "@tanaka")).toBe(true);
  expect(typeText("`API`", "`API`")).toBe(true);
  expect(tokenizeRomaji("かくにんします。").map((token) => token.display)).toEqual([
    "か",
    "く",
    "に",
    "ん",
    "し",
    "ま",
    "す",
    "。",
  ]);
  expect(typeText("かくにん", "kakunin")).toBe(true);
  expect(typeText("します。", "shimasu.")).toBe(true);
  expect(typeText("かくにんします。", "kakuninshimasu.")).toBe(true);
  expect(typeText("かくにんします。", "kakuninsimasu.")).toBe(true);
});

test("誤入力では進まない", () => {
  const started = createRomajiSession("あ");
  const missed = applyKey(started, "k");
  expect(missed.ok).toBe(false);
  expect(missed.session.tokenIndex).toBe(0);
  const ok = applyKey(started, "a");
  expect(ok.ok).toBe(true);
  expect(ok.session.finished).toBe(true);
});

test("カタカナもローマ字化できる", () => {
  expect(typeText("ログ", "rogu")).toBe(true);
});
