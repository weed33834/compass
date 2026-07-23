<p align="center">
  <img src="public/logo.svg" width="160" height="160" alt="Compass Logo" />
</p>

<h1 align="center">Compass · Quiz Compass</h1>

[English](README.md) | [中文](README.zh.md) | [日本語](README.ja.md)

<p align="center">
  FSRS-6 アルゴリズムで駆動するセルフホストの間隔反復クイズツール。海用計器をモチーフにした UI。<br/>
  Markdown / Excel / Word の問題バンクをインポート → キーボード駆動のコックピットで回答 → アルゴリズムが各カードの再出題タイミングを決定する。
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-c89b3c.svg?style=flat-square" /></a>
  <a href="https://github.com/weed33834/compass/actions/workflows/ci.yml"><img alt="CI" src="https://img.shields.io/github/actions/workflow/status/weed33834/compass/ci.yml?branch=main&style=flat-square&label=CI" /></a>
  <a href="https://gitcode.com/badhope/compass/releases"><img alt="Version" src="https://img.shields.io/badge/version-1.4.3-c89b3c?style=flat-square" /></a>
  <img alt="Node.js" src="https://img.shields.io/badge/node-%E2%89%A522-0a0f14?style=flat-square&logo=node.js&logoColor=c89b3c" />
  <img alt="pnpm" src="https://img.shields.io/badge/pnpm-%E2%89%A59-c89b3c?style=flat-square&logo=pnpm&logoColor=0a0f14" />
  <img alt="PostgreSQL" src="https://img.shields.io/badge/postgresql-17-0a0f14?style=flat-square&logo=postgresql&logoColor=c89b3c" />
  <img alt="Next.js" src="https://img.shields.io/badge/next.js-16.2-0a0f14?style=flat-square&logo=next.js&logoColor=c89b3c" />
  <img alt="Prisma" src="https://img.shields.io/badge/prisma-5.22-c89b3c?style=flat-square&logo=prisma&logoColor=0a0f14" />
  <img alt="ts-fsrs" src="https://img.shields.io/badge/ts--fsrs-5.4-0a0f14?style=flat-square" />
  <img alt="TypeScript" src="https://img.shields.io/badge/typescript-5.9-3178c6?style=flat-square&logo=typescript&logoColor=white" />
  <img alt="React" src="https://img.shields.io/badge/react-19-0a0f14?style=flat-square&logo=react&logoColor=c89b3c" />
  <img alt="Docker" src="https://img.shields.io/badge/docker-ready-c89b3c?style=flat-square&logo=docker&logoColor=0a0f14" />
</p>

<p align="center">
  <a href="#compassとは">Compassとは</a> ·
  <a href="#クイックスタート">クイックスタート</a> ·
  <a href="#dockerデプロイ">Docker</a> ·
  <a href="#問題バンクのインポート">インポート</a> ·
  <a href="#二段階コミット">二段階コミット</a> ·
  <a href="#アーキテクチャ概要">アーキテクチャ</a> ·
  <a href="#テスト">テスト</a> ·
  <a href="#ロードマップ">ロードマップ</a>
</p>

---

## Compassとは

Compass は、多くのクイズツールが放置している 2 つの問題を扱うために作られた。

1. **ベンダーロックインを避ける。** 問題バンクはあなた自身のもの——エクスポートし、編集し、ツールを乗り換えられる。Compass はバンクをプレーンテキスト中心で扱う。Markdown はノートのように書け、Excel はそのまま貼り付けられ、Word 文書はドロップするだけでパースされる。データベースは PostgreSQL でスキーマは完全に公開。いつでも `pg_dump` で持ち出せる。
2. **復習間隔を自分で計算しなくて済むように。** Anki の SM-2 アルゴリズムは 1985 年のもので、間隔反復はその後進化している。Compass は [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs) により FSRS-6（DSR モデル、デフォルト 21 個の重み）を実装する。「どれだけ正確に思い出せたか」と「カードがいつ戻ってくるか」を分離し、ユーザーは 1/2/3/4 を押して思い出し度を採点するだけで、スケジューリングはアルゴリズムに任せる。

