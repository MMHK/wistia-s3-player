<template>
  <div class="video-player-wrap">
    <div v-if="loading" class="loading-spinner"></div>
    <video ref="player" v-if="!loading && sources.length" class="video-js"></video>
    <div v-if="hash_id_error" class="hash-error-mask">Media not found.</div>
  </div>
</template>

<script>
import videojs from 'video.js'
import 'video.js/dist/video-js.css'
import qualitySelector from "@silvermine/videojs-quality-selector"
import "@silvermine/videojs-quality-selector/dist/css/quality-selector.css"
import { defineComponent } from 'vue'
import httpService from "./httpService";
import trackingService from "./trackingService";
qualitySelector(videojs);

export default defineComponent({
  name: "WistiaPlayer",

  data() {
    return {
      watcher: null,
      loading: true,
      cover: "",
      sources: [],
      hash_id_error: false,
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
            'playbackRateMenuButton',
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
      }
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
            this.watcher = trackingService(player);
            const shadowPlayer = this.watcher.onReady();
            window.dispatchEvent(new CustomEvent("video-player-ready", {detail: shadowPlayer}));
            this.watcher.start();
          });

          player.on('error', function() {
                var errorDisplayElem = document.querySelector('.vjs-error-display .vjs-modal-dialog-content');
                if (errorDisplayElem) {
                    errorDisplayElem.innerText = "Media not found.";
                }
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
            this.sources = Array.from(res.sources)
              .map((row) => {
                if (row.label > 640 && row.label < 1080) {
                  row.selected = true;
                }
                return row;
              })
          })
          .catch((err)=>{
            return Promise.reject(err);
          })
          .finally(() => {
            this.loading = false;
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

    &:before {
      content: "";
      padding-top: 56%; 
    }


    .video-js {
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
    }

    .video-js:hover {
      .vjs-big-play-button {
        background-color: rgba(84, 187, 255, 0.7);
      }
    }


    .video-js .vjs-big-play-button {
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
          width: auto;
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
    }

    .video-js .vjs-duration {
      display: block;
    }

    .vjs-has-started.video-js {

      .vjs-duration {
        display: none;
      }

      .vjs-current-time{
        display: block;
      }
    }

    .video-js .vjs-play-progress {
      background-color: #fff;
    }

    .video-js .vjs-slider,
    .video-js .vjs-load-progress div {
      background: rgba(255, 255, 255, 0.5);
    }

    .video-js .vjs-play-control.vjs-ended .vjs-icon-placeholder:before {
      content: "\f101";
    }

    .vjs-menu-button-popup .vjs-menu {
      bottom: 0;
      right: 0;
      left: 0;
      margin-bottom: 4.4em;
    }

    .vjs-menu-button-popup .vjs-menu .vjs-menu-content {
      width: 13.6em;
      bottom: 0;
      left: -5.1em;
      max-height: none;
    }

    .vjs-quality-selector .vjs-menu .vjs-menu-content {
      left: -1.1em;
    }

    .vjs-playback-rate.vjs-control{
      width: 4.5em;
    }

    .vjs-quality-selector .vjs-menu,
    .vjs-playback-rate .vjs-menu{
      display: none;
      &:hover{
        display: block;
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
  }

  @media (max-width: 768px) {
    .video-player-wrap {
      .loading-spinner {
        font-size: 12px;
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
