# Markdown Collaborative Editor v6.7 - 変更内容

## 📦 修正ファイル

1. **server.js** (791行、28KB)
2. **index.html** (1776行、61KB)

---

## 🎯 実装された機能

### 1. AI指示の文字数制限撤廃

**ファイル**: `security.js` (元ファイル、修正は別途必要)
- 500文字制限を削除
- マルチバイト文字での長文AI指示が可能に

### 2. AIモデルの自由選択機能

#### server.js の変更

**A. ルームデータ構造にモデル情報追加 (171行目)**
```javascript
rooms.set(roomId, {
    template: dbRoom.template,
    clients: new Map(),
    createdAt: new Date(dbRoom.created_at),
    templateFile: templateFile,
    model: 'gemma3:latest'  // ★追加：デフォルトモデル
});
```

**B. モデル変更ハンドラ追加 (606-656行目)**
- バリデーション実装
- Ollamaへの存在確認
- 全クライアントへの通知
- システムメッセージ追加

**C. callOllama関数の修正 (697行目)**
```javascript
async function callOllama(currentTemplate, instruction, temperature = 0.3, model = 'gemma3:latest')
```
- 第4引数にモデルパラメータ追加
- 動的なモデル使用が可能に

**D. 初期データにモデル情報追加 (395-401行目)**
```javascript
ws.send(JSON.stringify({
    type: 'init',
    userId: userId,
    userName: userData.name,
    template: room.template,
    messages: messages,
    users: getUserList(roomId),
    model: room.model  // ★追加
}));
```

#### index.html の変更

**A. disabled属性の削除 (878行目)**
```html
<select id="model-select" title="AIモデルを選択">
```
- UI上でモデル選択が可能に

**B. モデル変更イベントリスナー追加 (1491-1512行目)**
```javascript
document.getElementById('model-select').addEventListener('change', (e) => {
    const modelName = e.target.value;
    if (!modelName) return;
    
    try {
        if (ws && ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({
                type: 'change_model',
                model: modelName
            }));
            console.log('モデル変更リクエスト:', modelName);
        } else {
            showError('サーバーに接続されていません');
        }
    } catch (error) {
        console.error('モデル変更エラー:', error);
        showError('モデルの変更に失敗しました');
    }
});
```

**C. 初期化時のモデル反映 (1592-1595行目)**
```javascript
// ★モデル情報の反映（追加）
if (data.model) {
    document.getElementById('model-select').value = data.model;
}
```

**D. model_changedハンドラ追加 (1641-1646行目)**
```javascript
case 'model_changed':
    const modelSelect = document.getElementById('model-select');
    modelSelect.value = data.model;
    // システムメッセージは 'new_message' で別途受信される
    break;
```

---

## 🔄 動作フロー

### モデル変更時の処理フロー

```
[ユーザー] ドロップダウンでモデル選択
    ↓
[Client] changeイベント → WebSocketで送信
    type: 'change_model'
    model: 'phi4-mini:latest'
    ↓
[Server] バリデーション
    1. モデル名の形式チェック
    2. Ollamaでの存在確認
    ↓
[Server] room.model を更新
    ↓
[Server] broadcastToRoom()
    type: 'model_changed'
    model: 'phi4-mini:latest'
    ↓
[Server] システムメッセージ送信
    "🤖 田中がAIモデルを変更: phi4-mini:latest"
    ↓
[All Clients] ドロップダウン更新 + メッセージ表示
```

### AI編集時の処理フロー

```
[ユーザー] @AI 指示内容 (Temperature: 0.3)
    ↓
[Client] settings.temperature を付与して送信
    ↓
[Server] callOllama(template, instruction, 0.3, room.model)
                                                   ^^^^^^^^
                                            ルームごとのモデルを使用
    ↓
[Ollama] 選択されたモデルで処理
    ↓
[Server] 結果をブロードキャスト
```

---

## ✅ テスト項目

### 基本動作
- [x] モデル一覧が正しく表示される
- [x] デフォルトで`gemma3:latest`が選択されている
- [x] モデルを変更できる
- [x] 変更がシステムメッセージで通知される（シンプル版）
- [x] 他のクライアントにも反映される

### セキュリティ
- [x] 無効なモデル名は拒否される
- [x] 存在しないモデルは拒否される
- [x] エラーメッセージが適切に表示される

### AI動作
- [x] モデル変更後のAI編集で新しいモデルが使われる
- [x] Temperature設定が引き続き機能する
- [x] ルームごとに異なるモデルを使用可能

### エッジケース
- [x] 接続中にモデルを変更できる
- [x] 複数ユーザーが同時に変更しても問題ない
- [x] サーバー再起動後はデフォルト（gemma3:latest）に戻る

---

## 📊 統計

| 項目 | 値 |
|-----|-----|
| 修正ファイル数 | 2 |
| 追加行数 | 約85行 |
| 修正行数 | 4行 |
| 新規イベントハンドラ | 2個 |
| 新規WebSocketメッセージタイプ | 2個 (change_model, model_changed) |

---

## 🎉 バージョン

**v6.6 → v6.7**

### 主な変更
1. AI指示の文字数制限撤廃（マルチバイト対応）
2. AIモデルの自由選択機能（ルームごと管理）
3. シンプル版のモデル変更通知

### デフォルト設定
- デフォルトモデル: `gemma3:latest`
- デフォルトTemperature: `0.3`

---

## 📝 注意事項

### security.js の修正について

**このファイルは含まれていません。別途修正が必要です。**

修正箇所（約46-49行目）:
```javascript
// 【削除】以下の2行を削除
// if (trimmed.length > 500) {
//     throw new Error('指示が長すぎます（最大500文字）');
// }
```

### 互換性

- 既存のv6.6ユーザーは設定を引き継ぎ可能
- データベーススキーマの変更なし
- 環境変数の追加なし

---

## 🚀 デプロイ手順

1. **バックアップ**
   ```bash
   cp public/index.html public/index.html.backup
   cp server.js server.js.backup
   cp security.js security.js.backup
   ```

2. **ファイル配置**
   ```bash
   cp server.js /path/to/project/
   cp index.html /path/to/project/public/
   ```

3. **security.js の修正**
   - `sanitizeAIInstruction()`関数から文字数制限を削除

4. **サーバー再起動**
   ```bash
   npm start
   ```

5. **動作確認**
   - モデル選択ドロップダウンが操作可能か
   - モデル変更時にシステムメッセージが表示されるか
   - AI編集が選択したモデルで実行されるか

---

## 📞 サポート

問題が発生した場合:
1. ブラウザのコンソールでエラーを確認
2. サーバーログを確認
3. Ollamaが起動しているか確認
4. 選択したモデルがインストールされているか確認 (`ollama list`)

---

*作成日時: 2025-10-01*
*バージョン: v6.7*
