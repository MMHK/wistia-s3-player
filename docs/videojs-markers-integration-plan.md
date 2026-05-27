# 视频章节标记集成计划

## 概述

在 Wistia S3 Player 中添加类似 YouTube 的章节标记功能，包括进度条上的标记点、悬停提示、点击跳转、以及章节导航菜单。

## 技术方案选择

### 调研结果

| 方案 | 说明 | 兼容性 | 推荐度 |
|------|------|--------|--------|
| `videojs-markers` (原版) | 最完整的插件，但最后更新于 2018 年，针对 Video.js v4-5 | 需修补兼容性问题 | 低 |
| `@video-js-plugins/videojs-ads-markers` | 社区 fork，仅 2 stars，需 React 依赖，针对 Video.js 7 | 不兼容 Vue 3 | 低 |
| Odysee 自定义实现 | 使用 Video.js 原生 chapters track + CSS clip-path | 可行，但代码耦合 React/Redux | 中 |
| **自定义 Vue 组件** | 基于 Video.js 8 插件模式，从零构建轻量级实现 | **完全兼容** | **高** |

### 决定：自定义 Vue 组件

理由：
- 项目使用 Vue 3 + Video.js 8，无现成完美匹配的插件
- 自定义实现零外部依赖，易维护
- 可完美匹配 Wistia 播放器视觉风格
- 遵循现有 `spriteThumbnails` 插件注册模式

---

## 功能需求

### 已确认的功能

- [x] **进度条标记** - 在进度条上显示章节标记点（竖线或圆点）
- [x] **悬停提示** - 鼠标悬停到标记时显示章节标题
- [x] **点击跳转** - 点击标记跳转到对应时间点
- [x] **章节导航菜单** - 控制栏中添加章节选择按钮（类似 YouTube 的 chapters 按钮）

### 不需要的功能

- ~~断点覆盖层 (breakOverlay)~~ - 播放到标记时在视频上显示覆盖文字

---

## 实施步骤

### Step 1: 创建远程 JSON 配置

#### JSON 文件结构

```json
{
  "markers": [
    { "time": 0, "title": "简介" },
    { "time": 45.0, "title": "主要内容" },
    { "time": 120.0, "title": "总结" }
  ]
}
```

#### 存储位置

存放在 S3 视频资源目录，与 `index.json` 同级：

```
s3://bucket/wistia-backup/media/{hashId}/
├── index.json
├── markers.json      ← 新增
├── video-720p.mp4
├── video-1080p.mp4
└── storyboard.jpg
```

#### 文件修改

- [ ] `src/httpService.js` - 新增 `fetchMarkers(hashId)` 方法

```js
fetchMarkers(hashId) {
  return fetch(`${BaseURL}/${hashId}/markers.json`)
    .then(res => res.ok ? res.json() : { markers: [] })
    .catch(() => ({ markers: [] }));
}
```

### Step 2: 创建章节标记插件

#### 新建文件

- [ ] `src/plugins/videojs-chapters.js` - Video.js 章节标记插件

#### 插件功能

1. **进度条标记渲染**
   - 在 `.vjs-progress-holder` 上动态添加 `.vjs-chapter-marker` 元素
   - 根据 `time / duration * 100` 计算 `left` 百分比位置
   - 样式与 Wistia 播放器蓝色主题一致

2. **悬停提示**
   - 鼠标悬停到标记时显示 tooltip
   - 使用 `::after` 伪元素或独立 DOM 节点
   - 显示章节标题

3. **点击跳转**
   - 点击标记时 `player.currentTime(marker.time)`
   - 阻止事件冒泡避免触发进度条点击

4. **章节导航按钮**
   - 继承 `videojs.getComponent('MenuButton')`
   - 在控制栏中添加章节选择按钮
   - 点击弹出章节列表，选择后跳转

#### 插件注册方式

```js
// src/plugins/videojs-chapters.js
import videojs from 'video.js';

export default function chaptersPlugin(options = {}) {
  const player = this;

  player.on('loadedmetadata', () => {
    const markers = options.markers || [];
    if (!markers.length) return;

    renderMarkers(player, markers);
    addChaptersButton(player, markers);
  });

  player.on('dispose', () => {
    removeMarkers(player);
    removeChaptersButton(player);
  });
}

videojs.registerPlugin('chapters', chaptersPlugin);
```

### Step 3: 集成到 WistiaPlayer.vue

#### 文件修改

- [ ] `src/WistiaPlayer.vue`

##### 导入和注册

```js
import chaptersPlugin from './plugins/videojs-chapters';
videojs.registerPlugin('chapters', chaptersPlugin);
```

