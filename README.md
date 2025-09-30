# Markdown協調編集システム v6.1

リアルタイムMarkdown協調編集システムです。複数ユーザーで同時編集、AIによる自動編集、統合チャット機能を提供します。

## 📋 機能

- ✅ **ルーム機能**: URLパラメータで任意のルームに参加
- ✅ **ユーザー名設定**: 各ユーザーが自分の名前を設定可能
- ✅ **統合チャット**: AI指示と通常チャットを同じインターフェースで
- ✅ **AI編集**: Ollama (gemma:2b) を使用したMarkdownテンプレート編集
- ✅ **リアルタイム同期**: WebSocketによる即時反映

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
├── public/
│   └── index.html        # フロントエンド
├── templates/
│   └── default.md        # デフォルトテンプレート
├── .env                  # 環境設定（オプション）
└── README.md            # このファイル
```

## ⚙️ 設定

### 環境変数（.env）

```env
PORT=3000                            # HTTPサーバーポート
WS_PORT=8080                        # WebSocketポート
OLLAMA_HOST=http://localhost:11434  # OllamaのURL
OLLAMA_MODEL=gemma:2b               # 使用するOllamaモデル
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

## 📝 ライセンス

MIT

## 🤝 貢献

Issue や Pull Request を歓迎します。

## 📞 サポート

問題が発生した場合は、Issueを作成してください。