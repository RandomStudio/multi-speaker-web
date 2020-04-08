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
  LINEAR
}

export interface PlaybackOptions {
  loop?: boolean;
  rateVariation?: number;
  volumeVariation?: number;
  volumeMax?: number;
  exclusive?: boolean;
}

export type SourceMap = Record<string, string>;
export type SampleMap = Record<string, BufferedSample>;
