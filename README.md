# 🚧工事中／Under Construction🚧

# Markdown協調編集システム v6.3

リアルタイムMarkdown協調編集システムです。複数ユーザーで同時編集、AIによる自動編集、統合チャット機能、**データ永続化**を提供します。

## 📋 機能

- ✅ **ルーム機能**: URLパラメータで任意のルームに参加
- ✅ **ユーザー名設定**: 各ユーザーが自分の名前を設定可能
- ✅ **統合チャット**: AI指示と通常チャットを同じインターフェースで
- ✅ **AI編集**: Ollama (gemma:2b) を使用したMarkdownテンプレート編集
- ✅ **リアルタイム同期**: WebSocketによる即時反映
- ✅ **データ永続化**: Better-SQLite3によるデータベース保存
  - テンプレート編集内容の保存
  - チャットメッセージ履歴の保存
  - ユーザー参加・退出ログの記録

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
ollama pull gemma:2b

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
├── server.js             # サーバー本体
├── db.js                 # データベース操作（新規）
├── data/                 # データベース保存先（自動生成）
│   └── rooms.db          # SQLiteデータベース
├── public/
│   └── index.html        # フロントエンド
├── templates/
│   └── default.md        # デフォルトテンプレート
├── .env                  # 環境設定
└── README.md            # このファイル
```

## ⚙️ 設定

### 環境変数（.env）

```env
PORT=3000                            # HTTPサーバーポート
WS_PORT=8080                        # WebSocketポート
OLLAMA_HOST=http://localhost:11434  # OllamaのURL
OLLAMA_MODEL=gemma:2b               # 使用するOllamaモデル
DB_PATH=./data/rooms.db             # データベースファイルのパス
```

#### 利用可能なモデル例

| モデル名 | 説明 | サイズ |
|---------|------|--------|
| `gemma:2b` | 軽量で高速（デフォルト） | 1.4GB |
| `llama2:7b` | バランス型 | 3.8GB |
| `mistral:7b` | 高性能 | 4.1GB |
| `codellama:7b` | コード特化 | 3.8GB |
| `phi:2.7b` | 軽量・高速 | 1.6GB |

モデルを変更する場合：
1. `.env`ファイルの`OLLAMA_MODEL`を編集
2. `ollama pull [モデル名]`でモデルをダウンロード
3. サーバーを再起動

### カスタムテンプレート

`templates/default.md` を編集して、デフォルトテンプレートをカスタマイズできます。

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

## 🔧 トラブルシューティング

### Ollamaが接続できない

```bash
# Ollamaの状態確認
curl http://localhost:11434/api/tags

# Ollamaが起動していない場合
ollama serve
```

### WebSocket接続エラー

- ファイアウォールでポート8080がブロックされていないか確認
- ブラウザのコンソールでエラーメッセージを確認

### テンプレートが表示されない

- `templates/default.md` が存在するか確認
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

## 🆕 v6.3の新機能

### データ永続化

- **Better-SQLite3統合**: 高速で信頼性の高いデータベース
- **サーバー再起動後もデータ保持**: テンプレート、メッセージ、ログを保存
- **自動メンテナンス**: 古いデータの自動削除
- **統計API**: データベースの状態を確認

### 更新されたファイル

- ✅ `package.json` - better-sqlite3依存関係を追加
- ✅ `server.js` - データベース機能を統合
- ✅ `db.js` - データベース操作モジュール（新規）
- ✅ `.gitignore` - データベースファイルを除外
- ✅ `.env` / `.env.example` - DB_PATH設定を追加
- ✅ `README.md` - データベース機能の説明を追加

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
  }
}
```

### GET /api/stats

データベース統計情報

```bash
curl http://localhost:3000/api/stats
```

レスポンス例：
```json
{
  "rooms": 10,
  "messages": 1523,
  "logs": 342,
  "dbPath": "./data/rooms.db"
}
```

## 🔄 既存プロジェクトのアップデート

既存のv6.1/v6.2からアップデートする場合：

1. 依存関係を更新：
   ```bash
   npm install better-sqlite3
   ```

2. 新しいファイルを追加：
   ```bash
   # db.js をプロジェクトに追加
   ```

3. `server.js`を新しいバージョンに置き換え

4. `.env`ファイルに以下を追加：
   ```env
   DB_PATH=./data/rooms.db
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
*バージョン: 6.3*
*新機能: Better-SQLite3によるデータ永続化*
