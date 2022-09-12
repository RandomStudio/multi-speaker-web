import BufferedSample from "./BufferedSample";

class MultiChannelPlayer {
  private ctx: AudioContext;
  private numOutputChannels: number;

  private constructor(numOutputChannels: number, ctx: AudioContext) {
    ctx.destination.channelInterpretation = "discrete";

    const { maxChannelCount } = ctx.destination;
    if (numOutputChannels > maxChannelCount) {
      throw Error(
        `Requested channel count (${numOutputChannels}) exceeds the available channels (${maxChannelCount})`
      );
    }

    this.ctx = ctx;
    this.numOutputChannels = numOutputChannels;
  }

  /**
   *
   * @param numOutputChannels Channel count required
   * @param existingAudioContext Optionally pass in an existing audio context; otherwise, a new one will be created
   * @returns A MultiChannelAudioContext object, which saves its own audio context preconfigured for multi-channel audio
   */
  public static setup(
    numOutputChannels: number,
    existingAudioContext?: AudioContext
  ) {
    const multiChannelAudioContext = new MultiChannelPlayer(
      numOutputChannels,
      existingAudioContext ? existingAudioContext : new window.AudioContext()
    );
    return multiChannelAudioContext;
  }

  public getContext = () => this.ctx;

  public getNumOutputChannels = () => this.numOutputChannels;

  public createSample = async (src: string): Promise<BufferedSample> => {
    const sample = await BufferedSample.load(src, this);
    return sample;
  };
}

export default MultiChannelPlayer;
