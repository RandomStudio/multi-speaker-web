import { defaults } from "./config";
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
    const sample = this.getSample(keySearch);

    const finalOptions: PlaybackConfig = {
      ...defaults,
      ...options
    };

    if (sample.bufferData === null) {
      throw Error(`buffer not (yet?) loaded on call to play "${keySearch}"`);
    }

    if (finalOptions.exclusive && sample.isPlaying) {
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
      sample.isPlaying = true;
      sample.bufferSourceNode.onended = () => {
        sample.isPlaying = false;
      };
    }
  };

  /**
   *
   * @param keySearch Id of a clip to stop
   * @param fadeOutDuration Optional fade duration, in milliseconds
   */
  public stop = (keySearch: string, fadeOutDuration = 0) => {
    const sample = this.samples.find(s => s.id === keySearch);
    if (fadeOutDuration === 0) {
      // No fade out; stop "now"
      sample.bufferSourceNode.stop();
    } else {
      // Fade out. We don't have to be picky about output channels here,
      // because all will go to zero anyway (even if they are already zero, i.e. unused)
      sample.outputChannels.forEach(channel => {
        channel.gain.exponentialRampToValueAtTime(
          0,
          this.audioCtx.currentTime + fadeOutDuration / 1000
        );
      });
      // Stop a second later
      sample.bufferSourceNode.stop(
        this.audioCtx.currentTime + fadeOutDuration / 1000 + 1
      );
    }
  };

  public getSampleKeys = () => this.samples.map(s => s.id);

  public getIsPlaying = (key: string): boolean => {
    const sample = this.getSample(key);
    return sample.isPlaying;
  };

  private getSample = (key: string): BufferedSample => {
    const sample = this.samples.find(s => s.id);
    if (sample) {
      return sample;
    } else {
      throw Error(
        `Could not find sample with key/id "${key}" in sample bank ${this.getSampleKeys()}`
      );
    }
  };
} // end class
