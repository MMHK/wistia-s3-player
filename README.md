# Wistia S3 Player

[![npm version](https://img.shields.io/npm/v/wistia-s3-player.svg)](https://www.npmjs.com/package/wistia-s3-player)
[![npm downloads](https://img.shields.io/npm/dm/wistia-s3-player.svg)](https://www.npmjs.com/package/wistia-s3-player)
[![License](https://img.shields.io/npm/l/wistia-s3-player.svg)](https://github.com/mmhk/wistia-s3-player/blob/main/LICENSE)
[![Build Status](https://img.shields.io/github/actions/workflow/status/mmhk/wistia-s3-player/publish.yml?branch=main)](https://github.com/mmhk/wistia-s3-player/actions)
[![Vue 3](https://img.shields.io/badge/Vue-3.x-brightgreen.svg)](https://vuejs.org/)
[![Video.js](https://img.shields.io/badge/Video.js-8.x-orange.svg)](https://videojs.com/)

A Video.js-based video player that mimics the [Wistia](https://wistia.com/) player UI. Built with Vue 3.

## Features

- 🎬 Wistia-style video player controls
- 🎨 Vue 3 Composition API
- 📦 Drop-in replacement for Wistia embeds
- 🎞️ Quality selector support
- 🖼️ Sprite thumbnails
- 📊 Built-in Google Analytics 4 (gtag) tracking
- 🎯 Video chapter markers with timeline indicators
- 💬 Subtitles toggle button with On/Off control
- 🔔 Custom event bindings for playback tracking
- ⏱️ Player control API for programmatic seeking and progress tracking

## Tracking & Events

The player includes a built-in `trackingService` that automatically tracks video playback events via Google Analytics 4 (gtag.js).

### Tracked Events

| Event Name | Triggered When |
|---|---|
| `wistia_play` | Video starts playing |
| `wistia_seconds_played` | Every 60 seconds of playback |
| `wistia_25_percent_played` | 25% watched |
| `wistia_50_percent_played` | 50% watched |
| `wistia_75_percent_played` | 75% watched |
| `wistia_95_percent_played` | 95% watched |

### Custom Event Binding

Listen to the `video-player-ready` event to bind custom callbacks:

```javascript
window.addEventListener("video-player-ready", (e) => {
  const watcher = e.detail;
  const hashId = watcher.getHashId();

  watcher.bind('play', () => {
    console.log('Video played:', hashId);
  });

  watcher.bind('end', () => {
    console.log('Video ended:', hashId);
  });

  watcher.bind('percentwatchedchanged', (percent, lastPercent) => {
    console.log(`Progress: ${percent}%`);
  });
});
```

### Available Events

| Event | Callback Parameters | Description |
|---|---|---|
| `play` | None | Video starts playing |
| `end` | None | Video playback ended |
| `percentwatchedchanged` | `(percent, lastPercent)` | Watched percentage changed (integer 0-100) |
| `timeupdate` | `(currentTime, duration)` | Current playback time changed (in seconds) |

### Player Control API

The `shadowPlayer` object provides methods to control playback:

```javascript
window.addEventListener("video-player-ready", (e) => {
  const player = e.detail;
  
  // Get video ID
  const hashId = player.getHashId();
  
  // Seek to specific time (in seconds)
  player.seek(30.5);
  
  // Bind events
  player.bind('timeupdate', (currentTime, duration) => {
    console.log(`Current: ${currentTime}s / ${duration}s`);
  });
});
```

#### Methods

| Method | Parameters | Description |
|---|---|---|
| `getHashId()` | None | Returns the video hash ID |
| `bind(eventName, callback)` | `eventName`: Event name, `callback`: Callback function | Binds a callback to a player event |
| `seek(seconds)` | `seconds`: Time in seconds | Seeks to the specified time |

### Restore Playback Progress

Example: Save and restore playback progress using localStorage:

```javascript
window.addEventListener("video-player-ready", (e) => {
  const player = e.detail;
  const videoId = player.getHashId();
  const storageKey = `video-progress-${videoId}`;
  
  // Restore progress
  const savedTime = localStorage.getItem(storageKey);
  if (savedTime) {
    player.seek(parseFloat(savedTime));
  }
  
  // Save progress (throttled to avoid excessive writes)
  let lastSavedTime = 0;
  player.bind('timeupdate', (currentTime) => {
    // Only save every 5 seconds to avoid excessive localStorage writes
    if (Math.abs(currentTime - lastSavedTime) >= 5) {
      localStorage.setItem(storageKey, currentTime.toString());
      lastSavedTime = currentTime;
    }
  });
});
```

**Note**: The `timeupdate` event fires frequently. Consider throttling localStorage writes to avoid performance issues.

### Configure GA4 Measurement ID

Pass the `MeasurementId` prop when embedding:

```html
<div class="wistia_embed wistia_async_YOUR_VIDEO_ID" data-measurement-id="G-XXXXXXX"></div>
```

## Chapter Markers

The player automatically fetches and renders chapter markers from `markers.json` stored alongside the video assets on S3.

### Markers Format

Place a `markers.json` file in the same directory as your video assets:

```json
{
  "markers": [
    { "time": 0, "title": "Introduction" },
    { "time": 30, "title": "Getting Started" },
    { "time": 120, "title": "Advanced Features" }
  ]
}
```

### Features

- Visual markers on the progress bar with hover tooltips
- Click any marker to seek to that timestamp
- Chapters menu button in the control bar for navigation
- Auto-fetched on video load from `{baseURL}/{hashId}/markers.json`

### Custom Endpoint

Override the default S3 endpoint:

```javascript
window.MEDIA_ENDPOINT = 'https://your-cdn.com/wistia-backup/media';
```

## Subtitles

The player includes a subtitles toggle button (CC) in the control bar.

### Features

- CC button appears only when subtitles are available
- Toggle subtitles On/Off via menu
- Subtitles loaded from `{baseURL}/{hashId}/subtitles.vtt`
- Language info fetched from `index-ai.json` (`language`, `languageLabel` fields)
- Subtitle track opacity set to 0.85 for better readability

### How It Works

1. Player fetches `index-ai.json` on video load
2. If `subtitles.vtt` exists, the CC button appears
3. User can toggle subtitles via the CC menu
4. If no subtitles available, the button remains hidden

## Development

```bash
# Install dependencies
yarn install

# Start dev server
yarn serve

# Production build
yarn build

# Build demo
yarn demo

# Release to npm (auto-version + build + publish)
yarn release
```

## Project Structure

```
src/
├── main.js              # Entry point (init & render exports)
├── WistiaPlayer.vue     # Main player component
├── httpService.js       # HTTP service
├── trackingService.js   # Analytics tracking
├── plugins/             # Video.js plugins
├── style/               # SCSS styles
└── webpack/             # Custom webpack plugins
```

## Requirements

- Supports IE 11+, modern browsers
- Built with Video.js 8.x and Vue 3.x

## License

[Apache-2.0](LICENSE)
