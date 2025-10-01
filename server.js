import express from 'express';
import { WebSocketServer } from 'ws';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import {
    getOrCreateRoom,
    updateRoomTemplate,
    saveMessage,
    getRecentMessages,
    logUserAction,
    getDatabaseStats,
    deleteOldMessages
} from './db.js';
import {
    validateRoomName,
    validateUserName,
    validateFilename,
    validateModelName,
    sanitizeAIInstruction,
    sanitizeUrlParam,
    securityLog,
    checkRateLimit
} from './security.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 8080;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL_PRIMARY = process.env.OLLAMA_MODEL_PRIMARY || 'gemma3:latest';
const OLLAMA_MODEL_FALLBACK = process.env.OLLAMA_MODEL_FALLBACK || 'phi4-mini:latest';
const TEMPLATES_DIR = process.env.TEMPLATES_DIR || join(__dirname, 'templates');

let CURRENT_MODEL = null;

const wss = new WebSocketServer({ port: WS_PORT });

// モデル選択ロジック
async function selectBestModel() {
    try {
        const response = await fetch(`${OLLAMA_HOST}/api/tags`);
        if (!response.ok) throw new Error('Ollama not responding');
        
        const data = await response.json();
        const installedModels = data.models.map(m => m.name);
        
        // 優先順位でモデルを選択
        if (installedModels.includes(OLLAMA_MODEL_PRIMARY)) {
            console.log(`✅ モデル: ${OLLAMA_MODEL_PRIMARY} を使用`);
            return OLLAMA_MODEL_PRIMARY;
        } else if (installedModels.includes(OLLAMA_MODEL_FALLBACK)) {
            console.warn(`⚠️  ${OLLAMA_MODEL_PRIMARY} が見つかりません`);
            console.log(`✅ フォールバック: ${OLLAMA_MODEL_FALLBACK} を使用`);
            return OLLAMA_MODEL_FALLBACK;
        } else {
            console.error(`❌ ${OLLAMA_MODEL_PRIMARY} と ${OLLAMA_MODEL_FALLBACK} が見つかりません`);
            console.log('インストール済みモデル:', installedModels.join(', '));
            
            if (installedModels.length > 0) {
                console.log(`✅ ${installedModels[0]} を使用します`);
                return installedModels[0];
            } else {
                throw new Error('利用可能なモデルがありません');
            }
        }
    } catch (error) {
        console.error('モデル選択エラー:', error);
        return null;
    }
}

// Ollamaの疎通確認とモデル選択
async function checkOllama() {
    try {
        const response = await fetch(`${OLLAMA_HOST}/api/tags`);
        if (!response.ok) throw new Error('Ollama not responding');
        console.log('✅ Ollama: 接続OK');
        
        // モデル選択
        CURRENT_MODEL = await selectBestModel();
        
        if (!CURRENT_MODEL) {
            console.error('❌ 利用可能なモデルがありません');
            console.error('実行してください:');
            console.error(`  ollama pull ${OLLAMA_MODEL_PRIMARY}`);
            console.error(`  または ollama pull ${OLLAMA_MODEL_FALLBACK}`);
            process.exit(1);
        }
    } catch (error) {
        console.error('❌ ERROR: Ollamaが起動していません');
        console.error('実行してください: ollama serve');
        console.error(`その後: ollama pull ${OLLAMA_MODEL_PRIMARY}`);
        process.exit(1);
    }
}

// 起動時チェック
await checkOllama();

// CORS設定
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

// レート制限ミドルウェア
app.use((req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    
    if (!checkRateLimit(ip, 100, 60000)) {
        securityLog('warn', 'Rate limit exceeded', { ip, path: req.path });
        return res.status(429).json({ error: 'Too many requests' });
    }
    
    next();
});

// ルームごとのデータ管理（メモリ内）
const rooms = new Map();

// ユーザーID生成
let userCounter = 0;
function generateUserId() {
    return `user-${Date.now()}-${++userCounter}`;
}

// デフォルトテンプレートを読み込み
let defaultTemplate = '';
async function loadDefaultTemplate() {
    const templatePath = join(TEMPLATES_DIR, 'default.md');
    
    try {
        defaultTemplate = await fs.readFile(templatePath, 'utf-8');
        console.log(`📄 デフォルトテンプレート読み込み成功`);
    } catch (error) {
        console.warn('⚠️  default.mdが見つかりません。デフォルトテンプレートを使用');
        defaultTemplate = `# テンプレート

**訪問日時**: {{date}}
**学校名**: {{school}}
**教職員名**: {{teacher}}
**対応種別**: {{type}}

## 問い合わせ内容
{{content}}

## 対応詳細
{{detail}}

## 申し送り事項
{{notes}}`;
    }
}

