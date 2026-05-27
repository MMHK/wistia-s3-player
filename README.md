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

## Installation

```bash
npm install wistia-s3-player
# or
yarn add wistia-s3-player
```

## Usage

### CDN

```html
<script src="https://unpkg.com/wistia-s3-player/dist/js/wistia-s3-player.min.js"></script>
<script>
  // Auto-initialize all .wistia_embed elements
  WistiaS3Player.init();

  // Or render a specific video
  WistiaS3Player.render('videoId');
</script>
```

### HTML Embed

```html
<div class="wistia_embed wistia_async_YOUR_VIDEO_ID"></div>
```

Then call `init()` to auto-mount all embeds.

### Module

```javascript
import WistiaS3Player from 'wistia-s3-player';

// Auto-initialize all .wistia_embed elements
WistiaS3Player.init();

// Or render a specific video
import { render } from 'wistia-s3-player';
render('YOUR_VIDEO_ID');
```

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
