import { SourceMap, BufferedSample, PlaybackConfig } from "./types";


export const getGainNodes = (
  numOutputChannels: number,
  ctx: AudioContext
): GainNode[] => {
  const g: GainNode[] = [];
  for (let i = 0; i < numOutputChannels; i++) {
    const node = ctx.createGain();
    node.channelCountMode = "explicit";
    node.channelCount = 1;
    node.channelInterpretation = "discrete";
    g.push(node);
  }
  return g;
};


export const createBufferedSamples = (
  sources: SourceMap,
  ctx: AudioContext,
  numOutputChannels: number
): BufferedSample[] =>
  Object.keys(sources).reduce<BufferedSample[]>(
    (result, key) => [
      ...result,
      {
        id: key,
        src: sources[key],
        bufferSourceNode: ctx.createBufferSource(),
        bufferData: null,
        outputChannels: getGainNodes(numOutputChannels, ctx),
        mix: ctx.createChannelMerger(numOutputChannels),
        isPlaying: false
      }
    ],
    []
  );

export const connectBuffer = (sample: BufferedSample, ctx: AudioContext) => {
  sample.outputChannels.forEach((g, index) => {
    sample.bufferSourceNode.connect(g);
    g.connect(sample.mix, 0, index);
  });

  sample.mix.connect(ctx.destination);
};

export const exclusiveOutputChannel = (
  ctx: AudioContext,
  outputChannels: GainNode[],
  target: number,
  maxVolume = 1,
  fadeInDuration = 0
) => {
  outputChannels.forEach((s, index) => {
    if (index === target) {
      if (fadeInDuration > 0) {
        // Fade in, so first set volume to 0...
        s.gain.setValueAtTime(0, ctx.currentTime);
        // ...then schedule maxVolume at currentTime plus fadeInDuration
        s.gain.exponentialRampToValueAtTime(
          maxVolume,
          ctx.currentTime + fadeInDuration
        );
      } else {
        // No fade; just set to maxVolume "immediately"
        s.gain.setValueAtTime(maxVolume, ctx.currentTime);
      }
    } else {
      s.gain.setValueAtTime(0, ctx.currentTime);
    }
  });
};

export const remap = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) => outMin + ((outMax - outMin) / (inMax - inMin)) * (value - inMin);
