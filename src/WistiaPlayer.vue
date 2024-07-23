<template>
  <div class="video-player-wrap">
    <div v-if="loading" class="loading-spinner"></div>
    <video ref="player" v-if="!loading && sources.length" class="video-js"></video>
    <div v-if="hash_id_error" class="hash-error-mask">Media not found.</div>
  </div>
</template>

<script>
import videojs from 'video.js';
import 'video.js/dist/video-js.css';
import qualitySelector from "@silvermine/videojs-quality-selector";
import "@silvermine/videojs-quality-selector/dist/css/quality-selector.css";
import { defineComponent } from 'vue';
import httpService from "./httpService";
import trackingService from "./trackingService";
import spriteThumbnails from 'videojs-sprite-thumbnails';

qualitySelector(videojs);
videojs.registerPlugin('spriteThumbnails', spriteThumbnails);

const Button = videojs.getComponent('Button');

class CustomPlayPauseButton extends Button {
  constructor(player, options) {
    super(player, options);
    this.on('click', this.handleClick);
  }

  handleClick(event) {
    event.stopPropagation();
    const player = this.player();

    if (player.paused()) {
      player.play();
    } else {
      player.pause();
    }
  }

  buildCSSClass() {
    return `vjs-custom-play-pause-button ${super.buildCSSClass()}`;
  }
}


videojs.registerComponent('CustomPlayPauseButton', CustomPlayPauseButton);

export default defineComponent({
  name: "WistiaPlayer",

  data() {
    return {
      watcher: null,
      loading: true,
      cover: "",
      sources: [],
      hash_id_error: false,
      thumbnail_data: {},
      videoName: "",
    }
  },

  computed: {
    options() {
      return {
        controlBar: {
          children: [
            'playToggle',
            'currentTimeDisplay',
            'durationDisplay',
            'progressControl',
            {
              name: 'volumePanel',
              inline: false,
              vertical: true
            },
            'qualitySelector',
            'PlaybackRateMenuButton',
            'fullscreenToggle',
          ],
        },
        sources: this.sources,
        loop: false,
        fluid: true,
        preload: true,
        playsinline: true,
        controls: true,
        poster: this.cover,
        playbackRates: [2, 1.75, 1.5, 1.25, 1, 0.75, 0.5],
        userActions: {
          hotkeys: true
        }
      };
    },
  },

  props: {
    id: {
      type: String,
      required: true,
    },
  },

  mounted() {
    this.fetchAssets(this.id)
      .then(() => {
        this.$nextTick(() => {
          const player = videojs(this.$refs.player, this.options, () => {
            this.watcher = trackingService(player, this.id, this.videoName);
            const shadowPlayer = this.watcher.onReady();
            window.dispatchEvent(new CustomEvent("video-player-ready", {detail: shadowPlayer}));
            this.watcher.start();
          });

          // 恢复播放时间
          const savedTime = localStorage.getItem(`video-${this.id}-currentTime`);
          if (savedTime) {
            const formatTime = parseFloat(savedTime)
            if(formatTime > 10) {
              player.currentTime(formatTime);
              player.addClass('video-reload');
            }
          }

          player.on('error', function() {
            var errorDisplayElem = document.querySelector('.vjs-error-display .vjs-modal-dialog-content');
            if (errorDisplayElem) {
                errorDisplayElem.innerText = "Media not found.";
            }
          });

          player.on('loadedmetadata', () => {
            if(this.thumbnail_data.url){
              // 初始化视频缩略图插件
              const computed_interval = player.duration() / 200;
              new spriteThumbnails(player, {
                url: this.thumbnail_data.url,
                width: 200,
                height: 113,
                rows: 20,
                columns: 10,
                interval: computed_interval,
              });
            }
          });

          player.ready(() => {

            player.addChild('CustomPlayPauseButton', { className: 'custom-play-pause-btn vjs-play-control vjs-control vjs-button'});

            player.on('timeupdate', () => {
              localStorage.setItem(`video-${this.id}-currentTime`, player.currentTime());
            });

            player.on('ended', () => {
              localStorage.removeItem(`video-${this.id}-currentTime`);
              player.removeClass('video-reload');
            });

          });
        })
      })
      .catch((err)=>{
        // console.log(err)
        this.hash_id_error = true;
      })

  },

  beforeUnmount() {
    if (this.watcher) {
      this.watcher.stop();
    }
  },

  methods: {
    fetchAssets(hashId) {
      this.loading = true;
      return httpService.fetchAssets(hashId)
          .then(res => {
            this.cover = res.cover;
            this.videoName = res.name;
            this.sources = Array.from(res.sources)
              .map((row) => {
                if (row.label > 640 && row.label < 1080) {
                  row.selected = true;
                }
                return row;
              })
              .sort((a, b) => {
                return a.label - b.label;
              });

            this.thumbnail_data = res.thumbnail;
          })
          .catch((err)=>{
            return Promise.reject(err);
          })
          .finally(() => {
            this.loading = false;
          });
    },

    //处理视频播放出错
    tryPlay(player) {
      player.play().catch((error) => {
        console.log(error);
      });
    },
  }
});
</script>

