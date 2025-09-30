# 🚧工事中／Under Construction🚧

# Markdown協調編集システム v6.5

リアルタイムMarkdown協調編集システムです。複数ユーザーで同時編集、AIによる自動編集、統合チャット機能、**データ永続化**、**セキュリティ強化**、**高度なUI設定機能**を提供します。

## 📋 機能

### 基本機能
- ✅ **ルーム機能**: URLパラメータで任意のルームに参加
- ✅ **ユーザー名設定**: 各ユーザーが自分の名前を設定可能
- ✅ **統合チャット**: AI指示と通常チャットを同じインターフェースで
- ✅ **AI編集**: Ollama (自動モデル選択) を使用したMarkdownテンプレート編集
- ✅ **リアルタイム同期**: WebSocketによる即時反映

### データ管理
- ✅ **データ永続化**: Better-SQLite3によるデータベース保存
  - テンプレート編集内容の保存
  - チャットメッセージ履歴の保存
  - ユーザー参加・退出ログの記録

### セキュリティ
- ✅ **セキュリティ強化**:
  - パストラバーサル攻撃対策
  - XSS攻撃対策
  - プロンプトインジェクション対策
  - 入力バリデーション強化
  - レート制限

### テンプレート管理
- ✅ **テンプレート管理**:
  - 複数テンプレートのサポート
  - ドロップダウンで選択可能
  - リアルタイム切り替え
  - Markdownダウンロード機能 🆕

### AI機能
- ✅ **モデル自動選択**:
  - gemma3:latest → phi4-mini:latest → 任意のモデル
  - 全角スペース対応のAIコマンド 🆕

### UI/UX機能 🆕
- ✅ **ハンバーガーメニュー**: 詳細な設定パネル
- ✅ **カスタマイズ可能なレイアウト**:
  - チャット位置の切り替え（左/右）
  - チャット幅の調整（狭い/普通/広い）
  - フォントサイズ調整（10-24px）
- ✅ **Markdownプレビュー**:
  - 編集/プレビュー/分割表示モード
  - リアルタイムプレビュー
  - marked.jsによる高品質レンダリング
- ✅ **ダークモード**: ライト/ダークテーマ切り替え
- ✅ **設定の永続化**: localStorageに保存
- ✅ **レスポンシブデザイン**: モバイル/タブレット対応

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
| `@AI [指示]` | AI編集を実行（半角スペース） | `@AI 訪問日時を12月20日14時30分に変更` |
| `@AI　[指示]` | AI編集を実行（全角スペース対応）🆕 | `@AI　学校名を〇〇中学校に変更` |
| `@ai [指示]` | AI編集（小文字も可） | `@ai 対応種別を訪問に変更` |
| `@name [名前]` | 名前を変更 | `@name 田中太郎` |
| その他 | 通常のチャット | `この内容でよろしいですか？` |

## ⚙️ 設定機能 🆕

### ハンバーガーメニュー

ヘッダー右上の「☰ 設定」ボタンから設定パネルを開けます。

#### 利用可能な設定

| 設定項目 | 選択肢 | デフォルト | 説明 |
|---------|-------|----------|------|
| **📐 チャット位置** | 右側 / 左側 | 右側 | チャットエリアの配置 |
| **📏 チャット幅** | 狭い(300px) / 普通(450px) / 広い(600px) | 普通 | チャットエリアの幅 |
| **📝 Markdown表示** | 編集のみ / プレビューのみ / 分割表示 | 編集のみ | Markdownの表示モード |
| **🎨 テーマ** | ライトモード / ダークモード | ライト | カラーテーマ |
| **📖 フォントサイズ** | 10-24px | 14px | テキストサイズ |
| **⚙️ 自動スクロール** | ON / OFF | ON | チャットの自動スクロール |

### 設定の保存

すべての設定は自動的に `localStorage` に保存され、次回アクセス時に復元されます。

### 設定のリセット

設定メニュー下部の「設定をリセット」ボタンでデフォルト値に戻せます。

## 📝 Markdownプレビュー機能 🆕

### 表示モード

#### 1. 編集のみ（デフォルト）
Markdownのソースコードを編集するモードです。

#### 2. プレビューのみ
レンダリングされたMarkdownを表示するモードです。
- 見出し、リスト、コードブロック、テーブルなどをサポート
- リアルタイムで更新

