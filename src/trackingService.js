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
    window.dataLayer = window.dataLayer || [];
    let lastPercent = 0;
    let lastTime = 0;

    const timerHandler = () => {
        const currentTime = player.currentTime();
        if (currentTime > lastTime) {
            window.dataLayer.push({
                event: "wistia_seconds_played",
                eventModel: {
                    event_category: "Video",
                    event_label: Name,
                    video_hashed_id: hashId,
                    value: Math.round(currentTime - lastTime),
                }
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
            window.dataLayer.push({
                event: "wistia_play",
                eventModel: {
                    event_category: "Video",
                    event_label: Name,
                    video_hashed_id: hashId,
                }
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
                        window.dataLayer.push({
                            event: `wistia_${percentWatched}_percent_played`,
                            eventModel: {
                                event_category: "Video",
                                event_label: Name,
                                video_hashed_id: hashId,
                            }
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
