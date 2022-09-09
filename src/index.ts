import { defaults, NONZERO_SILENCE } from "./config";
import {
  createBufferedSamples,
  connectBuffer,
  exclusiveOutputChannel
} from "./functions";
import {
  BufferedSample,
  SourceMap,
  PlaybackConfig,
  PlaybackOptions
} from "./types";

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

  public getAudioContext = () => this.audioCtx;

  public loadSamples = async (sources: SourceMap): Promise<void> => {
    this.samples = createBufferedSamples(
      sources,
      this.audioCtx,
      this.numOutputChannels
    );

    const requests = Object.keys(sources).map(
      async key =>
        new Promise<void>((resolve, reject) => {
          const sample = this.getSample(key);
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
        console.info("all samples loaded: ", JSON.stringify(this.samples));
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
    if (channel === undefined) {
      throw Error("You must specify an output channel index");
    }
    const sample = this.getSample(keySearch);

    console.log(`multi-speaker-web: play "${keySearch}"...`);

    const finalOptions: PlaybackConfig = {
      ...defaults,
      ...options
    };

    if (sample.bufferData === null) {
      throw Error(`buffer not (yet?) loaded on call to play "${keySearch}"`);
    }

    if (finalOptions.exclusive && sample.startedAt) {
      console.warn(
        `exclusive mode; clip "${keySearch}" already playing; ignore play request`
      );
    } else {
      sample.bufferSourceNode = this.audioCtx.createBufferSource();
      sample.bufferSourceNode.buffer = sample.bufferData;

      connectBuffer(sample, this.audioCtx);

      const { volume, rate } = finalOptions;

      exclusiveOutputChannel(
        this.audioCtx,
        sample.outputChannels,
        channel,
        volume,
        finalOptions.fadeInDuration
      );

      sample.bufferSourceNode.playbackRate.value = rate;
      sample.bufferSourceNode.loop = finalOptions.loop;

      sample.bufferSourceNode.start(0);
      sample.startedAt = this.audioCtx.currentTime;
      sample.bufferSourceNode.onended = () => {
        console.log(`multi-speaker-web: onended "${keySearch}"...`);
        sample.startedAt = null;
      };
    }
  };

  /**
   *
   * @param keySearch Id of a clip to stop
   * @param fadeOutDuration Optional fade duration, in milliseconds
   */
  public stop = (keySearch: string, fadeOutDuration = 0) => {
    const sample = this.getSample(keySearch);
    if (fadeOutDuration === 0) {
      // No fade out; stop "now"
      sample.bufferSourceNode.stop();
    } else {
      console.log("Fade out over", fadeOutDuration, "ms ...");
      // Fade out. We don't have to be picky about output channels here,
      // because all will go to zero anyway (even if they are already zero, i.e. unused)
      sample.outputChannels.forEach(channel => {
        if (channel.gain.value > NONZERO_SILENCE) {
          channel.gain.setValueAtTime(1.0, this.audioCtx.currentTime);
          channel.gain.exponentialRampToValueAtTime(
            NONZERO_SILENCE,
            this.audioCtx.currentTime + fadeOutDuration / 1000
          );
        }
      });
      // Stop shortly after
      sample.bufferSourceNode.stop(
        this.audioCtx.currentTime + fadeOutDuration / 1000 + 0.01
      );
    }
  };

  public getSampleKeys = () => this.samples.map(s => s.id);

  public getIsPlaying = (key: string): boolean => {
    const sample = this.getSample(key);
    return sample.startedAt !== null;
  };

  public getProgress = (key: string): number => {
    const sample = this.getSample(key);
    const now = this.audioCtx.currentTime;
    return now - sample.startedAt;
  };

  private getSample = (key: string): BufferedSample => {
    const sample = this.samples.find(s => s.id === key);
    if (sample) {
      return sample;
    } else {
      throw Error(
        `Could not find sample with key/id "${key}" in sample bank ${this.getSampleKeys()}`
      );
    }
  };
} // end class
