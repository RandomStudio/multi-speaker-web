import { PlaybackConfig } from "./types";

export const defaults: PlaybackConfig = {
  loop: false,
  rate: 1,
  volume: 1,
  exclusive: true,
  fadeInDuration: 0,
  fadeOutDuration: 0
};

// Necessary because WebAudio API will not accept actual 0 as target volume for exponential ramp fade
export const NONZERO_SILENCE = 0.01;
