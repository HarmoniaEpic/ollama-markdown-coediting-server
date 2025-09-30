/**
 * security.js - セキュリティモジュール
 * 
 * このモジュールは、アプリケーションのセキュリティを強化するための
 * バリデーション関数とサニタイゼーション関数を提供します。
 * 
 * 主な機能:
 * - パストラバーサル攻撃の防止
 * - XSS攻撃の防止
 * - インジェクション攻撃の防止
 * - 入力値の検証とサニタイズ
 */

/**
 * ルーム名のバリデーション
 * 
 * ルーム名は以下の条件を満たす必要があります:
 * - 1-50文字
 * - 英数字、ハイフン、アンダースコアのみ
 * - SQLインジェクション対策
 * 
 * @param {string} roomName - 検証するルーム名
 * @returns {boolean} - 有効な場合true、無効な場合false
 */
export function validateRoomName(roomName) {
    if (!roomName || typeof roomName !== 'string') {
        return false;
    }
    
    // 長さチェック
    if (roomName.length < 1 || roomName.length > 50) {
        return false;
    }
    
    // 許可された文字のみ（英数字、ハイフン、アンダースコア）
    const regex = /^[a-zA-Z0-9_-]+$/;
    return regex.test(roomName);
}

/**
 * ユーザー名のバリデーション
 * 
 * ユーザー名は以下の条件を満たす必要があります:
 * - 1-20文字
 * - XSS攻撃を防ぐため危険な文字を除外
 * 
 * @param {string} userName - 検証するユーザー名
 * @returns {boolean} - 有効な場合true、無効な場合false
 */
export function validateUserName(userName) {
    if (!userName || typeof userName !== 'string') {
        return false;
    }
    
    // 長さチェック
    if (userName.length < 1 || userName.length > 20) {
        return false;
    }
    
    // XSS対策：危険な文字を除外
    const dangerousChars = ['<', '>', '"', "'", '`', '\\', '/', '{', '}', '[', ']'];
    for (const char of dangerousChars) {
        if (userName.includes(char)) {
            return false;
        }
    }
    
    return true;
}

/**
 * ファイル名のバリデーション
 * 
 * パストラバーサル攻撃を防ぐための厳格なファイル名検証
 * 
 * 許可される条件:
 * - .mdファイルのみ
 * - 1-100文字
 * - パストラバーサル文字列を含まない
 * - 英数字、ハイフン、アンダースコア、ドットのみ
 * 
 * @param {string} filename - 検証するファイル名
 * @returns {boolean} - 有効な場合true、無効な場合false
 */
export function validateFilename(filename) {
    if (!filename || typeof filename !== 'string') {
        return false;
    }
    
    // 長さチェック
    if (filename.length < 1 || filename.length > 100) {
        return false;
    }
    
    // パストラバーサル攻撃を防ぐ
    const dangerousPatterns = [
        '..',      // ディレクトリトラバーサル
        '/',       // パス区切り文字（Unix）
        '\\',      // パス区切り文字（Windows）
        '\0',      // ヌル文字
        '\n',      // 改行
        '\r'       // キャリッジリターン
    ];
    
    for (const pattern of dangerousPatterns) {
        if (filename.includes(pattern)) {
            return false;
        }
    }
    
    // .mdファイルのみ許可
    if (!filename.endsWith('.md')) {
        return false;
    }
    
    // 英数字、ハイフン、アンダースコア、ドットのみ
    const regex = /^[a-zA-Z0-9_.-]+$/;
    return regex.test(filename);
}

/**
 * ファイル名のサニタイズ
 * 
 * 危険な文字を削除して安全なファイル名を生成
 * 
 * @param {string} filename - サニタイズするファイル名
 * @returns {string} - サニタイズされたファイル名
 */
export function sanitizeFilename(filename) {
    if (!filename || typeof filename !== 'string') {
        return 'untitled.md';
    }
    
    // 危険な文字を削除
    let sanitized = filename.replace(/[^a-zA-Z0-9_.-]/g, '');
    
    // 空文字列になった場合はデフォルト値
    if (sanitized.length === 0) {
        return 'untitled.md';
    }
    
    // .mdで終わっていない場合は追加
    if (!sanitized.endsWith('.md')) {
        sanitized += '.md';
    }
    
    return sanitized;
}

/**
 * Ollamaモデル名のバリデーション
 * 
 * モデル名の形式を検証（例: gemma3:latest, llama2:7b）
 * 
 * @param {string} modelName - 検証するモデル名
 * @returns {boolean} - 有効な場合true、無効な場合false
 */
export function validateModelName(modelName) {
    if (!modelName || typeof modelName !== 'string') {
        return false;
    }
    
    // 長さチェック
    if (modelName.length < 1 || modelName.length > 100) {
        return false;
    }
    
    // Ollamaのモデル名形式: name:tag
    // name: 英数字、ハイフン、アンダースコア
    // tag: 英数字、ハイフン、アンダースコア、ドット
    const regex = /^[a-zA-Z0-9_-]+:[a-zA-Z0-9_.-]+$/;
    return regex.test(modelName);
}

