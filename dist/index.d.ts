interface PlaybackOptions {
    loop?: boolean;
    rateVariation?: number;
    volumeVariation?: number;
    volumeMax?: number;
    exclusive?: boolean;
}
export default class MultiChannelPlayer {
    private samples;
    private audioCtx;
    private numSpeakers;
    constructor(numSpeakers: number);
    loadSamples: (sources: Record<string, string>) => Promise<void>;
    play: (keySearch: string | string[], channel: number, options?: PlaybackOptions) => void;
    getSampleKeys: () => string[];
    private playSample;
    getIsPlaying: (key: string) => boolean;
}
export {};
