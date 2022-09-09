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

### Optional playback configuration

You can pass a third parameter to `play` if you like: a `PlaybackOptions` object, specifying any or all of the following:

- `loop` boolean (default: `false`) - whether to loop the sample or play just once through
- `rate`: number (default `1.0`) - playback speed multiplier (affects pitch)
- `volume`: number (default `1.0`) - target "full" volume, from 0 (silence) to full volume (1.0)
- `exclusive`: boolean (default `true) - whether to prevent multiple starts of the sample buffer before it finishes

## Example

You can run a small browser demo to test again, with `npm run example`

This example uses just 2 channels, to suit most test environments. Two channels obviously doesn't demonstrate the full potential of this library but does show you how to use it.

## Development

The library is written in TypeScript so compiles with `npm run build`

## TODO

- [x] Remove all random picking, random variations (outside the scope of this library; should be handled by client library/application)
- [x] Revisit "applyDefaults" mechanism / types
- [ ] It should be possible to play sample multiple times simultaneously (currently, "exclusive" mode prevents strange issues)
- [ ] Should be possible to play sample via multiple channels (same volume)
- [ ] Should be possible to play sample with custom "panning" between multiple channels (pseudo-spatialised audio)
