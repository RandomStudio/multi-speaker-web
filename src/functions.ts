import { SourceMap, BufferedSample, PlaybackOptions } from "./types";

export const createBufferedSamples = (
  sources: SourceMap,
  ctx: AudioContext,
  numOutputChannels: number
): BufferedSample[] =>
  Object.keys(sources).reduce<BufferedSample[]>(
    (result, key) => ([
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
    ]),
    []
  );

  export const getGainNodes = (numOutputChannels: number, ctx: AudioContext): GainNode[] => {
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
  maxVolume = 1
) => {
  outputChannels.forEach((s, index) => {
    if (index === target) {
      s.gain.setValueAtTime(maxVolume, ctx.currentTime);
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

export const applyDefaults = (original?: PlaybackOptions): PlaybackOptions => {
  const defaults: PlaybackOptions = {
    loop: false,
    rate: 1,
    volume: 1,
    exclusive: false
  };

  if (original === undefined) {
    return defaults;
  } else {
    const result = original;
    Object.keys(original).forEach(key => {
      result[key] = original[key] === undefined ? defaults[key] : original[key];
    });
    return result;
  }
};
