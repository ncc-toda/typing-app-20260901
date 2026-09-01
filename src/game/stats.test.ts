import { expect, test } from "vite-plus/test";
import { fingerForKey, missRate, PlayAggregator } from "./stats";

test("キーと指の集計", () => {
  const play = new PlayAggregator();
  play.record("s", true);
  play.record("i", true);
  play.record("s", false);
  expect(play.correctKeys).toBe(2);
  expect(play.missCount).toBe(1);
  expect(play.maxCombo).toBe(2);
  expect(play.keyStats().find((row) => row.key === "s")).toEqual({
    key: "s",
    hitCount: 1,
    missCount: 1,
  });
  expect(play.transitionStats()[0]).toMatchObject({ fromKey: "s", toKey: "i", hitCount: 1 });
  expect(fingerForKey("a")).toBe("left-pinky");
  expect(fingerForKey("j")).toBe("right-index");
});

test("ミス率", () => {
  expect(missRate(9, 1)).toBeCloseTo(0.1);
  expect(missRate(0, 0)).toBe(0);
});
