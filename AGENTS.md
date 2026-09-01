# Reply Rush

IT エンジニアのチャット返信を模したタイピングゲーム。React と Hono は **1 プロジェクト・1 Worker**。

## 開発

```bash
direnv allow   # Nix flake（Node.js / vp / just / git / gh）
npm install
just           # レシピ一覧。check / deploy / db-migrate を使う
```

Vite+ は Nix の Node を使う（`vp env off` / system-first）。managed Node は使わない。

## このリポジトリ固有のルール

- LocalStorage に保存するのは匿名 ID だけ。問題・プレイ結果・集計は D1。
- プレイ中のキーイベントを毎回送らない。終了時に集計結果を一括 POST する。
- D1 はパラメータ化クエリを直接使う。ORM は足さない。
- GitHub Actions は使わない。デプロイは Wrangler 直接。
- 独自 skill は作らない。Workers / wrangler 作業では公式 skill だけを読む:
  - `.agents/skills/workers-best-practices`
  - `.agents/skills/wrangler`
- 型の `Env` は `wrangler types` で生成する。手書きしない。

## 仕様

- 正式仕様: `docs/specs/mvp.md`
- 受入: `docs/tasks/mvp_acceptance_checklist.md`
- UI 原型: `prototypes/concept-a-chat.html`
