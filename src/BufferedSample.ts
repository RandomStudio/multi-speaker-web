import { createGainNodes, playWithExclusiveOutputChannel } from "./functions";
import MultiChannelPlayer from "./MultiChannelPlayer";
import { ChannelPanningConfig, PlaybackConfig, PlaybackOptions } from "./types";
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

  /**
   * Play on a SINGLE channel (mute all other channel outputs) for this sample
   * @param targetChannel
   * @param options
   */
  public playOnChannel = (targetChannel: number, options?: PlaybackOptions) => {
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

    this.play(config);
  };

  private play = (config: PlaybackConfig) => {
    this.createSourceNode();

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

  /**
   * Play at the same volume on either all channels or a list of channels
   * @param channels An array channel indexes. Leave this out to simply play on *all* available output channels.
   * @param options Playback options. If a volume is specified here, it will be applied to all selected output channels,
   * otherwise, full volume (value 1.0) will be used instead
   */

  public playSameOnChannels = (
    channels?: number[],
    options?: PlaybackOptions
  ) => {
    const channelIndexes = channels
      ? channels
      : this.outputChannels.map((_c, index) => index);
    const channelPanning: ChannelPanningConfig[] = channelIndexes.map(
      index => ({
        index,
        volume: options?.volume || 1.0
      })
    );

    this.playCustomPanning(channelPanning, options);
  };

  /**
   * Play on one or more target channels, with the ability to specify different volumes ("panning") for each channel individually
   *
   * @param channelPanning A list of one or more { index, volume? } objects for each of the channels you want
   * to play the sample on.
   * @param options
   */
  public playCustomPanning = (
    channelPanning: ChannelPanningConfig[],
    options?: PlaybackOptions
  ) => {
    if (channelPanning.length > this.outputChannels.length) {
      throw Error(
        "You specified more channel panning options than available channel count"
      );
    }

    const config: PlaybackConfig = {
      ...defaults,
      ...options
    };

    const channelsWithVolumes = this.outputChannels.map((gainNode, index) => {
      const customPanning = channelPanning.find(p => p.index === index);
      const volume = customPanning ? customPanning.volume || 1.0 : 0;
      return {
        index,
        gainNode,
        volume
      };
    });

    channelsWithVolumes.forEach(channel => {
      const { index, gainNode, volume } = channel;
      if (volume > 0) {
        console.log("Setting outputChannel #", index, "to volume", volume);
      } else {
        console.log("Muting outputChannel #", index);
      }
      gainNode.gain.setValueAtTime(
        volume,
        this.multiChannelAudioContext.getContext().currentTime
      );
    });

    this.play(config);
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

  public getProgressSeconds = (wrapLoop = true) => {
    if (this.lastStarted) {
      const now = this.multiChannelAudioContext.getContext().currentTime;
      if (wrapLoop && this.bufferSourceNode?.loop === true) {
        return (now - this.lastStarted) % this.duration;
      } else {
        return now - this.lastStarted;
      }
    } else {
      return 0;
    }
  };

  public getProgressNormalised = () =>
    this.getProgressSeconds() / this.duration;

  public getDuration = () => this.duration;

  public getVolume = () => {
    const getLoudestChannelValue = this.outputChannels.reduce(
      (result, gainNode) =>
        gainNode.gain.value > result ? gainNode.gain.value : result,
      0
    );
    return this.getIsPlaying() ? getLoudestChannelValue : 0;
  };

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
   * @param bufferSourceNodetx An AudioBufferSourceNode, created already and ready to play
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
