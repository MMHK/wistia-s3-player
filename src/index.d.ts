declare function init(GA_ID?: string): void;

declare function render(videoId: string, GA_ID?: string): void;

export { render };

export default init;

declare global {
    interface Window {
        WistiaS3Player: {
            init: typeof init;
            render: typeof render;
        };
    }
}