海用計器モチーフの理由は、コンパス・漂流ボトル・航海日誌という語が、案内・間違い帳・回答履歴という機能に自然に対応するからである。

> **リポジトリミラー**
> - プライマリ（GitCode）: <https://gitcode.com/badhope/compass>
> - GitHub ミラー: <https://github.com/weed33834/compass>
>
> 両者は同期されている。PR・issue はどちらでも歓迎する。主リポジトリでマージ後、ミラーへ自動同期される。

---

## コア機能

| モジュール | ルート | 機能 |
|---|---|---|
| Compass | `/compass` | 今日の期限切れ数、連続日数、バンク艦隊、ワンクリック開始 |
| 学習コックピット | `/study` | 4 種の問題形式、4 キー FSRS 評価（ホットキー 1-4）、キーごとの間隔プレビュー、選択漏れの部分点、再開機能（localStorage 7 日間）、完了レポート |
| Workshop | `/workshop` | バンク CRUD、ドラッグ＆ドロップインポート（`.md/.txt/.xlsx/.csv/.docx`）、バンクごとの FSRS 設定、ページネーション付き問題リスト |
| バンク詳細 | `/workshop/[id]` | ページネーション + 検索 + タイプフィルタ、**インライン問題編集**（4 種 + 難易度 + スター + 有効化 + 論理削除）、**バンクごとの FSRS チューニング**（トグル + 保持率 + 1 日あたり新規カード数 + 復習上限）、**CSV / Anki エクスポート** |
| 漂流ボトル | `/wrongbook` | `lapses > 0` のカードがここに漂流する。展開して回答・解説を確認、習得済みマークややり直しが可能 |
| 航海日誌 | `/logbook` | 全回答記録を逆時系列で表示、日ごとにグループ化、バンクでフィルタ可能 |
| アナリティクス | `/analytics` | 連続日数、正答率、FSRS 状態分布、**365 日回答ヒートマップ**、SVG トレンド、タイプごとの正答率、弱点知識ポイント TOP 10、記憶ヘルス（Retrievability リング + 5 バケット分布 + 7 日間期限予測） |
| アカウント | `/account` | プロフィール、テーマ切替（深海 / 羊皮紙）、FSRS パラメータプレビュー、サインアウト |

### 4 種の問題形式と採点ルール

| タイプ | 回答形式 | 採点 |
|---|---|---|
| `SINGLE_CHOICE` | `"B"` | 正解 = 1.0、それ以外 = 0 |
| `MULTI_CHOICE` | `["A","C"]` | 全問正解 = 1.0；選択漏れ = `0.5 + (selected-correct / expected-correct) * 0.5`、最大 0.99；誤選択 = 0 |
| `TRUE_FALSE` | `true` / `false` | 正解 = 1.0、それ以外 = 0 |
| `FILL_BLANK` | `["Beijing"]` | 各空欄を独立して正規化（trim + 小文字化 + 全角→半角 + ホワイトスペース圧縮）；`\|` で許容回答を区切る |

---

## 二段階コミット

FSRS の二重スケジューリング（ユーザーがデフォルト評価を上書きした場合に 2 回計算される問題）を避けるため、回答フローは 2 つの API 呼び出しに分割されている。

```mermaid
sequenceDiagram
    participant U as Browser
    participant G as /api/study/grade
    participant A as /api/study/apply
    participant DB as PostgreSQL

    U->>G: POST { reviewItemId, userAnswer, timeSpentSec }
    G->>DB: Write AnswerRecord (no FSRS)
    G-->>U: { isCorrect, partialScore, explanation, previews: {again,hard,good,easy} }

    Note over U: User grades recall with 1/2/3/4<br/>(or Space to accept default)

    U->>A: POST { reviewItemId, rating, timeSpentSec }
    A->>A: gradeCard(prevCard, rating, now)
    A->>DB: Update ReviewItem (new FSRS state)
    A->>DB: Write ReviewLog (immutable log for optimizer)
    A-->>U: { state, reps, lapses, stability, difficulty, dueAt, nextIntervalLabel }
```

