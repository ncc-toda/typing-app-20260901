export type RomajiToken = {
  display: string;
  patterns: string[];
};

export type RomajiGuideState = "done" | "current" | "pending";

export type RomajiGuide = {
  text: string;
  state: RomajiGuideState;
};

const TWO_KANA: Record<string, string[]> = {
  きゃ: ["kya"],
  きぃ: ["kyi"],
  きゅ: ["kyu"],
  きぇ: ["kye"],
  きょ: ["kyo"],
  しゃ: ["sha", "sya"],
  しぃ: ["syi", "shyi"],
  しゅ: ["shu", "syu"],
  しぇ: ["she", "sye"],
  しょ: ["sho", "syo"],
  ちゃ: ["cha", "tya", "cya"],
  ちぃ: ["tyi", "cyi"],
  ちゅ: ["chu", "tyu", "cyu"],
  ちぇ: ["che", "tye", "cye"],
  ちょ: ["cho", "tyo", "cyo"],
  にゃ: ["nya"],
  にゅ: ["nyu"],
  にょ: ["nyo"],
  ひゃ: ["hya"],
  ひゅ: ["hyu"],
  ひょ: ["hyo"],
  みゃ: ["mya"],
  みゅ: ["myu"],
  みょ: ["myo"],
  りゃ: ["rya"],
  りゅ: ["ryu"],
  りょ: ["ryo"],
  ぎゃ: ["gya"],
  ぎゅ: ["gyu"],
  ぎょ: ["gyo"],
  じゃ: ["ja", "jya", "zya"],
  じゅ: ["ju", "jyu", "zyu"],
  じぇ: ["je", "jye", "zye"],
  じょ: ["jo", "jyo", "zyo"],
  びゃ: ["bya"],
  びゅ: ["byu"],
  びょ: ["byo"],
  ぴゃ: ["pya"],
  ぴゅ: ["pyu"],
  ぴょ: ["pyo"],
  ふぁ: ["fa", "hwa"],
  ふぃ: ["fi", "hwi"],
  ふぇ: ["fe", "hwe"],
  ふぉ: ["fo", "hwo"],
  てぃ: ["thi", "ti"],
  でぃ: ["dhi", "di"],
  うぃ: ["wi"],
  うぇ: ["we"],
  うぉ: ["who", "uxo"],
};

const ONE_KANA: Record<string, string[]> = {
  あ: ["a"],
  い: ["i", "yi"],
  う: ["u", "wu", "whu"],
  え: ["e"],
  お: ["o"],
  か: ["ka", "ca"],
  き: ["ki"],
  く: ["ku", "cu", "qu"],
  け: ["ke"],
  こ: ["ko", "co"],
  が: ["ga"],
  ぎ: ["gi"],
  ぐ: ["gu"],
  げ: ["ge"],
  ご: ["go"],
  さ: ["sa"],
  し: ["shi", "si", "ci"],
  す: ["su"],
  せ: ["se", "ce"],
  そ: ["so"],
  ざ: ["za"],
  じ: ["ji", "zi"],
  ず: ["zu"],
  ぜ: ["ze"],
  ぞ: ["zo"],
  た: ["ta"],
  ち: ["chi", "ti"],
  つ: ["tsu", "tu"],
  て: ["te"],
  と: ["to"],
  だ: ["da"],
  ぢ: ["di", "ji"],
  づ: ["du", "zu"],
  で: ["de"],
  ど: ["do"],
  な: ["na"],
  に: ["ni"],
  ぬ: ["nu"],
  ね: ["ne"],
  の: ["no"],
  は: ["ha"],
  ひ: ["hi"],
  ふ: ["fu", "hu"],
  へ: ["he"],
  ほ: ["ho"],
  ば: ["ba"],
  び: ["bi"],
  ぶ: ["bu"],
  べ: ["be"],
  ぼ: ["bo"],
  ぱ: ["pa"],
  ぴ: ["pi"],
  ぷ: ["pu"],
  ぺ: ["pe"],
  ぽ: ["po"],
  ま: ["ma"],
  み: ["mi"],
  む: ["mu"],
  め: ["me"],
  も: ["mo"],
  や: ["ya"],
  ゆ: ["yu"],
  よ: ["yo"],
  ら: ["ra"],
  り: ["ri"],
  る: ["ru"],
  れ: ["re"],
  ろ: ["ro"],
  わ: ["wa"],
  を: ["wo", "o"],
  ん: ["n", "nn", "xn", "n'"],
  ぁ: ["xa", "la"],
  ぃ: ["xi", "li", "xyi", "lyi"],
  ぅ: ["xu", "lu"],
  ぇ: ["xe", "le", "xye", "lye"],
  ぉ: ["xo", "lo"],
  ゃ: ["xya", "lya"],
  ゅ: ["xyu", "lyu"],
  ょ: ["xyo", "lyo"],
  っ: ["xtu", "ltu", "xtsu", "ltsu"],
  ー: ["-"],
  "、": [","],
  "。": ["."],
  "「": ["["],
  "」": ["]"],
  "・": ["/"],
};

function toHiragana(char: string): string {
  const code = char.codePointAt(0);
  if (code !== undefined && code >= 0x30a1 && code <= 0x30f6) {
    return String.fromCodePoint(code - 0x60);
  }
  return char;
}

