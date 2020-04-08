import { exclusiveSpeakerPanner } from ".";

describe("panning algorithms", () => {
  describe("exlusive speaker panning", () => {
    test("2 speakers; position 0", () => {
      const target = 0;
      const speakerCount = 2;
      const levels = exclusiveSpeakerPanner(target, speakerCount);
      expect(levels).toHaveLength(2);
    });
  });
});
