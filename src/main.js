import { createApp } from 'vue'
import WistiaPlayer from './WistiaPlayer.vue'
document.querySelectorAll(".wistia_embed").forEach((el) => {
    const matches = el.className.match(/wistia_async_([^_\ ]+)/i);
    if (matches) {
        const id = matches[1];
        const app = createApp(WistiaPlayer, {
            id,
        })
        app.mount(el);
    }
})
