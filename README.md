# 🚧工事中／Under Construction🚧

# Markdown協調編集システム v6.4

リアルタイムMarkdown協調編集システムです。複数ユーザーで同時編集、AIによる自動編集、統合チャット機能、**データ永続化**、**セキュリティ強化**を提供します。

## 📋 機能

- ✅ **ルーム機能**: URLパラメータで任意のルームに参加
- ✅ **ユーザー名設定**: 各ユーザーが自分の名前を設定可能
- ✅ **統合チャット**: AI指示と通常チャットを同じインターフェースで
- ✅ **AI編集**: Ollama (自動モデル選択) を使用したMarkdownテンプレート編集
- ✅ **リアルタイム同期**: WebSocketによる即時反映
- ✅ **データ永続化**: Better-SQLite3によるデータベース保存
  - テンプレート編集内容の保存
  - チャットメッセージ履歴の保存
  - ユーザー参加・退出ログの記録
- ✅ **セキュリティ強化**:
  - パストラバーサル攻撃対策
  - XSS攻撃対策
  - プロンプトインジェクション対策
  - 入力バリデーション強化
  - レート制限
- ✅ **テンプレート管理**:
  - 複数テンプレートのサポート
  - ドロップダウンで選択可能
  - リアルタイム切り替え
- ✅ **モデル自動選択**:
  - gemma3:latest → phi4-mini:latest → 任意のモデル

## 🚀 クイックスタート

### 前提条件

1. **Node.js** (v14以上)
2. **Ollama** (ローカルAI)

### インストール手順

```bash
# 1. 依存関係のインストール
npm install

# 2. Ollamaのセットアップ（別ターミナル）
ollama serve
ollama pull gemma3:latest  # または phi4-mini:latest

# 3. サーバー起動
npm start
```

### アクセス

```
http://localhost:3000/?room=ルーム名&name=あなたの名前
```

例：
```
http://localhost:3000/?room=meeting&name=田中
http://localhost:3000/?room=meeting&name=田中&template=custom.md
```

## 💬 コマンド一覧

| コマンド | 説明 | 例 |
|---------|------|-----|
| `@AI [指示]` | AI編集を実行 | `@AI 訪問日時を12月20日14時30分に変更` |
| `@ai [指示]` | AI編集（小文字も可） | `@ai 学校名を〇〇中学校に変更` |
| `@name [名前]` | 名前を変更 | `@name 田中太郎` |
| その他 | 通常のチャット | `この内容でよろしいですか？` |

## 📁 ファイル構成

```
markdown-editor/
├── package.json           # Node.js設定
├── server.js             # サーバー本体（セキュリティ統合）
├── db.js                 # データベース操作
├── security.js           # セキュリティモジュール（新規）
├── data/                 # データベース保存先（自動生成）
│   └── rooms.db          # SQLiteデータベース
├── public/
│   └── index.html        # フロントエンド（UI更新）
├── templates/            # テンプレートディレクトリ
│   ├── default.md        # デフォルトテンプレート
│   ├── custom.md         # カスタムテンプレート例
│   └── ...
├── .env                  # 環境設定
└── README.md            # このファイル
```

## ⚙️ 設定

### 環境変数（.env）

```env
# サーバー設定
PORT=3000                            # HTTPサーバーポート
WS_PORT=8080                        # WebSocketポート

# Ollama設定
OLLAMA_HOST=http://localhost:11434  # OllamaのURL

# モデル設定（優先順位順）
OLLAMA_MODEL_PRIMARY=gemma3:latest  # 第一優先モデル
OLLAMA_MODEL_FALLBACK=phi4-mini:latest  # フォールバックモデル

# テンプレート設定
TEMPLATES_DIR=./templates           # テンプレートディレクトリ

# Database設定
DB_PATH=./data/rooms.db             # データベースファイルのパス
```

#### 利用可能なモデル例

| モデル名 | 説明 | サイズ |
|---------|------|--------|
| `gemma3:latest` | 最新版・高性能（推奨） | 2GB |
| `phi4-mini:latest` | 軽量・高速（フォールバック） | 1.5GB |
| `llama2:7b` | バランス型 | 3.8GB |
| `mistral:7b` | 高性能 | 4.1GB |
| `codellama:7b` | コード特化 | 3.8GB |

