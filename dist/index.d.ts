export default class MultiChannelPlayer {
    private samples;
    private audioCtx;
    private numSpeakers;
    constructor(numSpeakers: number);
    loadSamples: (sources: Record<string, string>) => Promise<void>;
    play: (key: string, channel: number, loop?: boolean, rateVariation?: number, volumeVariation?: number, volumeMax?: number, exclusive?: boolean) => void;
    getIsPlaying: (key: string) => boolean;
}
