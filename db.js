import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// データベースファイルのパス
const DB_DIR = join(__dirname, 'data');
const DB_PATH = process.env.DB_PATH || join(DB_DIR, 'rooms.db');

// データディレクトリが存在しない場合は作成
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// データベース接続
const db = new Database(DB_PATH);

// WALモードを有効化（パフォーマンス向上）
db.pragma('journal_mode = WAL');

// テーブル初期化
function initDatabase() {
    // roomsテーブル
    db.exec(`
        CREATE TABLE IF NOT EXISTS rooms (
            id TEXT PRIMARY KEY,
            template TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    `);

    // messagesテーブル
    db.exec(`
        CREATE TABLE IF NOT EXISTS messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id TEXT NOT NULL,
            user_id TEXT,
            user_name TEXT NOT NULL,
            text TEXT NOT NULL,
            type TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
        )
    `);

    // users_logテーブル（参加・退出ログ）
    db.exec(`
        CREATE TABLE IF NOT EXISTS users_log (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            room_id TEXT NOT NULL,
            user_id TEXT,
            user_name TEXT NOT NULL,
            action TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
        )
    `);

    // インデックス作成
    db.exec(`
        CREATE INDEX IF NOT EXISTS idx_messages_room_id ON messages(room_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
        CREATE INDEX IF NOT EXISTS idx_users_log_room_id ON users_log(room_id);
    `);

    console.log('✅ データベース初期化完了');
}

// ========================================
// Room関連の操作
// ========================================

/**
 * ルームを作成または取得
 */
export function getOrCreateRoom(roomId, defaultTemplate) {
    const room = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    
    if (room) {
        return room;
    }
    
    // 新規ルーム作成
    const now = new Date().toISOString();
    db.prepare(`
        INSERT INTO rooms (id, template, created_at, updated_at)
        VALUES (?, ?, ?, ?)
    `).run(roomId, defaultTemplate, now, now);
    
    console.log(`📄 新規ルーム作成: ${roomId}`);
    return { id: roomId, template: defaultTemplate, created_at: now, updated_at: now };
}

/**
 * ルームのテンプレートを更新
 */
export function updateRoomTemplate(roomId, template) {
    const now = new Date().toISOString();
    db.prepare(`
        UPDATE rooms 
        SET template = ?, updated_at = ?
        WHERE id = ?
    `).run(template, now, roomId);
}

/**
 * ルームを削除
 */
export function deleteRoom(roomId) {
    db.prepare('DELETE FROM rooms WHERE id = ?').run(roomId);
    console.log(`🗑️  ルーム削除: ${roomId}`);
}

/**
 * 全ルームを取得
 */
export function getAllRooms() {
    return db.prepare('SELECT * FROM rooms').all();
}

// ========================================
// Message関連の操作
// ========================================

/**
 * メッセージを保存
 */
export function saveMessage(roomId, userId, userName, text, type = 'user') {
    const now = new Date().toISOString();
    const result = db.prepare(`
        INSERT INTO messages (room_id, user_id, user_name, text, type, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
    `).run(roomId, userId, userName, text, type, now);
    
    return {
        id: result.lastInsertRowid,
        room_id: roomId,
        user_id: userId,
        user_name: userName,
        text,
        type,
        created_at: now
    };
}

/**
 * ルームの最新メッセージを取得
 */
export function getRecentMessages(roomId, limit = 50) {
    return db.prepare(`
        SELECT * FROM messages 
        WHERE room_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
    `).all(roomId, limit).reverse();
}

/**
 * ルームの全メッセージを削除
 */
export function deleteRoomMessages(roomId) {
    db.prepare('DELETE FROM messages WHERE room_id = ?').run(roomId);
}

/**
 * 古いメッセージを削除（日数指定）
 */
export function deleteOldMessages(days = 30) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    const cutoff = cutoffDate.toISOString();
    
    const result = db.prepare(`
        DELETE FROM messages 
        WHERE created_at < ?
    `).run(cutoff);
    
    console.log(`🧹 ${result.changes}件の古いメッセージを削除`);
    return result.changes;
}

// ========================================
// UserLog関連の操作
// ========================================

/**
 * ユーザーアクションをログに記録
 */
export function logUserAction(roomId, userId, userName, action) {
    const now = new Date().toISOString();
    db.prepare(`
        INSERT INTO users_log (room_id, user_id, user_name, action, created_at)
        VALUES (?, ?, ?, ?, ?)
    `).run(roomId, userId, userName, action, now);
}

/**
 * ルームのユーザーログを取得
 */
export function getUserLogs(roomId, limit = 100) {
    return db.prepare(`
        SELECT * FROM users_log 
        WHERE room_id = ? 
        ORDER BY created_at DESC 
        LIMIT ?
    `).all(roomId, limit);
}

// ========================================
// メンテナンス関連
// ========================================

/**
 * データベースのバックアップ
 */
export function backupDatabase(backupPath) {
    const backup = new Database(backupPath);
    db.backup(backup);
    backup.close();
    console.log(`💾 バックアップ作成: ${backupPath}`);
}

/**
 * データベースの統計情報を取得
 */
export function getDatabaseStats() {
    const roomCount = db.prepare('SELECT COUNT(*) as count FROM rooms').get().count;
    const messageCount = db.prepare('SELECT COUNT(*) as count FROM messages').get().count;
    const logCount = db.prepare('SELECT COUNT(*) as count FROM users_log').get().count;
    
    return {
        rooms: roomCount,
        messages: messageCount,
        logs: logCount,
        dbPath: DB_PATH
    };
}

/**
 * データベースを最適化
 */
export function optimizeDatabase() {
    db.pragma('optimize');
    db.pragma('vacuum');
    console.log('🔧 データベース最適化完了');
}

// ========================================
// トランザクション
// ========================================

/**
 * トランザクション実行
 */
export function transaction(fn) {
    const txn = db.transaction(fn);
    return txn;
}

// ========================================
// 初期化
// ========================================

// データベース初期化を実行
initDatabase();

// プロセス終了時にデータベースをクローズ
process.on('exit', () => {
    db.close();
    console.log('📊 データベース接続をクローズしました');
});

process.on('SIGINT', () => {
    db.close();
    console.log('📊 データベース接続をクローズしました');
    process.exit(0);
});

// データベース接続をエクスポート（直接操作が必要な場合）
export default db;
