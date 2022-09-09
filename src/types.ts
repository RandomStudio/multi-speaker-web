export interface BufferedSample {
  id: string;
  src: string;
  bufferData: AudioBuffer | null;
  bufferSourceNode: AudioBufferSourceNode;
  outputChannels: GainNode[];
  mix: ChannelMergerNode;
  filter?: BiquadFilterNode;
  isPlaying: boolean;
}

export interface PlaybackOptions {
  loop?: boolean;
  rate?: number;
  volumeVariation?: number;
  volume?: number;
  exclusive?: boolean;
  fadeInDuration?: number;
}

export type SourceMap = Record<string, string>;