<style lang="scss">
  .video-player-wrap {
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
    background-color: rgba(0,0,0,0.9);

    &:before {
      content: "";
      padding-top: 56%;
    }

    button,
    .vjs-menu-item {
      &:focus {
        outline: none;
        border: none;
      }
    }

    .video-js {
      background-color: transparent;

      &.vjs-device-ipad {
       .vjs-control-bar {
        opacity: 1;
       }

       .custom-play-pause-btn {
        display: none;
        top:0;
        left: 0;
        width: 100%;
        height: calc(100% - 4.4em);
        transform: translate(0, 0) scale(1);
       }
      }

      &.vjs-device-ipad,
      &.vjs-device-iphone{
        .vjs-volume-panel {
          display: none;
        }
      }

      &.vjs-has-started.vjs-device-ipad {
        .custom-play-pause-btn {
          display: block;
        }
      }

      //切换画质
      .vjs-waiting {
        .vjs-big-play-button,
        .vjs-duration {
          display: none;
        }

        .vjs-current-time {
          display: block;
        }
      }

    }

    .video-js:hover {
      .vjs-big-play-button {
        background-color: rgba(84, 187, 255, 0.7);
      }
    }

	.video-js .vjs-tech:focus {
      outline: none;
    }
    .vjs-tech {
      &:focus-visible {
        outline: none;
      }
    }

    .video-js .vjs-big-play-button {
      z-index: 9;
      width: 2.5em;
      font-size: 5.6em;
      border-radius: 0;
      border: none;
      margin: 0;
      transform: translate(-50%, -50%);
      background-color: rgba(84, 187, 255, 0.7);
      &:hover{
        background-color: rgba(161, 217, 255, 0.7);
      }

      .vjs-icon-placeholder {
        display: block;
        width: 100%;
        height: 100%;

        &:before {
          width: 100%;
          height: auto;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      }
    }

    .video-js .vjs-control-bar {
      display: flex;
      height: 4.4em;
      visibility: visible;
      opacity: 1;
      transition: visibility 0.1s, opacity 0.1s;
      background-color: rgba(84, 187, 255, 0.7);
      vertical-align: middle;
      z-index: 9;

      .vjs-button{
        &:hover {
          background-color: rgba(0, 0, 0, .2);
        }
      }
    }

    .video-js .vjs-duration {
      display: block;
    }

    .vjs-has-started.video-js,
    .video-reload.video-js {

      .vjs-duration {
        display: none;
      }

      .vjs-current-time{
        display: block;
      }
    }

    //进度条
    .video-js .vjs-play-progress {
      background-color: #fff;
    }

    .vjs-progress-control .vjs-play-progress .vjs-time-tooltip {
        display: none;
    }

    .video-js .vjs-slider,
    .video-js .vjs-load-progress div {
      background: rgba(255, 255, 255, 0.5);
    }

    .video-js .vjs-progress-control .vjs-mouse-display {
      background-color: #fff;
    }

    //缩略图样式
    .vjs-mouse-display .vjs-time-tooltip {
      display: flex !important;
      justify-content: center;
      align-items: flex-end;
      border: none !important;

      &:before {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 40px;
          height: 25px;
          border-radius: 3px;
          background-color: #000;
          opacity: 0.7;
          transform: translateX(-50%);
          z-index: -1;
          border: none;
      }
    }

    .video-js .vjs-play-control.vjs-ended .vjs-icon-placeholder:before {
      content: "\f101";
    }

    //音量
    .vjs-volume-panel.vjs-control.vjs-volume-panel-vertical {
      &.vjs-hover {
        .vjs-volume-control.vjs-volume-vertical {
          left: -4em;
        }
      }

    }
    .video-js .vjs-volume-panel .vjs-volume-control.vjs-volume-vertical {
      width: 4em;
      z-index: 9;
      margin-left: 0;
    }

    .vjs-menu-button-popup {

      .vjs-menu {
        bottom: 0;
        right: 0;
        left: 0;
        margin-bottom: 4.4em;
      }

      &.vjs-hover {
        .vjs-menu {
          display: none;
        }
      }
    }

    .vjs-menu-button-popup .vjs-menu .vjs-menu-content {
      width: 13.1em;
      left: -4em;
      bottom: 0;
      max-height: none;
    }

    .vjs-quality-selector .vjs-menu .vjs-menu-content {
      left: 0;
    }

    .vjs-playback-rate.vjs-control{
      width: 5.1em;

      .vjs-menu-button {
        padding: 0;
      }
    }

    .vjs-menu li.vjs-menu-item{

      &:hover {
        background-color: rgba(0, 0, 0, 0.3);
      }
    }

    .vjs-button > .vjs-icon-placeholder:before {
      font-size: 2.8em;
      line-height: 1.67;
    }

    .vjs-duration-display,
    .video-js .vjs-playback-rate-value,
    .vjs-current-time-display {
      font-size: 2em;
      line-height: 2.4em;
    }

    .vjs-menu-item {
      font-size: 1.6em;
      line-height: 1.8em;
    }

    .loading-spinner {
      font-size: 20px;
      width: 3em;
      height: 3em;
      border: 0.4em solid #f3f3f3;
      border-top: 0.4em solid #54bbff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% {
        transform: rotate(0deg);
      }
      100% {
        transform: rotate(360deg);
      }
    }

    .hash-error-mask {
      box-sizing: border-box;
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 1;
      background: rgba(0, 0, 0, 0.8);
      background: linear-gradient(180deg, rgba(0, 0, 0, 0.8), rgba(255, 255, 255, 0));
      overflow: auto;
      padding: 20px 24px;
      color: #fff;
      margin: 0;
      font-size: 14px;
      line-height: 1.5;
      text-align: center;
    }

    .custom-play-pause-btn{
      opacity: 0;
      position: absolute;
      top: 50%;
      left: 50%;
      width: 5em;
      height: 5em;
      transform: translate(-50%, -50%) scale(0.8);
    }

    .vjs-touch-enabled.vjs-waiting .vjs-custom-play-pause-button,
    .vjs-waiting .vjs-custom-play-pause-button,
    .vjs-custom-play-pause-button {
      display: none;
    }

    .vjs-touch-enabled {
      .vjs-custom-play-pause-button {
        display: inline-block;
      }
    }
  }

  @media (max-width: 768px) {
    .video-player-wrap {
      .loading-spinner {
        font-size: 12px;
      }

      .video-js {

        &.vjs-playing {
          .custom-play-pause-btn .vjs-icon-placeholder::before{
            content: "\f103";
          }
        }

        &.vjs-paused {
          .custom-play-pause-btn .vjs-icon-placeholder::before{
            content: "\f101";
          }

          .custom-play-pause-btn {
            transform: translate(-50%, -50%) scale(0.9);
          }
        }
      }

      .vjs-has-started {
        .custom-play-pause-btn{
          opacity: 1;
          position: absolute;
          top: 50%;
          left: 50%;
          width: 5em;
          height: 5em;
          transform: translate(-50%, -50%) scale(0.8);
          font-size: 1.6em;
          background: rgba(0, 0, 0, 0.6);
          border: 0px;
          border-radius: 50%;
          cursor: pointer;
          margin: 0px;
          padding: 0px;
          pointer-events: auto;
          outline: none;
          transition: opacity 200ms ease 0s, transform 600ms ease 0s;
          -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
        }

        .custom-play-pause-btn .vjs-icon-placeholder {
          position: relative;
          width: 100%;
          height: 100%;
        }

        .custom-play-pause-btn .vjs-icon-placeholder::before {
          position: absolute;
          top: 50%;
          left: 50%;
          height: auto;
          transform: translate(-50%, -50%);
        }

      }
      .vjs-user-inactive {
        .custom-play-pause-btn {
          opacity: 0;
          visibility: visible;
          pointer-events: none;
          transition: visibility 1s, opacity 1s;
        }

        &.vjs-paused {
          .custom-play-pause-btn {
            opacity: 1;
          }
        }
      }
    }
  }
 @media screen and (max-width: 1248px) {
    .video-player-wrap {
      .video-js .vjs-big-play-button{
        width: 12.980769230769232vw;
        height: 8.333333333333332vw;
        font-size: 7.211538461538461vw;
      }
    }
  }
  @media screen and (max-width: 960px) {
    .video-player-wrap {
      .video-js .vjs-big-play-button{
        width: 2.23em;
        height: 1.43em;
        font-size: 5.6em;
      }
    }
  }
  @media screen and (max-width: 640px) {
    .video-player-wrap {
      .video-js .vjs-big-play-button{
        width: 19.53125vw;
        height: 12.5vw;
        font-size: 8.75vw;
      }
    }

  }
</style>
