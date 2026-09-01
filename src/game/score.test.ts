import { expect, test } from "vite-plus/test";
import {
  accuracyFactor,
  clamp,
  computeAccuracy,
  computeCpm,
  computeSalary,
  speedFactor,
} from "./score";

test("速度補正は CPM/150 を 0.5〜1.5 に収める", () => {
  expect(speedFactor(0)).toBe(0.5);
  expect(speedFactor(75)).toBe(0.5);
  expect(speedFactor(150)).toBe(1);
  expect(speedFactor(225)).toBe(1.5);
  expect(speedFactor(400)).toBe(1.5);
});

test("正確性補正は指定点を線形補間する", () => {
  expect(accuracyFactor(0.8)).toBeCloseTo(0.8);
  expect(accuracyFactor(0.9)).toBeCloseTo(1);
  expect(accuracyFactor(1)).toBeCloseTo(1.2);
  expect(accuracyFactor(0.5)).toBeCloseTo(0.8);
  expect(accuracyFactor(0.85)).toBeCloseTo(0.9);
  expect(accuracyFactor(0.95)).toBeCloseTo(1.1);
});

test("CPM と正確性の定義", () => {
  expect(computeCpm(150, 60_000)).toBe(150);
  expect(computeAccuracy(9, 10)).toBeCloseTo(0.9);
  expect(computeAccuracy(0, 0)).toBe(1);
});

test("年収は基礎額×難易度×速度×正確性", () => {
  expect(
    computeSalary({
      replyChars: 20,
      difficulty: "beginner",
      cpm: 150,
      accuracy: 0.9,
    }),
  ).toBe(2000);
  expect(
    computeSalary({
      replyChars: 20,
      difficulty: "intermediate",
      cpm: 150,
      accuracy: 0.9,
    }),
  ).toBe(3000);
});

test("clamp の境界", () => {
  expect(clamp(0, 0.5, 1.5)).toBe(0.5);
  expect(clamp(2, 0.5, 1.5)).toBe(1.5);
  expect(clamp(1, 0.5, 1.5)).toBe(1);
});