// ルームデータの取得または作成
function getRoom(roomId, templateFile = 'default.md') {
    if (!rooms.has(roomId)) {
        // データベースからルーム情報を取得
        const dbRoom = getOrCreateRoom(roomId, defaultTemplate);
        
        rooms.set(roomId, {
            template: dbRoom.template,
            clients: new Map(),
            createdAt: new Date(dbRoom.created_at),
            templateFile: templateFile
        });
        
        console.log(`📂 ルーム読み込み: ${roomId}`);
    }
    return rooms.get(roomId);
}

// Temperature値のバリデーション
function validateTemperature(temp) {
    if (temp === undefined || temp === null) {
        return 0.3; // デフォルト値を0.3に変更
    }
    
    const num = parseFloat(temp);
    if (isNaN(num)) {
        return 0.3; // デフォルト値
    }
    
    // 範囲を0.0〜2.0に制限
    if (num < 0) return 0;
    if (num > 2) return 2;
    
    // 小数点第1位までに丸める
    return Math.round(num * 10) / 10;
}

// 静的ファイル配信
app.use(express.static(join(__dirname, 'public')));

// ヘルスチェック
app.get('/health', (req, res) => {
    const stats = getDatabaseStats();
    res.json({ 
        status: 'ok', 
        activeRooms: rooms.size,
        activeClients: Array.from(rooms.values()).reduce((sum, room) => sum + room.clients.size, 0),
        database: stats,
        model: CURRENT_MODEL,
        defaultTemperature: 0.3  // デフォルトtemperature値を追加
    });
});

// データベース統計API
app.get('/api/stats', (req, res) => {
    const stats = getDatabaseStats();
    res.json(stats);
});

// モデル一覧取得
app.get('/api/models', async (req, res) => {
    try {
        const response = await fetch(`${OLLAMA_HOST}/api/tags`);
        if (!response.ok) {
            throw new Error('Failed to fetch models from Ollama');
        }
        
        const data = await response.json();
        
        const models = data.models.map(m => ({
            name: m.name,
            size: m.size,
            modified: m.modified_at
        }));
        
        res.json({
            current: CURRENT_MODEL,
            available: models,
            primary: OLLAMA_MODEL_PRIMARY,
            fallback: OLLAMA_MODEL_FALLBACK
        });
    } catch (error) {
        console.error('モデル一覧取得エラー:', error);
        res.status(500).json({ error: 'Failed to fetch models' });
    }
});

// テンプレート一覧取得
app.get('/api/templates', async (req, res) => {
    try {
        const files = await fs.readdir(TEMPLATES_DIR);
        const mdFiles = files.filter(f => f.endsWith('.md'));
        
        const templates = await Promise.all(
            mdFiles.map(async (file) => {
                const stats = await fs.stat(join(TEMPLATES_DIR, file));
                return {
                    name: file,
                    size: stats.size,
                    modified: stats.mtime
                };
            })
        );
        
        res.json({ templates });
    } catch (error) {
        console.error('テンプレート一覧取得エラー:', error);
        res.status(500).json({ error: 'Failed to fetch templates' });
    }
});

