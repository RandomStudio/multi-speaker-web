import { remap } from "./utils";

/**
 * Given a target speaker index (round number) will play sound only on that speaker.
 * Index will be rounded if not a whole number.
 * @param target Speaker index to play on; should be a whole number, but will be rounded if not
 * @param speakersCount How many speakers to use in panning
 * @param maxVolume Maximum volume that will be allowed
 */
export const exclusiveSpeakerPanner = (
  target: number,
  speakersCount: number,
  maxVolume = 1
): number[] => {
  if (target > speakersCount) {
    throw Error(`target index ${target} exceeds speaker count ${speakersCount}`);
  }
  let levels = Array(speakersCount).fill(0);
  return levels.map((level, index) => (index === Math.round(target) ? maxVolume : 0));
};

export const linearPairsPanner = (
  speakersCount: number,
  target: number,
  maxVolume = 1
): number[] => {
  if (target > speakersCount) {
    throw Error(`target index ${target} exceeds speaker count ${speakersCount}`);
  }
  let levels = Array(speakersCount).fill(0);

  const pairIndex = {
    left: Math.floor(target),
    right: Math.ceil(target)
  };
  const relativePan = target - pairIndex.left;

  return levels
    .map((level, index) => {
      if (index === pairIndex.left) {
        return 1 - relativePan;
      } else if (index === pairIndex.right) {
        return relativePan;
      } else {
        return 0;
      }
    })
    .map(level => remap(level, 0, 1, 0, maxVolume));
};
