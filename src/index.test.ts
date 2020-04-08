import { exclusiveSpeakerPanner, linearPairsPanner } from "./panners";

describe("panning algorithms", () => {
  describe("exlusive speaker panning", () => {
    test("2 speakers; position 0 (full left)", () => {
      const target = 0;
      const speakerCount = 2;
      const levels = exclusiveSpeakerPanner(target, speakerCount);

      expect(levels).toHaveLength(speakerCount);
      expect(levels[0]).toEqual(1.0);
      expect(levels[1]).toEqual(0);
    });
    test("2 speakers; position 1 (full right)", () => {
      const target = 1;
      const speakerCount = 2;
      const levels = exclusiveSpeakerPanner(target, speakerCount);

      expect(levels).toHaveLength(speakerCount);
      expect(levels[0]).toEqual(0);
      expect(levels[1]).toEqual(1.0);
    });
    test("2 speakers; position 0.3 (round to 0)", () => {
      const target = 0.3;
      const speakerCount = 2;
      const levels = exclusiveSpeakerPanner(target, speakerCount);

      expect(levels).toHaveLength(speakerCount);
      expect(levels[0]).toEqual(1.0);
      expect(levels[1]).toEqual(0);
    });
    test("3 speakers; position 2 (full on index 2)", () => {
      const target = 2;
      const speakerCount = 3;
      const levels = exclusiveSpeakerPanner(target, speakerCount);

      expect(levels).toHaveLength(speakerCount);
      expect(levels[0]).toEqual(0);
      expect(levels[1]).toEqual(0);
      expect(levels[2]).toEqual(1);
    });
    test("4 speakers; position 1 (full on index 1)", () => {
      const target = 1;
      const speakerCount = 4;
      const levels = exclusiveSpeakerPanner(target, speakerCount);

      expect(levels).toHaveLength(speakerCount);
      expect(levels[0]).toEqual(0);
      expect(levels[1]).toEqual(1);
      expect(levels[2]).toEqual(0);
      expect(levels[3]).toEqual(0);
    });
    test("4 speakers; position 5 throws error", () => {
      const target = 5;
      const speakerCount = 4;
      expect(() => {
        const levels = exclusiveSpeakerPanner(target, speakerCount);
      }).toThrow();
    });
    test("3 speakers; position 2 (full on index 2), volume lowered", () => {
      const target = 2;
      const speakerCount = 3;
      const maxVolume = 0.6;
      const levels = exclusiveSpeakerPanner(target, speakerCount, maxVolume);

      expect(levels).toHaveLength(speakerCount);
      expect(levels[0]).toEqual(0);
      expect(levels[1]).toEqual(0);
      expect(levels[2]).toEqual(maxVolume);
    });
  });

  describe("linear pairs panning", () => {
    test("4 speakers; position 1 plays exclusively on speaker #1", () => {
      const target = 1.0;
      const speakerCount = 4;
      const levels = linearPairsPanner(target, speakerCount);

      expect(levels).toHaveLength(speakerCount);
      expect(levels[0]).toEqual(0);
      expect(levels[1]).toEqual(1.0);
      expect(levels[2]).toEqual(0);
      expect(levels[3]).toEqual(0);
    });
    test("4 speakers; position 1.5 plays exactly half on speakers #1, #2", () => {
      const target = 1.5;
      const speakerCount = 4;
      const levels = linearPairsPanner(target, speakerCount);

      expect(levels).toHaveLength(speakerCount);
      expect(levels[0]).toBeCloseTo(0);
      expect(levels[1]).toBeCloseTo(0.5);
      expect(levels[2]).toBeCloseTo(0.5);
      expect(levels[3]).toBeCloseTo(0);
    });
    test("4 speakers; position 0.75 plays proportionally between speakers #0, #1", () => {
      const target = 0.75;
      const speakerCount = 4;
      const levels = linearPairsPanner(target, speakerCount);

      expect(levels).toHaveLength(speakerCount);
      expect(levels[0]).toBeCloseTo(0.25);
      expect(levels[1]).toBeCloseTo(0.75);
      expect(levels[2]).toBeCloseTo(0);
      expect(levels[3]).toBeCloseTo(0);
    });
    test("3 speakers; position 1.9 plays mostly on speaker #2", () => {
      const target = 1.9;
      const speakerCount = 3;
      const levels = linearPairsPanner(target, speakerCount);

      expect(levels).toHaveLength(speakerCount);
      expect(levels[0]).toBeCloseTo(0);
      expect(levels[1]).toBeCloseTo(0.1);
      expect(levels[2]).toBeCloseTo(0.9);
    });
    test("3 speakers; position 1.9 plays mostly on speaker #2, but at quarter volume", () => {
      const target = 1.9;
      const speakerCount = 3;
      const maxVolume = 0.25;
      const levels = linearPairsPanner(target, speakerCount, maxVolume);

      expect(levels).toHaveLength(speakerCount);
      expect(levels[0]).toBeCloseTo(0);
      expect(levels[1]).toBeCloseTo(0.1 * 0.25);
      expect(levels[2]).toBeCloseTo(0.9 * 0.25);
    });
  });
});