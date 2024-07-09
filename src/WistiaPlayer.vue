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
qualitySelector(videojs);

export default defineComponent({
  name: "WistiaPlayer",

  data() {
    return {
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
          videojs(this.$refs.player, this.options);
        })
      });
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
    
    .video-js .vjs-big-play-button {
      border-radius: 0;
      border: none;
      background-color: rgba(84, 187, 255, 0.7);
      &:hover{
        background-color: rgba(161, 217, 255, 0.7);
      }
    }

    .video-js .vjs-control-bar {
      display: flex;
      visibility: visible;
      opacity: 1;
      transition: visibility 0.1s, opacity 0.1s;
      background-color: rgba(84, 187, 255, 0.7);
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

    .vjs-menu-button-popup .vjs-menu .vjs-menu-content {
      width: 6em;
      max-height: none
    }

    .vjs-menu-button-popup .vjs-menu {
      left: -1em;
    }
  }
</style>