function isKana(char: string): boolean {
  return /[\u3040-\u30ff]/.test(char);
}

function nextConsonants(patterns: string[]): string[] {
  const consonants = new Set<string>();
  for (const pattern of patterns) {
    const first = pattern[0];
    if (first && !/^[aeiou']/i.test(first)) {
      consonants.add(first);
    }
  }
  return [...consonants];
}

export function tokenizeRomaji(text: string): RomajiToken[] {
  const tokens: RomajiToken[] = [];
  let index = 0;
  const source: string[] = [];
  for (const char of text) {
    source.push(char);
  }

  while (index < source.length) {
    const current = source[index] ?? "";
    const next = source[index + 1] ?? "";
    const currentKana = toHiragana(current);
    const nextKana = toHiragana(next);

    if (isKana(current)) {
      const pair = `${currentKana}${nextKana}`;
      if (TWO_KANA[pair]) {
        tokens.push({ display: current + next, patterns: TWO_KANA[pair] });
        index += 2;
        continue;
      }
      if (currentKana === "っ") {
        const rest = tokenizeRomaji(source.slice(index + 1).join(""));
        const following = rest[0];
        const consonants = following ? nextConsonants(following.patterns) : [];
        const patterns = ["xtu", "ltu", "xtsu", "ltsu"];
        for (const consonant of consonants) {
          if (consonant !== "n") {
            patterns.unshift(consonant);
          }
        }
        tokens.push({ display: current, patterns });
        index += 1;
        continue;
      }
      if (currentKana === "ん") {
        const rest = tokenizeRomaji(source.slice(index + 1).join(""));
        const following = rest[0];
        const nextFirst = following?.patterns[0]?.[0] ?? "";
        const needsNn = /^[aeiouyn']$/i.test(nextFirst);
        tokens.push({
          display: current,
          patterns: needsNn ? ["nn", "xn", "n'"] : ["n", "nn", "xn", "n'"],
        });
        index += 1;
        continue;
      }
      tokens.push({
        display: current,
        patterns: ONE_KANA[currentKana] ?? [current],
      });
      index += 1;
      continue;
    }

    tokens.push({
      display: current,
      patterns: ONE_KANA[current] ?? [current],
    });
    index += 1;
  }

  return tokens;
}

export type RomajiSession = {
  tokens: RomajiToken[];
  tokenIndex: number;
  typed: string;
  finished: boolean;
};

export function createRomajiSession(text: string): RomajiSession {
  return {
    tokens: tokenizeRomaji(text),
    tokenIndex: 0,
    typed: "",
    finished: false,
  };
}

function matchingPatterns(token: RomajiToken, typed: string): string[] {
  return token.patterns.filter((pattern) => pattern.startsWith(typed));
}

export function applyKey(
  session: RomajiSession,
  key: string,
): { ok: boolean; session: RomajiSession } {
  if (session.finished || key.length !== 1) {
    return { ok: false, session };
  }

  const token = session.tokens[session.tokenIndex];
  if (!token) {
    return { ok: false, session };
  }

  const nextTyped = session.typed + key;
  const matches = matchingPatterns(token, nextTyped);
  if (matches.length === 0) {
    return { ok: false, session };
  }

  const completed = matches.some((pattern) => pattern === nextTyped);
  if (completed) {
    const tokenIndex = session.tokenIndex + 1;
    return {
      ok: true,
      session: {
        ...session,
        tokenIndex,
        typed: "",
        finished: tokenIndex >= session.tokens.length,
      },
    };
  }

  return {
    ok: true,
    session: {
      ...session,
      typed: nextTyped,
    },
  };
}

export function applyBackspace(session: RomajiSession): RomajiSession {
  if (session.finished) {
    return session;
  }
  if (session.typed.length > 0) {
    return { ...session, typed: session.typed.slice(0, -1) };
  }
  if (session.tokenIndex === 0) {
    return session;
  }
  const tokenIndex = session.tokenIndex - 1;
  const previous = session.tokens[tokenIndex];
  return {
    ...session,
    tokenIndex,
    typed: previous ? (previous.patterns[0] ?? "") : "",
  };
}

export function guideFor(session: RomajiSession): RomajiGuide[] {
  const guides: RomajiGuide[] = [];
  for (const [index, token] of session.tokens.entries()) {
    if (index < session.tokenIndex) {
      guides.push({ text: token.patterns[0] ?? token.display, state: "done" });
      continue;
    }
    if (index === session.tokenIndex) {
      const remaining = matchingPatterns(token, session.typed)[0] ?? token.patterns[0] ?? "";
      if (session.typed.length > 0) {
        guides.push({ text: session.typed, state: "done" });
      }
      guides.push({ text: remaining.slice(session.typed.length), state: "current" });
      continue;
    }
    guides.push({ text: token.patterns[0] ?? token.display, state: "pending" });
  }
  return guides;
}

export function typeText(text: string, keys: string): boolean {
  let session = createRomajiSession(text);
  for (const key of keys) {
    const result = applyKey(session, key);
    if (!result.ok) {
      return false;
    }
    session = result.session;
  }
  return session.finished;
}