`grade` フェーズでは `partialScore` からデフォルト評価を自動マッピングする（全問正解 → GOOD、部分点 → HARD、全問不正解 → AGAIN）。`Space` でデフォルトを受け入れるか、`1/2/3/4` で上書きする。

---

## クイックスタート

### 前提条件

| ツール | 最低バージョン | 備考 |
|---|---|---|
| Node.js | 22.13 | pnpm 11 は `node:sqlite` に依存、Node 22+ が必要 |
| pnpm | 11 | `package.json` の `packageManager` フィールドで固定；corepack が自動インストール |
| PostgreSQL | 17 | 16 でも動作するが、必須ではない |

### 手順

```bash
git clone https://gitcode.com/badhope/compass.git
cd compass
pnpm install
cp .env.example .env
# Edit .env, at minimum set:
#   DATABASE_URL=postgresql://postgres:<password>@localhost:5432/compass
#   NEXTAUTH_SECRET=<generate with: openssl rand -base64 32>

pnpm db:generate
pnpm db:migrate
pnpm db:seed      # Optional: 3 sample banks, 60 questions total (FSRS / China geography / TypeScript), covers all 4 types
pnpm dev          # → http://localhost:3000
```

シードにはデモアカウントが含まれる：`captain@compass.dev` / `Compass-Test-2026!`。本番環境では変更または削除すること。

---

## Dockerデプロイ

Node.js / PostgreSQL をローカルにインストールする手間を省ける。Docker Compose で 3 ステップで起動する。

```bash
git clone https://gitcode.com/badhope/compass.git
cd compass
cp .env.example .env
# At minimum change:
#   NEXTAUTH_URL=http://your-domain-or-ip:3000
#   NEXTAUTH_SECRET=$(openssl rand -base64 32)
#   POSTGRES_PASSWORD=<strong password>

docker compose up -d --build
```

`http://localhost:3000` にアクセスする。コンテナは自動的に以下を実行する：

1. PostgreSQL ヘルスチェックを待機（最大 60 秒）
2. `prisma migrate deploy` を実行（全マイグレーションを適用）
3. Next.js スタンドアロン本番サーバーを起動

### 含まれるもの

| コンテナ | イメージ | 目的 |
|---|---|---|
| `compass-db` | `postgres:17-alpine` | 永続ボリューム付きデータベース |
| `compass-app` | このリポジトリの `Dockerfile` からビルド | Compass 本体（非 root ユーザー、init として tini） |
| `compass-caddy`（オプション） | `caddy:2-alpine` | 自動 HTTPS リバースプロキシ + セキュリティヘッダー、本番推奨 |

### 本番チェックリスト

- [ ] `NEXTAUTH_URL` を実際のアクセスドメインに設定
- [ ] `openssl rand -base64 32` で `NEXTAUTH_SECRET` を生成
- [ ] `POSTGRES_PASSWORD` に強力なパスワードを設定
- [ ] `docker-compose.yml` の `caddy` セクションをアンコメント、`DOMAIN` を設定、自動 HTTPS を有効化
- [ ] リバースプロキシ背後の場合、`TRUSTED_PROXY_IPS` にプロキシ IP（カンマ区切り）を設定。未設定だとレート制限が不正確になる可能性がある
- [ ] （オプション）パスワードリセットメール用に `SMTP_URL` を設定

### イメージ機能