// 特定テンプレート取得（セキュリティ強化版）
app.get('/api/templates/:filename', async (req, res) => {
    try {
        const filename = sanitizeUrlParam(req.params.filename);
        
        // ✅ セキュリティ: ファイル名バリデーション
        if (!validateFilename(filename)) {
            securityLog('warn', 'Invalid filename attempt', { filename, ip: req.ip });
            return res.status(400).json({ error: 'Invalid filename' });
        }
        
        // パスの構築と正規化
        const filepath = join(TEMPLATES_DIR, filename);
        const normalizedPath = path.normalize(filepath);
        const normalizedTemplatesDir = path.normalize(TEMPLATES_DIR);
        
        // ✅ セキュリティ: パストラバーサル対策
        if (!normalizedPath.startsWith(normalizedTemplatesDir)) {
            securityLog('error', 'Path traversal attempt detected', { 
                filename, 
                ip: req.ip,
                normalizedPath 
            });
            return res.status(403).json({ error: 'Access denied' });
        }
        
        // ファイル読み込み
        const content = await fs.readFile(normalizedPath, 'utf-8');
        res.json({ filename, content });
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: 'Template not found' });
        } else {
            console.error('Template fetch error:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

// WebSocket接続
wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const roomId = sanitizeUrlParam(url.searchParams.get('room') || 'default');
    const userName = sanitizeUrlParam(url.searchParams.get('name') || '');
    const templateFile = sanitizeUrlParam(url.searchParams.get('template') || 'default.md');
    
    // クライアントのIPアドレス取得
    const clientIp = req.socket.remoteAddress;
    
    // ✅ セキュリティ: ルーム名バリデーション
    if (!validateRoomName(roomId)) {
        ws.close(1008, 'Invalid room name');
        securityLog('warn', 'Invalid room name attempt', { roomId, ip: clientIp });
        return;
    }
    
    // ✅ セキュリティ: テンプレートファイル名バリデーション
    if (!validateFilename(templateFile)) {
        ws.close(1008, 'Invalid template filename');
        securityLog('warn', 'Invalid template filename attempt', { templateFile, ip: clientIp });
        return;
    }
    
    const room = getRoom(roomId, templateFile);
    
    // ユーザー情報設定
    const userId = generateUserId();
    let validatedUserName = userName;
    
    // ✅ セキュリティ: ユーザー名バリデーション
    if (validatedUserName && !validateUserName(validatedUserName)) {
        securityLog('warn', 'Invalid username attempt', { userName: validatedUserName, ip: clientIp });
        validatedUserName = '';
    }
    
    const userData = {
        id: userId,
        name: validatedUserName || `ユーザー${room.clients.size + 1}`,
        joinedAt: new Date()
    };
    
    // ルームに参加
    room.clients.set(ws, userData);
    ws.roomId = roomId;
    ws.userId = userId;
    
    console.log(`👤 ${userData.name} が ${roomId} に参加`);
    
    // データベースにログ記録
    logUserAction(roomId, userId, userData.name, 'joined');
    
    // データベースからメッセージ履歴を取得
    const dbMessages = getRecentMessages(roomId, 50);
    
    // メッセージをフロントエンド形式に変換
    const messages = dbMessages.map(msg => ({
        text: msg.text,
        type: msg.type,
        time: new Date(msg.created_at).toLocaleTimeString('ja-JP', { 
            hour: '2-digit', 
            minute: '2-digit' 
        }),
        userName: msg.user_name,
        userId: msg.user_id
    }));
    
    // 初期データ送信
    ws.send(JSON.stringify({
        type: 'init',
        userId: userId,
        userName: userData.name,
        template: room.template,
        messages: messages,
        users: getUserList(roomId)
    }));
    
    // 参加通知
    broadcastToRoom(roomId, {
        type: 'user_joined',
        user: userData,
        users: getUserList(roomId)
    }, ws);
    
    // システムメッセージ
    addMessage(roomId, `${userData.name} が参加しました`, 'system');
    
    ws.on('message', async (message) => {
        try {
            const data = JSON.parse(message);
            await handleMessage(ws, roomId, data);
        } catch (error) {
            console.error('メッセージ処理エラー:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'メッセージの処理に失敗しました'
            }));
        }
    });
    
    ws.on('error', (error) => {
        console.error('WebSocketエラー:', error);
    });
    
    ws.on('close', () => {
        const userData = room.clients.get(ws);
        room.clients.delete(ws);
        
        // 退出通知
        if (userData) {
            console.log(`👤 ${userData.name} が ${roomId} から退出`);
            
            // データベースにログ記録
            logUserAction(roomId, userId, userData.name, 'left');
            
            addMessage(roomId, `${userData.name} が退出しました`, 'system');
            broadcastToRoom(roomId, {
                type: 'user_left',
                user: userData,
                users: getUserList(roomId)
            });
        }
        
        // 空ルームの削除（メモリから）
        if (room.clients.size === 0) {
            setTimeout(() => {
                if (rooms.has(roomId) && rooms.get(roomId).clients.size === 0) {
                    rooms.delete(roomId);
                    console.log(`🗑️  メモリから空ルーム削除: ${roomId}`);
                }
            }, 60000); // 1分後
        }
    });
});

// ユーザーリスト取得
function getUserList(roomId) {
    const room = rooms.get(roomId);
    if (!room) return [];
    
    return Array.from(room.clients.values()).map(user => ({
        id: user.id,
        name: user.name
    }));
}

