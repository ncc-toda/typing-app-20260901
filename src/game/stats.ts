export type Finger =
  | "left-pinky"
  | "left-ring"
  | "left-middle"
  | "left-index"
  | "thumb"
  | "right-index"
  | "right-middle"
  | "right-ring"
  | "right-pinky";

export type KeyCounter = {
  key: string;
  hitCount: number;
  missCount: number;
};

export type TransitionCounter = {
  fromKey: string;
  toKey: string;
  hitCount: number;
  missCount: number;
};

const FINGER_BY_KEY: Record<string, Finger> = {
  "1": "left-pinky",
  q: "left-pinky",
  a: "left-pinky",
  z: "left-pinky",
  "2": "left-ring",
  w: "left-ring",
  s: "left-ring",
  x: "left-ring",
  "3": "left-middle",
  e: "left-middle",
  d: "left-middle",
  c: "left-middle",
  "4": "left-index",
  "5": "left-index",
  r: "left-index",
  t: "left-index",
  f: "left-index",
  g: "left-index",
  v: "left-index",
  b: "left-index",
  " ": "thumb",
  "6": "right-index",
  "7": "right-index",
  y: "right-index",
  u: "right-index",
  h: "right-index",
  j: "right-index",
  n: "right-index",
  m: "right-index",
  "8": "right-middle",
  i: "right-middle",
  k: "right-middle",
  ",": "right-middle",
  "9": "right-ring",
  o: "right-ring",
  l: "right-ring",
  ".": "right-ring",
  "0": "right-pinky",
  p: "right-pinky",
  ";": "right-pinky",
  "/": "right-pinky",
  "-": "right-pinky",
  "=": "right-pinky",
  "[": "right-pinky",
  "]": "right-pinky",
};

export function fingerForKey(key: string): Finger {
  return FINGER_BY_KEY[key.toLowerCase()] ?? "right-pinky";
}

export function missRate(hitCount: number, missCount: number): number {
  const total = hitCount + missCount;
  if (total === 0) {
    return 0;
  }
  return missCount / total;
}

export class PlayAggregator {
  correctKeys = 0;
  totalKeys = 0;
  missCount = 0;
  combo = 0;
  maxCombo = 0;
  #lastKey: string | null = null;
  #keys = new Map<string, KeyCounter>();
  #transitions = new Map<string, TransitionCounter>();

  record(key: string, ok: boolean): void {
    this.totalKeys += 1;
    if (ok) {
      this.correctKeys += 1;
      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
    } else {
      this.missCount += 1;
      this.combo = 0;
    }

    const keyRow = this.#keys.get(key) ?? { key, hitCount: 0, missCount: 0 };
    if (ok) {
      keyRow.hitCount += 1;
    } else {
      keyRow.missCount += 1;
    }
    this.#keys.set(key, keyRow);

    if (this.#lastKey !== null) {
      const id = `${this.#lastKey}\0${key}`;
      const row = this.#transitions.get(id) ?? {
        fromKey: this.#lastKey,
        toKey: key,
        hitCount: 0,
        missCount: 0,
      };
      if (ok) {
        row.hitCount += 1;
      } else {
        row.missCount += 1;
      }
      this.#transitions.set(id, row);
    }
    this.#lastKey = key;
  }

  keyStats(): KeyCounter[] {
    return [...this.#keys.values()];
  }

  transitionStats(): TransitionCounter[] {
    return [...this.#transitions.values()];
  }

  fingerStats(): Array<{ finger: Finger; hitCount: number; missCount: number }> {
    const byFinger = new Map<Finger, { finger: Finger; hitCount: number; missCount: number }>();
    for (const row of this.#keys.values()) {
      const finger = fingerForKey(row.key);
      const current = byFinger.get(finger) ?? { finger, hitCount: 0, missCount: 0 };
      current.hitCount += row.hitCount;
      current.missCount += row.missCount;
      byFinger.set(finger, current);
    }
    return [...byFinger.values()];
  }
}
