import { useEffect, useMemo, useRef, useState } from "react";
import {
  applyBackspace,
  applyKey,
  createRomajiSession,
  guideFor,
  type RomajiSession,
} from "../game/romaji";
import { computeAccuracy, computeCpm, computeSalary } from "../game/score";
import { fingerForKey, missRate, PlayAggregator } from "../game/stats";
import type { Difficulty, Problem } from "../worker/types";
import { getAnonymousId } from "./anonymousId";
import { fetchProblems, fetchStats, saveResult, type StatsResponse } from "./api";
import "./App.css";

const PLAY_MS = 120_000;
const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  beginner: "初級 🌱",
  intermediate: "中級 ⚡",
  advanced: "上級 🔥",
};

type Screen = "title" | "play" | "result" | "stats";

type PlaySnapshot = {
  salary: number;
  cpm: number;
  accuracy: number;
  missCount: number;
  maxCombo: number;
  repliesCompleted: number;
  durationMs: number;
};

export default function App() {
  const [screen, setScreen] = useState<Screen>("title");
  const [difficulty, setDifficulty] = useState<Difficulty>("beginner");
  const [error, setError] = useState("");
  const [problems, setProblems] = useState<Problem[]>([]);
  const [problemIndex, setProblemIndex] = useState(0);
  const [remainingMs, setRemainingMs] = useState(PLAY_MS);
  const [salary, setSalary] = useState(0);
  const [session, setSession] = useState<RomajiSession>(() => createRomajiSession(""));
  const [missFlash, setMissFlash] = useState(false);
  const [result, setResult] = useState<PlaySnapshot | null>(null);
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const play = useRef(new PlayAggregator());
  const startedAt = useRef(0);
  const replyStartedAt = useRef(0);
  const repliesRef = useRef(0);
  const endedRef = useRef(false);
  const difficultyRef = useRef(difficulty);
  const problemsRef = useRef(problems);
  const sessionRef = useRef(session);
  const salaryRef = useRef(0);
  const problemIndexRef = useRef(0);

  difficultyRef.current = difficulty;
  problemsRef.current = problems;
  sessionRef.current = session;
  salaryRef.current = salary;
  problemIndexRef.current = problemIndex;

  const problem = problems[problemIndex];
  const guide = useMemo(() => guideFor(session), [session]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 800px)");
    const sync = () => setSidebarOpen(!media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (screen !== "play") {
      return;
    }
    const timer = window.setInterval(() => {
      const left = Math.max(0, PLAY_MS - (Date.now() - startedAt.current));
      setRemainingMs(left);
      if (left <= 0) {
        void finishPlay();
      }
    }, 200);
    return () => window.clearInterval(timer);
  }, [screen]);

  useEffect(() => {
    if (screen !== "play") {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        return;
      }
      event.preventDefault();
      if (event.key === "Backspace") {
        const next = applyBackspace(sessionRef.current);
        sessionRef.current = next;
        setSession(next);
        return;
      }
      if (event.key.length !== 1) {
        return;
      }
      const applied = applyKey(sessionRef.current, event.key);
      play.current.record(event.key, applied.ok);
      if (!applied.ok) {
        setMissFlash(true);
        window.setTimeout(() => setMissFlash(false), 160);
        return;
      }
      sessionRef.current = applied.session;
      setSession(applied.session);
      if (applied.session.finished) {
        completeReply(applied.session);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [screen]);

  async function startGame() {
    setError("");
    try {
      const loaded = await fetchProblems(difficulty);
      if (loaded.length === 0) {
        setError("問題がありません。just db-seed を実行してください。");
        return;
      }
      play.current = new PlayAggregator();
      endedRef.current = false;
      repliesRef.current = 0;
      startedAt.current = Date.now();
      replyStartedAt.current = Date.now();
      salaryRef.current = 0;
      setSalary(0);
      setProblems(loaded);
      setProblemIndex(0);
      setRemainingMs(PLAY_MS);
      const first = createRomajiSession(loaded[0]?.replyKana ?? "");
      sessionRef.current = first;
      setSession(first);
      setScreen("play");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "開始に失敗しました");
    }
  }

  function completeReply(finished: RomajiSession) {
    const list = problemsRef.current;
    const index = problemIndexRef.current;
    const currentProblem = list[index];
    if (!currentProblem) {
      return;
    }
    const durationMs = Math.max(1, Date.now() - replyStartedAt.current);
    const cpm = computeCpm(finished.tokens.length, durationMs);
    const accuracy = computeAccuracy(play.current.correctKeys, play.current.totalKeys);
    salaryRef.current += computeSalary({
      replyChars: currentProblem.replyText.length,
      difficulty: difficultyRef.current,
      cpm,
      accuracy,
    });
    setSalary(salaryRef.current);
    repliesRef.current += 1;
    const nextIndex = (index + 1) % list.length;
    problemIndexRef.current = nextIndex;
    setProblemIndex(nextIndex);
    replyStartedAt.current = Date.now();
    const next = createRomajiSession(list[nextIndex]?.replyKana ?? "");
    sessionRef.current = next;
    setSession(next);
  }

  async function finishPlay() {
    if (endedRef.current) {
      return;
    }
    endedRef.current = true;
    const durationMs = Math.min(PLAY_MS, Date.now() - startedAt.current);
    const snapshot: PlaySnapshot = {
      salary: salaryRef.current,
      cpm: computeCpm(play.current.correctKeys, durationMs),
      accuracy: computeAccuracy(play.current.correctKeys, play.current.totalKeys),
      missCount: play.current.missCount,
      maxCombo: play.current.maxCombo,
      repliesCompleted: repliesRef.current,
      durationMs,
    };
    setResult(snapshot);
    setScreen("result");
    try {
      await saveResult({
        anonymousId: getAnonymousId(),
        difficulty: difficultyRef.current,
        salary: snapshot.salary,
        cpm: snapshot.cpm,
        accuracy: snapshot.accuracy,
        missCount: snapshot.missCount,
        maxCombo: snapshot.maxCombo,
        repliesCompleted: snapshot.repliesCompleted,
        durationMs: snapshot.durationMs,
        keyStats: play.current.keyStats(),
        transitionStats: play.current.transitionStats(),
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "保存に失敗しました");
    }
  }

  async function openStats() {
    setError("");
    try {
      setStats(await fetchStats(getAnonymousId()));
      setScreen("stats");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "統計を取得できませんでした");
    }
  }

  if (screen === "title") {
    return (
      <main className="title-screen">
        <h1 className="logo">Reply Rush</h1>
        <p className="sub">エンジニアのチャット返信を、120秒で打ち倒せ</p>
        <div className="cards">
          {(["beginner", "intermediate", "advanced"] as const).map((value) => (
            <button
              key={value}
              type="button"
              className={value === difficulty ? "card selected" : "card"}
              onClick={() => setDifficulty(value)}
            >
              <div className="emoji">{DIFFICULTY_LABEL[value]}</div>
            </button>
          ))}
        </div>
        <button type="button" className="start" onClick={() => void startGame()}>
          ゲーム開始（120秒）
        </button>
        {error ? <p className="error">{error}</p> : null}
      </main>
    );
  }

  if (screen === "play") {
    return (
      <div className="play-layout">
        {sidebarOpen ? (
          <aside className="sidebar">
            <h2>Trouble Inc.</h2>
            <button type="button" className="active">
              # incidents
            </button>
            <button type="button"># dev-team</button>
            <button type="button"># random</button>
          </aside>
        ) : (
          <button type="button" className="start" onClick={() => setSidebarOpen(true)}>
            メニュー
          </button>
        )}
        <section className="chat">
          <header className="chat-header">
            <strong># incidents</strong>
            <div className="hud">
              ⏱ {Math.ceil(remainingMs / 1000)}秒 💰 ¥{salary.toLocaleString("ja-JP")} /{" "}
              {DIFFICULTY_LABEL[difficulty]}
            </div>
          </header>
          <div className="messages">
            <div className="bubble them">
              <strong>{problem?.opponentName ?? "PM"}</strong>
              <p>{problem?.opponentMessage}</p>
            </div>
            <div className="bubble me">
              <strong>YOU</strong>
              <p>{problem?.replyText}</p>
            </div>
          </div>
          <div className="composer">
            <p className="reply-jp">{problem?.replyText}</p>
            <p className={missFlash ? "romaji miss" : "romaji"}>
              {guide.map((part, index) => (
                <span key={`${part.state}-${index}`} className={part.state}>
                  {part.text}
                </span>
              ))}
            </p>
          </div>
        </section>
      </div>
    );
  }

  if (screen === "result" && result) {
    return (
      <main className="result-screen">
        <h1>120秒 終了！</h1>
        <p className="salary">¥{result.salary.toLocaleString("ja-JP")}</p>
        <div className="grid">
          <div className="stat">CPM {Math.round(result.cpm)}</div>
          <div className="stat">正確性 {(result.accuracy * 100).toFixed(1)}%</div>
          <div className="stat">ミス {result.missCount}</div>
          <div className="stat">最大連続 {result.maxCombo}</div>
        </div>
        <p>
          返信完了 {result.repliesCompleted} / {DIFFICULTY_LABEL[difficulty]}
        </p>
        {error ? <p className="error">{error}</p> : null}
        <div className="actions">
          <button type="button" onClick={() => setScreen("title")}>
            もう一度
          </button>
          <button type="button" onClick={() => void openStats()}>
            統計を見る
          </button>
        </div>
      </main>
    );
  }

  const fingerRows = new Map<string, { hitCount: number; missCount: number }>();
  for (const row of stats?.worstKeys ?? []) {
    const finger = fingerForKey(row.key);
    const current = fingerRows.get(finger) ?? { hitCount: 0, missCount: 0 };
    current.hitCount += row.hitCount;
    current.missCount += row.missCount;
    fingerRows.set(finger, current);
  }

  return (
    <main className="stats-screen">
      <h1>タイピング分析</h1>
      <h2>苦手キー TOP 5</h2>
      {(stats?.worstKeys ?? []).map((row) => (
        <p key={row.key}>
          {row.key} ミス率 {(missRate(row.hitCount, row.missCount) * 100).toFixed(0)}%
          <span className="bar">
            <span style={{ width: `${missRate(row.hitCount, row.missCount) * 100}%` }} />
          </span>
        </p>
      ))}
      <h2>苦手な指</h2>
      {[...fingerRows.entries()].map(([finger, row]) => (
        <p key={finger}>
          {finger} {(missRate(row.hitCount, row.missCount) * 100).toFixed(0)}%
        </p>
      ))}
      <h2>苦手な動き TOP 5</h2>
      {(stats?.worstTransitions ?? []).map((row) => (
        <p key={`${row.fromKey}-${row.toKey}`}>
          {row.fromKey} → {row.toKey} {(missRate(row.hitCount, row.missCount) * 100).toFixed(0)}%
        </p>
      ))}
      <h2>履歴</h2>
      {(stats?.history ?? []).map((row) => (
        <p key={row.id}>
          {row.createdAt} / {DIFFICULTY_LABEL[row.difficulty]} / ¥
          {row.salary.toLocaleString("ja-JP")}
        </p>
      ))}
      <button type="button" onClick={() => setScreen("title")}>
        タイトルへ
      </button>
    </main>
  );
}