// メッセージ処理
async function handleMessage(ws, roomId, data) {
    const room = getRoom(roomId);
    const userData = room.clients.get(ws);
    
    if (data.type === 'message') {
        const text = data.text.trim();
        
        // @name コマンド: 名前変更
        if (text.startsWith('@name ')) {
            const newName = text.substring(6).trim();
            
            // ✅ セキュリティ: ユーザー名バリデーション
            if (newName && validateUserName(newName)) {
                const oldName = userData.name;
                userData.name = newName;
                
                // データベースにログ記録
                logUserAction(roomId, userData.id, newName, 'renamed');
                
                // 名前変更通知
                broadcastToRoom(roomId, {
                    type: 'user_renamed',
                    userId: userData.id,
                    oldName: oldName,
                    newName: newName,
                    users: getUserList(roomId)
                });
                
                addMessage(roomId, `${oldName} → ${newName} に変更`, 'system');
                console.log(`✏️  名前変更: ${oldName} → ${newName}`);
            } else {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: '名前に使用できない文字が含まれています（1-20文字、特殊文字不可）'
                }));
            }
            return;
        }
        
        // @AI コマンド: AI処理（★全角スペース対応版★）
        // 正規表現: @ai の後に半角または全角スペースが1つ以上、その後に指示内容
        // i フラグで大文字小文字を区別しない
        const aiCommandPattern = /^@ai[\s　]+(.+)$/i;
        const aiMatch = text.match(aiCommandPattern);
        
        if (aiMatch) {
            // キャプチャグループから指示内容を取得
            const instruction = aiMatch[1].trim();
            
            // Temperature値を取得（settingsから、なければデフォルト値）
            let temperature = 0.3; // デフォルト値を0.3に変更
            if (data.settings && data.settings.temperature !== undefined) {
                temperature = validateTemperature(data.settings.temperature);
            }
            
            try {
                // ✅ セキュリティ: AI指示のサニタイゼーション
                const sanitizedInstruction = sanitizeAIInstruction(instruction);
                
                // AI処理中メッセージ（temperature値も表示）
                addMessage(roomId, `AI処理中: "${sanitizedInstruction}" (Temperature: ${temperature})`, 'system');
                
                // Temperature値を渡してOllamaを呼び出し
                const result = await callOllama(room.template, sanitizedInstruction, temperature);
                
                if (result) {
                    room.template = result;
                    
                    // データベースに保存
                    updateRoomTemplate(roomId, result);
                    
                    broadcastToRoom(roomId, {
                        type: 'template_update',
                        template: room.template,
                        updatedBy: userData.name
                    });
                    
                    addMessage(roomId, `✅ ${userData.name}がAI編集を実行: "${sanitizedInstruction}"`, 'system');
                    console.log(`🤖 AI編集実行: ${sanitizedInstruction} (Temperature: ${temperature})`);
                } else {
                    addMessage(roomId, `❌ AI処理に失敗しました`, 'system');
                }
            } catch (error) {
                addMessage(roomId, `❌ ${error.message}`, 'system');
                securityLog('warn', 'AI instruction validation failed', { 
                    instruction, 
                    error: error.message,
                    userId: userData.id
                });
            }
        } else {
            // 通常のチャットメッセージ
            addMessage(roomId, text, 'user', userData);
        }
    }
    
    // テンプレート変更リクエスト
    if (data.type === 'change_template') {
        const filename = sanitizeUrlParam(data.filename);
        
        // ✅ セキュリティ: ファイル名バリデーション
        if (!validateFilename(filename)) {
            ws.send(JSON.stringify({
                type: 'error',
                message: '無効なテンプレートファイル名です'
            }));
            securityLog('warn', 'Invalid template change attempt', { 
                filename, 
                userId: userData.id 
            });
            return;
        }
        
        try {
            const filepath = join(TEMPLATES_DIR, filename);
            const normalizedPath = path.normalize(filepath);
            const normalizedTemplatesDir = path.normalize(TEMPLATES_DIR);
            
            // ✅ セキュリティ: パストラバーサル対策
            if (!normalizedPath.startsWith(normalizedTemplatesDir)) {
                throw new Error('アクセスが拒否されました');
            }
            
            const content = await fs.readFile(normalizedPath, 'utf-8');
            room.template = content;
            room.templateFile = filename;
            
            updateRoomTemplate(roomId, content);
            
            broadcastToRoom(roomId, {
                type: 'template_update',
                template: room.template,
                updatedBy: userData.name
            });
            
            addMessage(roomId, `📄 ${userData.name}がテンプレートを変更: ${filename}`, 'system');
            console.log(`📄 テンプレート変更: ${roomId} → ${filename}`);
        } catch (error) {
            console.error('テンプレート変更エラー:', error);
            ws.send(JSON.stringify({
                type: 'error',
                message: 'テンプレートの読み込みに失敗しました'
            }));
        }
    }
}

