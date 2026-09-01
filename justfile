# Reply Rush の開発コマンド。direnv / nix develop 済みを前提にする。
set shell := ["bash", "-cu"]

db := "DB"
export PATH := `printf '%s' "$PWD/node_modules/.bin:$PATH"`

default:
    @just --list

# ローカル開発サーバ（Vite + Workers ランタイム）
dev:
    vp dev

# format / lint / typecheck → test → production build
check:
    vp check
    vp test
    vp build

# 本番ビルドして Workers にデプロイする
deploy:
    vp build
    wrangler deploy

# ローカル D1 に migration を適用する
db-migrate:
    wrangler d1 migrations apply {{db}} --local

# 本番 D1 に migration を適用する
db-migrate-prod:
    wrangler d1 migrations apply {{db}} --remote

# ローカル D1 に MVP 問題を投入する
db-seed:
    wrangler d1 execute {{db}} --local --file=seeds/mvp_problems.sql

# 本番 D1 に MVP 問題を投入する
db-seed-prod:
    wrangler d1 execute {{db}} --remote --file=seeds/mvp_problems.sql

# wrangler types で Env を生成する
types:
    wrangler types