- **マルチステージビルド**: `deps → builder → runner`。最終イメージにはスタンドアロン出力 + 必要な node_modules のみ、約 200MB
- **非 root ランタイム**: `node:22-alpine` + `node` ユーザー、最小権限
- **PID 1 としての tini**: 適切なシグナル処理 + ゾンビプロセス回収
- **HEALTHCHECK**: 組み込みの `/api/health` プローブ、K8s / Docker Swarm 対応
- **docker-entrypoint.sh**: DB 待機 → マイグレーション → 起動、安全なブート順序

> 手動コマンドが好みなら `docker build -t compass .` の後 `docker run -p 3000:3000 --env-file .env compass` でも動作する。PostgreSQL は各自で用意すること。

---

## 問題バンクのインポート

### 公式バンク（組み込み）

Compass は 4 つの公式バンクを `public/official-banks/` の Markdown 静的ファイルとして同梱している。

| バンク | 問題数 | カバレッジ |
|------|-----------|----------|
| FSRS & 間隔反復入門 | 20 | FSRS-6 コア概念、DSR モデル、評価メカニズム、パラメータ最適化 |
| 中国の地理と文化 | 20 | 省級地域、河川と山脈、世界遺産、二十四節気と民俗 |
| プログラミング基礎 & TypeScript | 20 | 型システム、ジェネリクス、非同期、モジュール、ベストプラクティス |
| Python プログラミング基礎 | 20 | データ型、制御フロー、関数、モジュール、OOP、例外 |

`/workshop` →「公式バンク」→ バンクを選択 →「読み込み」をクリック。バンクファイルはリポジトリに同梱されており、**読み込まれるまでデータベース容量を消費しない**。読み込みには Markdown インポート API を再利用する。

### Markdown（推奨）

```markdown
# Bank name (optional, first line)

---

## Single choice

The stem can span multiple lines.

A. Option A
B. Option B
C. Option C
D. Option D

Answer: B
Explanation: Because B is correct.
Difficulty: 3
Knowledge: algebra-basics, exam-2024
Source: 2024 national exam

---

## Multiple choice

Which of the following are correct?

A. Option A
B. Option B

Answer: AC

---

## True / False

The Earth is round.

Answer: True

---

## Fill in the blank

The capital of China is ____.

Answer: Beijing
```

空欄補充は複数空欄（`||` 区切り）と許容回答（`|` 区切り）をサポートする：

```
Answer: Beijing|Beijing||Yangtze|Yangtze River
```

### Excel / CSV

最初の行はヘッダー（大文字小文字を区別しない、中国語エイリアスも受け付ける）：

| 列 | 必須 | 内容 |
|---|---|---|
| `type` | はい（または自動推論） | `single` / `multi` / `true-false` / `fill-blank`（中国語も受け付ける） |
| `stem` | はい | 問題文 |
| `options` | 選択タイプでは必須 | `A.Option A|B.Option B|C.Option C`（パイプ区切り） |
| `answer` | はい | 単一 `"B"` / 複数 `"AC"` または `"A,C"` / 真偽 `"True"` / 空欄 `"Beijing||Yangtze"` |
| `explanation` | オプション | Markdown |
| `difficulty` | オプション | 1-5 |
| `knowledge` | オプション | カンマ区切り |
| `source` | オプション | 自由テキスト |

### Word（.docx）

両方のスタイルを受け付ける：

1. **Markdown スタイル** — 上記の Markdown を Word 文書に直接貼り付ける。
2. **プレーンテキストスタイル** — 空行で問題を区切る。各ブロックはタイプラベル（`Single choice` / `True/False` / …）で始まり、オプションと回答は Markdown と同じ形式に従う。

---

## 設定

環境変数はすべて `.env.example` に文書化されている。必須の 3 つ：

| 変数 | 目的 |
|---|---|
| `DATABASE_URL` | PostgreSQL 接続文字列 |
| `NEXTAUTH_URL` | デプロイ URL（ローカル開発では `http://localhost:3000`） |
| `NEXTAUTH_SECRET` | JWT 署名キー、`openssl rand -base64 32` で生成 |

