# Markdown協調編集システム v6.3 アップデート

## 🎯 新機能

### Better-SQLite3によるデータ永続化

サーバー再起動後もデータが保持されるようになりました！

## 📝 主な変更内容

### 1. データ永続化

**保存されるデータ:**
- ✅ ルームのテンプレート内容
- ✅ チャットメッセージ履歴
- ✅ ユーザー参加・退出・名前変更のログ

**技術仕様:**
- **データベース**: Better-SQLite3
- **ファイル形式**: SQLite (.db)
- **保存場所**: `./data/rooms.db`
- **WALモード**: 高速な読み書き
- **自動クリーンアップ**: 30日以上古いメッセージは自動削除

### 2. データベース構造

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

### 3. 新しいAPIエンドポイント

#### GET /health
サーバーとデータベースのヘルスチェック

```bash
curl http://localhost:3000/health
```

レスポンス例:
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

#### GET /api/stats
データベース統計情報

```bash
curl http://localhost:3000/api/stats
```

### 4. 更新されたファイル

#### 新規ファイル:
- ✅ `db.js` - データベース操作モジュール（約400行）

#### 更新されたファイル:
- ✅ `package.json` - better-sqlite3依存関係を追加
- ✅ `server.js` - データベース機能を統合（約350行）
- ✅ `.gitignore` - データベースファイルを除外
- ✅ `.env` / `.env.example` - DB_PATH設定を追加
- ✅ `README.md` - データベース機能の説明を追加
- ✅ `setup.sh` / `setup.bat` - データベース対応

#### 変更なし:
- `public/index.html` - フロントエンドは変更なし
- `templates/default.md` - テンプレートは変更なし

## 🔄 アップグレード手順

### 新規インストールの場合

```bash
# 1. 依存関係のインストール
npm install

# 2. セットアップスクリプトを実行
chmod +x setup.sh
./setup.sh

# 3. サーバー起動
npm start
```

### 既存プロジェクトからのアップグレード

```bash
# 1. better-sqlite3をインストール
npm install better-sqlite3

# 2. 新しいファイルを追加
# - db.js をプロジェクトルートに配置

# 3. 既存ファイルを更新
# - server.js を新バージョンに置き換え
# - package.json を更新
# - .env に DB_PATH=./data/rooms.db を追加
# - .gitignore にデータベースファイルを追加

# 4. データディレクトリを作成
mkdir -p data

# 5. サーバーを再起動
npm start
```

### アップグレード時の注意事項

⚠️ **重要**: 既存のメモリ内データは失われます
- v6.2以前では、サーバー再起動時にデータが消失していました
- v6.3にアップグレード後、初回起動時はデータベースが空の状態です
- 以降は、サーバー再起動してもデータが保持されます

## 💡 新機能の使い方

### 起動時の挙動

```bash
npm start

# コンソール出力例:
# ✅ データベース初期化完了
# ✅ Ollama: 接続OK
# ✅ モデル gemma:2b が利用可能です
# 📄 デフォルトテンプレート読み込み成功
# 🚀 Markdown Editor Server Started
# 📍 HTTP Server: http://localhost:3000
# 📍 WebSocket: ws://localhost:8080
# 🤖 Ollama Model: gemma:2b
# 💾 Database: ./data/rooms.db
# 📊 DB Stats: 5 rooms, 234 messages
```

### データベース統計の確認

```bash
# ヘルスチェック
curl http://localhost:3000/health

# 統計情報
curl http://localhost:3000/api/stats
```

### データベースファイルの管理

```bash
# バックアップの作成
cp data/rooms.db data/rooms_backup_$(date +%Y%m%d).db

# データベースサイズの確認
ls -lh data/rooms.db

# データベースの削除（すべてのデータが失われます）
rm data/rooms.db
npm start  # 新しいデータベースが自動作成されます
```

## 📊 パフォーマンス向上

### WALモードの利点

Better-SQLite3はWAL (Write-Ahead Logging) モードを使用:

- **同時読み書き**: 読み取り中も書き込み可能
- **高速化**: 通常のジャーナルモードより高速
- **クラッシュ回復**: データの整合性を保証

### 自動最適化

- **インデックス**: 頻繁に検索されるカラムにインデックスを作成
- **自動クリーンアップ**: 30日以上古いメッセージを自動削除
- **トランザクション**: 複数の操作をまとめて実行

## 🔒 セキュリティ

### データの安全性

- **ローカル保存**: データはサーバーのローカルファイルシステムに保存
- **バックアップ対応**: SQLiteファイルのコピーでバックアップ可能
- **トランザクション**: データの整合性を保証

### .gitignore設定

データベースファイルは自動的にGit管理から除外:
```
*.db
*.db-shm
*.db-wal
data/
```

## 🐛 既知の問題と制限事項

### 制限事項

1. **Node.js Clusterモード非対応**
   - Better-SQLite3はClusterモードでは動作しません
   - 単一プロセスでの運用を想定

2. **大規模データには不向き**
   - 数千件のメッセージまで快適に動作
   - 数万件を超える場合はPostgreSQLなどを検討

3. **同時書き込み**
   - SQLiteは書き込みをシリアライズします
   - 大量の同時書き込みには向きません

### トラブルシューティング

**データベースがロックされる場合:**
```bash
# WALファイルをチェックポイント
sqlite3 data/rooms.db "PRAGMA wal_checkpoint(FULL);"
```

**データベースを再作成する場合:**
```bash
# 既存のデータベースを削除
rm -rf data/
npm start
```

## 📈 今後の予定

### v6.4（予定）

- [ ] データベースバックアップAPI
- [ ] メッセージ検索機能
- [ ] ルーム削除機能
- [ ] エクスポート機能（JSON/CSV）

### v7.0（予定）

- [ ] ユーザー認証
- [ ] PostgreSQL対応（大規模運用向け）
- [ ] リアルタイムプレビュー機能

## 📞 サポート

問題が発生した場合:
1. `npm start` のログを確認
2. `/health` エンドポイントで状態確認
3. データベースファイルの確認: `ls -la data/`

---

*リリース日: 2025年9月30日*
*バージョン: 6.3*
*主な変更: Better-SQLite3によるデータ永続化*
