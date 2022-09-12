export interface PlaybackConfig {
  loop: boolean;
  rate: number;
  volume: number;
  exclusive: boolean;
  fadeInDuration: number;
  fadeOutDuration: number;
}

export interface ChannelPanningConfig {
  index: number;
  volume?: number;
}

export type PlaybackOptions = Partial<PlaybackConfig>;

export type SourceMap = Record<string, string>;
