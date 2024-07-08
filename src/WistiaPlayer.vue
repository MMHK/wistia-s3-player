<template>
  <div class="video-player-wrap">
    <video-player v-if="!loading"
        :sources="sources"
        :poster="cover"
        :responsive="false"
        :fluid="true"
        :plugins="plugins"
        controls
        :loop="false"
        :volume="0.6"
    />
  </div>
</template>

<script>
import qualityLevels from "videojs-contrib-quality-levels"
import hlsQualitySelector from "jb-videojs-hls-quality-selector"
import { defineComponent } from 'vue'
import { VideoPlayer } from '@videojs-player/vue'
import 'video.js/dist/video-js.css'
import httpService from "./httpService";


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
    plugins() {
      return {
        qualityLevels: qualityLevels,
        hlsQualitySelector: hlsQualitySelector,
      }
    },
  },

  props: {
    id: {
      type: String,
      required: true,
    },
  },

  components: {
    VideoPlayer,
  },

  mounted() {
    this.fetchAssets(this.id);
  },

  methods: {
    fetchAssets(hashId) {
      this.loading = true;
      return httpService.fetchAssets(hashId)
          .then(res => {
            this.cover = res.cover;
            this.sources = res.sources;
          })
          .finally(() => {
            this.loading = false;
          });
    },
  }
});
</script>
