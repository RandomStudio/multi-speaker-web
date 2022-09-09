import {
  createBufferedSamples,
  applyDefaults,
  connectBuffer,
  exclusiveOutputChannel
} from "./functions";
import { BufferedSample, SourceMap, PlaybackOptions } from "./types";

export default class MultiChannelPlayer {
  private samples: BufferedSample[];
  private audioCtx: AudioContext;
  private numOutputChannels: number;

  constructor(numOutputChannels: number) {
    this.numOutputChannels = numOutputChannels;
    this.audioCtx = new window.AudioContext();
    this.audioCtx.destination.channelInterpretation = "discrete";

    const maxChannelCount = this.audioCtx.destination.maxChannelCount;

    this.numOutputChannels =
      this.audioCtx.destination.maxChannelCount > 2 ? numOutputChannels : 2;
    this.audioCtx.destination.channelCount = maxChannelCount;

    console.log(
      "requested",
      numOutputChannels,
      "outputChannels; got",
      this.audioCtx.destination.channelCount,
      "channels for output"
    );

    this.samples = [];
  }

  public loadSamples = async (sources: SourceMap): Promise<void> => {
    this.samples = createBufferedSamples(
      sources,
      this.audioCtx,
      this.numOutputChannels
    );

    const requests = Object.keys(this.samples).map(
      async key =>
        new Promise<void>((resolve, reject) => {
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

  public play = (
    keySearch: string,
    channel: number,
    options?: PlaybackOptions
  ) => {
    this.playSample(keySearch, channel, applyDefaults(options));
  };

  /**
   *
   * @param keySearch Id of a clip to stop
   * @param fadeOutDuration Optional fade duration, in milliseconds
   */
  public stop = (keySearch: string, fadeOutDuration = 0) => {
    const sample = this.samples.find(s => s.id === keySearch);
    if (fadeOutDuration === 0) {
      sample.bufferSourceNode.stop();
    } else {
      sample.outputChannels.forEach(channel => {
        channel.gain.exponentialRampToValueAtTime(
          0,
          this.audioCtx.currentTime + fadeOutDuration / 1000
        );
      });
    }
  };

  public getSampleKeys = () => Object.keys(this.samples);

  private playSample = (
    key: string,
    channel: number,
    options: PlaybackOptions
  ) => {
    const sample = this.samples[key];
    if (sample === undefined) {
      throw Error(
        `could not find sample with key "${key}" in sample bank ${Object.keys(
          this.samples
        )}`
      );
    }
    // console.log(`found sample "${key}", play on channel #${channel}`);

    if (sample.bufferData === null) {
      throw Error(`buffer not (yet?) loaded on call to play "${key}"`);
    }

    if (options.exclusive && sample.isPlaying) {
      console.warn(
        `exclusive mode; clip "${key}" already playing; ignore play request`
      );
    } else {
      sample.bufferSourceNode = this.audioCtx.createBufferSource();
      sample.bufferSourceNode.buffer = sample.bufferData;

      connectBuffer(sample, this.audioCtx);

      const { volume, rate } = options;

      exclusiveOutputChannel(
        this.audioCtx,
        sample.outputChannels,
        channel,
        volume
      );

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
        `could not find sample with key "${key}" in sample bank ${Object.keys(
          this.samples
        )}`
      );
    }
    return sample.isPlaying;
  };
} // end class
