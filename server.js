import express from 'express';
import { WebSocketServer } from 'ws';
import fs from 'fs/promises';
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

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 3000;
const WS_PORT = process.env.WS_PORT || 8080;
const OLLAMA_HOST = process.env.OLLAMA_HOST || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'gemma:2b';

const wss = new WebSocketServer({ port: WS_PORT });

// Ollamaの疎通確認
async function checkOllama() {
    try {
        const response = await fetch(`${OLLAMA_HOST}/api/tags`);
        if (!response.ok) throw new Error('Ollama not responding');
        console.log('✅ Ollama: 接続OK');
        
        // モデル確認
        const data = await response.json();
        const modelName = OLLAMA_MODEL.split(':')[0];
        const hasModel = data.models?.some(m => m.name.includes(modelName));
        if (!hasModel) {
            console.warn(`⚠️  ${OLLAMA_MODEL} が見つかりません。実行: ollama pull ${OLLAMA_MODEL}`);
        } else {
            console.log(`✅ モデル ${OLLAMA_MODEL} が利用可能です`);
        }
    } catch (error) {
        console.error('❌ ERROR: Ollamaが起動していません');
        console.error('実行してください: ollama serve');
        console.error(`その後: ollama pull ${OLLAMA_MODEL}`);
        process.exit(1);
    }
}

// 起動時チェック
checkOllama();

// CORS設定
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST');
    res.header('Access-Control-Allow-Headers', 'Content-Type');
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
    const templatePath = join(__dirname, 'templates', 'default.md');
    
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
function getRoom(roomId) {
    if (!rooms.has(roomId)) {
        // データベースからルーム情報を取得
        const dbRoom = getOrCreateRoom(roomId, defaultTemplate);
        
        rooms.set(roomId, {
            template: dbRoom.template,
            clients: new Map(),
            createdAt: new Date(dbRoom.created_at)
        });
        
        console.log(`📂 ルーム読み込み: ${roomId}`);
    }
    return rooms.get(roomId);
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
        database: stats
    });
});

// データベース統計API
app.get('/api/stats', (req, res) => {
    const stats = getDatabaseStats();
    res.json(stats);
});

// WebSocket接続
wss.on('connection', (ws, req) => {
    const url = new URL(req.url, 'http://localhost');
    const roomId = url.searchParams.get('room') || 'default';
    const userName = url.searchParams.get('name') || null;
    const room = getRoom(roomId);
    
    // ユーザー情報設定
    const userId = generateUserId();
    const userData = {
        id: userId,
        name: userName || `ユーザー${room.clients.size + 1}`,
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
            if (newName && newName.length <= 20) {
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
            }
            return;
        }
        
        // @AI コマンド: AI処理
        if (text.startsWith('@AI ') || text.startsWith('@ai ')) {
            const instruction = text.substring(4);
            
            // AI処理中メッセージ
            addMessage(roomId, `AI処理中: "${instruction}"`, 'system');
            
            const result = await callOllama(room.template, instruction);
            
            if (result) {
                room.template = result;
                
                // データベースに保存
                updateRoomTemplate(roomId, result);
                
                broadcastToRoom(roomId, {
                    type: 'template_update',
                    template: room.template,
                    updatedBy: userData.name
                });
                
                addMessage(roomId, `✅ ${userData.name}がAI編集を実行: "${instruction}"`, 'system');
                console.log(`🤖 AI編集実行: ${instruction}`);
            } else {
                addMessage(roomId, `❌ AI処理に失敗しました`, 'system');
            }
        } else {
            // 通常のチャットメッセージ
            addMessage(roomId, text, 'user', userData);
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

// Ollama呼び出し
async function callOllama(currentTemplate, instruction) {
    try {
        const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt: `
Markdownテンプレートを編集してください。
{{変数}}の部分を実際の値に置き換えてください。

現在のテンプレート:
${currentTemplate}

指示: ${instruction}

編集後の完全なテンプレート:`,
                stream: false,
                options: {
                    temperature: 0.3,
                    num_predict: 500
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

// 定期的なメンテナンス（オプション）
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
        console.log('🚀 Markdown Editor Server Started');
        console.log(`📍 HTTP Server: http://localhost:${PORT}`);
        console.log(`📍 WebSocket: ws://localhost:${WS_PORT}`);
        console.log(`🤖 Ollama Model: ${OLLAMA_MODEL}`);
        console.log(`💾 Database: ${stats.dbPath}`);
        console.log(`📊 DB Stats: ${stats.rooms} rooms, ${stats.messages} messages`);
        console.log('=====================================');
        console.log('使い方:');
        console.log(`  http://localhost:${PORT}/?room=ルーム名&name=あなたの名前`);
        console.log('=====================================');
    });
}

startServer();
