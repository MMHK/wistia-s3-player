import { createApp } from 'vue'
import WistiaPlayer from './WistiaPlayer.vue'

const IS_DEV_SERVER = __VUE_PROD_DEVTOOLS__;

const init = () => {
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
}

const render = (videoId) => {
    const matches = document.querySelector(`.wistia_async_${videoId}`);
    if (matches) {
        const app = createApp(WistiaPlayer, {
            id: videoId,
        })
        app.mount(matches);
    }
}

export {render};

if (IS_DEV_SERVER) {
    init();
}

export default init;