##### 数据状态

```js
data() {
  return {
    // ...existing
    chapterMarkers: [],  // 章节标记数据
  }
}
```

##### 获取标记数据

在 `loadedmetadata` 事件中获取 markers 并初始化插件：

```js
player.on('loadedmetadata', () => {
  // existing: spriteThumbnails init

  // new: chapters init
  this.fetchMarkers(this.id).then(data => {
    if (data.markers && data.markers.length) {
      this.chapterMarkers = data.markers;
      player.chapters({ markers: data.markers });
    }
  });
});
```

##### 控制栏添加章节按钮

```js
options() {
  return {
    controlBar: {
      children: [
        'playToggle',
        'currentTimeDisplay',
        'durationDisplay',
        'progressControl',
        { name: 'volumePanel', inline: false, vertical: true },
        'CustomQualitySelectorMenuButton',
        'CustomPlaybackRateMenuButton',
        'ChaptersMenuButton',    // ← 新增
        'fullscreenToggle',
      ],
    },
    // ...
  };
}
```

##### 清理

```js
beforeUnmount() {
  if (this.watcher) {
    this.watcher.stop();
  }
  // 插件会通过 player.dispose 自动清理
}
```

### Step 4: 样式定制

#### 文件修改

- [ ] `src/WistiaPlayer.vue` - `<style>` 块中添加章节标记样式

```scss
.video-player-wrap {
  // 进度条章节标记
  .vjs-progress-holder {
    .vjs-chapter-marker {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 3px;
      background-color: rgba(255, 255, 255, 0.8);
      cursor: pointer;
      z-index: 2;

      &:hover {
        background-color: #fff;
      }

      // 悬停提示
      &::after {
        content: attr(data-title);
        position: absolute;
        bottom: 100%;
        left: 50%;
        transform: translateX(-50%);
        padding: 4px 8px;
        background-color: rgba(0, 0, 0, 0.85);
        color: #fff;
        font-size: 12px;
        white-space: nowrap;
        border-radius: 3px;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.2s;
      }

      &:hover::after {
        opacity: 1;
      }
    }
  }

  // 章节导航菜单按钮
  .vjs-chapters-button {
    .vjs-menu {
      .vjs-menu-item {
        font-size: 1.4em;

        &:hover {
          background-color: rgba(0, 0, 0, 0.3);
        }

        &.vjs-selected {
          background-color: rgba(255, 255, 255, 0.3);
        }
      }
    }
  }
}
```

---

## 技术参考

### Odysee 实现方案参考

Odysee 使用 Video.js 原生 `chapters` text track 实现章节功能：

```js
// 添加章节 track
const textTrack = player.addRemoteTextTrack({ kind: 'chapters' }).track;

// 添加 cue points
textTrack.addCue(new window.VTTCue(start, end, label));

// 更新章节按钮
player.controlBar.chaptersButton.update();
```

**优势**: 使用 Video.js 原生支持，兼容性好
**劣势**: 需要额外的 WebVTT 文件或动态创建 cue

我们的实现将结合两种方式：
- 使用 VTTCue 实现章节菜单（兼容 Video.js 原生 chaptersButton）
- 使用自定义 DOM 实现进度条标记点（更灵活的样式控制）

---

## 涉及文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/httpService.js` | 修改 | 新增 `fetchMarkers()` 方法 |
| `src/plugins/videojs-chapters.js` | **新建** | 章节标记 Video.js 插件 |
| `src/WistiaPlayer.vue` | 修改 | 导入插件、获取数据、初始化、样式 |

---

## 远程 JSON 示例

### 完整示例

```json
{
  "markers": [
    { "time": 0, "title": "0:00 - 简介" },
    { "time": 15.5, "title": "0:15 - 安装步骤" },
    { "time": 45.0, "title": "0:45 - 配置说明" },
    { "time": 120.0, "title": "2:00 - 实战演示" },
    { "time": 300.0, "title": "5:00 - 总结" }
  ]
}
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `time` | number | 是 | 章节开始时间（秒），从 0 开始 |
| `title` | string | 是 | 章节标题，用于悬停提示和菜单显示 |

---

## 时间估算

| 步骤 | 预估时间 |
|------|----------|
| 创建 `fetchMarkers` API | 10 分钟 |
| 开发 `videojs-chapters.js` 插件 | 1-2 小时 |
| 集成到 `WistiaPlayer.vue` | 30 分钟 |
| 样式定制和调试 | 30-60 分钟 |
| **总计** | **约 2.5-4 小时** |
