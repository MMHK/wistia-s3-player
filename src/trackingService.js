const storagePush = (key, data) => {
    if (localStorage) {
        localStorage.setItem(key, JSON.stringify(data))
    }
}
const storagePull = (key, defaultValue = null) => {
    if (localStorage) {
        return JSON.parse(localStorage.getItem(key)) || defaultValue;
    }
    return null
}

const gtagInstalled = () => {
    if (window.gtag instanceof Function) {
        return true;
    }

    if (window.dataLayer) {
        const loaded = Array.from(window.dataLayer).find((item) => {
            return item.hasOwnProperty('event') && item.event === 'gtm.load';
        });

        return !!(loaded);
    }

    return false;
}

const installGtag = (TAG_ID) => {
    const script = document.querySelector('script[src*=gtag]');
    if (!script) {
        const script = document.createElement('script');
        script.src = `//www.googletagmanager.com/gtag/js?id=${TAG_ID}`;
        script.async = true;
        document.head.appendChild(script);
    }
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
        window.gtag = function () {window.dataLayer.push(arguments);}
        gtag('js', new Date());
        gtag('config', TAG_ID);
    }
}

const autoConfigGtag = (TAG_ID) => {
    if (!gtagInstalled()) {
        installGtag(TAG_ID);
    }
}


const sendCustomEvent = (eventName, eventParams) => {
    const hasGtag = typeof gtag === 'function';
    const hasDataLayer = typeof dataLayer !== 'undefined' && dataLayer.hasOwnProperty("push");

    const withPagePath = {
        ...eventParams,
        page_title: eventParams.page_title || document.title,
        page_location: eventParams.page_location || location.href,
    };

    // console.log(hasGtag, hasDataLayer);

    if (hasGtag) {
        // 使用 gtag 发送事件
        gtag('event', eventName, withPagePath);
    } else if (hasDataLayer) {
        // 使用 dataLayer 发送事件
        dataLayer.push({
            'event': eventName,
            ...withPagePath
        });
    } else {
        console.warn('Neither gtag nor dataLayer is available.');
    }
}

/**
 *
 * @param {string} hashId
 * @param {string} Name
 * @param {import("video.js").Player} player
 * @returns {{play(): void, end(): void, percentwatchedchanged(percentWatched: number, lastPercent: number): void}}
 * @constructor
 */
const dataLayerHandler = (hashId, Name, player) => {
    const storageKey = `wistia-video-progress-${hashId}`;
    let timerId = 0;
    let lastPercent = 0;
    let lastTime = 0;

    const timerHandler = () => {
        const currentTime = player.currentTime();
        if (currentTime > lastTime) {
            sendCustomEvent("wistia_seconds_played", {
                event_category: "Video",
                event_label: Name,
                video_hashed_id: hashId,
                value: Math.round(currentTime - lastTime),
            });

            lastTime = currentTime;
        }
    };

    return {
        destroy() {
            clearInterval(timerId);
        },
        ended() {
            clearInterval(timerId);
            timerHandler();
            timerId = 0;
        },
        play() {
            sendCustomEvent("wistia_play", {
                event_category: "Video",
                event_label: Name,
                video_hashed_id: hashId,
            });
            const oriData = storagePull(storageKey,{lastTime:0});
            // console.log(lastTime, oriData);
            if (lastTime > oriData.lastTime) {
                timerHandler();
            }

            if (!timerId) {
                timerId = setInterval(timerHandler, 60000);
            }
        },
        timeupdate() {
            let dataExist = storagePull(storageKey,{lastPercent:0, lastTime:0});
            const currentTime = player.currentTime();
            const duration = player.duration();
            let percentWatched = Math.floor((currentTime / duration) * 100);
            if (percentWatched % 5 == 0
                && percentWatched != lastPercent) {
                lastPercent = percentWatched;

                // console.log(percentWatched)

                if ([25, 50, 75, 95].includes(percentWatched)) {
                    if (percentWatched > dataExist.lastPercent) {
                        sendCustomEvent(`wistia_${percentWatched}_percent_played`, {
                            event_category: "Video",
                            event_label: Name,
                            video_hashed_id: hashId,
                        });
                    }
                    dataExist.lastPercent = percentWatched;
                }
            }
            storagePush(storageKey, {
                ...dataExist,
                lastTime: currentTime,
            })
        }
    }
}


/**
 *
 * @param {import("video.js").Player} player
 * @param {string} hashId
 * @param {string} Name
 * @returns {{stop(): void, start(): void, onReady(): {bind(*=, *): void}}|{bind(*=, *): void}}
 * @constructor
 */
const CreateWatcher = (player, hashId, Name) => {
    let handler = {};
    const mappings = {
        play: "play",
        end: "ended",
        percentwatchedchanged: "timeupdate"
    };

    const dataLayoutHandler = dataLayerHandler(hashId, Name, player);

    return {
        configGtag(TAG_ID) {
                autoConfigGtag(TAG_ID);
        },
        onReady() {
            return {
                bind(eventName, callback) {
                    if (Object.keys(mappings).includes(eventName)) {
                        handler[eventName] = callback;
                    }
                }
            }
        },
        start() {
            let lastPercent = 0;
            Object.keys(handler).forEach((eventName) => {
                const realEventName = mappings[eventName];
                if (realEventName) {
                    if (realEventName === 'timeupdate') {
                        player.on('timeupdate', (e) => {
                            const currentTime = player.currentTime();
                            const duration = player.duration();
                            let percentWatched = (currentTime / duration) * 100;

                            // Round to the nearest whole number
                            percentWatched = Math.floor(percentWatched);

                            // Check if the percent watched has changed
                            if (percentWatched !== lastPercent) {
                                lastPercent = percentWatched;
                                // Trigger a custom event or call a function
                                handler[eventName](percentWatched, lastPercent);
                            }
                        })

                        return;
                    }

                    player.on(realEventName, (e) => {
                        handler[eventName]();
                    });
                }
            })
            Object.keys(dataLayoutHandler).forEach((eventName) => {
                player.on(eventName, dataLayoutHandler[eventName]);
            })
        },
        stop() {
            Object.keys(handler).forEach((eventName) => {
                const realEventName = mappings[eventName];
                if (realEventName) {
                    player.off(realEventName, handler[eventName]);
                }
            })
            Object.keys(dataLayoutHandler).forEach((eventName) => {
                player.off(eventName, dataLayoutHandler[eventName]);
            })
            if (dataLayoutHandler['destroy']) {
                dataLayoutHandler['destroy']();
            }
        }
    }
};

export default CreateWatcher;
