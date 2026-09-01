# Reply Rush

IT エンジニアのチャット返信を模したタイピングゲーム（MVP）。

React + Hono を単一の Cloudflare Worker として動かします。

## 開発環境

Nix + direnv が入っている前提です。リポジトリ直下で:

```bash
direnv allow
```

flake が Node.js、Vite+ (`vp`)、just、git、gh を提供します。Vite+ は Nix の Node を使う system-first 構成です。

依存関係のインストール:

```bash
npm install
```

開発サーバー:

```bash
npm run dev
```
