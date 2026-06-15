# Chapters & Subtitles Support — Planning Doc

## Goal / Background

wistia-s3-player 目前支援 chapters（章節）透過 `markers.json`。Go 後端已新增 AI indexing 功能，會產生：
- `index-ai.json` — 含 `subtitles`（字幕陣列）、`summary`、`chapters`（章節陣列）
- `subtitles.vtt` — WebVTT 格式字幕檔

目標：
1. Chapters 資料來源改用 `index-ai.json`，不再使用 `markers.json`
2. 新增字幕支援 — 使用 video.js 內建 `<track>` 機制載入 `subtitles.vtt`

## Technical Approach

### 1. Chapters — 改用 index-ai.json

**現狀：**
- `httpService.fetchMarkers(hashId)` → 讀 `{hashId}/markers.json` → 回傳 `{markers: [{time, title}]}`
- `WistiaPlayer.vue` `loadedmetadata` → 呼叫 `fetchMarkers` → `player.chapters({markers})`

**改為：**
- `httpService.fetchIndexAI(hashId)` → 讀 `{hashId}/index-ai.json` → 回傳完整 JSON
- 從 `index-ai.json` 的 `chapters` 陣列 `[{start, end, title}]` 轉換為 chapters plugin 需要的 `[{time, title}]` 格式
- `time = chapter.start`（秒數）

**格式轉換：**
```json
// index-ai.json chapters:
[{"start": 0.0, "end": 45.0, "title": "Introduction"}]

// chapters plugin markers:
[{"time": 0.0, "title": "Introduction"}]
```

### 2. Subtitles — video.js addRemoteTextTrack

**方案：** 使用 video.js 的 `addRemoteTextTrack()` API

```js
// index-ai.json 可包含可選欄位:
// "language": "zh",
// "languageLabel": "中文"

const track = player.addRemoteTextTrack({
  kind: 'subtitles',
  src: `${MEDIA_ENDPOINT}/${hashId}/subtitles.vtt`,
  srclang: indexAI.language || 'en',
  label: indexAI.languageLabel || 'English',
  default: false,
}, false);
```

- 如果 `subtitles.vtt` 不存在（404），video.js 會安靜失敗，不影響播放
- 字幕選單會自動出現在 video.js control bar
- 用戶可在播放器選單切換字幕開/關

### 3. 修改位置

**Phase 1: wistia-s3-player (JS npm package)**
- `src/httpService.js` — 替換 fetchMarkers → fetchIndexAI
- `src/WistiaPlayer.vue` — 更新 chapters 資料來源 + 新增字幕 track

**Phase 2: wistia-s3 (Go web)**
- `web/package.json` — 更新 `wistia-s3-player` 版本號
- `yarn install` 更新依賴

## Task Breakdown

### Phase 1: wistia-s3-player

- [x] 1. 修改 `src/httpService.js`
  - 新增 `fetchIndexAI(hashId)` — 讀 `{hashId}/index-ai.json`
  - 刪除 `fetchMarkers(hashId)`
  - 新增 `getSubtitlesUrl(hashId)` — 回傳 `{hashId}/subtitles.vtt` URL

- [x] 2. 修改 `src/WistiaPlayer.vue`
  - `loadedmetadata` handler: 替換 `fetchMarkers` → `fetchIndexAI`
  - 從 `index-ai.json` 提取 `chapters` → 轉換為 `[{time: chapter.start, title}]` → 餵給 `player.chapters()`
  - 新增字幕載入：在 player ready 後，用 `addRemoteTextTrack()` 載入 `subtitles.vtt`
  - 錯誤處理：index-ai.json 不存在時靜默失敗（同目前 fetchMarkers 行為）

- [x] 3. Bump version in `package.json`（minor: 1.1.25 → 1.2.0）

- [x] 4. Build: `yarn build` 確認無錯誤

### Phase 2: wistia-s3 (Go web)

- [ ] 5. 更新 `web/package.json` 的 `wistia-s3-player` 版本

- [ ] 6. `yarn install` 更新依賴

- [ ] 7. `yarn build` 確認 Go web 建置成功

## Affected Files

| Project | File | Change |
|---------|------|--------|
| wistia-s3-player | `src/httpService.js` | fetchMarkers → fetchIndexAI, 新增 getSubtitlesUrl |
| wistia-s3-player | `src/WistiaPlayer.vue` | chapters 資料來源改用 index-ai.json, 新增字幕 track |
| wistia-s3-player | `package.json` | version bump |
| wistia-s3-player | `src/plugins/videojs-chapters.js` | **不變** — 已有完整功能 |
| wistia-s3 | `web/package.json` | 更新 wistia-s3-player 版本 |

## Testing Strategy

1. **JS 專案 dev server**: `yarn serve` → 開啟 demo page → 確認：
   - Chapters markers 顯示在 progress bar
   - Chapters button 出現並可選單導航
   - 字幕選單出現，可切換開/關
   - 沒有 index-ai.json 的影片不報錯（靜默失敗）
   - 沒有 subtitles.vtt 的影片不報錯

2. **Go web**: `yarn build` → 確認建置無錯誤

## Open Questions

- [x] srclang/label 從 index-ai.json 動態取得（`language`/`languageLabel` 欄位，fallback `en`/`English`）
- [x] 字幕預設關閉，用戶手動開啟
