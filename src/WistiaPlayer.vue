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
            'progressControl',
            'volumePanel',
            'qualitySelector',
            'fullscreenToggle',
          ],
        },
        sources: this.sources,
        loop: false,
        fluid: true,
        preload: true,
        playsinline: true,
        controls: true,
        poster: this.cover
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