オプション: SMTP 設定でパスワードリセットメールを有効化。OAuth プロバイダ（GitHub、Google）でサードパーティログインを有効化。

---

## アーキテクチャ概要

```
src/
  app/
    (main)/              認証済みページ
      compass/           ホームダッシュボード（今日の概要 + バンク艦隊）
      study/             学習コックピット（4 種 + 4 キー評価）
      workshop/          Workshop（バンク管理 + インポート）
        [id]/            バンク詳細（ページネーション付き問題リスト）
      wrongbook/         漂流ボトル（間違い帳）
      logbook/           航海日誌（回答履歴）
      analytics/         アナリティクス（統計 + ヒートマップ）
      account/           アカウントセンター
    login/ register/     認証ページ
    api/                 REST エンドポイント
      banks/             バンク CRUD + インポート
      questions/         問題 CRUD
      study/             queue / grade / apply / sessions
      wrongbook/         間違いリスト + 習得済みマーク
      logbook/           回答履歴
      analytics/         統計集計
  components/
    AppShell.tsx         左ナビ + モバイル下部バー
    ui/                  Button / Card / Input / ...
  lib/
    auth.ts              NextAuth 設定
    prisma.ts            Prisma シングルトン
    fsrs.ts              FSRS-6 ラッパー（grade / preview / format）
    quiz/
      grading.ts         統合 4 タイプ採点
      scheduler.ts       日次キュービルダー（期限 + 新規 + 間違いやり直し）
      import/            Markdown / Excel / Word パーサー
prisma/
  schema.prisma          12 モデル
  seed.ts                サンプルバンク
```

### データモデル

| モデル | 目的 |
|---|---|
| `User` | アカウント、テーマ、言語 |
| `QuestionBank` | バンクごとの FSRS 設定付きバンク（`newCardsPerDay` / `desiredRetention`） |
| `Question` | 問題文、オプション JSON、回答 JSON、解説、知識ポイント |
| `ReviewItem` | ユーザー × 問題の FSRS カード状態（stability / difficulty / reps / lapses / dueAt） |
| `ReviewLog` | FSRS オプティマイザ用の不変レビューログ |
| `AnswerRecord` | 各回答試行、部分点と所要時間を含む |
| `QuizSession` | オプションのセショングループ化 |
| `SessionAnswer` | セッション内の単一回答 |
| `FsrsParams` | ユーザーレベルの FSRS 重み（オプティマイザ用） |
| `LearningPlan` | 学習計画（予約済み） |
| `AgentGenerationTask` | AI エージェントタスクキュー（V2） |
| `Notification` / `WeeklyReview` | 通知 + 週次レビュー（予約済み） |

### API エンドポイント

- **Auth** — `/api/auth/[...nextauth]`, `/api/auth/register`, `/api/auth/forgot-password`, `/api/auth/reset-password`
- **Banks** — `/api/banks` (GET/POST), `/api/banks/:id` (GET/PATCH/DELETE), `/api/banks/:id/questions` (GET/POST), `/api/banks/import` (POST multipart)
- **Questions** — `/api/questions/:id` (GET/PATCH/DELETE)
- **Study** — `/api/study/queue`, `/api/study/grade`, `/api/study/apply`, `/api/study/sessions`
- **Wrong book** — `/api/wrongbook` (GET/PATCH)
- **Logbook** — `/api/logbook` (GET)
- **Analytics** — `/api/analytics` (GET)
- **Health** — `/api/health` (GET) → Docker / K8s プローブ

---

## テスト

Compass は 3 つのテストレイヤーを維持している。CI は push / PR ごとに最初の 2 つを実行する。

### ユニットテスト（DB 不要、CI 必須）

`pnpm test:unit` は 3 つのコアモジュールにわたる 49 の純粋ロジックテストを実行する：

