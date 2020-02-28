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
              // logger.debug("got file");
              const audioData = request.response;
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

            // logger.debug(request);
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
