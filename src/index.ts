import { SampleMap, SourceMap, PlaybackOptions, BufferedSample, PanMode } from "./types";

export default class MultiChannelPlayer {
  private numSpeakers: number;
  private panMode: PanMode;
  private samples: SampleMap;
  private audioCtx: AudioContext;

  constructor(numSpeakers: number = 2, panMode: PanMode = PanMode.EXCLUSIVE) {
    this.numSpeakers = numSpeakers;
    this.panMode = panMode;
    this.audioCtx = new window.AudioContext();
    this.audioCtx.destination.channelInterpretation = "discrete";

    const maxChannelCount = this.audioCtx.destination.maxChannelCount;

    this.numSpeakers = this.audioCtx.destination.maxChannelCount > 2 ? numSpeakers : 2;
    this.audioCtx.destination.channelCount = maxChannelCount;

    console.log(
      "requested",
      numSpeakers,
      "speakers; got",
      this.audioCtx.destination.channelCount,
      "channels for output"
    );

    this.samples = {};
  }

  public loadSamples = async (sources: SourceMap): Promise<void> => {
    this.samples = createBufferedSamples(sources, this.audioCtx, this.numSpeakers);

    const requests = Object.keys(this.samples).map(
      async key =>
        new Promise((resolve, reject) => {
          const sample = this.samples[key];
          console.log("load sample for", sample.src);
          if (sample) {
            const request = new XMLHttpRequest();

            request.onload = () => {
              // console.log("got file");
              const audioData = request.response;
              // console.log("response", request.response);
              this.audioCtx.decodeAudioData(audioData, buffer => {
                // console.log(`got audio buffer for sample "${key}"`);
                sample.bufferData = buffer;
                resolve();
              });
            };
            request.onerror = err => {
              reject(err);
            };

            request.open("GET", sample.src);
            request.responseType = "arraybuffer";
            request.send();

            console.log(request);
          }
        })
    );

    await Promise.all(requests)
      .then(() => {
        console.info("all samples loaded: ", Object.keys(this.samples));
      })
      .catch(err => {
        console.error("error loading samples:", err);
      });
  };

  public play = (keySearch: string | string[], position: number, options?: PlaybackOptions) => {
    if (Array.isArray(keySearch)) {
      const pick = Math.floor(Math.random() * keySearch.length);
      this.playSample(keySearch[pick], position, applyDefaults(options));
    } else {
      this.playSample(keySearch, position, applyDefaults(options));
    }
  };

  public getSampleKeys = () => Object.keys(this.samples);

  private playSample = (key: string, position: number, options: PlaybackOptions) => {
    const sample = this.samples[key];
    if (sample === undefined) {
      throw Error(
        `could not find sample with key "${key}" in sample bank ${Object.keys(this.samples)}`
      );
    }
    // console.log(`found sample "${key}", play on channel #${channel}`);

    if (sample.bufferData === null) {
      throw Error(`buffer not (yet?) loaded on call to play "${key}"`);
    }

    if (options.doNotInterrupt && sample.isPlaying) {
      console.warn(`doNotInterrupt option set; clip "${key}" already playing`);
    } else {
      sample.bufferSourceNode = this.audioCtx.createBufferSource();
      sample.bufferSourceNode.buffer = sample.bufferData;

      connectBuffer(sample, this.audioCtx);

      const volume = remap(
        1 - Math.random() * options.volumeVariation,
        0,
        1.0,
        0,
        options.volumeMax
      );
      const rate = 1 + Math.random() * options.rateVariation - options.rateVariation / 2;

      switch (this.panMode) {
        case PanMode.EXCLUSIVE:
          panner(
            this.audioCtx,
            sample.speakers,
            exclusiveSpeakerPanner(position, this.numSpeakers, volume)
          );
          break;
        case PanMode.LINEAR_PAIRS:
          // linearPairsPanner(this.audioCtx, sample.speakers, position, volume);
          break;
        default:
          console.error("unknown panMode:", this.panMode);
      }

      sample.bufferSourceNode.playbackRate.value = rate;
      sample.bufferSourceNode.loop = options.loop;

      sample.bufferSourceNode.start(0);
      sample.isPlaying = true;
      sample.bufferSourceNode.onended = () => {
        sample.isPlaying = false;
      };
    }
  };