| テストファイル | 件数 | カバレッジ |
|---|---|---|
| `scripts/grading-test.ts` | 13 | 4 タイプ採点：単一 / 複数（選択漏れの部分点）/ 真偽（中国語+英語ブール値）/ 空欄補充（複数空欄 + `\|` 許容回答 + 正規化） |
| `scripts/fsrs-test.ts` | 19 | Prisma 文字列 enum ↔ ts-fsrs 数値 State の双方向変換、`dbRowToCard` / `cardToDbUpdate`、`gradeCard` スケジューリング、`previewIntervals`、`formatInterval`、`scoreToRating` マッピング |
| `scripts/parser-test.ts` | 17 | Markdown / Excel / Word パーサー：有効なパース、空/バイナリ/未知の拡張子の拒否、回答欠落警告、回答がオプションにない警告、ナンバリングフォーマット互換性 |

テストはテストフレームワーク依存なしで `node:assert` を使用。`tsx` が直接実行する。

### API スモークテスト（開発サーバー + DB が必要）

`pnpm test:api` は `scripts/api-test.ts` を実行し、未認証のインターセプト、NextAuth ログイン、バンク CRUD、二段階コミット、漂流ボトル、航海日誌、アナリティクスをカバーする（7 グループ）。事前に `pnpm dev` + 準備完了のデータベースが必要。

### E2E テスト（Playwright、開発サーバー + DB が必要）

`tests/e2e/` 配下の 4 つの Playwright スイートが実際のユーザークリックをシミュレートする：

| ファイル | ケース | カバレッジ |
|---|---|---|
| `visual-walkthrough.spec.ts` | 15 | サイト全体のビジュアルウォークスルー：ランディング / ログイン / 登録 / compass / workshop / study / wrongbook / logbook / analytics / account / 404 |
| `import-flow.spec.ts` | 7 | バンクインポート：有効な Markdown / CSV / Word、空/バイナリ/未知の拡張子の拒否、警告プロンプト |
| `answering-flow.spec.ts` | 5 | 完全な回答フロー：開始 / 全問回答 / 完了レポート / 再生 / 間違いやり直し |
| `full-flow.spec.ts` | — | エンドツーエンドの完全フローチェーン |

E2E の実行：`pnpm exec playwright test`（事前に `playwright.config.ts` の baseURL を設定すること）。

### CI 戦略

CI（`.github/workflows/ci.yml`）は自動化を最小限に保つ。自動公開 / デプロイ / 依存関係更新 / 自動マージ / ボットコメントは**行わない**：

- `main` への `push` / `PR` → `install → db:generate → typecheck → lint → test:unit → build`
- `main` への `push` → 追加で `docker-build` ジョブを実行し Dockerfile のビルドを検証
- Dependabot は明示的に無効化（`.github/dependabot.yml` `updates: []`）。依存関係はメンテナが手動でレビュー
- 同じブランチの新しいコミットは古い実行をキャンセルし、CI 枠を節約

---

## 技術スタック

| レイヤー | 選択 | バージョン |
|---|---|---|
| フレームワーク | Next.js (App Router) | 16.2.11 |
| 言語 | TypeScript | 5.9 |
| スタイリング | Tailwind CSS | 4.3.3 |
| ORM | Prisma | 5.22 |
| データベース | PostgreSQL | 17 |
| 認証 | NextAuth.js | 4.24.15 |
| 間隔反復 | ts-fsrs | 5.4 |
| UI プリミティブ | Radix UI | 1.1.21 |
| Excel パース | xlsx | 0.18 |
| Word パース | mammoth | 1.12 |
| アニメーション | framer-motion | 12.42 |
| アイコン | Lucide React | 1.25 |
| バリデーション | Zod | 4.4 |
| ランタイム | Node.js | ≥22.13 |

---

## デザインシステム

インターフェースは航海と天文学の言葉を借りている。真鍮のリング、深淵の背景、アイボリーのテキスト、コーラルのアラート。

**コアパレット**