/**
 * AI指示のサニタイゼーション
 * 
 * プロンプトインジェクション攻撃を防ぐため、
 * AI指示を検証してサニタイズします。
 * 
 * @param {string} instruction - AI指示文字列
 * @returns {string} - サニタイズされた指示文字列
 * @throws {Error} - 無効な入力の場合
 */
export function sanitizeAIInstruction(instruction) {
    if (!instruction || typeof instruction !== 'string') {
        throw new Error('指示が無効です');
    }
    
    // トリミング
    const trimmed = instruction.trim();
    
    // 空文字列チェック
    if (trimmed.length === 0) {
        throw new Error('指示が空です');
    }
    
    // 長さ制限（プロンプトインジェクション対策）
    if (trimmed.length > 500) {
        throw new Error('指示が長すぎます（最大500文字）');
    }
    
    // 危険なパターンをチェック（システムプロンプト改変を防ぐ）
    const dangerousPatterns = [
        /ignore\s+previous\s+instructions/i,
        /ignore\s+all\s+previous/i,
        /disregard\s+previous/i,
        /forget\s+previous/i,
        /system:\s*you\s+are/i,
        /system\s+prompt/i,
        /<\|im_start\|>/i,
        /<\|im_end\|>/i
    ];
    
    for (const pattern of dangerousPatterns) {
        if (pattern.test(trimmed)) {
            throw new Error('指示に禁止されたパターンが含まれています');
        }
    }
    
    return trimmed;
}

/**
 * メッセージテキストのバリデーション
 * 
 * チャットメッセージの長さと内容を検証
 * 
 * @param {string} text - 検証するメッセージテキスト
 * @returns {boolean} - 有効な場合true、無効な場合false
 */
export function validateMessageText(text) {
    if (!text || typeof text !== 'string') {
        return false;
    }
    
    // トリミング後の長さチェック
    const trimmed = text.trim();
    if (trimmed.length < 1 || trimmed.length > 2000) {
        return false;
    }
    
    return true;
}

/**
 * URLパラメータのサニタイズ
 * 
 * URLパラメータから危険な文字を除去
 * 
 * @param {string} param - サニタイズするパラメータ
 * @returns {string} - サニタイズされたパラメータ
 */
export function sanitizeUrlParam(param) {
    if (!param || typeof param !== 'string') {
        return '';
    }
    
    // URLデコード
    let decoded = decodeURIComponent(param);
    
    // 危険な文字を削除
    decoded = decoded.replace(/[<>"'`\\]/g, '');
    
    // 制御文字を削除
    decoded = decoded.replace(/[\x00-\x1F\x7F]/g, '');
    
    return decoded.trim();
}

/**
 * セキュリティログの出力
 * 
 * セキュリティ関連のイベントをログに記録
 * 
 * @param {string} level - ログレベル（info, warn, error）
 * @param {string} message - ログメッセージ
 * @param {object} details - 詳細情報（オプション）
 */
export function securityLog(level, message, details = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
        timestamp,
        level,
        message,
        ...details
    };
    
    const prefix = {
        info: '🔒 [Security]',
        warn: '⚠️  [Security Warning]',
        error: '❌ [Security Error]'
    }[level] || '[Security]';
    
    console.log(`${prefix} ${message}`, details);
}

/**
 * IPアドレスのレート制限（簡易版）
 * 
 * 同一IPからの過剰なリクエストを制限
 * 
 * @param {string} ip - クライアントのIPアドレス
 * @param {number} limit - 制限回数（デフォルト: 100）
 * @param {number} window - 時間窓（ミリ秒、デフォルト: 60000 = 1分）
 * @returns {boolean} - 制限内の場合true、超過した場合false
 */
const rateLimitMap = new Map();

export function checkRateLimit(ip, limit = 100, window = 60000) {
    const now = Date.now();
    
    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + window });
        return true;
    }
    
    const record = rateLimitMap.get(ip);
    
    // ウィンドウをリセット
    if (now > record.resetAt) {
        rateLimitMap.set(ip, { count: 1, resetAt: now + window });
        return true;
    }
    
    // カウントを増加
    record.count++;
    
    // 制限チェック
    if (record.count > limit) {
        securityLog('warn', 'Rate limit exceeded', { ip, count: record.count });
        return false;
    }
    
    return true;
}

/**
 * 定期的にレート制限マップをクリーンアップ
 */
setInterval(() => {
    const now = Date.now();
    for (const [ip, record] of rateLimitMap.entries()) {
        if (now > record.resetAt) {
            rateLimitMap.delete(ip);
        }
    }
}, 60000); // 1分ごと
