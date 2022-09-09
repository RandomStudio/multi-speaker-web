# Multi Channel Web Audio

Provides a convenient audio engine that can route sounds to specific speakers in a multi-channel (more than 2 speakers) environment.

## Setup

Install

```
npm i multi-channel-web-audio
```

Import

```
import MultiChannelPlayer from "multi-channel-web-audio";
```

or

```
const MultiChannelPlayer = require("multi-channel-web-audio");
```

## Usage

### Make a player instance

Instantiate with the number of speakers you expect to route. For example, here's a 4 channel setup:

```
const player = new MultiChannelPlayer(4);
```

### Load a sample bank

Call `loadSamples` and provide a sample bank object, where each key is a string naming the sample, and the corresponding value is the path to the source file. This happens asynchronously (fetches files and loads array buffers), so the result is a Promise<void>.

For example:

```
player.loadSamples({
  beep: "/samples/beep.mp3",
  toot: "/samples/toot-toot.mp3"
}).then(() => {
  console.log('yay my samples loaded');
  // now you can play them
}).catch(e => {
  console.error('something went wrong loading samples: ', e);
});
```

### Trigger samples

Specify the sample key (it must exist in your `SourceMap`, and it must have been loaded already); then specify the channel (speaker) you want it to play from. Example:

```
player.play("beep", 2); // plays out of speaker index 2 (third speaker)
```

### Optional variations

You can pass a third parameter to `play` if you like: a `PlaybackOptions` object, specifying any or all of the following:

```
{
  loop?: boolean = false;
  rateVariation?: number = 0;
  volumeVariation?: number 0;
  volumeMax?: number = 1.0;
  exclusive?: boolean = false;
}
```

The rate and volume variations work in similar way. By default, `0` variation will mean that rate is 1.0 or volume is always maximum (`1.0` or a value specified in `volumeMax`).

Specifying another value will allow random variation above or below "normal" up to the range you specify. Example:

```
player.play("annoyingSound", 0, {
  rateVariation: 0.5
});
// Sound will play in range 0.5x - 1.5x normal speed.
```

Rate variation _will_ affect the pitch, too.

## Development

The library is written in TypeScript so compiles with `npm run build`

You can also run a small browser demo to test again, with `npm run example`

## TODO

- [x] Remove all random picking, random variations (outside the scope of this library; should be handled by client library/application)
- [x] Revisit "applyDefaults" mechanism / types
- [ ] Should be possible to play sample via multiple channels (same volume)
- [ ] Should be possible to play sample with custom "panning" between multiple channels (pseudo-spatialised audio)