| トークン | Hex | 用途 |
|---|---|---|
| `abyss` | `#0a0f14` | 背景の深み |
| `ivory` | `#f0ead6` | プライマリテキスト |
| `brass` | `#c89b3c` | インタラクティブハイライト、ナビゲーション |
| `coral` | `#e0584a` | 破壊的アクション、期限アラート |

**フィードバックパレット**（4 キー評価バー + 回答表示）

| トークン | Hex | 意味 |
|---|---|---|
| `f-emerald` | `#10b981` | EASY — 流暢な思い出し |
| `f-azure` | `#38bdf8` | GOOD — 通常の思い出し |
| `f-amber` | `#f59e0b` | HARD — ぎりぎり正解 |
| `f-coral2` | `#ef4444` | AGAIN — 完全な失念 |

2 つのテーマ：
- **深海**（デフォルト） — 深淵の背景 + 真鍮のハイライト + 星空
- **羊皮紙** — 温かいクリーム色の背景 + 暗褐色のテキスト + 真鍮は維持

フォントはシステムネイティブファミリーのみを使用する。見出しに Georgia セリフ、本文に system-ui、データに ui-monospace。外部 CDN フォントはない。

---

## コマンドリファレンス

| コマンド | 目的 |
|---|---|
| `pnpm dev` | 開発サーバー（ポート 3000） |
| `pnpm build` | 本番ビルド |
| `pnpm start` | 本番サーバー起動 |
| `pnpm lint` | ESLint |
| `pnpm typecheck` | TypeScript 型チェック（`tsc --noEmit`） |
| `pnpm test:unit` | ユニットテスト（採点 + FSRS + パーサー、DB 不要） |
| `pnpm test:grading` | 採点ユニットテストのみ実行 |
| `pnpm test:fsrs` | FSRS 状態マッピングユニットテストのみ実行 |
| `pnpm test:parser` | インポートパーサーユニットテストのみ実行 |
| `pnpm test:api` | API スモークテスト（`pnpm dev` + DB が必要） |
| `pnpm db:generate` | Prisma クライアント生成 |
| `pnpm db:migrate` | データベースマイグレーション実行（開発） |
| `pnpm db:deploy` | マイグレーションデプロイ（本番） |
| `pnpm db:seed` | サンプルバンク挿入 |
| `pnpm db:studio` | Prisma Studio GUI 起動 |

---

## ロードマップ

### V1 — クイズ基盤（完了）

- [x] FSRS-6 スケジューリング + 4 キー評価バー
- [x] 統一採点付き 4 種の問題形式 + 選択漏れの部分点
- [x] Markdown / Excel / Word インポート
- [x] 漂流ボトル（間違い帳）+ 航海日誌 + アナリティクス
- [x] 深海 / 羊皮紙デュアルテーマ

### V1.1 — ポリッシュ（完了）

- [x] 初回訪問ウェルカムガイドカード（localStorage フラグ、閉じる可能）+ アップグレードされたバンク艦隊カード（説明 / タグ / プログレスバー）
- [x] 完了レポートを学習プロフィールにアップグレード：プロフィールタグ + タイプごとの習得度 + FSRS 評価分布 + 弱点知識 TOP 3 + 選択漏れヒント + 実行可能なアドバイス
- [x] シードバンク拡張：12 → 60 問（FSRS 概念 / 中国地理 / TypeScript）
- [x] 間違い帳ロジック修正：AGAIN 評価もボトルに入る（以前は FSRS の lapses のみが入っていた。NEW/LEARNING カードで間違えたものが漏れていた）
- [x] ナビブランドエリアにロゴ埋め込み、モバイルトップバーに同期

### V1.2 — 記憶ヘルス & 再開（完了）