**モデル自動選択の優先順位:**
1. `OLLAMA_MODEL_PRIMARY` が利用可能な場合 → 使用
2. `OLLAMA_MODEL_FALLBACK` が利用可能な場合 → 使用
3. インストール済みの任意のモデル → 使用
4. モデルがない場合 → エラーで終了

モデルを変更する場合：
1. `.env`ファイルの`OLLAMA_MODEL_PRIMARY`または`OLLAMA_MODEL_FALLBACK`を編集
2. `ollama pull [モデル名]`でモデルをダウンロード
3. サーバーを再起動

### テンプレート管理

`templates/`ディレクトリに`.md`ファイルを配置すると、自動的に利用可能になります。

**テンプレートの追加方法:**
1. `templates/custom.md` を作成
2. サーバーを再起動（または「🔄」ボタンで再読み込み）
3. UIのドロップダウンから選択可能

**URLでテンプレート指定:**
```
http://localhost:3000/?room=meeting&name=田中&template=custom.md
```

## 💾 データベース

### データ永続化

Better-SQLite3を使用してデータを永続化します。以下のデータが保存されます：

- **ルーム情報**: 各ルームのテンプレート内容
- **メッセージ履歴**: チャットとシステムメッセージ（最新50件を表示）
- **ユーザーログ**: 参加・退出・名前変更の履歴

### データベース構造

```sql
-- roomsテーブル: ルーム情報
CREATE TABLE rooms (
    id TEXT PRIMARY KEY,
    template TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- messagesテーブル: メッセージ履歴
CREATE TABLE messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL,
    user_id TEXT,
    user_name TEXT NOT NULL,
    text TEXT NOT NULL,
    type TEXT NOT NULL,
    created_at TEXT NOT NULL
);

-- users_logテーブル: ユーザー操作ログ
CREATE TABLE users_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    room_id TEXT NOT NULL,
    user_id TEXT,
    user_name TEXT NOT NULL,
    action TEXT NOT NULL,
    created_at TEXT NOT NULL
);
```

### データベースの特徴

- **WALモード**: 高速な読み書きパフォーマンス
- **自動クリーンアップ**: 30日以上古いメッセージは自動削除
- **インデックス**: 検索パフォーマンスの最適化
- **トランザクション**: データの整合性を保証

### データベースファイルの場所

デフォルト: `./data/rooms.db`

データベースファイルは `.gitignore` で除外されているため、Gitにコミットされません。

## 🛡️ セキュリティ

### v6.4で実装されたセキュリティ機能

#### 1. パストラバーサル攻撃対策
- ファイル名の厳格なバリデーション
- パス正規化によるディレクトリトラバーサル防止
- テンプレートディレクトリ外へのアクセスを拒否

**例：悪意のあるリクエスト**
```
GET /api/templates/../../../etc/passwd  ❌ 拒否
GET /api/templates/../../server.js     ❌ 拒否
GET /api/templates/default.md          ✅ 許可
```

#### 2. XSS攻撃対策
- ユーザー名の危険な文字を除外
- HTMLエスケープ処理
- チャットメッセージの長さ制限（2000文字）

**除外される文字:** `< > " ' ` \ / { } [ ]`

#### 3. プロンプトインジェクション対策
- AI指示の長さ制限（500文字）
- システムプロンプト改変を検出・拒否
- 危険なパターンのフィルタリング

**ブロックされるパターン:**
- `ignore previous instructions`
- `system: you are`
- `<|im_start|>` / `<|im_end|>`

#### 4. 入力バリデーション
- **ルーム名**: 英数字、ハイフン、アンダースコア（1-50文字）
- **ユーザー名**: 特殊文字除外（1-20文字）
- **ファイル名**: `.md`ファイルのみ、パストラバーサル文字列除外

#### 5. レート制限
- 同一IPからの過剰なリクエストを制限
- デフォルト: 100リクエスト/分

### セキュリティログ

セキュリティ関連のイベントは自動的にログに記録されます：
- 無効な入力の試行
- パストラバーサルの試み
- レート制限の超過

## 🔧 トラブルシューティング

### Ollamaが接続できない

```bash
# Ollamaの状態確認
curl http://localhost:11434/api/tags