// メッセージ追加と配信
function addMessage(roomId, text, type = 'user', userData = null) {
    const room = getRoom(roomId);
    const now = new Date();
    
    const message = {
        text,
        type,
        time: now.toLocaleTimeString('ja-JP', { 
            hour: '2-digit', 
            minute: '2-digit' 
        }),
        userName: userData ? userData.name : 'システム',
        userId: userData ? userData.id : null
    };
    
    // データベースに保存
    saveMessage(
        roomId,
        userData ? userData.id : null,
        userData ? userData.name : 'システム',
        text,
        type
    );
    
    broadcastToRoom(roomId, {
        type: 'new_message',
        message
    });
}

// Ollama呼び出し（★Temperature対応版★）
async function callOllama(currentTemplate, instruction, temperature = 0.3) {
    try {
        // Temperature値を再度バリデーション（安全のため）
        const validatedTemp = validateTemperature(temperature);
        
        console.log(`🤖 Ollama呼び出し - Model: ${CURRENT_MODEL}, Temperature: ${validatedTemp}`);
        
        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: CURRENT_MODEL,
                prompt: `あなたはMarkdownテンプレートの編集アシスタントです。

【重要なルール】
1. 指示された箇所「のみ」を変更してください
2. {{変数}}の形式は絶対に保持してください（例: {{date}}, {{school}}など）
3. 指示されていない{{変数}}は絶対に置き換えないでください
4. 不要な創作や追加は一切行わないでください
5. テンプレートの構造とフォーマットを維持してください

【現在のテンプレート】
${currentTemplate}

【ユーザーの指示】
${instruction}

【編集後の完全なテンプレート】
上記のルールに従って、指示された箇所のみを変更したテンプレートを出力してください。
変更していない部分は元のまま保持してください。`,
                stream: false,
                options: {
                    temperature: validatedTemp,  // 動的なtemperature値を使用
                    num_predict: 800
                }
            })
        });
        
        if (!response.ok) {
            console.error('Ollama APIエラー:', response.status);
            return null;
        }
        
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Ollama呼び出しエラー:', error);
        return null;
    }
}

// ルーム内配信
function broadcastToRoom(roomId, data, excludeWs = null) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const message = JSON.stringify(data);
    room.clients.forEach((userData, client) => {
        if (client !== excludeWs && client.readyState === 1) {
            client.send(message);
        }
    });
}

// 定期的なメンテナンス
setInterval(() => {
    // 30日以上古いメッセージを削除
    deleteOldMessages(30);
}, 24 * 60 * 60 * 1000); // 1日ごと

// サーバー起動
async function startServer() {
    // デフォルトテンプレートを読み込み
    await loadDefaultTemplate();
    
    app.listen(PORT, () => {
        const stats = getDatabaseStats();
        console.log('=====================================');
        console.log('🚀 Markdown Editor Server Started v6.6');
        console.log('📍 HTTP Server: http://localhost:' + PORT);
        console.log('📍 WebSocket: ws://localhost:' + WS_PORT);
        console.log('🤖 Current Model: ' + CURRENT_MODEL);
        console.log('🌡️  Default Temperature: 0.3');
        console.log('💾 Database: ' + stats.dbPath);
        console.log('📊 DB Stats: ' + stats.rooms + ' rooms, ' + stats.messages + ' messages');
        console.log('🛡️  Security: Enhanced');
        console.log('=====================================');
        console.log('使い方:');
        console.log('  http://localhost:' + PORT + '/?room=ルーム名&name=あなたの名前');
        console.log('  テンプレート指定: &template=custom.md');
        console.log('=====================================');
        console.log('✨ v6.6 新機能:');
        console.log('  - ハンバーガーメニューが左端に移動');
        console.log('  - AI Temperature設定が可能（0.0-2.0）');
        console.log('  - デフォルトTemperature値: 0.3');
        console.log('=====================================');
    });
}

startServer();
