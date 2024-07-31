import { createApp } from 'vue'
import WistiaPlayer from './WistiaPlayer.vue'

const IS_DEV_SERVER = __VUE_PROD_DEVTOOLS__;

const init = (GA_ID = undefined) => {
    document.querySelectorAll(".wistia_embed").forEach((el) => {
        const matches = el.className.match(/wistia_async_([^_\ ]+)/i);
        if (matches) {
            const id = matches[1];
            const app = createApp(WistiaPlayer, {
                id,
                MeasurementId: GA_ID,
            })
            app.mount(el);
        }
    })
}

const render = (videoId, GA_ID = undefined) => {
    const matches = document.querySelector(`.wistia_async_${videoId}`);
    if (matches) {
        const app = createApp(WistiaPlayer, {
            id: videoId,
            MeasurementId: GA_ID,
        })
        app.mount(matches);
    }
}

export {render};

if (IS_DEV_SERVER) {
    init();
}

export default init;
