interface BufferedSample {
  src: string;
  bufferData: AudioBuffer | null;
  bufferSourceNode: AudioBufferSourceNode;
  speakers: GainNode[];
  mix: ChannelMergerNode;
  filter?: BiquadFilterNode;
  isPlaying: boolean;
}

type SourceMap = Record<string, string>;
type SampleMap = Record<string, BufferedSample>;

export default class MultiChannelPlayer {
  private samples: SampleMap;
  private audioCtx: AudioContext;
  private numSpeakers: number;

  constructor(numSpeakers: number) {
    this.numSpeakers = numSpeakers;
    this.audioCtx = new window.AudioContext();
    this.audioCtx.destination.channelInterpretation = "discrete";

    const maxChannelCount = this.audioCtx.destination.maxChannelCount;

    this.numSpeakers =
      this.audioCtx.destination.maxChannelCount > 2 ? numSpeakers : 2;
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
    this.samples = createBufferedSamples(
      sources,
      this.audioCtx,
      this.numSpeakers
    );

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
              console.log("response", request.response);
              this.audioCtx.decodeAudioData(audioData, buffer => {
                // logger.debug("got audio buffer");
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
        console.log("all samples loaded");
      })
      .catch(err => {
        console.error("error loading samples:", err);
      });
  };

  public play = (
    key: string,
    channel: number,
    loop: boolean = false,
    rateVariation: number = 0,
    volumeVariation: number = 0,
    volumeMax: number = 1,
    exclusive = false
  ) => {
    const sample = this.samples[key];
    if (sample === undefined) {
      throw Error(
        `could not find sample with key "${key}" in sample bank ${Object.keys(
          this.samples
        )}`
      );
    }
    console.log(`found sample "${key}", play on channel #${channel}`);

    if (sample.bufferSourceNode.buffer === null) {
      throw Error("buffer not (yet?) loaded on call to play");
    }

    if (exclusive && sample.isPlaying) {
      console.warn(`exclusive mode; clip "${key}" already playing`);
    } else {
      sample.bufferSourceNode = this.audioCtx.createBufferSource();
      sample.bufferSourceNode.buffer = sample.bufferData;

      connectBuffer(sample, this.audioCtx);

      const volume = remap(
        1 - Math.random() * volumeVariation,
        0,
        1.0,
        0,
        volumeMax
      );
      const rate = 1 + Math.random() * rateVariation - rateVariation / 2;

      exclusiveSpeaker(this.audioCtx, sample.speakers, channel, volume);

      sample.bufferSourceNode.playbackRate.value = rate;
      sample.bufferSourceNode.loop = loop;

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
        `could not find sample with key "${key}" in sample bank ${Object.keys(
          this.samples
        )}`
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

const exclusiveSpeaker = (
  ctx: AudioContext,
  speakers: GainNode[],
  target: number,
  maxVolume = 1
) => {
  speakers.forEach((s, index) => {
    if (index === target) {
      s.gain.setValueAtTime(maxVolume, ctx.currentTime);
    } else {
      s.gain.setValueAtTime(0, ctx.currentTime);
    }
  });
};

const remap = (
  value: number,
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number
) => outMin + ((outMax - outMin) / (inMax - inMin)) * (value - inMin);
