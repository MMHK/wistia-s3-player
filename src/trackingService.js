/**
 *
 * @param {import("video.js").Player} player
 * @returns {{stop(): void, start(): void, onReady(): {bind(*=, *): void}}|{bind(*=, *): void}}
 * @constructor
 */
const CreateWatcher = (player) => {
    let handler = {};
    const mappings = {
        play: "play",
        end: "ended",
        percentwatchedchanged: "timeupdate"
    };

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
        },
        stop() {
            Object.keys(handler).forEach((eventName) => {
                const realEventName = mappings[eventName];
                if (realEventName) {
                    player.off(realEventName, handler[eventName]);
                }
            })
        }
    }
};

export default CreateWatcher;
