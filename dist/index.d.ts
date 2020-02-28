export default class MultiChannelPlayer {
    private samples;
    private audioCtx;
    private numSpeakers;
    constructor(numSpeakers: number);
    loadSamples: (sources: Record<string, string>) => Promise<void>;
    play: (key: string, channel: number) => void;
}
