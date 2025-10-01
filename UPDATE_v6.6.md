# Markdown協調編集システム v6.6 アップデート

## 🎯 概要

v6.6では**AI Temperature設定機能**の追加と**UIの改善**を実施しました。ユーザーはAIの創造性レベルを自由に調整できるようになり、より柔軟なMarkdown編集が可能になりました。

## 📝 主な変更内容

### 1. 🤖 AI Temperature設定機能（新機能）

#### 実装内容
AI編集時の「創造性」や「一貫性」を制御するTemperature設定機能を追加しました。

#### Temperature値とは？
- **低い値（0.0-0.5）**: 一貫性のある、予測可能な応答
- **中間値（0.5-1.0）**: バランスの取れた応答
- **高い値（1.0-2.0）**: 創造的で多様な応答

#### UI実装
```
🤖 AI設定
├── プリセット選択
│   ├── 正確 (0.1) - 最も一貫性のある応答
│   ├── バランス (0.3) - デフォルト ★新規
│   ├── 標準 (0.7) - 一般的な編集
│   ├── 創造的 (1.2) - より多様な応答
│   └── カスタム - 手動調整
└── カスタムスライダー（0.0-2.0）
```

#### デフォルト値の変更
- **v6.5まで**: 0.1（非常に保守的）
- **v6.6から**: 0.3（バランス重視）

**変更理由:**
1. 0.1では応答が硬直的すぎる
2. 0.3は適度な柔軟性を持ちつつ安定
3. テンプレート編集により適している

### 2. 🍔 ハンバーガーメニューの位置変更

#### 変更前（v6.5）
```
ヘッダー: [接続] [ルーム] [名前] ... [コントロール] [ダウンロード] [☰ 設定]
                                                                    ↑
                                                                  右端に配置
```

#### 変更後（v6.6）
```
ヘッダー: [☰ 設定] [接続] [ルーム] [名前] ... [コントロール] [ダウンロード]
           ↑
         左端に配置
```

**変更理由:**
1. 多くのWebアプリケーションで採用される標準的なUIパターン
2. 左から右への自然な視線移動
3. モバイルでの操作性向上

### 3. 🔧 技術的な実装詳細

#### フロントエンド（index.html）の変更

**設定管理の拡張:**
```javascript
const DEFAULT_SETTINGS = {
    // 既存の設定
    chatPosition: 'right',
    chatWidth: 450,
    theme: 'light',
    fontSize: 14,
    markdownView: 'edit',
    autoScroll: true,
    // 新規追加
    aiTemperature: 0.3,  // デフォルト値
    aiPreset: 'balance'  // 選択されたプリセット
};
```

**WebSocket通信の拡張:**
```javascript
// AI編集リクエスト時にtemperature値を送信
ws.send(JSON.stringify({
    type: 'message',
    text: '@AI 指示内容',
    settings: {
        temperature: userSettings.aiTemperature
    }
}));
```

#### バックエンド（server.js）の変更

**Temperature値のバリデーション:**
```javascript
function validateTemperature(temp) {
    if (temp === undefined || temp === null) {
        return 0.3; // デフォルト値
    }
    
    const num = parseFloat(temp);
    if (isNaN(num)) return 0.3;
    if (num < 0) return 0;
    if (num > 2) return 2;
    
    return Math.round(num * 10) / 10;
}
```

**Ollama APIへの適用:**
```javascript
async function callOllama(currentTemplate, instruction, temperature = 0.3) {
    const validatedTemp = validateTemperature(temperature);
    
    const response = await fetch(`${OLLAMA_HOST}/api/generate`, {
        // ...
        body: JSON.stringify({
            model: CURRENT_MODEL,
            prompt: promptText,
            stream: false,
            options: {
                temperature: validatedTemp,  // 動的なtemperature値
                num_predict: 800
            }
        })
    });
}
```

### 4. 📊 パフォーマンスへの影響

| 項目 | v6.5 | v6.6 | 変化 |
|------|------|------|------|
| 起動時間 | 1.5秒 | 1.5秒 | 変化なし |
| メモリ使用量 | 48MB | 49MB | +1MB |
| WebSocket通信量 | 標準 | 標準+4byte | 微増 |
| AI処理時間 | Temperature依存 | Temperature依存 | 変化なし |

**結論:** パフォーマンスへの影響はほぼありません。

### 5. 🎨 UIの改善点

#### 設定メニューの構成変更

**メニュー項目の順序:**
1. 🤖 AI設定（新規・最上位）
2. 📐 チャット位置
3. 📏 チャット幅
4. 📝 Markdown表示
5. 🎨 テーマ
6. 📖 フォントサイズ
7. ⚙️ その他

**理由:** 最も頻繁に調整される可能性のある設定を上位に配置

#### レスポンシブ対応の強化

