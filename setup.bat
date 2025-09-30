@echo off
echo =======================================
echo Markdown Editor セットアップスクリプト
echo =======================================

REM .envファイルから設定を読み込み（存在する場合）
set OLLAMA_MODEL=gemma:2b
if exist .env (
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        if "%%a"=="OLLAMA_MODEL" set OLLAMA_MODEL=%%b
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

REM モデルの確認とダウンロード
echo.
echo %OLLAMA_MODEL%モデルの確認...
ollama list | findstr /C:"%OLLAMA_MODEL%" >nul 2>&1
if %errorlevel% neq 0 (
    echo モデルをダウンロード中...
    ollama pull %OLLAMA_MODEL%
) else (
    echo √ %OLLAMA_MODEL%: インストール済み
)

echo.
echo =======================================
echo √ セットアップ完了！
echo =======================================
echo 使用モデル: %OLLAMA_MODEL%
echo.
echo サーバーを起動するには:
echo   npm start
echo.
echo ブラウザでアクセス:
echo   http://localhost:3000/?room=test^&name=あなたの名前
echo.
pause