# Ollamaが起動していない場合
ollama serve
```

### モデルが見つからない

```bash
# 推奨モデルをインストール
ollama pull gemma3:latest
ollama pull phi4-mini:latest

# インストール済みモデルを確認
ollama list
```

### WebSocket接続エラー

- ファイアウォールでポート8080がブロックされていないか確認
- ブラウザのコンソールでエラーメッセージを確認

### テンプレートが表示されない

- `templates/`ディレクトリが存在するか確認
- テンプレートファイル名が`.md`で終わっているか確認
- サーバーログでエラーメッセージを確認

### データベースエラー

```bash
# データベースファイルを削除して再起動（データは失われます）
rm -rf data/
npm start
```

### データベース統計の確認

```bash
# ヘルスチェックエンドポイント
curl http://localhost:3000/health

# 統計情報エンドポイント
curl http://localhost:3000/api/stats
```

## 🆕 v6.4の新機能

### セキュリティ強化
- ✅ `security.js`モジュールの新規追加
- ✅ パストラバーサル攻撃対策
- ✅ XSS攻撃対策
- ✅ プロンプトインジェクション対策
- ✅ 入力バリデーション強化
- ✅ レート制限機能

### モデル管理
- ✅ 自動モデル選択（gemma3:latest → phi4-mini:latest → 任意）
- ✅ `/api/models` エンドポイント
- ✅ UIでモデル表示

### テンプレート管理
- ✅ 複数テンプレートのサポート
- ✅ `/api/templates` エンドポイント
- ✅ `/api/templates/:filename` エンドポイント
- ✅ UIでテンプレート選択
- ✅ リロードボタン

### 更新されたファイル
- ✅ `security.js` - セキュリティモジュール（新規）
- ✅ `server.js` - セキュリティ統合+新機能
- ✅ `index.html` - UI更新
- ✅ `.env` / `.env.example` - モデル設定追加
- ✅ `README.md` - ドキュメント更新

## 📊 API エンドポイント

### GET /health

サーバーとデータベースのヘルスチェック

```bash
curl http://localhost:3000/health
```

レスポンス例：
```json
{
  "status": "ok",
  "activeRooms": 2,
  "activeClients": 5,
  "database": {
    "rooms": 10,
    "messages": 1523,
    "logs": 342,
    "dbPath": "./data/rooms.db"
  },
  "model": "gemma3:latest"
}
```

### GET /api/stats

データベース統計情報

```bash
curl http://localhost:3000/api/stats
```

### GET /api/models

利用可能なOllamaモデル一覧

```bash
curl http://localhost:3000/api/models
```

レスポンス例：
```json
{
  "current": "gemma3:latest",
  "available": [
    {
      "name": "gemma3:latest",
      "size": 2000000000,
      "modified": "2025-09-30T00:00:00Z"
    }
  ],
  "primary": "gemma3:latest",
  "fallback": "phi4-mini:latest"
}
```

### GET /api/templates

利用可能なテンプレート一覧

```bash
curl http://localhost:3000/api/templates
```

### GET /api/templates/:filename

特定のテンプレート取得

```bash
curl http://localhost:3000/api/templates/default.md
```

## 🔄 既存プロジェクトのアップデート

既存のv6.3からアップデートする場合：

1. 依存関係を確認：
   ```bash
   npm install
   ```

2. 新しいファイルを追加：
   ```bash
   # security.js をプロジェクトに追加
   ```

3. 既存ファイルを更新：
   ```bash
   # server.js, index.html を新しいバージョンに置き換え
   ```

4. `.env`ファイルを更新：
   ```env
   # OLLAMA_MODEL行を削除し、以下を追加：
   OLLAMA_MODEL_PRIMARY=gemma3:latest
   OLLAMA_MODEL_FALLBACK=phi4-mini:latest
   TEMPLATES_DIR=./templates
   ```

5. サーバーを再起動

## 📝 ライセンス

MIT

## 🤝 Fork 歓迎

Fork を歓迎します。

## 📞 サポート

問題が発生した場合はご自由に改変・改良下さい。

---

*リリース日: 2025年9月*
*バージョン: 6.4*
*主な変更: セキュリティ強化 + テンプレート管理 + モデル自動選択*
