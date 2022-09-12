import BufferedSample from "./BufferedSample";
import { NONZERO_SILENCE } from "./config";

export const createGainNodes = (
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

export const playWithExclusiveOutputChannel = (
  ctx: AudioContext,
  outputChannels: GainNode[],
  target: number,
  maxVolume = 1,
  fadeInDuration = 0
) => {
  outputChannels.forEach((gainNode, index) => {
    if (index === target) {
      if (fadeInDuration > 0) {
        console.log(
          "Fade in over",
          fadeInDuration,
          "ms to volume",
          maxVolume.toFixed(2),
          "..."
        );
        // Fade in, so first set volume to 0...
        gainNode.gain.setValueAtTime(NONZERO_SILENCE, ctx.currentTime);
        // ...then schedule maxVolume at currentTime plus fadeInDuration
        gainNode.gain.exponentialRampToValueAtTime(
          1.0,
          ctx.currentTime + fadeInDuration / 1000
        );
      } else {
        // No fade; just set to maxVolume "immediately"
        gainNode.gain.setValueAtTime(maxVolume, ctx.currentTime);
      }
    } else {
      // Every other output channel: set to zero volume
      // console.log("set outputChannel", index, "to zero volume");
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
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