#### 3. 分割表示
編集エリアとプレビューを左右に並べて表示します。
- 編集しながらプレビューを確認可能
- リアルタイム更新

### タブ切り替え

Markdownエリア上部の「編集」「プレビュー」タブで切り替え可能です。

### Markdownダウンロード 🆕

ヘッダーの「📥 ダウンロード」ボタンをクリックすると、現在のMarkdownファイルをダウンロードできます。

**ファイル名形式**: `{ルーム名}_{日付}.md`  
例: `meeting_2025-09-30.md`

## 📁 ファイル構成

```
markdown-editor/
├── package.json           # Node.js設定
├── server.js             # サーバー本体（全角スペース対応）
├── db.js                 # データベース操作
├── security.js           # セキュリティモジュール
├── data/                 # データベース保存先（自動生成）
│   └── rooms.db          # SQLiteデータベース
├── public/
│   └── index.html        # フロントエンド（v6.5 UI強化版）🆕
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

### v6.5で実装されたセキュリティ機能

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

### 設定が保存されない

- ブラウザのlocalStorageが有効か確認
- プライベートブラウジングモードを使用していないか確認
- ブラウザのストレージをクリアして再試行

### プレビューが表示されない

- ブラウザのコンソールでエラーを確認
- marked.jsのCDNが読み込まれているか確認
- ネットワーク接続を確認

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

## 🆕 v6.5の新機能

### UI/UX機能（New!）

1. **ハンバーガーメニュー**
   - スライドイン式の設定パネル
   - 全設定に簡単アクセス

2. **レイアウトカスタマイズ**
   - チャット位置の切り替え（左/右）
   - チャット幅の調整（300px/450px/600px）
   - CSS Flexboxによるスムーズな切り替え

3. **Markdownプレビュー**
   - 編集/プレビュー/分割表示の3モード
   - marked.jsによる高品質レンダリング
   - リアルタイム更新（debounce処理付き）

4. **ダークモード**
   - ライト/ダークテーマ対応
   - CSS変数による一括管理
   - スムーズなトランジション

5. **フォントサイズ調整**
   - 10px-24pxの範囲で調整可能
   - すべてのテキストに適用

6. **設定の永続化**
   - localStorageに自動保存
   - ページリロード後も設定維持

7. **Markdownダウンロード**
   - ヘッダーからワンクリックダウンロード
   - `{ルーム名}_{日付}.md` 形式

### AIコマンド改善（New!）

- **全角スペース対応**: `@AI　指示` も動作
- **大文字小文字を区別しない**: `@ai`, `@Ai`, `@aI` すべて対応
- **複数スペース対応**: `@AI  指示` も動作

### プレースホルダー保持の改善

AIが指示された箇所のみを変更し、他の `{{変数}}` は保持するようにプロンプトを改善。

## 🔄 既存プロジェクトのアップデート

既存のv6.4からアップデートする場合：

### ファイルの更新

1. `public/index.html` を新しいバージョンに置き換え
2. `server.js` を新しいバージョンに置き換え（全角スペース対応版）

### 新規依存関係

- **marked.js**: CDN経由で自動読み込み（追加インストール不要）

### サーバーを再起動

```bash
npm start
```

### ブラウザキャッシュのクリア

新しいUIを確認するため、ブラウザのキャッシュをクリアしてください。

## 🎨 カスタマイズ

### テーマのカスタマイズ

`index.html`のCSS変数を編集してカラーテーマをカスタマイズできます：

```css
:root {
    --bg-primary: #f8f9fa;
    --text-primary: #2c3e50;
    --accent-primary: #3498db;
    /* ... */
}
```

### 設定項目の追加

新しい設定項目を追加する場合：

1. `DEFAULT_SETTINGS` に項目を追加
2. 設定パネルにUIを追加
3. `applySettings()` 関数に適用ロジックを追加
4. イベントリスナーを登録

## 📝 ライセンス

MIT

## 🤝 Fork 歓迎

Fork を歓迎します。

## 📞 サポート

問題が発生した場合はご自由に改変・改良下さい。

---

*リリース日: 2025年9月*
*バージョン: 6.5*
*主な変更: UI/UX大幅強化 + Markdownプレビュー + ダークモード + レイアウトカスタマイズ + ダウンロード機能*
