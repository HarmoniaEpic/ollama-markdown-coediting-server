#!/bin/bash

echo "======================================="
echo "Markdown Editor セットアップスクリプト"
echo "v6.3 (Better-SQLite3対応版)"
echo "======================================="

# .envファイルから設定を読み込み
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# デフォルト値の設定
OLLAMA_MODEL=${OLLAMA_MODEL:-gemma:2b}

# Node.jsチェック
if ! command -v node &> /dev/null; then
    echo "❌ Node.jsがインストールされていません"
    echo "インストール方法:"
    echo "  macOS: brew install node"
    echo "  Ubuntu: sudo apt install nodejs npm"
    exit 1
fi

echo "✅ Node.js: $(node --version)"

# Ollamaチェック
if ! command -v ollama &> /dev/null; then
    echo "❌ Ollamaがインストールされていません"
    echo "インストール: curl -fsSL https://ollama.ai/install.sh | sh"
    exit 1
fi

echo "✅ Ollama: インストール済み"

# 依存関係インストール
echo ""
echo "📦 依存関係をインストール中..."
npm install

# Ollamaの起動確認
echo ""
echo "🤖 Ollamaの起動確認..."
if ! curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "⚠️  Ollamaが起動していません"
    echo "別のターミナルで以下を実行してください:"
    echo "  ollama serve"
    read -p "Ollamaを起動したらEnterキーを押してください..."
fi

# モデルの確認とダウンロード
echo ""
echo "🧠 ${OLLAMA_MODEL}モデルの確認..."
if ! ollama list | grep -q "${OLLAMA_MODEL}"; then
    echo "モデルをダウンロード中..."
    ollama pull ${OLLAMA_MODEL}
else
    echo "✅ ${OLLAMA_MODEL}: インストール済み"
fi

# データディレクトリの作成
echo ""
echo "💾 データベースディレクトリを作成中..."
mkdir -p data

echo ""
echo "======================================="
echo "✅ セットアップ完了！"
echo "======================================="
echo "使用モデル: ${OLLAMA_MODEL}"
echo "データベース: ./data/rooms.db"
echo ""
echo "サーバーを起動するには:"
echo "  npm start"
echo ""
echo "ブラウザでアクセス:"
echo "  http://localhost:3000/?room=test&name=あなたの名前"
echo ""
echo "💡 新機能: データ永続化"
echo "  - テンプレート編集内容が保存されます"
echo "  - チャットメッセージ履歴が保存されます"
echo "  - サーバー再起動後もデータが残ります"
echo ""
