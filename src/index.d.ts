declare function init(GA_ID?: string): void;

declare function render(videoId: string, GA_ID?: string): void;

export { render };

export default init;

interface ShadowPlayer {
    getHashId(): string;
    bind(
        eventName: 'play' | 'end' | 'percentwatchedchanged' | 'timeupdate',
        callback: (...args: any[]) => void
    ): void;
    seek(seconds: number): void;
}

declare global {
    interface Window {
        WistiaS3Player: {
            init: typeof init;
            render: typeof render;
        };
    }
}
