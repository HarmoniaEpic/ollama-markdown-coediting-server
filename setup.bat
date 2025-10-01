@echo off
echo =======================================
echo Markdown Editor セットアップスクリプト
echo v6.7 (AIモデル選択対応版)
echo =======================================

REM .envファイルから設定を読み込み（存在する場合）
set OLLAMA_MODEL_PRIMARY=gemma3:latest
set OLLAMA_MODEL_FALLBACK=phi4-mini:latest
if exist .env (
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        if "%%a"=="OLLAMA_MODEL_PRIMARY" set OLLAMA_MODEL_PRIMARY=%%b
        if "%%a"=="OLLAMA_MODEL_FALLBACK" set OLLAMA_MODEL_FALLBACK=%%b
    )
)

REM Node.jsチェック
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo × Node.jsがインストールされていません
    echo インストール方法:
    echo   winget install OpenJS.NodeJS
    echo   または https://nodejs.org/ からダウンロード
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo √ Node.js: %NODE_VERSION%

REM Ollamaチェック
where ollama >nul 2>&1
if %errorlevel% neq 0 (
    echo × Ollamaがインストールされていません
    echo インストール: 
    echo   winget install Ollama.Ollama
    echo   または https://ollama.ai/download/windows からダウンロード
    exit /b 1
)

echo √ Ollama: インストール済み

REM 依存関係インストール
echo.
echo 依存関係をインストール中...
call npm install

REM Ollamaの起動確認
echo.
echo Ollamaの起動確認...
curl -s http://localhost:11434/api/tags >nul 2>&1
if %errorlevel% neq 0 (
    echo ※ Ollamaが起動していません
    echo 別のコマンドプロンプトで以下を実行してください:
    echo   ollama serve
    pause
)

REM プライマリモデルの確認とダウンロード
echo.
echo %OLLAMA_MODEL_PRIMARY%モデルの確認...
ollama list | findstr /C:"%OLLAMA_MODEL_PRIMARY%" >nul 2>&1
if %errorlevel% neq 0 (
    echo プライマリモデルをダウンロード中...
    ollama pull %OLLAMA_MODEL_PRIMARY%
) else (
    echo √ %OLLAMA_MODEL_PRIMARY%: インストール済み
)

REM フォールバックモデルの確認とダウンロード
echo.
echo %OLLAMA_MODEL_FALLBACK%モデルの確認...
ollama list | findstr /C:"%OLLAMA_MODEL_FALLBACK%" >nul 2>&1
if %errorlevel% neq 0 (
    echo フォールバックモデルをダウンロード中...
    ollama pull %OLLAMA_MODEL_FALLBACK%
) else (
    echo √ %OLLAMA_MODEL_FALLBACK%: インストール済み
)

REM データディレクトリの作成
echo.
echo データベースディレクトリを作成中...
if not exist data mkdir data

REM テンプレートディレクトリの確認
echo.
echo テンプレートディレクトリを確認中...
if not exist templates mkdir templates
if not exist templates\default.md (
    echo デフォルトテンプレートを作成中...
    (
        echo # 対応記録
        echo.
        echo **訪問日時**: {{date}}
        echo **学校名**: {{school}}
        echo **教職員名**: {{teacher}}
        echo **対応種別**: {{type}}
        echo.
        echo ## 問い合わせ内容
        echo {{content}}
        echo.
        echo ## 対応詳細
        echo {{detail}}
        echo.
        echo ## 解決状況
        echo - [ ] 完了
        echo - [ ] 継続対応
        echo - [ ] 要再訪問
        echo.
        echo ## 申し送り事項
        echo {{notes}}
        echo.
        echo ---
        echo *記録者: {{recorder}}*
        echo *記録日時: {{recorded_at}}*
    ) > templates\default.md
)

echo.
echo =======================================
echo √ セットアップ完了！
echo =======================================
echo プライマリモデル: %OLLAMA_MODEL_PRIMARY%
echo フォールバック: %OLLAMA_MODEL_FALLBACK%
echo データベース: ./data/rooms.db
echo.
echo サーバーを起動するには:
echo   npm start
echo.
echo ブラウザでアクセス:
echo   http://localhost:3000/?room=test^&name=あなたの名前
echo.
echo =======================================
echo ★ v6.7 新機能
echo =======================================
echo.
echo [AIモデル自由選択]
echo   - ヘッダーのドロップダウンからモデルを選択可能
echo   - ルームごとに異なるモデルを使用可能
echo   - リアルタイムでモデル切り替え
echo.
echo [AI指示の文字数制限撤廃]
echo   - マルチバイト文字での長文指示が可能
echo   - より詳細で複雑な編集指示に対応
echo.
echo [AI Temperature設定] (v6.6から継続)
echo   - ハンバーガーメニュー（左上）から設定可能
echo   - 0.0-2.0の範囲で創造性を調整
echo   - デフォルト: 0.3（バランス）
echo.
echo [Temperature設定の推奨値]
echo   0.1 - 正確（フォーマット変更など）
echo   0.3 - バランス（デフォルト）
echo   0.7 - 標準（自然な文章生成）
echo   1.2 - 創造的（アイデア生成）
echo.
echo =======================================
echo.
pause