  public getIsPlaying = (key: string): boolean => {
    const sample = this.samples[key];
    if (sample === undefined) {
      throw Error(
        `could not find sample with key "${key}" in sample bank ${Object.keys(this.samples)}`
      );
    }
    return sample.isPlaying;
  };
} // end class

const createBufferedSamples = (
  sources: SourceMap,
  ctx: AudioContext,
  numSpeakers: number
): SampleMap =>
  Object.keys(sources).reduce<SampleMap>(
    (result, key) => ({
      ...result,
      [key]: {
        src: sources[key],
        bufferSourceNode: ctx.createBufferSource(),
        bufferData: null,
        speakers: getGainNodes(numSpeakers, ctx),
        mix: ctx.createChannelMerger(numSpeakers),
        isPlaying: false
      }
    }),
    {}
  );

const getGainNodes = (numSpeakers: number, ctx: AudioContext): GainNode[] => {
  const g: GainNode[] = [];
  for (let i = 0; i < numSpeakers; i++) {
    const node = ctx.createGain();
    node.channelCountMode = "explicit";
    node.channelCount = 1;
    node.channelInterpretation = "discrete";
    g.push(node);
  }
  return g;
};

const connectBuffer = (sample: BufferedSample, ctx: AudioContext) => {
  sample.speakers.forEach((g, index) => {
    sample.bufferSourceNode.connect(g);
    g.connect(sample.mix, 0, index);
  });

  sample.mix.connect(ctx.destination);
};

const panner = (ctx: AudioContext, speakers: GainNode[], levels: number[]) => {
  if (speakers.length !== levels.length) {
    throw Error("speaker gain nodes length does not match length of levels array");
  }
  speakers.forEach((s, index) => {
    const level = levels[index];
    if (level > 1.0 || level < 0) {
      throw Error("level is out of range: " + level);
    }
    s.gain.setValueAtTime(level, ctx.currentTime);
  });
};

const exclusiveSpeakerPanner = (target: number, speakersCount: number, maxVolume = 1): number[] => {
  let levels = Array(speakersCount).fill(0);
  return levels.map((speaker, index) => (index === target ? maxVolume : 0));
};

// const linearPairsPanner = (
//   ctx: AudioContext,
//   speakers: GainNode[],
//   target: number,
//   maxVolume = 1
// ) => {
//   const pairIndex = {
//     left: Math.floor(target),
//     right: Math.ceil(target)
//   };
//   const relativePan = target - pairIndex.left;

//   speakers.forEach((s, index) => {
//     if (index === pairIndex.left) {
//       s.gain.setValueAtTime(1 - relativePan, ctx.currentTime); // inverse of relative "pan"
//     } else if (index === pairIndex.right) {
//       s.gain.setValueAtTime(relativePan, ctx.currentTime); // relative "pan"
//     } else {
//       s.gain.setValueAtTime(0, ctx.currentTime);
//     }
//   });
// };

const remap = (value: number, inMin: number, inMax: number, outMin: number, outMax: number) =>
  outMin + ((outMax - outMin) / (inMax - inMin)) * (value - inMin);

const applyDefaults = (original?: PlaybackOptions): PlaybackOptions => {
  const defaults: PlaybackOptions = {
    loop: false,
    rateVariation: 0,
    volumeVariation: 0,
    volumeMax: 1,
    doNotInterrupt: false
  };

  if (original === undefined) {
    return defaults;
  } else {
    const result = original;
    Object.keys(original).forEach(key => {
      result[key] = original[key] === undefined ? defaults[key] : original[key];
    });
    return result;
  }
};
