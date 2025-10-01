#!/bin/bash

echo "======================================="
echo "Markdown Editor セットアップスクリプト"
echo "v6.6 (AI Temperature設定対応版)"
echo "======================================="

# .envファイルから設定を読み込み
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# デフォルト値の設定
OLLAMA_MODEL_PRIMARY=${OLLAMA_MODEL_PRIMARY:-gemma3:latest}
OLLAMA_MODEL_FALLBACK=${OLLAMA_MODEL_FALLBACK:-phi4-mini:latest}

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

# プライマリモデルの確認とダウンロード
echo ""
echo "🧠 ${OLLAMA_MODEL_PRIMARY}モデルの確認..."
if ! ollama list | grep -q "${OLLAMA_MODEL_PRIMARY}"; then
    echo "プライマリモデルをダウンロード中..."
    ollama pull ${OLLAMA_MODEL_PRIMARY}
else
    echo "✅ ${OLLAMA_MODEL_PRIMARY}: インストール済み"
fi

# フォールバックモデルの確認とダウンロード
echo ""
echo "🧠 ${OLLAMA_MODEL_FALLBACK}モデルの確認..."
if ! ollama list | grep -q "${OLLAMA_MODEL_FALLBACK}"; then
    echo "フォールバックモデルをダウンロード中..."
    ollama pull ${OLLAMA_MODEL_FALLBACK}
else
    echo "✅ ${OLLAMA_MODEL_FALLBACK}: インストール済み"
fi

# データディレクトリの作成
echo ""
echo "💾 データベースディレクトリを作成中..."
mkdir -p data

# テンプレートディレクトリの確認
echo ""
echo "📄 テンプレートディレクトリを確認中..."
mkdir -p templates
if [ ! -f templates/default.md ]; then
    echo "デフォルトテンプレートを作成中..."
    cat > templates/default.md << 'EOF'
# 対応記録

**訪問日時**: {{date}}
**学校名**: {{school}}
**教職員名**: {{teacher}}
**対応種別**: {{type}}

## 問い合わせ内容
{{content}}

## 対応詳細
{{detail}}

## 解決状況
- [ ] 完了
- [ ] 継続対応
- [ ] 要再訪問

## 申し送り事項
{{notes}}

---
*記録者: {{recorder}}*
*記録日時: {{recorded_at}}*
EOF
fi

echo ""
echo "======================================="
echo "✅ セットアップ完了！"
echo "======================================="
echo "プライマリモデル: ${OLLAMA_MODEL_PRIMARY}"
echo "フォールバック: ${OLLAMA_MODEL_FALLBACK}"
echo "データベース: ./data/rooms.db"
echo ""
echo "🚀 サーバーを起動するには:"
echo "  npm start"
echo ""
echo "🌐 ブラウザでアクセス:"
echo "  http://localhost:3000/?room=test&name=あなたの名前"
echo ""
echo "🆕 v6.6 新機能:"
echo "======================================="
echo "🤖 AI Temperature設定"
echo "  - ハンバーガーメニュー（左上）から設定可能"
echo "  - 0.0-2.0の範囲で創造性を調整"
echo "  - デフォルト: 0.3（バランス）"
echo ""
echo "🍔 UIの改善"
echo "  - ハンバーガーメニューを左端に移動"
echo "  - より直感的な設定アクセス"
echo ""
echo "💡 Temperature設定の推奨値:"
echo "  0.1 - 正確（フォーマット変更など）"
echo "  0.3 - バランス（デフォルト）"
echo "  0.7 - 標準（自然な文章生成）"
echo "  1.2 - 創造的（アイデア生成）"
echo "======================================="
echo ""
