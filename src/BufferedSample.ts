import { createGainNodes, playWithExclusiveOutputChannel } from "./functions";
import MultiChannelPlayer from "./MultiChannelPlayer";
import { PlaybackConfig, PlaybackOptions } from "./types";
import { defaults, NONZERO_SILENCE } from "./config";
class BufferedSample {
  private bufferData: AudioBuffer;
  private bufferSourceNode: AudioBufferSourceNode | null;
  private outputChannels: GainNode[];
  mix: ChannelMergerNode;
  lastStarted: number | null;
  private multiChannelAudioContext: MultiChannelPlayer;
  private duration: number;

  private constructor(
    multiChannelAudioContext: MultiChannelPlayer,
    bufferData: AudioBuffer
  ) {
    const ctx = multiChannelAudioContext.getContext();
    const numOutputChannels = multiChannelAudioContext.getNumOutputChannels();

    this.bufferData = bufferData;
    this.bufferSourceNode = null;

    this.duration = bufferData.duration;
    this.outputChannels = createGainNodes(numOutputChannels, ctx);
    this.mix = ctx.createChannelMerger(numOutputChannels);

    this.lastStarted = null;
    this.multiChannelAudioContext = multiChannelAudioContext;
  }

  public static load = async (
    src: string,
    multiChannelAudioContext: MultiChannelPlayer
  ): Promise<BufferedSample> => {
    const res = await fetch(src, { method: "GET" });
    const audioData = await res.arrayBuffer();
    const bufferData = await multiChannelAudioContext
      .getContext()
      .decodeAudioData(audioData);
    const sample = new BufferedSample(multiChannelAudioContext, bufferData);
    return sample;
  };

  public playOnChannel = (targetChannel: number, options?: PlaybackOptions) => {
    this.createSourceNode();

    const config: PlaybackConfig = {
      ...defaults,
      ...options
    };
    playWithExclusiveOutputChannel(
      this.multiChannelAudioContext.getContext(),
      this.outputChannels,
      targetChannel,
      config.volume,
      config.fadeInDuration
    );

    if (this.bufferSourceNode) {
      this.bufferSourceNode.playbackRate.value = config.rate;
      this.bufferSourceNode.loop = config.loop;

      this.bufferSourceNode.start(0);
      this.lastStarted = this.multiChannelAudioContext.getContext().currentTime;

      this.bufferSourceNode.onended = () => {
        console.log("bufferSource ended");
        this.lastStarted = null;
        this.bufferSourceNode = null;
      };
    } else {
      throw Error("playOnChannel: AudioBufferSourceNode does not exist (yet?)");
    }
  };

  public stop = (options?: PlaybackOptions) => {
    const fadeOutDuration =
      options?.fadeOutDuration || defaults.fadeOutDuration;
    if (fadeOutDuration === 0) {
      this.bufferSourceNode?.stop();
    } else {
      console.log("Fade out over", fadeOutDuration, "ms ...");
      // Fade out. We don't have to be picky about output channels here,
      // because all will go to zero anyway (even if they are already zero, i.e. unused)
      const { currentTime } = this.multiChannelAudioContext.getContext();
      this.outputChannels.forEach(gainNode => {
        if (gainNode.gain.value > NONZERO_SILENCE) {
          gainNode.gain.setValueAtTime(1.0, currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            NONZERO_SILENCE,
            currentTime + fadeOutDuration / 1000
          );
        }
      });
      // Stop playback shortly after fade complete
      this.bufferSourceNode?.stop(currentTime + fadeOutDuration / 1000 + 0.01);
    }
  };

  public getIsPlaying = () => {
    return this.lastStarted !== null;
  };

  public getProgressSeconds = () => {
    if (this.lastStarted) {
      const now = this.multiChannelAudioContext.getContext().currentTime;
      return now - this.lastStarted;
    } else {
      return 0;
    }
  };

  public getProgressNormalised = () =>
    this.getProgressSeconds() / this.duration;

  public getDuration = () => this.duration;

  /**
   * Since AudioBufferSourceNode can only be played once (https://developer.mozilla.org/en-US/docs/Web/API/AudioBufferSourceNode),
   * it is necessary to recreate the object from the buffer data each time. This is an inexpensive operation.
   */
  private createSourceNode = () => {
    const bufferSourceNode = this.multiChannelAudioContext
      .getContext()
      .createBufferSource();
    bufferSourceNode.buffer = this.bufferData;

    this.connectBufferToMix(bufferSourceNode);

    this.bufferSourceNode = bufferSourceNode;
  };

  /**
   * Fan out the source (BufferAudioBufferSourceNodeSourceNode) into a separate
   * GainNode for each channel, then merge back using a ChannelMergerNode, which finally
   * is sent to the destination for the AudioContext
   *
   * @param ctx An audio context with a destination that is already configured for the correct number of output channels
   */
  private connectBufferToMix(bufferSourceNode: AudioBufferSourceNode) {
    /*
      The graph looks something like this (example with 3 output channels):

      bufferSourceNode   -> GainNode 0, channel 0    -> ChannelMergerNode, channel 0   ->  Destination, channel 0
                         -> GainNode 1, channel 0     -> ChannelMergerNode, channel 1   ->  Destination, channel 1
                         -> GainNode 2, channel 0     -> ChannelMergerNode, channel 2   ->  Destination, channel 2
    */

    this.outputChannels.forEach((gainNode, index) => {
      bufferSourceNode.connect(gainNode);
      gainNode.connect(this.mix, 0, index);
      console.log("connect buffer channel 0 => ", index);
    });

    this.mix.connect(this.multiChannelAudioContext.getContext().destination);
  }
}

export default BufferedSample;