**モバイル（< 768px）:**
- ハンバーガーメニューは左端に固定
- Temperature設定は縦並びレイアウト
- スライダーは全幅表示

## 🔄 アップグレード手順

### 新規インストールの場合

```bash
# 依存関係のインストール
npm install

# Ollamaモデルのインストール
ollama pull gemma3:latest
ollama pull phi4-mini:latest

# サーバー起動
npm start
```

### 既存プロジェクト（v6.5）からのアップグレード

#### ステップ1: ファイルのバックアップ

```bash
# 重要なファイルをバックアップ
cp public/index.html public/index_v65.html.backup
cp server.js server_v65.js.backup
cp package.json package_v65.json.backup
```

#### ステップ2: ファイルの更新

以下のファイルを新しいバージョンに置き換え：
- ✅ `public/index.html` - Temperature設定UI追加、ハンバーガーメニュー位置変更
- ✅ `server.js` - Temperature処理追加
- ✅ `package.json` - バージョン更新
- ✅ `README.md` - ドキュメント更新

#### ステップ3: サーバーを再起動

```bash
# Node.jsサーバーを再起動
npm start
```

#### ステップ4: ブラウザキャッシュのクリア

新しいUIを適用するため、以下の方法でキャッシュをクリア：
- **Chrome/Edge**: Ctrl+Shift+Delete → キャッシュをクリア
- **Firefox**: Ctrl+Shift+Delete → キャッシュをクリア
- **Safari**: Cmd+Option+E

### 既存設定の移行

v6.5の設定は自動的に移行されます。新しいTemperature設定はデフォルト値（0.3）が適用されます。

```javascript
// 自動マイグレーション
if (!userSettings.aiTemperature) {
    userSettings.aiTemperature = 0.3;
    userSettings.aiPreset = 'balance';
}
```

## 💡 使用例

### Temperature設定の実践例

#### 例1: 日付の変更（正確な編集）
```
Temperature: 0.1
指示: @AI 訪問日時を2025年1月15日14時30分に変更

結果: 指示通り正確に変更
```

#### 例2: 文章の改善（標準的な編集）
```
Temperature: 0.7
指示: @AI 申し送り事項をより詳しく記載

結果: 適度なバリエーションで文章を拡張
```

#### 例3: 新しいセクションの追加（創造的な編集）
```
Temperature: 1.2
指示: @AI 今後の改善点セクションを追加

結果: 創造的で多様な提案を含むセクション追加
```

### 推奨設定

| 作業内容 | 推奨Temperature | 理由 |
|---------|----------------|------|
| フォーマット変更 | 0.1 | 厳密な変更が必要 |
| 日付・名前の編集 | 0.3 | 安定性と柔軟性のバランス |
| 文章の言い換え | 0.7 | 自然な表現のバリエーション |
| アイデア生成 | 1.2以上 | 創造的な提案が必要 |
| 実験的な使用 | 1.5-2.0 | 予測不可能な応答を楽しむ |

## 🐛 既知の問題と制限事項

### 制限事項

1. **Temperature値の即時反映**
   - 設定変更は次回のAI編集から適用
   - 実行中のAI処理には影響しない

2. **モデル依存性**
   - Temperature値の効果はモデルによって異なる
   - 一部のモデルでは効果が限定的な場合がある

3. **極端な値での動作**
   - 0.0: 完全に決定論的（同じ応答の繰り返し）
   - 2.0: 非常に予測困難（文脈を無視する可能性）

### 既知のバグ

現時点で重大なバグは報告されていません。

## 📈 今後の予定

### v6.7（予定）

- [ ] Temperature設定のプリセットカスタマイズ機能
- [ ] AI編集履歴の保存と取り消し機能
- [ ] Temperature値の推奨表示機能
- [ ] モデルごとの最適Temperature値の自動設定

### v7.0（予定）

- [ ] ユーザーごとのデフォルト設定プロファイル
- [ ] チームでの設定共有機能
- [ ] AI編集のA/Bテスト機能

## 🎉 まとめ

### v6.6の改善点

1. ✅ **AI Temperature設定** - AIの創造性を自由に調整
2. ✅ **デフォルト値の最適化** - 0.1→0.3でより実用的に
3. ✅ **UIの標準化** - ハンバーガーメニューを左端に移動
4. ✅ **設定の永続化** - Temperature設定も自動保存

### アップグレードを推奨する理由

1. **柔軟なAI編集** - 用途に応じた最適な応答
2. **使いやすさの向上** - 直感的な設定UI
3. **下位互換性** - 既存機能はすべて維持
4. **パフォーマンス** - 処理速度への影響なし

---

*リリース日: 2025年10月2日*
*バージョン: 6.6*
*開発時間: 約8時間*
*変更ファイル: 4ファイル（index.html, server.js, package.json, README.md）*
*新規コード: 約200行*
