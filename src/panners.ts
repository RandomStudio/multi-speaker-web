import { remap } from "./utils";

/**
 * Given a target speaker index (round number) will play sound only on that speaker.
 * Index will be rounded if not a whole number.
 * @param target Speaker index to play on; should be a whole number, but will be rounded if not
 * @param speakerCount How many speakers to use in panning
 * @param maxVolume Maximum volume that will be allowed
 */
export const exclusiveSpeakerPanner = (
  target: number,
  speakerCount: number,
  maxVolume = 1
): number[] => {
  if (target > speakerCount) {
    throw Error(`target index ${target} exceeds speaker count ${speakerCount}`);
  }
  let levels = Array(speakerCount).fill(0);
  return levels.map((level, index) => (index === Math.round(target) ? maxVolume : 0));
};

/**
 * Given a target position between 0 (first speaker) and speakersCount (i.e. last speaker),
 * pan volume on the nearest pair of speakers to this position. If a whole number, sound will
 * only come from speaker corresponding to that index (i.e. same as exlusiveSpeakerPanner).
 * @param target Position, between 0 and last speaker index
 * @param speakerCount How many speakers to use in panning
 * @param maxVolume Maximum volume that will be allowed
 */
export const linearPairsPanner = (
  target: number,
  speakerCount: number,
  maxVolume = 1
): number[] => {
  if (target > speakerCount) {
    throw Error(`target index ${target} exceeds speaker count ${speakerCount}`);
  }
  let levels = Array(speakerCount).fill(0);

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
