export interface BufferedSample {
  src: string;
  bufferData: AudioBuffer | null;
  bufferSourceNode: AudioBufferSourceNode;
  speakers: GainNode[];
  mix: ChannelMergerNode;
  filter?: BiquadFilterNode;
  isPlaying: boolean;
}

export enum PanMode {
  EXCLUSIVE,
  LINEAR_PAIRS,
  LINEAR_WITH_SPREAD,
  POSITIONAL_2D
}

export interface PlaybackOptions {
  loop?: boolean;
  rateVariation?: number;
  volumeVariation?: number;
  volumeMax?: number;
  doNotInterrupt?: boolean;
}

export type SourceMap = Record<string, string>;
export type SampleMap = Record<string, BufferedSample>;
