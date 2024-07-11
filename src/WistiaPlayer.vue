<template>
  <div class="video-player-wrap">
    <video ref="player" v-if="!loading" class="video-js"></video>
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
        })
      });
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
  }
  @media screen and (max-width: 1448px) {
    .video-player-wrap {
      .video-js .vjs-big-play-button{
        width: d-vw(162px);
        height: d-vw(104px);
        font-size: d-vw(90px);
      }
    }
  }
  @media screen and (max-width: 960px) {
    .video-player-wrap {
      .video-js .vjs-big-play-button{
        width: 125px;
        height: 80px;
        font-size: 56px;
      }
    }
  }
  @media screen and (max-width: 640px) {
    .video-player-wrap {
      .video-js .vjs-big-play-button{
        width: m-vw(125px);
        height: m-vw(80px);
        font-size:m-vw(56px);
      }
    }

  }
</style>