- [x] **記憶ヘルス（Retrievability）**: アナリティクスに FSRS-6 減衰曲線可視化を追加 — 平均保持率リング + 5 バケット分布（critical / fragile / fair / stable / fresh）+ 忘却アラート（R<70%）+ 7 日間期限予測バーチャート
- [x] **退出後の再開**: 学習中に退出して `/study` に戻ると localStorage セーブを検出し「継続 / 破棄」をプロンプト。セーブは 7 日後に期限切れ、ラウンド完了時にクリア
- [x] **オープンソース整備**: CI ワークフロー（typecheck + lint + build ゲート）+ Dependabot を明示的に無効化 + PR テンプレートにメンテナの自動化ポリシーを文書化

### V1.3 — Workshop & アナリティクス拡張（完了）

- [x] **インライン問題編集**: 4 種 + 難易度 + スター + 有効化 + 論理削除、削除確認付き
- [x] **バンクごとの FSRS チューニング**: トグル / 保持率スライダー / 1 日あたり新規カード数 / 復習上限
- [x] **CSV / Anki エクスポート**: CSV はインポート互換（BOM 付き）、Anki TSV は `#deck` / `#tags` 列ヘッダー付き
- [x] **アナリティクス 365 日ヒートマップ**: GitHub スタイルの 4 色スケール、月/週ラベル、ツールチップ

### V1.4 — 公式バンクオンデマンド（完了）

- [x] **組み込み公式バンク**: 4 バンク（FSRS / 中国地理 / TypeScript / Python）を `manifest.json` インデックス付きの Markdown 静的ファイルとして同梱
- [x] **オンデマンド読み込み UI**: `/workshop` →「公式バンク」ダイアログ → クリックして読み込み。読み込まれるまでデータベースフットプリントなし
- [x] **スリム化されたシード**: バンクを自動挿入しなくなり、デモユーザー + FSRS パラメータのみ作成

### V1.4.1 — 本番の堅牢化（完了）

- [x] **Docker ワンクリックデプロイ**: マルチステージ Dockerfile + docker-compose（app + db + オプション caddy）+ docker-entrypoint.sh + `/api/health` プローブ
- [x] **3 つのクリティカル修正**: FSRS State の文字列/数値型不一致によるスケジューリング破壊、バンク削除時の FK カスケード欠落、apply のべき等性なし
- [x] **6 つの High 修正**: アナリティクス N+1 クエリ（365 → 1）、漂流ボトル errorReason 永続化、IP 信頼チェーンセキュリティ、採点二重カウント、timeSpentSec クランプ、パスワード忘れステータスコード
- [x] **49 のユニットテスト**: 採点 13 + FSRS 状態マッピング 19 + パーサー 17、CI 必須
- [x] **CI 堅牢化**: 新しい `test:unit` ステップ + Dockerfile ビルドを検証する `docker-build` ジョブ

### V2 — AI エージェント

- [ ] 資料アップロード → エージェントが問題バンクを自動生成
- [ ] 知識ポイントの自動タグ付け
- [ ] 回答データからの難易度自動キャリブレーション
- [ ] レビューログに基づく個人 FSRS 重みオプティマイザ

### V3 — マルチプラットフォーム

- [ ] WeChat ミニプログラム（API + デザイントークン共有）
- [ ] モバイル PWA チューニング
- [ ] 公開バンク共有（読み取り専用リンク）

---

## コントリビュート

issue と PR を歓迎する。PR を開く前に [CONTRIBUTING.md](CONTRIBUTING.md) を読むこと — コードスタイル、コミット規約、クイズロジックルーティングルール（すべての採点は `src/lib/quiz/grading.ts` を経由、すべての FSRS スケジューリングは `src/lib/fsrs.ts` を経由。ルートハンドラから直接 `ts-fsrs` を呼び出さないこと）をカバーしている。

行動規範については [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) を参照。セキュリティ問題については [SECURITY.md](SECURITY.md) を参照 — 公開の issue を開かず、非公開の開示プロセスに従うこと。

---

## ライセンス

MIT — [LICENSE](LICENSE) を参照。
