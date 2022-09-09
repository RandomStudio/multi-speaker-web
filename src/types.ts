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

export interface PlaybackConfig {
  loop: boolean;
  rate: number;
  volume: number;
  exclusive: boolean;
  fadeInDuration: number;
}

export type PlaybackOptions = Partial<PlaybackConfig>;

export type SourceMap = Record<string, string>;
